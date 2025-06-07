from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from models.schemas import Specification, SpecificationGenerate
from services.database import db
from services.ai_agents import SpecificationAgent
from routers.auth import get_current_user
import uuid
import asyncio

router = APIRouter()

async def generate_specification_background(project_id: str, project: dict, spec_data: SpecificationGenerate):
    """Background task to generate specification using AI"""
    try:
        # Initialize AI agent
        agent = SpecificationAgent()
        
        # Generate specification using Gemini
        spec_content = agent.generate_specification(
            project_name=project["name"],
            odoo_version=project["odoo_version"],
            requirements=spec_data.requirements,
            description=project.get("description")
        )
        
        # Save specification
        spec_id = str(uuid.uuid4())
        await db.save_specification(spec_id, project_id, spec_content)
        
        # Update project status
        await db.update_project_status(project_id, "specification_generated")
        
    except Exception as e:
        print(f"Error generating specification: {e}")
        await db.update_project_status(project_id, "specification_failed")

@router.post("/generate/{project_id}")
async def generate_specification(
    project_id: str,
    spec_data: SpecificationGenerate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Generate specification for a project using AI"""
    # Verify project belongs to user
    project = await db.get_project_by_id(project_id, current_user["id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Update project status to generating
    await db.update_project_status(project_id, "generating_specification")
    
    # Start background task for AI generation
    background_tasks.add_task(generate_specification_background, project_id, project, spec_data)
    
    return {
        "message": "Specification generation started", 
        "project_id": project_id,
        "status": "generating"
    }

@router.get("/{project_id}", response_model=Specification)
async def get_specification(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specification for a project"""
    # Verify project belongs to user
    project = await db.get_project_by_id(project_id, current_user["id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    specification = await db.get_specification(project_id)
    if not specification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specification not found"
        )
    
    return Specification(**specification)

@router.put("/{project_id}/approve")
async def approve_specification(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Approve a specification"""
    # Verify project belongs to user
    project = await db.get_project_by_id(project_id, current_user["id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    success = await db.approve_specification(project_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to approve specification"
        )
    
    # Update project status
    await db.update_project_status(project_id, "specification_approved")
    
    return {"message": "Specification approved successfully"}

@router.put("/{project_id}/content")
async def update_specification_content(
    project_id: str,
    content: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update specification content"""
    # Verify project belongs to user
    project = await db.get_project_by_id(project_id, current_user["id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get existing specification
    spec = await db.get_specification(project_id)
    if not spec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specification not found"
        )
    
    # Update specification content
    success = await db.save_specification(spec["id"], project_id, content["content"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update specification"
        )
    
    return {"message": "Specification updated successfully"}

@router.get("/{project_id}/status")
async def get_specification_status(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specification generation status"""
    # Verify project belongs to user
    project = await db.get_project_by_id(project_id, current_user["id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    specification = await db.get_specification(project_id)
    
    return {
        "project_status": project["status"],
        "has_specification": specification is not None,
        "is_approved": specification["is_approved"] if specification else False
    } 