from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
import os
import logging
from datetime import datetime

from ..services.database import DatabaseService
from .auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/uat", tags=["uat"])

# Request/Response Models
class UATSessionRequest(BaseModel):
    project_id: str
    odoo_version: int

class UATSessionResponse(BaseModel):
    session_id: str
    project_id: str
    status: str
    tunnel_url: Optional[str] = None
    started_at: str
    expires_at: str
    time_remaining: int

class AdjustmentRequest(BaseModel):
    project_id: str
    adjustment_description: str
    priority: str = "normal"  # "low", "normal", "high"

class PricingResponse(BaseModel):
    project_id: str
    base_price: float
    complexity_score: int
    final_price: float
    pricing_breakdown: Dict[str, Any]

# UAT Session Management

@router.post("/start/{project_id}", response_model=UATSessionResponse)
async def start_uat_session(
    project_id: str,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user),
    db: DatabaseService = Depends(DatabaseService)
):
    """Start a User Acceptance Testing session for a project"""
    try:
        # Verify project ownership and status
        project = await db.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        if project["status"] != "testing_passed":
            raise HTTPException(status_code=400, detail="Project must pass testing before UAT")
        
        # Get the latest module version
        module_version = await db.get_latest_module_version(project_id)
        if not module_version:
            raise HTTPException(status_code=400, detail="No module version found")
        
        # Call test-runner service to create UAT session
        test_runner_url = os.getenv("TEST_RUNNER_URL", "http://localhost:8001")
        
        uat_request_data = {
            "project_id": project_id,
            "module_url": module_version["r2_url"],
            "module_name": module_version["module_name"],
            "odoo_version": project["odoo_version"],
            "user_id": current_user["user_id"]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{test_runner_url}/uat/start",
                json=uat_request_data,
                timeout=30.0
            )
            response.raise_for_status()
            uat_response = response.json()
        
        # Save UAT session to database
        await db.create_uat_session(
            session_id=uat_response["session_id"],
            project_id=project_id,
            user_id=current_user["user_id"],
            status="initializing"
        )
        
        # Update project status
        await db.update_project_status(project_id, "uat_active")
        
        # Start background task to monitor UAT session
        background_tasks.add_task(monitor_uat_session, uat_response["session_id"])
        
        logger.info(f"UAT session started for project {project_id}: {uat_response['session_id']}")
        
        return UATSessionResponse(
            session_id=uat_response["session_id"],
            project_id=project_id,
            status=uat_response["status"],
            tunnel_url=None,  # Will be populated when ready
            started_at=datetime.now().isoformat(),
            expires_at=(datetime.now()).isoformat(),  # Will be updated
            time_remaining=3600  # 1 hour default
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting UAT session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start UAT session: {str(e)}")

@router.get("/session/{session_id}", response_model=UATSessionResponse)
async def get_uat_session(
    session_id: str,
    current_user: Dict = Depends(get_current_user),
    db: DatabaseService = Depends(DatabaseService)
):
    """Get UAT session status and information"""
    try:
        # Get session from database
        db_session = await db.get_uat_session(session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail="UAT session not found")
        
        if db_session["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this session")
        
        # Get latest status from test-runner
        test_runner_url = os.getenv("TEST_RUNNER_URL", "http://localhost:8001")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{test_runner_url}/uat/session/{session_id}",
                timeout=10.0
            )
            
            if response.status_code == 404:
                # Session expired or not found, update database
                await db.update_uat_session_status(session_id, "expired")
                raise HTTPException(status_code=404, detail="UAT session expired")
            
            response.raise_for_status()
            session_data = response.json()
        
        # Update database with latest status
        await db.update_uat_session_status(session_id, session_data["status"])
        
        return UATSessionResponse(
            session_id=session_data["session_id"],
            project_id=session_data["project_id"],
            status=session_data["status"],
            tunnel_url=session_data.get("tunnel_url"),
            started_at=session_data["started_at"],
            expires_at=session_data["expires_at"],
            time_remaining=session_data["time_remaining"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting UAT session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get UAT session: {str(e)}")

@router.post("/extend/{session_id}")
async def extend_uat_session(
    session_id: str,
    additional_minutes: int = 30,
    current_user: Dict = Depends(get_current_user),
    db: DatabaseService = Depends(DatabaseService)
):
    """Extend UAT session duration"""
    try:
        # Verify session ownership
        db_session = await db.get_uat_session(session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail="UAT session not found")
        
        if db_session["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this session")
        
        # Call test-runner to extend session
        test_runner_url = os.getenv("TEST_RUNNER_URL", "http://localhost:8001")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{test_runner_url}/uat/extend/{session_id}",
                params={"additional_minutes": additional_minutes},
                timeout=10.0
            )
            response.raise_for_status()
        
        return {"message": f"UAT session extended by {additional_minutes} minutes"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extending UAT session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extend UAT session: {str(e)}")

@router.post("/stop/{session_id}")
async def stop_uat_session(
    session_id: str,
    current_user: Dict = Depends(get_current_user),
    db: DatabaseService = Depends(DatabaseService)
):
    """Stop UAT session and clean up resources"""
    try:
        # Verify session ownership
        db_session = await db.get_uat_session(session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail="UAT session not found")
        
        if db_session["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this session")
        
        # Call test-runner to stop session
        test_runner_url = os.getenv("TEST_RUNNER_URL", "http://localhost:8001")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{test_runner_url}/uat/stop/{session_id}",
                timeout=10.0
            )
            response.raise_for_status()
        
        # Update database
        await db.update_uat_session_status(session_id, "stopped")
        
        return {"message": "UAT session stopped successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error stopping UAT session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to stop UAT session: {str(e)}")

# User Adjustment Requests

@router.post("/request-adjustment/{project_id}")
async def request_adjustment(
    project_id: str,
    adjustment: AdjustmentRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user),
    db: DatabaseService = Depends(DatabaseService)
):
    """Request an adjustment to the module during UAT"""
    try:
        # Verify project ownership
        project = await db.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Check adjustment count (max 5 per project)
        adjustment_count = await db.get_adjustment_count(project_id)
        if adjustment_count >= 5:
            raise HTTPException(status_code=400, detail="Maximum 5 adjustments allowed per project")
        
        # Save adjustment request
        adjustment_id = await db.create_adjustment_request(
            project_id=project_id,
            user_id=current_user["user_id"],
            description=adjustment.adjustment_description,
            priority=adjustment.priority
        )
        
        # Update project status
        await db.update_project_status(project_id, "uat_adjustment_requested")
        
        # Start background task to process adjustment
        background_tasks.add_task(process_adjustment_request, project_id, adjustment_id)
        
        return {
            "adjustment_id": adjustment_id,
            "message": "Adjustment request submitted successfully",
            "remaining_adjustments": 5 - adjustment_count - 1
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting adjustment request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to submit adjustment request: {str(e)}")

# Pricing

@router.get("/pricing/{project_id}", response_model=PricingResponse)
async def get_project_pricing(
    project_id: str,
    current_user: Dict = Depends(get_current_user),
    db: DatabaseService = Depends(DatabaseService)
):
    """Get dynamic pricing for a project"""
    try:
        # Verify project ownership
        project = await db.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Check if pricing already calculated
        existing_pricing = await db.get_project_pricing(project_id)
        if existing_pricing:
            return PricingResponse(**existing_pricing)
        
        # Get module code and specification
        module_version = await db.get_latest_module_version(project_id)
        specification = await db.get_project_specification(project_id)
        
        if not module_version or not specification:
            raise HTTPException(status_code=400, detail="Module or specification not found")
        
        # Get fix attempts count
        fix_attempts = await db.get_project_fix_attempts(project_id)
        
        # Call test-runner pricing service
        test_runner_url = os.getenv("TEST_RUNNER_URL", "http://localhost:8001")
        
        pricing_request = {
            "project_id": project_id,
            "module_code": module_version["module_code"],
            "specification": specification["content"],
            "complexity_factors": {
                "fix_attempts": fix_attempts
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{test_runner_url}/pricing/calculate",
                json=pricing_request,
                timeout=30.0
            )
            response.raise_for_status()
            pricing_data = response.json()
        
        # Save pricing to database
        await db.save_project_pricing(project_id, pricing_data)
        
        return PricingResponse(**pricing_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project pricing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get project pricing: {str(e)}")

# Background Tasks

async def monitor_uat_session(session_id: str):
    """Background task to monitor UAT session status"""
    try:
        logger.info(f"Starting UAT session monitoring for {session_id}")
        
        # This would periodically check the UAT session status
        # and update the database accordingly
        # Implementation depends on specific monitoring requirements
        
    except Exception as e:
        logger.error(f"Error monitoring UAT session {session_id}: {str(e)}")

async def process_adjustment_request(project_id: str, adjustment_id: str):
    """Background task to process adjustment request"""
    try:
        logger.info(f"Processing adjustment request {adjustment_id} for project {project_id}")
        
        # This would:
        # 1. Get the adjustment request details
        # 2. Call the coding agent with the adjustment description
        # 3. Generate new module version
        # 4. Trigger testing for the new version
        # 5. Update UAT session with new module
        
        # For now, this is a placeholder for the actual implementation
        
    except Exception as e:
        logger.error(f"Error processing adjustment request {adjustment_id}: {str(e)}") 