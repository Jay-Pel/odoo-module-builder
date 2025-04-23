from flask import Blueprint, request, jsonify
import os
import json
import base64
import uuid
from services.llm_service import LLMService

# Initialize Blueprint
chat_bp = Blueprint('chat', __name__)

# Initialize LLM service
llm_service = LLMService()

@chat_bp.route('/send', methods=['POST'])
def send_message():
    """
    Endpoint for sending a message to the chat
    
    Request body:
    {
        "message": "User message",
        "conversation_id": "optional-conversation-id",
        "context": {
            "module_name": "optional module name if already provided",
            "module_purpose": "optional module purpose if already provided",
            ...
        },
        "files": [
            {
                "name": "filename.jpg",
                "type": "image/jpeg", 
                "data": "base64 encoded data"
            },
            ...
        ]
    }
    
    Response:
    {
        "response": "Assistant response",
        "conversation_id": "conversation-id",
        "context": {
            "module_name": "extracted module name if provided",
            "module_purpose": "extracted module purpose if provided",
            ...
        },
        "next_step": "specification" | "continue" | null
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({
                'error': 'Invalid request. Message is required.'
            }), 400
        
        user_message = data['message']
        conversation_id = data.get('conversation_id')
        context = data.get('context', {})
        files = data.get('files', [])
        
        # Process the message with the LLM service
        response, updated_context, next_step = llm_service.process_chat_message(
            user_message, 
            conversation_id, 
            context,
            files
        )
        
        # Generate a new conversation ID if none was provided
        if not conversation_id:
            conversation_id = llm_service.generate_conversation_id()
        
        return jsonify({
            'response': response,
            'conversation_id': conversation_id,
            'context': updated_context,
            'next_step': next_step
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@chat_bp.route('/history/<conversation_id>', methods=['GET'])
def get_conversation_history(conversation_id):
    """
    Endpoint for retrieving conversation history
    
    Response:
    {
        "history": [
            {
                "role": "user" | "assistant",
                "content": "Message content",
                "timestamp": "ISO timestamp"
            },
            ...
        ],
        "context": {
            "module_name": "extracted module name",
            "module_purpose": "extracted module purpose",
            ...
        }
    }
    """
    try:
        history, context = llm_service.get_conversation_history(conversation_id)
        
        # Remove binary data from the response to keep it lightweight
        for message in history:
            if 'files' in message:
                # Keep file metadata but remove binary data
                for file in message['files']:
                    if 'data' in file:
                        file['data'] = '[BINARY DATA]'
        
        return jsonify({
            'history': history,
            'context': context
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@chat_bp.route('/upload', methods=['POST'])
def upload_file():
    """
    Endpoint for uploading files to be processed by the chat
    
    Files should be sent as multipart/form-data
    
    Response:
    {
        "files": [
            {
                "name": "filename.jpg",
                "type": "image/jpeg",
                "size": 12345,
                "id": "unique-file-id"
            },
            ...
        ]
    }
    """
    try:
        if 'files' not in request.files:
            return jsonify({
                'error': 'No files provided'
            }), 400
        
        uploaded_files = []
        
        for file in request.files.getlist('files'):
            # Generate a unique ID for the file
            file_id = str(uuid.uuid4())
            
            # Read file data
            file_data = file.read()
            
            # For images, encode as base64
            if file.content_type.startswith('image/'):
                encoded_data = base64.b64encode(file_data).decode('utf-8')
            else:
                # For now, we only support images
                return jsonify({
                    'error': 'Only image files are supported'
                }), 400
            
            # Add file info to the list
            uploaded_files.append({
                'name': file.filename,
                'type': file.content_type,
                'size': len(file_data),
                'id': file_id,
                'data': encoded_data
            })
        
        return jsonify({
            'files': uploaded_files
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500