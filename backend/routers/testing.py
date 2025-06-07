from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, List, Optional
import httpx
import os
import logging
import asyncio
from datetime import datetime

from ..services.database import DatabaseService
from .auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/testing", tags=["testing"])

# Test Runner service configuration
TEST_RUNNER_URL = os.getenv("TEST_RUNNER_URL", "http://localhost:8001")

@router.post("/start/{project_id}")
async def start_testing(
    project_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Start automated testing for a project"""
    try:
        db = DatabaseService()
        
        # Get project and verify ownership
        project = await db.get_project(project_id)
        if not project or project["user_id"] != current_user["id"]:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if project has a generated module
        if project["status"] != "code_generated":
            raise HTTPException(status_code=400, detail="Module must be generated before testing")
        
        # Get the latest module build
        latest_build = await db.get_latest_module_build(project_id)
        if not latest_build:
            raise HTTPException(status_code=400, detail="No module build found")
        
        # Get module specification
        spec = await db.get_specification(project_id)
        if not spec or not spec["is_approved"]:
            raise HTTPException(status_code=400, detail="Specification must be approved")
        
        # Start background testing task
        background_tasks.add_task(
            initiate_testing_workflow,
            project_id,
            latest_build,
            spec
        )
        
        # Update project status
        await db.update_project_status(project_id, "testing_started")
        
        return {
            "message": "Testing initiated",
            "project_id": project_id,
            "status": "testing_started"
        }
        
    except Exception as e:
        logger.error(f"Failed to start testing for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{project_id}")
async def get_testing_status(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get the current testing status for a project"""
    try:
        db = DatabaseService()
        
        # Verify project ownership
        project = await db.get_project(project_id)
        if not project or project["user_id"] != current_user["id"]:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get the latest test session
        test_session = await db.get_latest_test_session(project_id)
        if not test_session:
            return {
                "project_id": project_id,
                "status": "no_tests",
                "message": "No testing sessions found"
            }
        
        # If test is in progress, get status from Test Runner
        if test_session["status"] in ["running", "initializing"]:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{TEST_RUNNER_URL}/test/status/{test_session['session_id']}"
                    )
                    if response.status_code == 200:
                        runner_status = response.json()
                        return {
                            "project_id": project_id,
                            "session_id": test_session["session_id"],
                            "status": runner_status.get("status"),
                            "progress": runner_status.get("progress", 0),
                            "current_step": runner_status.get("current_step"),
                            "started_at": test_session["started_at"]
                        }
            except Exception as e:
                logger.warning(f"Failed to get status from Test Runner: {e}")
        
        return {
            "project_id": project_id,
            "session_id": test_session["session_id"],
            "status": test_session["status"],
            "started_at": test_session["started_at"],
            "completed_at": test_session.get("completed_at")
        }
        
    except Exception as e:
        logger.error(f"Failed to get testing status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results/{project_id}")
