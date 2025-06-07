from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import os
import asyncio
import logging
from datetime import datetime

from services.docker_manager import DockerManager
from services.test_executor import TestExecutor
from services.test_generator import TestGenerator
from services.uat_manager import UATManager
from services.pricing_service import PricingService
from models.schemas import TestRequest, TestResult, UATRequest, AdjustmentRequest, PricingRequest

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="OMB Test Runner Service",
    description="Automated testing service for Odoo modules",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",  # Main OMB API
        "https://*.workers.dev",  # Cloudflare Workers
        # Add production domains when ready
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
docker_manager = DockerManager()
test_executor = TestExecutor()
test_generator = TestGenerator()
uat_manager = UATManager()
pricing_service = PricingService()

# In-memory storage for test sessions (in production, use Redis or database)
active_sessions: Dict[str, Dict] = {}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    docker_status = await docker_manager.check_docker()
    return {
        "status": "ok",
        "service": "omb-test-runner",
        "version": "1.0.0",
        "docker_available": docker_status,
        "active_sessions": len(active_sessions)
    }

@app.post("/test/start")
async def start_testing(
    test_request: TestRequest,
    background_tasks: BackgroundTasks
):
    """Start automated testing for a module"""
    try:
        session_id = f"test_{test_request.project_id}_{int(datetime.now().timestamp())}"
        
        # Initialize test session
        active_sessions[session_id] = {
            "project_id": test_request.project_id,
            "status": "initializing",
            "started_at": datetime.now().isoformat(),
            "module_url": test_request.module_url,
            "odoo_version": test_request.odoo_version,
            "quick_mode": test_request.quick_mode
        }
        
        # Start background testing task
        background_tasks.add_task(
            run_automated_testing,
            session_id,
            test_request
        )
        
        return {
            "session_id": session_id,
            "status": "started",
            "message": "Automated testing initiated"
        }
        
    except Exception as e:
        logger.error(f"Error starting test: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start testing: {str(e)}")

@app.get("/test/status/{session_id}")
async def get_test_status(session_id: str):
    """Get the current status of a test session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Test session not found")
    
    session = active_sessions[session_id]
    return {
        "session_id": session_id,
        "status": session.get("status"),
        "progress": session.get("progress", 0),
        "current_step": session.get("current_step"),
        "started_at": session.get("started_at"),
        "results": session.get("results"),
        "error": session.get("error")
    }

@app.get("/test/results/{session_id}")
async def get_test_results(session_id: str):
    """Get detailed test results"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Test session not found")
    
    session = active_sessions[session_id]
    
    if session.get("status") not in ["completed", "failed"]:
        raise HTTPException(status_code=400, detail="Testing not completed yet")
    
    return session.get("results", {})

