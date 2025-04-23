from flask import Blueprint, request, jsonify, send_file
import os
import json
import tempfile
from services.module_generator_service import ModuleGeneratorService
from services.testing_service import TestingService
from services.docker_service import DockerService

# Initialize Blueprint
module_generator_bp = Blueprint('module_generator', __name__)

# Initialize services
module_generator_service = ModuleGeneratorService()
testing_service = TestingService()
docker_service = DockerService()

@module_generator_bp.route('/generate', methods=['POST'])
def generate_module():
    """
    Endpoint for generating an Odoo module based on an approved development plan
    
    Request body:
    {
        "plan_id": "plan-id"
    }
    
    Response:
    {
        "generation_id": "generation-id",
        "status": "in-progress",
        "message": "Module generation started"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'plan_id' not in data:
            return jsonify({
                'error': 'Invalid request. Plan ID is required.'
            }), 400
        
        plan_id = data['plan_id']
        
        # Start the module generation process (asynchronously)
        generation_id = module_generator_service.start_generation(plan_id)
        
        return jsonify({
            'generation_id': generation_id,
            'status': 'in-progress',
            'message': 'Module generation started'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@module_generator_bp.route('/status/<generation_id>', methods=['GET'])
def get_generation_status(generation_id):
    """
    Endpoint for checking the status of a module generation process
    
    Response:
    {
        "status": "in-progress" | "completed" | "failed",
        "progress": [
            {
                "id": 1,
                "title": "Step title",
                "description": "Step description",
                "status": "completed" | "in-progress" | "pending" | "failed"
            },
            ...
        ],
        "message": "Optional status message",
        "error": "Optional error message if status is failed"
    }
    """
    try:
        status_info = module_generator_service.get_generation_status(generation_id)
        
        if not status_info:
            return jsonify({
                'error': 'Generation ID not found.'
            }), 404
        
        return jsonify(status_info)
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@module_generator_bp.route('/test-results/<generation_id>', methods=['GET'])
def get_test_results(generation_id):
    """
    Endpoint for retrieving test results for a generated module
    
    Response:
    {
        "backend_tests": [
            {
                "name": "Test name",
                "description": "Test description",
                "passed": true | false,
                "error": "Optional error message if test failed"
            },
            ...
        ],
        "frontend_tests": [
            {
                "name": "Test name",
                "description": "Test description",
                "passed": true | false,
                "screenshots": [
                    {
                        "id": "screenshot-id",
                        "name": "Screenshot name",
                        "url": "URL to screenshot image"
                    },
                    ...
                ],
                "error": "Optional error message if test failed"
            },
            ...
        ]
    }
    """
    try:
        test_results = testing_service.get_test_results(generation_id)
        
        if not test_results:
            return jsonify({
                'error': 'Test results not found for the specified generation ID.'
            }), 404
        
        return jsonify(test_results)
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@module_generator_bp.route('/screenshot/<screenshot_id>', methods=['GET'])
def get_screenshot(screenshot_id):
    """
    Endpoint for retrieving a screenshot image
    
    Response: Image file
    """
    try:
        screenshot_path = testing_service.get_screenshot_path(screenshot_id)
        
        if not screenshot_path or not os.path.exists(screenshot_path):
            return jsonify({
                'error': 'Screenshot not found.'
            }), 404
        
        return send_file(screenshot_path, mimetype='image/png')
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@module_generator_bp.route('/download/<generation_id>', methods=['GET'])
def download_module(generation_id):
    """
    Endpoint for downloading a generated module package
    
    Response: ZIP file containing the Odoo module
    """
    try:
        module_path = module_generator_service.get_module_path(generation_id)
        
        if not module_path or not os.path.exists(module_path):
            return jsonify({
                'error': 'Module package not found.'
            }), 404
        
        # Get the module name from the generation ID
        module_name = module_generator_service.get_module_name(generation_id)
        
        return send_file(
            module_path,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f"{module_name}.zip"
        )
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@module_generator_bp.route('/documentation/<generation_id>', methods=['GET'])
def get_documentation(generation_id):
    """
    Endpoint for retrieving the documentation for a generated module
    
    Response:
    {
        "test_scenarios": "Content of Test_scenarios.txt",
        "proof_of_tests": "Content of Proof_of_tests.md"
    }
    """
    try:
        documentation = module_generator_service.get_documentation(generation_id)
        
        if not documentation:
            return jsonify({
                'error': 'Documentation not found for the specified generation ID.'
            }), 404
        
        return jsonify(documentation)
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@module_generator_bp.route('/start-odoo', methods=['POST'])
def start_odoo_environment():
    """
    Endpoint for starting an Odoo Docker environment with the generated module installed
    
    Request body:
    {
        "generation_id": "generation-id"
    }
    
    Response:
    {
        "status": "success" | "error",
        "odoo_url": "URL to access the Odoo instance",
        "message": "Optional status message"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'generation_id' not in data:
            return jsonify({
                'error': 'Invalid request. Generation ID is required.'
            }), 400
        
        generation_id = data['generation_id']
        
        # Get the module path
        module_path = module_generator_service.get_module_path(generation_id)
        
        if not module_path or not os.path.exists(module_path):
            return jsonify({
                'error': 'Module package not found.'
            }), 404
        
        # Start an Odoo Docker container with the generated module
        container_info = docker_service.start_odoo_container(generation_id, module_path)
        
        # Return a success response with the URL to access the Odoo instance
        return jsonify({
            'status': 'success',
            'odoo_url': container_info['odoo_url'],
            'message': f"Odoo environment started successfully. Module {container_info['module_name']} is installed."
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@module_generator_bp.route('/run-odoo-tests', methods=['POST'])
def run_odoo_tests():
    """
    Endpoint for running tests in the Odoo environment
    
    Request body:
    {
        "generation_id": "generation-id"
    }
    
    Response:
    {
        "status": "success" | "error",
        "message": "Test results message",
        "details": {
            "output": "Test output"
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'generation_id' not in data:
            return jsonify({
                'error': 'Invalid request. Generation ID is required.'
            }), 400
        
        generation_id = data['generation_id']
        
        # Run tests in the Odoo container
        test_results = docker_service.run_odoo_tests(generation_id)
        
        # Return the test results
        return jsonify(test_results)
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@module_generator_bp.route('/stop-odoo', methods=['POST'])
def stop_odoo_environment():
    """
    Endpoint for stopping an Odoo Docker environment
    
    Request body:
    {
        "generation_id": "generation-id"
    }
    
    Response:
    {
        "status": "success" | "error",
        "message": "Optional status message"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'generation_id' not in data:
            return jsonify({
                'error': 'Invalid request. Generation ID is required.'
            }), 400
        
        generation_id = data['generation_id']
        
        # Stop the Odoo Docker container
        docker_service.stop_container(generation_id)
        
        # Return a success response
        return jsonify({
            'status': 'success',
            'message': 'Odoo environment stopped successfully.'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500