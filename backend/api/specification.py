from flask import Blueprint, request, jsonify
import os
import json
import logging
import traceback
import time
from services.llm_service import LLMService
from services.specification_service import SpecificationService

# Set up module-specific logger
logger = logging.getLogger('odoo_module_builder.specification_api')
logger.setLevel(logging.INFO)

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
    logger.info("\n[API] /specification/generate endpoint called")
    request_start_time = time.time()
    max_attempts = 3
    fallback_used = False
    
    try:
        data = request.get_json()
        
        if not data:
            logger.warning("[API] Invalid request - no data")
            return jsonify({
                'error': 'Invalid request. Request body is required.'
            }), 400
        
        logger.info(f"[API] Request data: {data}")
        
        conversation_id = data.get('conversation_id')
        context = data.get('context', {})
        forced_fallback = data.get('force_fallback', False)  # Allow client to force fallback mode
        
        logger.info(f"[API] Context received: {context}")
        
        if not conversation_id and not context:
            logger.warning("[API] Missing required parameters")
            return jsonify({
                'error': 'Either conversation_id or context is required.'
            }), 400
        
        # If conversation_id is provided, get the context from the conversation
        if conversation_id:
            logger.info(f"[API] Using conversation history from ID: {conversation_id}")
            _, context = llm_service.get_conversation_history(conversation_id)
            logger.info(f"[API] Updated context from conversation: {context}")
        
        # Generate the specification with retries
        specification_id = None
        specification = None
        last_error = None
        
        # Try standard generation first (unless fallback is forced)
        if not forced_fallback:
            logger.info("[API] Attempting to generate specification with Claude 3.7")
            for attempt in range(1, max_attempts + 1):
                try:
                    logger.info(f"[API] Attempt {attempt}/{max_attempts} with primary model")
                    specification_id, specification = specification_service.generate_specification(context)
                    break
                except Exception as e:
                    last_error = e
                    error_traceback = traceback.format_exc()
                    logger.error(f"[API] Error in attempt {attempt}/{max_attempts}: {str(e)}")
                    logger.debug(f"[API] Error traceback: {error_traceback}")
                    
                    # Last attempt failed, we'll use fallback in the except block if this was the last try
                    if attempt == max_attempts:
                        logger.warning(f"[API] All {max_attempts} attempts failed with primary model")
                        raise
                    
                    # Short backoff before retry
                    time.sleep(2 * attempt)  # 2, 4, 6 seconds backoff
        else:
            logger.info("[API] Fallback mode forced by client request")
            
        # If we reach here without a specification, all attempts failed
        if not specification or forced_fallback:
            fallback_used = True
            logger.warning("[API] Using fallback mechanism with older Claude model")
            try:
                specification_id, specification = specification_service.generate_specification_fallback(context)
                logger.info("[API] Fallback mechanism succeeded")
            except Exception as fallback_error:
                fallback_error_traceback = traceback.format_exc()
                logger.error(f"[API] Fallback generation also failed: {str(fallback_error)}")
                logger.debug(f"[API] Fallback error traceback: {fallback_error_traceback}")
                
                if last_error:
                    # Raise the original error if both methods failed
                    raise last_error
                else:
                    raise fallback_error
        
        # Log success details
        request_duration = time.time() - request_start_time
        logger.info(f"[API] Specification generated with ID: {specification_id} in {request_duration:.2f} seconds")
        
        # Log the type and first part of the specification for debugging
        spec_type = type(specification).__name__
        spec_preview = str(specification)[:100] if specification else "None"
        logger.info(f"[API] Specification type: {spec_type}, preview: {spec_preview}...")
        
        return jsonify({
            'specification_id': specification_id,
            'specification': specification,
            'fallback_used': fallback_used,
            'processing_time': f"{request_duration:.2f} seconds"
        })
        
    except Exception as e:
        request_duration = time.time() - request_start_time
        error_traceback = traceback.format_exc()
        error_message = f"Error generating specification: {str(e)}"
        error_type = type(e).__name__
        
        # Log detailed error information
        logger.error(f"[API] {error_message}")
        logger.error(f"[API] Error type: {error_type}")
        logger.error(f"[API] Request duration before error: {request_duration:.2f} seconds")
        logger.debug(f"[API] Full traceback: {error_traceback}")
        
        # Create error response with more detailed information
        error_response = {
            'error': error_message,
            'error_type': error_type,
            'specification_id': None,
            'fallback_used': fallback_used,
            'retry_suggested': True if 'rate limit' in str(e).lower() or 'timeout' in str(e).lower() else False,
            'specification': {
                'module_name': 'Error',
                'module_description': f"Error: {str(e)}",
                'functional_requirements': [],
                'technical_requirements': [],
                'user_interface': [],
                'dependencies': []
            }
        }
        
        return jsonify(error_response), 500

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