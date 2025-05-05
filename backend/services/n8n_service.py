import os
import requests
import json
import logging
import uuid
import base64
from urllib.parse import urljoin
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class N8nService:
    """
    Service for interacting with n8n workflows for Odoo module development
    """
    
    def __init__(self, config_service=None):
        """
        Initialize the n8n service
        """
        # If config_service is provided, use it for configuration
        if config_service:
            n8n_config = config_service.get_n8n_config()
            self.base_url = n8n_config.get('base_url')
            self.api_key = n8n_config.get('api_key')
        else:
            # Fallback to environment variables
            self.base_url = os.environ.get('N8N_BASE_URL', 'http://localhost:5678')
            self.api_key = os.environ.get('N8N_API_KEY', '')
        
        # Define the webhook paths for each workflow
        self.workflows = {
            'specification': '/webhook/specification-agent',
            'specification_feedback': '/webhook/specification-feedback',
            'coding': '/webhook/coding-agent',
            'testing': '/webhook/testing-agent',
            'user_testing': '/webhook/user-testing',
            'user_testing_feedback': '/webhook/user-testing-feedback',
            'user_testing_refresh': '/webhook/user-testing-refresh'
        }
        
        # Cache for user testing iframe URLs
        self.iframe_cache = {}
        
        logger.info(f"N8nService initialized with base URL: {self.base_url}")
    
    def _make_request(self, endpoint, payload, timeout=300):
        """
        Make a request to an n8n webhook
        
        Args:
            endpoint (str): Webhook endpoint
            payload (dict): Request payload
            timeout (int): Request timeout in seconds
        
        Returns:
            dict: Response data
        """
        # Check if n8n service is configured to be disabled (for testing)
        if os.environ.get('DISABLE_N8N', '').lower() == 'true':
            logger.warning("N8n service is disabled. Using fallback mechanisms.")
            return {'status': 'error', 'message': 'N8n service is disabled', 'fallback_required': True}
        
        url = urljoin(self.base_url, endpoint)
        headers = {'Content-Type': 'application/json'}
        
        if self.api_key:
            headers['X-N8N-API-KEY'] = self.api_key
        
        try:
            logger.info(f"Making request to n8n workflow: {endpoint}")
            response = requests.post(url, json=payload, headers=headers, timeout=timeout)
            
            if response.status_code == 200:
                try:
                    return response.json()
                except json.JSONDecodeError:
                    logger.warning(f"Response from n8n is not valid JSON: {response.text[:100]}...")
                    return {'status': 'error', 'message': 'Invalid JSON response from n8n workflow', 'fallback_required': True}
            else:
                logger.error(f"Error calling n8n workflow: {response.status_code} - {response.text[:200]}")
                return {'status': 'error', 'message': f"Error calling n8n workflow: {response.status_code}", 'fallback_required': True}
        except requests.ConnectionError:
            logger.error(f"Connection error when calling n8n workflow: {endpoint}. Is n8n running on {self.base_url}?")
            return {'status': 'error', 'message': f"Cannot connect to n8n. Is it running on {self.base_url}?", 'fallback_required': True}
        except requests.Timeout:
            logger.error(f"Timeout calling n8n workflow (after {timeout}s): {endpoint}")
            return {'status': 'error', 'message': f"Timeout calling n8n workflow after {timeout} seconds", 'fallback_required': True}
        except Exception as e:
            logger.error(f"Exception calling n8n workflow: {str(e)}")
            return {'status': 'error', 'message': str(e), 'fallback_required': True}
    
    def generate_specification(self, context):
        """
        Generate a module specification using the specification workflow with Gemini 2.5
        
        Args:
            context (dict): Context information for specification generation
            
        Returns:
            dict: Specification generation result in HTML format
        """
        payload = {
            'sessionId': context.get('sessionId', f"session-{context.get('userId', '')}-{context.get('timestamp', '')}"),
            'requirements': context.get('requirements', ''),
            'moduleVersion': context.get('moduleVersion', '1.0.0'),
            'moduleName': context.get('moduleName', 'odoo_module'),
            'odooVersion': context.get('odooVersion', '16.0'),  # Include Odoo version
            'odooEdition': context.get('odooEdition', 'community')  # Specify edition (community/enterprise)
        }
        
        return self._make_request(self.workflows['specification'], payload)
    
    def submit_specification_feedback(self, specification_id, feedback, updated_specification=None, approved=False):
        """
        Submit feedback on a generated specification
        
        Args:
            specification_id (str): Specification ID
            feedback (str): User feedback on the specification
            updated_specification (str, optional): Updated specification content if provided
            approved (bool): Whether the specification is approved for next step
            
        Returns:
            dict: Feedback submission result in HTML format
        """
        payload = {
            'specificationId': specification_id,
            'feedback': feedback,
            'specification': updated_specification,
            'approved': approved
        }
        
        return self._make_request(self.workflows['specification_feedback'], payload)
    
    def generate_module_code(self, plan_id, specification, metadata=None):
        """
        Generate module code using the coding workflow with Claude 3.7 Sonnet
        
        Args:
            plan_id (str): Development plan ID
            specification (dict): Module specification
            metadata (dict): Additional metadata
            
        Returns:
            dict: Module generation result with organized files
        """
        if metadata is None:
            metadata = {}
        
        payload = {
            'planId': plan_id,
            'specification': specification,
            'moduleName': metadata.get('moduleName', 'odoo_module'),
            'moduleVersion': metadata.get('moduleVersion', '1.0.0'),
            'odooVersion': metadata.get('odooVersion', '16.0'),
            'odooEdition': metadata.get('odooEdition', 'community'),
            'sessionId': metadata.get('sessionId', f"session-{plan_id}")
        }
        
        return self._make_request(self.workflows['coding'], payload)
    
    def check_coding_status(self, generation_id):
        """
        Check the status of a module generation
        
        Args:
            generation_id (str): Generation ID
            
        Returns:
            dict: Generation status
        """
        payload = {
            'generationId': generation_id
        }
        
        return self._make_request(self.workflows['coding_status'], payload)
    
    def run_tests(self, module_path, generation_id, metadata=None):
        """
        Run automated tests on a module
        
        Args:
            module_path (str): Path to the module
            generation_id (str): Generation ID
            metadata (dict): Additional metadata
        
        Returns:
            dict: Response data from n8n workflow
        """
        if metadata is None:
            metadata = {}
            
        if 'odooVersion' not in metadata:
            metadata['odooVersion'] = '16.0'
        if 'odooEdition' not in metadata:
            metadata['odooEdition'] = 'community'
            
        payload = {
            'generationId': generation_id,
            'modulePath': module_path,
            'odooVersion': metadata.get('odooVersion'),
            'odooEdition': metadata.get('odooEdition'),
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Running automated tests for generation {generation_id}")
        return self._make_request(self.workflows['testing'], payload, timeout=600)  # Longer timeout for tests
    
    def get_user_testing_iframe(self, container_url, module_name, generation_id, metadata=None):
        """
        Get an iframe URL for user testing
        
        Args:
            container_url (str): URL of the Odoo container
            module_name (str): Name of the module being tested
            generation_id (str): Generation ID
            metadata (dict): Additional metadata
        
        Returns:
            dict: Response data from n8n workflow containing iframe URL
        """
        if metadata is None:
            metadata = {}
            
        if 'odooVersion' not in metadata:
            metadata['odooVersion'] = '16.0'
        if 'odooEdition' not in metadata:
            metadata['odooEdition'] = 'community'
        
        # Generate a unique session ID for this test session
        test_session_id = str(uuid.uuid4())
        
        payload = {
            'generationId': generation_id,
            'containerUrl': container_url,
            'moduleName': module_name,
            'testSessionId': test_session_id,
            'odooVersion': metadata.get('odooVersion'),
            'odooEdition': metadata.get('odooEdition'),
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Requesting user testing iframe for module {module_name} (generation {generation_id})")
        response = self._make_request(self.workflows['user_testing'], payload)
        
        if response and response.get('status') == 'success' and 'iframeUrl' in response:
            # Cache the iframe URL for this generation ID
            self.iframe_cache[generation_id] = {
                'url': response['iframeUrl'],
                'session_id': test_session_id,
                'timestamp': datetime.now().isoformat()
            }
        
        return response
    
    def submit_user_feedback(self, generation_id, feedback, screenshots=None, metadata=None):
        """
        Submit user feedback from manual testing
        
        Args:
            generation_id (str): Generation ID
            feedback (str): User feedback text
            screenshots (list): List of screenshots as base64 encoded strings
            metadata (dict): Additional metadata
        
        Returns:
            dict: Response data from n8n workflow
        """
        if metadata is None:
            metadata = {}
        
        if screenshots is None:
            screenshots = []
            
        # Get the cached session information if available
        session_info = self.iframe_cache.get(generation_id, {})
        test_session_id = session_info.get('session_id', str(uuid.uuid4()))
        
        payload = {
            'generationId': generation_id,
            'testSessionId': test_session_id,
            'feedback': feedback,
            'screenshots': screenshots,
            'timestamp': datetime.now().isoformat(),
            'metadata': metadata
        }
        
        logger.info(f"Submitting user feedback for generation {generation_id}")
        return self._make_request(self.workflows['user_testing_feedback'], payload)
        
    def refresh_testing_iframe(self, generation_id, container_url, module_name, metadata=None):
        """
        Refresh the user testing iframe after module updates
        
        Args:
            generation_id (str): Generation ID
            container_url (str): URL of the Odoo container
            module_name (str): Name of the module being tested
            metadata (dict): Additional metadata
        
        Returns:
            dict: Response data from n8n workflow
        """
        if metadata is None:
            metadata = {}
            
        # Get the cached session information if available
        session_info = self.iframe_cache.get(generation_id, {})
        test_session_id = session_info.get('session_id', str(uuid.uuid4()))
        
        payload = {
            'generationId': generation_id,
            'testSessionId': test_session_id,
            'containerUrl': container_url,
            'moduleName': module_name,
            'timestamp': datetime.now().isoformat(),
            'metadata': metadata
        }
        
        logger.info(f"Refreshing testing iframe for generation {generation_id}")
        response = self._make_request(self.workflows['user_testing_refresh'], payload)
        
        if response and response.get('status') == 'success' and 'iframeUrl' in response:
            # Update the cached iframe URL for this generation ID
            self.iframe_cache[generation_id] = {
                'url': response['iframeUrl'],
                'session_id': test_session_id,
                'timestamp': datetime.now().isoformat()
            }
        
        return response
