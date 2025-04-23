from flask import Blueprint, request, jsonify
import os
import json
from services.development_plan_service import DevelopmentPlanService

# Initialize Blueprint
development_plan_bp = Blueprint('development_plan', __name__)

# Initialize service
development_plan_service = DevelopmentPlanService()

@development_plan_bp.route('/generate', methods=['POST'])
def generate_development_plan():
    """
    Endpoint for generating a development plan based on an approved specification
    
    Request body:
    {
        "specification_id": "specification-id"
    }
    
    Response:
    {
        "plan_id": "plan-id",
        "plan": {
            "module_structure": [
                {"name": "module_name", "isFolder": true, "level": 0},
                {"name": "__init__.py", "isFolder": false, "level": 1},
                ...
            ],
            "development_steps": [
                {
                    "title": "Step title",
                    "description": "Step description"
                },
                ...
            ]
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'specification_id' not in data:
            return jsonify({
                'error': 'Invalid request. Specification ID is required.'
            }), 400
        
        specification_id = data['specification_id']
        
        # Generate the development plan
        plan_id, plan = development_plan_service.generate_plan(specification_id)
        
        return jsonify({
            'plan_id': plan_id,
            'plan': plan
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@development_plan_bp.route('/<plan_id>', methods=['GET'])
def get_development_plan(plan_id):
    """
    Endpoint for retrieving a development plan by ID
    
    Response:
    {
        "plan": {
            "module_structure": [
                {"name": "module_name", "isFolder": true, "level": 0},
                {"name": "__init__.py", "isFolder": false, "level": 1},
                ...
            ],
            "development_steps": [
                {
                    "title": "Step title",
                    "description": "Step description"
                },
                ...
            ]
        }
    }
    """
    try:
        plan = development_plan_service.get_plan(plan_id)
        
        if not plan:
            return jsonify({
                'error': 'Development plan not found.'
            }), 404
        
        return jsonify({
            'plan': plan
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@development_plan_bp.route('/<plan_id>/update', methods=['POST'])
def update_development_plan(plan_id):
    """
    Endpoint for updating a development plan based on user feedback
    
    Request body:
    {
        "feedback": "User feedback on the development plan"
    }
    
    Response:
    {
        "plan": {
            "module_structure": [
                {"name": "module_name", "isFolder": true, "level": 0},
                {"name": "__init__.py", "isFolder": false, "level": 1},
                ...
            ],
            "development_steps": [
                {
                    "title": "Step title",
                    "description": "Step description"
                },
                ...
            ]
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'feedback' not in data:
            return jsonify({
                'error': 'Invalid request. Feedback is required.'
            }), 400
        
        feedback = data['feedback']
        
        # Update the development plan
        updated_plan = development_plan_service.update_plan(plan_id, feedback)
        
        return jsonify({
            'plan': updated_plan
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@development_plan_bp.route('/<plan_id>/approve', methods=['POST'])
def approve_development_plan(plan_id):
    """
    Endpoint for approving a development plan
    
    Response:
    {
        "message": "Development plan approved successfully",
        "plan_id": "plan-id"
    }
    """
    try:
        # Mark the development plan as approved
        development_plan_service.approve_plan(plan_id)
        
        return jsonify({
            'message': 'Development plan approved successfully',
            'plan_id': plan_id
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500