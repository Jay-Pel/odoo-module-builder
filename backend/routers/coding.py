from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response
from typing import Dict, Any, Optional
import asyncio
import json
import os
from datetime import datetime

from .auth import get_current_user
from ..services.database import DatabaseService
from ..services.ai_agents import CodingAgent
from ..models.schemas import User

router = APIRouter(prefix="/coding", tags=["coding"])
coding_agent = CodingAgent()
db_service = DatabaseService()

@router.post("/generate-module/{project_id}")
async def generate_module_code(
    project_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Start module code generation process"""
    try:
        # Verify project ownership and approved specification
        project = await db_service.get_project(project_id, current_user.id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if specification is approved
        specification = await db_service.get_specification(project_id)
        if not specification or not specification.get('is_approved'):
            raise HTTPException(
                status_code=400, 
                detail="Specification must be approved before code generation"
            )
        
        # Check if already generating
        if project.get('status') in ['generating_code', 'code_generated']:
            raise HTTPException(
                status_code=400, 
                detail="Code generation already in progress or completed"
            )
        
        # Start background generation task
        background_tasks.add_task(
            _generate_module_background_task,
            project_id,
            current_user.id,
            specification['content'],
            project
        )
        
        # Update project status
        await db_service.update_project_status(project_id, 'generating_code')
        
        return {
            "message": "Module code generation started",
            "project_id": project_id,
            "status": "generating_code"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start code generation: {str(e)}")

async def _generate_module_background_task(
    project_id: str,
    user_id: str,
    specification: str,
    project: dict
):
    """Background task for module code generation"""
    try:
        print(f"Starting code generation for project {project_id}")
        
        # Update status: analyzing specification
        await db_service.update_project_status(project_id, 'analyzing_specification')
        
        # Prepare project info for the AI agent
        project_info = {
            'name': project.get('name', '').lower().replace(' ', '_'),
            'odoo_version': project.get('odoo_version', 17),
            'description': project.get('description', '')
        }
        
        # Update status: generating code
        await db_service.update_project_status(project_id, 'generating_code')
        
        # Generate module code using AI agent
        module_files = await coding_agent.generate_module_code(specification, project_info)
        
        # Update status: creating zip
        await db_service.update_project_status(project_id, 'creating_zip')
        
        # Create ZIP file
        module_name = project_info['name']
        zip_content = coding_agent.create_module_zip(module_files, module_name)
        
        # Update status: uploading
        await db_service.update_project_status(project_id, 'uploading')
        
        # Get next version number
        current_version = await db_service.get_next_module_version(project_id)
        
        # Upload to R2 (simulated for now - will be implemented with actual R2 in deployment)
        r2_key = f"modules/{project_id}/v{current_version}/{module_name}.zip"
        
        # Analyze module complexity for pricing
        complexity_analysis = coding_agent.analyze_module_complexity(module_files)
        
        # Calculate pricing based on complexity
        base_price = 50  # Base price in USD
        complexity_multiplier = complexity_analysis['complexity_score'] / 100
        final_price = int((base_price + (complexity_multiplier * 50)) * 100)  # Convert to cents
        
        # Save module build record
        build_data = {
            'id': f"build_{project_id}_{current_version}",
            'project_id': project_id,
            'version': current_version,
            'r2_key': r2_key,
            'build_status': 'completed',
            'build_size': len(zip_content),
            'files_count': len(module_files),
            'created_at': datetime.utcnow().isoformat()
        }
        
        await db_service.create_module_build(build_data)
        
        # Update project with final status and pricing
        await db_service.update_project_status(project_id, 'code_generated')
        await db_service.update_project_price(project_id, final_price)
        
        # Store the actual ZIP content temporarily (in production, this would be in R2)
        # For now, we'll store it as base64 in a temp location or handle it differently
        temp_storage_path = f"/tmp/modules/{project_id}_v{current_version}.zip"
        os.makedirs(os.path.dirname(temp_storage_path), exist_ok=True)
        with open(temp_storage_path, 'wb') as f:
            f.write(zip_content)
        
        print(f"Code generation completed for project {project_id}")
        print(f"Generated {len(module_files)} files, complexity score: {complexity_analysis['complexity_score']}")
        print(f"Final price: ${final_price/100:.2f}")
        
    except Exception as e:
        print(f"Code generation failed for project {project_id}: {str(e)}")
        await db_service.update_project_status(project_id, 'code_generation_failed')
        # Could also store error details in database for user feedback

@router.get("/progress/{project_id}")
async def get_generation_progress(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get the current progress of module generation"""
    try:
        project = await db_service.get_project(project_id, current_user.id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get module builds for this project
        builds = await db_service.get_module_builds(project_id)
        
        latest_build = None
        if builds:
            latest_build = max(builds, key=lambda b: b.get('version', 0))
        
        return {
            "project_id": project_id,
            "status": project.get('status'),
            "current_version": latest_build.get('version') if latest_build else 0,
            "build_status": latest_build.get('build_status') if latest_build else None,
            "files_count": latest_build.get('files_count') if latest_build else 0,
            "build_size": latest_build.get('build_size') if latest_build else 0,
            "final_price": project.get('final_price', 0)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")

@router.get("/module-files/{project_id}")
async def get_module_files_tree(
    project_id: str,
    version: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """Get the file tree structure of the generated module"""
    try:
        project = await db_service.get_project(project_id, current_user.id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get module builds
        builds = await db_service.get_module_builds(project_id)
        if not builds:
            raise HTTPException(status_code=404, detail="No module builds found")
        
        # Find the requested version or latest
        if version:
            build = next((b for b in builds if b.get('version') == version), None)
        else:
            build = max(builds, key=lambda b: b.get('version', 0))
        
        if not build:
            raise HTTPException(status_code=404, detail="Module build not found")
        
        # For now, simulate file tree from temp storage
        # In production, this would read from R2
        temp_storage_path = f"/tmp/modules/{project_id}_v{build['version']}.zip"
        
        if not os.path.exists(temp_storage_path):
            raise HTTPException(status_code=404, detail="Module files not found")
        
        # Read ZIP file and create file tree
        import zipfile
        file_tree = []
        
        with zipfile.ZipFile(temp_storage_path, 'r') as zip_file:
            for file_info in zip_file.filelist:
                if not file_info.is_dir():
                    file_tree.append({
                        'path': file_info.filename,
                        'size': file_info.file_size,
                        'modified': file_info.date_time,
                        'type': _get_file_type(file_info.filename)
                    })
        
        return {
            "project_id": project_id,
            "version": build['version'],
            "files": file_tree,
            "total_files": len(file_tree),
            "build_info": {
                "created_at": build.get('created_at'),
                "status": build.get('build_status'),
                "size": build.get('build_size')
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get module files: {str(e)}")

@router.get("/versions/{project_id}")
async def get_module_versions(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all versions of a module"""
    try:
        project = await db_service.get_project(project_id, current_user.id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        builds = await db_service.get_module_builds(project_id)
        
        versions = []
        for build in sorted(builds, key=lambda b: b.get('version', 0), reverse=True):
            versions.append({
                'version': build.get('version'),
                'status': build.get('build_status'),
                'created_at': build.get('created_at'),
                'files_count': build.get('files_count'),
                'build_size': build.get('build_size')
            })
        
        return {
            "project_id": project_id,
            "versions": versions,
            "total_versions": len(versions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get versions: {str(e)}")

@router.get("/download/{project_id}")
async def download_module(
    project_id: str,
    version: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """Download the generated module ZIP file"""
    try:
        project = await db_service.get_project(project_id, current_user.id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if payment is completed (for future implementation)
        # if project.get('status') != 'paid':
        #     raise HTTPException(status_code=402, detail="Payment required")
        
        # Get module builds
        builds = await db_service.get_module_builds(project_id)
        if not builds:
            raise HTTPException(status_code=404, detail="No module builds found")
        
        # Find the requested version or latest
        if version:
            build = next((b for b in builds if b.get('version') == version), None)
        else:
            build = max(builds, key=lambda b: b.get('version', 0))
        
        if not build:
            raise HTTPException(status_code=404, detail="Module build not found")
        
        # Read the ZIP file from temp storage
        temp_storage_path = f"/tmp/modules/{project_id}_v{build['version']}.zip"
        
        if not os.path.exists(temp_storage_path):
            raise HTTPException(status_code=404, detail="Module file not found")
        
        # Read file content
        with open(temp_storage_path, 'rb') as f:
            zip_content = f.read()
        
        # Return file as download
        module_name = project.get('name', 'module').lower().replace(' ', '_')
        filename = f"{module_name}_v{build['version']}.zip"
        
        return Response(
            content=zip_content,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download module: {str(e)}")

def _get_file_type(filename: str) -> str:
    """Determine file type based on extension"""
    if filename.endswith('.py'):
        return 'python'
    elif filename.endswith('.xml'):
        return 'xml'
    elif filename.endswith('.csv'):
        return 'csv'
    elif filename.endswith('.md'):
        return 'markdown'
    elif filename.endswith('.js'):
        return 'javascript'
    elif filename.endswith('.css'):
        return 'css'
    elif filename.endswith(('.png', '.jpg', '.jpeg', '.gif', '.ico')):
        return 'image'
    else:
        return 'text' 