async def get_test_results(
    project_id: str,
    session_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed test results for a project"""
    try:
        db = DatabaseService()
        
        # Verify project ownership
        project = await db.get_project(project_id)
        if not project or project["user_id"] != current_user["id"]:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get test session
        if session_id:
            test_session = await db.get_test_session(session_id)
        else:
            test_session = await db.get_latest_test_session(project_id)
        
        if not test_session:
            raise HTTPException(status_code=404, detail="Test session not found")
        
        # Get results from database
        test_results = await db.get_test_results(test_session["session_id"])
        
        return {
            "project_id": project_id,
            "session_id": test_session["session_id"],
            "status": test_session["status"],
            "results": test_results,
            "started_at": test_session["started_at"],
            "completed_at": test_session.get("completed_at")
        }
        
    except Exception as e:
        logger.error(f"Failed to get test results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{project_id}")
async def get_testing_history(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get testing history for a project"""
    try:
        db = DatabaseService()
        
        # Verify project ownership
        project = await db.get_project(project_id)
        if not project or project["user_id"] != current_user["id"]:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get all test sessions for this project
        test_sessions = await db.get_test_sessions_history(project_id)
        
        return {
            "project_id": project_id,
            "test_sessions": test_sessions
        }
        
    except Exception as e:
        logger.error(f"Failed to get testing history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/retry/{project_id}")
async def retry_testing(
    project_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Retry testing for a project"""
    try:
        db = DatabaseService()
        
        # Verify project ownership
        project = await db.get_project(project_id)
        if not project or project["user_id"] != current_user["id"]:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if there's a previous test session
        latest_test = await db.get_latest_test_session(project_id)
        if not latest_test or latest_test["status"] == "running":
            raise HTTPException(status_code=400, detail="Cannot retry: no previous test or test in progress")
        
        # Start new testing
        return await start_testing(project_id, background_tasks, current_user)
        
    except Exception as e:
        logger.error(f"Failed to retry testing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def initiate_testing_workflow(project_id: str, module_build: dict, spec: dict):
    """Background task to initiate testing workflow"""
    try:
        db = DatabaseService()
        logger.info(f"Initiating testing workflow for project {project_id}")
        
        # Create test session record
        session_id = f"test_{project_id}_{int(datetime.now().timestamp())}"
        await db.create_test_session({
            "session_id": session_id,
            "project_id": project_id,
            "status": "initializing",
            "started_at": datetime.now().isoformat()
        })
        
        # Get module code from the build
        module_files = await db.get_module_files(module_build["id"])
        
        # Prepare test request
        test_request = {
            "project_id": project_id,
            "module_url": module_build["download_url"],
            "module_name": module_build["module_name"],
            "module_code": module_files,
            "specification": spec["content"],
            "odoo_version": 17,  # Default for now
            "quick_mode": False  # Will be configurable per project
        }
        
        # Send request to Test Runner
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{TEST_RUNNER_URL}/test/start",
                json=test_request
            )
            
            if response.status_code == 200:
                runner_response = response.json()
                await db.update_test_session(session_id, {
                    "status": "running",
                    "runner_session_id": runner_response["session_id"]
                })
                logger.info(f"Testing started for project {project_id}")
                
                # Start monitoring task
                await monitor_test_progress(session_id, runner_response["session_id"])
            else:
                await db.update_test_session(session_id, {
                    "status": "failed",
                    "error": f"Failed to start testing: {response.text}",
                    "completed_at": datetime.now().isoformat()
                })
                await db.update_project_status(project_id, "testing_failed")
                
    except Exception as e:
        logger.error(f"Testing workflow failed for project {project_id}: {e}")
        await db.update_test_session(session_id, {
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.now().isoformat()
        })
        await db.update_project_status(project_id, "testing_failed")

async def monitor_test_progress(session_id: str, runner_session_id: str):
    """Monitor test progress and update database"""
    db = DatabaseService()
    
    try:
        while True:
            await asyncio.sleep(10)  # Poll every 10 seconds
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{TEST_RUNNER_URL}/test/status/{runner_session_id}"
                )
                
                if response.status_code != 200:
                    break
                
                status_data = response.json()
                current_status = status_data.get("status")
                
                # Update session status
                await db.update_test_session(session_id, {
                    "status": current_status,
                    "progress": status_data.get("progress", 0),
                    "current_step": status_data.get("current_step")
                })
                
                # Check if completed
                if current_status in ["completed", "failed"]:
                    # Get final results
                    results_response = await client.get(
                        f"{TEST_RUNNER_URL}/test/results/{runner_session_id}"
                    )
                    
                    if results_response.status_code == 200:
                        results = results_response.json()
                        await db.save_test_results(session_id, results)
                        
                        # Update project status based on results
                        if current_status == "completed" and results.get("success"):
                            await db.update_project_status(
                                status_data.get("project_id"),
                                "testing_passed"
                            )
                        else:
                            await db.update_project_status(
                                status_data.get("project_id"),
                                "testing_failed"
                            )
                    
                    await db.update_test_session(session_id, {
                        "completed_at": datetime.now().isoformat()
                    })
                    break
                    
    except Exception as e:
        logger.error(f"Error monitoring test progress: {e}")
        await db.update_test_session(session_id, {
            "status": "failed",
            "error": f"Monitoring failed: {e}",
            "completed_at": datetime.now().isoformat()
        }) 