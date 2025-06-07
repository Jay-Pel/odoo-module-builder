from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from models.schemas import Project, ProjectCreate, ProjectUpdate
from services.database import db
from services.auth import generate_project_id
from routers.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=Project)
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new project"""
    project_id = generate_project_id()
    
    success = await db.create_project(
        project_id=project_id,
        user_id=current_user["id"],
        name=project_data.name,
        odoo_version=project_data.odoo_version.value,
        description=project_data.description
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project"
        )
    
    # Return the created project
    project = await db.get_project_by_id(project_id, current_user["id"])
    return Project(**project)

@router.get("/", response_model=List[Project])
async def get_user_projects(current_user: dict = Depends(get_current_user)):
    """Get all projects for the current user"""
    projects = await db.get_user_projects(current_user["id"])
    return [Project(**project) for project in projects]

@router.get("/{project_id}", response_model=Project)
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific project"""
    project = await db.get_project_by_id(project_id, current_user["id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return Project(**project)

@router.put("/{project_id}/status")
async def update_project_status(
    project_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    """Update project status"""
    # Verify project belongs to user
    project = await db.get_project_by_id(project_id, current_user["id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    success = await db.update_project_status(project_id, status)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project status"
        )
    
    return {"message": "Project status updated successfully"} 