from flask import Blueprint, request, jsonify
import os
import json
from services.llm_service import LLMService
from services.specification_service import SpecificationService

# Initialize Blueprint
specification_bp = Blueprint('specification', __name__)

# Initialize services
llm_service = LLMService()
specification_service = SpecificationService()

@specification_bp.route('/generate', methods=['POST'])
def generate_specification():
    """
    Endpoint for generating a module specification based on chat context
    
    Request body:
    {
        "conversation_id": "conversation-id",
        "context": {
            "module_name": "module name",
            "module_purpose": "module purpose",
            ...
        }
    }
    
    Response:
    {
        "specification_id": "specification-id",
        "specification": {
            "module_name": "Module Name",
            "module_description": "Detailed description",
            "functional_requirements": [...],
            "technical_requirements": [...],
            "user_interface": [...],
            "dependencies": [...]
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Invalid request. Request body is required.'
            }), 400
        
        conversation_id = data.get('conversation_id')
        context = data.get('context', {})
        
        if not conversation_id and not context:
            return jsonify({
                'error': 'Either conversation_id or context is required.'
            }), 400
        
        # If conversation_id is provided, get the context from the conversation
        if conversation_id:
            _, context = llm_service.get_conversation_history(conversation_id)
        
        # Generate the specification
        specification_id, specification = specification_service.generate_specification(context)
        
        return jsonify({
            'specification_id': specification_id,
            'specification': specification
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@specification_bp.route('/<specification_id>', methods=['GET'])
def get_specification(specification_id):
    """
    Endpoint for retrieving a specification by ID
    
    Response:
    {
        "specification": {
            "module_name": "Module Name",
            "module_description": "Detailed description",
            "functional_requirements": [...],
            "technical_requirements": [...],
            "user_interface": [...],
            "dependencies": [...]
        }
    }
    """
    try:
        specification = specification_service.get_specification(specification_id)
        
        if not specification:
            return jsonify({
                'error': 'Specification not found.'
            }), 404
        
        return jsonify({
            'specification': specification
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@specification_bp.route('/<specification_id>/update', methods=['POST'])
def update_specification(specification_id):
    """
    Endpoint for updating a specification based on user feedback
    
    Request body:
    {
        "feedback": "User feedback on the specification",
        "sections": ["module_name", "functional_requirements", ...] (optional)
    }
    
    Response:
    {
        "specification": {
            "module_name": "Updated Module Name",
            "module_description": "Updated detailed description",
            "functional_requirements": [...],
            "technical_requirements": [...],
            "user_interface": [...],
            "dependencies": [...]
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
        sections = data.get('sections', [])
        
        # Update the specification
        updated_specification = specification_service.update_specification(
            specification_id, 
            feedback, 
            sections
        )
        
        return jsonify({
            'specification': updated_specification
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@specification_bp.route('/<specification_id>/approve', methods=['POST'])
def approve_specification(specification_id):
    """
    Endpoint for approving a specification
    
    Response:
    {
        "message": "Specification approved successfully",
        "specification_id": "specification-id"
    }
    """
    try:
        # Mark the specification as approved
        specification_service.approve_specification(specification_id)
        
        return jsonify({
            'message': 'Specification approved successfully',
            'specification_id': specification_id
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500