@app.post("/test/stop/{session_id}")
async def stop_testing(session_id: str):
    """Stop a running test session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Test session not found")
    
    try:
        # Stop Docker containers
        await docker_manager.cleanup_session(session_id)
        
        # Update session status
        active_sessions[session_id]["status"] = "stopped"
        active_sessions[session_id]["stopped_at"] = datetime.now().isoformat()
        
        return {"message": "Test session stopped successfully"}
        
    except Exception as e:
        logger.error(f"Error stopping test: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to stop testing: {str(e)}")

async def run_automated_testing(session_id: str, test_request: TestRequest):
    """Background task for running automated testing"""
    session = active_sessions[session_id]
    
    try:
        logger.info(f"Starting automated testing for session {session_id}")
        
        # Step 1: Environment Preparation
        session["status"] = "preparing_environment"
        session["current_step"] = "Preparing Docker environment"
        session["progress"] = 10
        
        container_info = await docker_manager.setup_odoo_environment(
            session_id=session_id,
            odoo_version=test_request.odoo_version,
            module_url=test_request.module_url
        )
        
        # Step 2: Module Installation
        session["status"] = "installing_module"
        session["current_step"] = "Installing module in Odoo"
        session["progress"] = 30
        
        installation_result = await docker_manager.install_module(
            session_id=session_id,
            module_name=test_request.module_name
        )
        
        if not installation_result["success"]:
            session["status"] = "failed"
            session["error"] = "Module installation failed"
            session["results"] = installation_result
            return
        
        # Step 3: Test Script Generation
        session["status"] = "generating_tests"
        session["current_step"] = "Generating Playwright test scripts"
        session["progress"] = 50
        
        test_script = await test_generator.generate_test_script(
            module_code=test_request.module_code,
            specification=test_request.specification,
            quick_mode=test_request.quick_mode
        )
        
        # Step 4: Test Execution
        session["status"] = "running_tests"
        session["current_step"] = "Executing automated tests"
        session["progress"] = 70
        
        test_results = await test_executor.run_tests(
            session_id=session_id,
            test_script=test_script,
            odoo_url=container_info["odoo_url"]
        )
        
        # Step 5: Results Processing
        session["status"] = "processing_results"
        session["current_step"] = "Processing test results"
        session["progress"] = 90
        
        # Cleanup
        await docker_manager.cleanup_session(session_id)
        
        # Final results
        session["status"] = "completed" if test_results["success"] else "failed"
        session["current_step"] = "Testing completed"
        session["progress"] = 100
        session["results"] = test_results
        session["completed_at"] = datetime.now().isoformat()
        
        logger.info(f"Testing completed for session {session_id}")
        
    except Exception as e:
        logger.error(f"Testing failed for session {session_id}: {str(e)}")
        session["status"] = "failed"
        session["error"] = str(e)
        session["completed_at"] = datetime.now().isoformat()
        
        # Cleanup on error
        try:
            await docker_manager.cleanup_session(session_id)
        except:
            pass

# UAT Endpoints

@app.post("/uat/start")
async def start_uat_session(uat_request: UATRequest, background_tasks: BackgroundTasks):
    """Start a User Acceptance Testing session"""
    try:
        session_id = f"uat_{uat_request.project_id}_{int(datetime.now().timestamp())}"
        
        # Start background UAT setup task
        background_tasks.add_task(
            setup_uat_environment,
            session_id=session_id,
            project_id=uat_request.project_id,
            user_id=uat_request.user_id,
            module_url=uat_request.module_url,
            module_name=uat_request.module_name,
            odoo_version=uat_request.odoo_version
        )
        
        return {
            "session_id": session_id,
            "status": "initializing",
            "message": "UAT environment setup initiated"
        }
        
    except Exception as e:
        logger.error(f"Error starting UAT session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start UAT session: {str(e)}")

@app.get("/uat/session/{session_id}")
async def get_uat_session(session_id: str):
    """Get UAT session information"""
    try:
        session = await uat_manager.get_uat_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="UAT session not found or expired")
        
        # Update activity timestamp
        await uat_manager.update_session_activity(session_id)
        
        return {
            "session_id": session["session_id"],
            "project_id": session["project_id"],
            "status": session["status"],
            "tunnel_url": session.get("tunnel_url"),
            "started_at": session["started_at"].isoformat(),
            "expires_at": session["expires_at"].isoformat(),
            "time_remaining": max(0, (session["expires_at"] - datetime.now()).total_seconds())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting UAT session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get UAT session: {str(e)}")

@app.post("/uat/extend/{session_id}")
async def extend_uat_session(session_id: str, additional_minutes: int = 30):
    """Extend UAT session duration"""
    try:
        success = await uat_manager.extend_uat_session(session_id, additional_minutes)
        if not success:
            raise HTTPException(status_code=404, detail="UAT session not found")
        
        return {"message": f"UAT session extended by {additional_minutes} minutes"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extending UAT session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extend UAT session: {str(e)}")

@app.post("/uat/stop/{session_id}")
async def stop_uat_session(session_id: str):
    """Stop UAT session and cleanup resources"""
    try:
        await uat_manager.cleanup_uat_session(session_id)
        return {"message": "UAT session stopped successfully"}
        
    except Exception as e:
        logger.error(f"Error stopping UAT session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to stop UAT session: {str(e)}")

@app.get("/uat/sessions")
async def list_uat_sessions():
    """List all active UAT sessions"""
    try:
        sessions = await uat_manager.list_active_sessions()
        return {"active_sessions": sessions}
        
    except Exception as e:
        logger.error(f"Error listing UAT sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list UAT sessions: {str(e)}")

# Pricing Endpoints

@app.post("/pricing/calculate")
async def calculate_pricing(pricing_request: PricingRequest):
    """Calculate dynamic pricing for a module"""
    try:
        # Parse module code if it's a JSON string
        module_code = pricing_request.module_code
        if isinstance(module_code, str):
            import json
            module_code = json.loads(module_code)
        
        pricing_result = await pricing_service.calculate_price(
            project_id=pricing_request.project_id,
            module_code=module_code,
            specification=pricing_request.specification,
            fix_attempts=pricing_request.complexity_factors.get("fix_attempts", 0) if pricing_request.complexity_factors else 0
        )
        
        return pricing_result
        
    except Exception as e:
        logger.error(f"Error calculating pricing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate pricing: {str(e)}")

# Helper background tasks

async def setup_uat_environment(session_id: str, project_id: str, user_id: str, 
                               module_url: str, module_name: str, odoo_version: int):
    """Background task to set up UAT environment"""
    try:
        logger.info(f"Setting up UAT environment for session {session_id}")
        
        uat_session = await uat_manager.create_uat_session(
            session_id=session_id,
            project_id=project_id,
            user_id=user_id,
            module_url=module_url,
            module_name=module_name,
            odoo_version=odoo_version
        )
        
        logger.info(f"UAT environment ready for session {session_id}")
        
    except Exception as e:
        logger.error(f"Error setting up UAT environment: {str(e)}")
        # Clean up on failure
        try:
            await uat_manager.cleanup_uat_session(session_id)
        except:
            pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 