import os
import json
import uuid
import re
import shutil
import subprocess
from datetime import datetime
from services.llm_service import LLMService
from services.n8n_service import N8nService
from services.docker_service import DockerService
from services.config_service import ConfigService

class TestingService:
    """
    Service for testing generated Odoo modules
    """
    
    def __init__(self, n8n_service=None, docker_service=None, config_service=None):
        """
        Initialize the testing service
        
        Args:
            n8n_service (N8nService, optional): N8n service for integration
            docker_service (DockerService, optional): Docker service for testing containers
            config_service (ConfigService, optional): Configuration service
        """
        self.llm_service = LLMService()
        self.n8n_service = n8n_service
        self.docker_service = docker_service
        self.config_service = config_service
        
        # Create data directories if they don't exist
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        self.screenshots_dir = os.path.join(self.data_dir, 'screenshots')
        self.test_results_dir = os.path.join(self.data_dir, 'test_results')
        self.fixes_dir = os.path.join(self.data_dir, 'fixes')
        self.user_tests_dir = os.path.join(self.data_dir, 'user_tests')
        
        os.makedirs(self.screenshots_dir, exist_ok=True)
        os.makedirs(self.test_results_dir, exist_ok=True)
        os.makedirs(self.fixes_dir, exist_ok=True)
        os.makedirs(self.user_tests_dir, exist_ok=True)
        
        # In-memory storage for test results (in a real implementation, this would be a database)
        self.test_results = {}
        self.fixes = {}
        self.user_tests = {}
        
        # Cache for user testing sessions
        self.testing_sessions = {}
        
        # Initialize with empty data for now
        # We'll implement proper loading later
    
    def run_tests(self, module_path, generation_id, metadata=None):
        """
        Run tests on a generated module with Claude 3.7 Sonnet for automated fixes
        
        Args:
            module_path (str): Path to the module directory
            generation_id (str): Generation ID
            metadata (dict, optional): Additional metadata including Odoo version and edition
            
        Returns:
            dict: Test results with explanation of changes if any
        """
        # Create a test results object
        test_results = {
            'generation_id': generation_id,
            'timestamp': datetime.now().isoformat(),
            'status': 'running',
            'backend_tests': [],
            'frontend_tests': [],
            'errors': [],
            'fixes_applied': [],
            'explanation': ''
        }
        
        if metadata is None:
            metadata = {}
            
        # Add Odoo version and edition information if not provided
        if 'odooVersion' not in metadata:
            metadata['odooVersion'] = '16.0'
        if 'odooEdition' not in metadata:
            metadata['odooEdition'] = 'community'
        
        try:
            # Try to use n8n workflow for automated testing
            try:
                # Call the n8n testing workflow with Claude 3.7 Sonnet for fixes
                workflow_results = self.n8n_service.run_tests(module_path, generation_id, metadata)
                
                if workflow_results and workflow_results.get('status') != 'error' and not workflow_results.get('fallback_required', False):
                    # Use test results from the n8n workflow
                    if 'backend_tests' in workflow_results:
                        test_results['backend_tests'] = workflow_results['backend_tests']
                    if 'frontend_tests' in workflow_results:
                        test_results['frontend_tests'] = workflow_results['frontend_tests']
                    if 'errors' in workflow_results:
                        test_results['errors'] = workflow_results['errors']
                    if 'fixes_applied' in workflow_results:
                        test_results['fixes_applied'] = workflow_results['fixes_applied']
                    if 'status' in workflow_results:
                        test_results['status'] = workflow_results['status']
                    if 'explanation' in workflow_results:
                        test_results['explanation'] = workflow_results['explanation']
                        
                    # Check if there are before/after test results
                    if 'backend_tests_after_fix' in workflow_results:
                        test_results['backend_tests_after_fix'] = workflow_results['backend_tests_after_fix']
                    if 'frontend_tests_after_fix' in workflow_results:
                        test_results['frontend_tests_after_fix'] = workflow_results['frontend_tests_after_fix']
                else:
                    # Fallback to direct testing methods
                    self._fallback_run_tests(module_path, test_results, metadata)
            except Exception as e:
                print(f"Error calling n8n testing workflow: {str(e)}")
                # Fallback to direct testing methods
                self._fallback_run_tests(module_path, test_results, metadata)
        except Exception as e:
            print(f"Error running tests: {str(e)}")
            test_results['status'] = 'error'
            test_results['errors'].append({
                'type': 'system',
                'error': str(e)
            })
        
        # Save test results
        self.test_results[generation_id] = test_results
        self._save_test_results(generation_id)
        
        return test_results
        
    def get_testing_iframe(self, module_name, generation_id, metadata=None):
        """
        Get an iframe URL for user testing
        
        Args:
            module_name (str): Name of the module being tested
            generation_id (str): Generation ID
            metadata (dict): Additional metadata
            
        Returns:
            dict: Response containing iframe URL
        """
        # Initialize result
        result = {
            'generation_id': generation_id,
            'timestamp': datetime.now().isoformat(),
            'status': 'pending',
            'iframe_url': None,
            'errors': []
        }
        
        try:
            # Get a running Odoo container URL from the Docker service
            if not self.docker_service:
                self.docker_service = DockerService(self.n8n_service)
            
            # Check if there's metadata passed, otherwise create it
            if metadata is None:
                metadata = {}
                
                # If there's a config service, get default values from it
                if self.config_service:
                    odoo_defaults = self.config_service.get_odoo_defaults()
                    metadata['odooVersion'] = odoo_defaults.get('version', '16.0')
                    metadata['odooEdition'] = odoo_defaults.get('edition', 'community')
                else:
                    # Use defaults if no config service
                    metadata['odooVersion'] = '16.0'
                    metadata['odooEdition'] = 'community'
            
            # Start an Odoo container or get the URL of an existing one
            container_url = self.docker_service.get_odoo_container_url(metadata.get('odooVersion', '16.0'), metadata.get('odooEdition', 'community'))
            
            if not container_url:
                result['status'] = 'error'
                result['errors'].append({
                    'type': 'system',
                    'error': 'Failed to start Odoo container'
                })
                return result
            
            # Use n8n workflow to create iframe URL
            if self.n8n_service:
                iframe_response = self.n8n_service.get_user_testing_iframe(
                    container_url=container_url,
                    module_name=module_name,
                    generation_id=generation_id,
                    metadata=metadata
                )
                
                if iframe_response and iframe_response.get('status') == 'success' and 'iframeUrl' in iframe_response:
                    result['status'] = 'success'
                    result['iframe_url'] = iframe_response['iframeUrl']
                    
                    # Store the iframe session information
                    self.testing_sessions[generation_id] = {
                        'container_url': container_url,
                        'module_name': module_name,
                        'iframe_url': iframe_response['iframeUrl'],
                        'session_id': iframe_response.get('testSessionId', str(uuid.uuid4())),
                        'created_at': datetime.now().isoformat(),
                        'metadata': metadata
                    }
                else:
                    result['status'] = 'error'
                    result['errors'].append({
                        'type': 'system',
                        'error': iframe_response.get('message', 'Failed to generate testing iframe')
                    })
            else:
                # Fallback if n8n service is not available
                result['status'] = 'success'
                result['iframe_url'] = container_url
                
                # Store the basic information
                self.testing_sessions[generation_id] = {
                    'container_url': container_url,
                    'module_name': module_name,
                    'iframe_url': container_url,
                    'session_id': str(uuid.uuid4()),
                    'created_at': datetime.now().isoformat(),
                    'metadata': metadata
                }
        except Exception as e:
            print(f"Error getting testing iframe: {str(e)}")
            result['status'] = 'error'
            result['errors'].append({
                'type': 'system',
                'error': str(e)
            })
        
        # Save the test session info
        self.user_tests[generation_id] = result
        self._save_user_test_results(generation_id)
        
        return result
        
    def _fallback_run_tests(self, module_path, test_results, metadata=None):
        """
        Fallback method to run tests directly if n8n workflow fails
        
        Args:
            module_path (str): Path to the module directory
            test_results (dict): Test results object to update
            metadata (dict, optional): Additional metadata including Odoo version and edition
        """
        # Run backend tests
        backend_results = self._run_backend_tests(module_path)
        test_results['backend_tests'] = backend_results
        
        # Run frontend tests
        frontend_results = self._run_frontend_tests(module_path)
        test_results['frontend_tests'] = frontend_results
        
        # Collect errors from both backend and frontend tests
        errors = []
        for test in backend_results:
            if not test.get('passed', False) and 'error' in test:
                errors.append({
                    'type': 'backend',
                    'test_name': test['name'],
                    'error': test['error'],
                    'file_path': test.get('file_path')
                })
        
        for test in frontend_results:
            if not test.get('passed', False) and 'error' in test:
                errors.append({
                    'type': 'frontend',
                    'test_name': test['name'],
                    'error': test['error'],
                    'file_path': test.get('file_path')
                })
        
        test_results['errors'] = errors
        
        # Update status based on test results
        if not errors:
            test_results['status'] = 'passed'
        else:
            test_results['status'] = 'failed'
            
            # Attempt to fix errors
            fixes = self._fix_errors(module_path, errors)
            test_results['fixes_applied'] = fixes
            
            # If fixes were applied, run tests again
            if fixes:
                # Update status to indicate fixes were applied
                test_results['status'] = 'fixed'
                
                # Run backend tests again
                backend_results = self._run_backend_tests(module_path)
                test_results['backend_tests_after_fix'] = backend_results
                
                # Run frontend tests again
                frontend_results = self._run_frontend_tests(module_path)
                test_results['frontend_tests_after_fix'] = frontend_results
                
                # Check if all tests pass after fixes
                all_pass = True
                for test in backend_results + frontend_results:
                    if not test.get('passed', False):
                        all_pass = False
                        break
                        
                if all_pass:
                    test_results['status'] = 'fixed_and_passed'
                    
    def get_user_testing_session(self, generation_id):
        """
        Get the user testing session information
            
        Args:
            generation_id (str): Generation ID
                
        Returns:
            dict: User testing session information
        """
        if generation_id not in self.testing_sessions:
            return None
            
        return self.testing_sessions[generation_id]
    
    def get_user_testing_results(self, generation_id):
        """
        Get the user testing results
            
        Args:
            generation_id (str): Generation ID
                
        Returns:
            dict: User testing results
        """
        if generation_id not in self.user_tests:
            return None
            
        return self.user_tests[generation_id]

    def _save_user_test_results(self, generation_id):
        """
        Save user test results to disk
            
        Args:
            generation_id (str): Generation ID
        """
        if generation_id in self.user_tests:
            file_path = os.path.join(self.user_tests_dir, f"{generation_id}.json")
            try:
                with open(file_path, 'w') as f:
                    json.dump(self.user_tests[generation_id], f, indent=2)
            except Exception as e:
                print(f"Error saving user test results for {generation_id}: {str(e)}")
    
    def _save_fixes(self, generation_id):
        """
        Save fixes to disk
        
        Args:
            generation_id (str): Generation ID
        """
        if generation_id in self.fixes:
            file_path = os.path.join(self.fixes_dir, f"{generation_id}.json")
            try:
                with open(file_path, 'w') as f:
                    json.dump(self.fixes[generation_id], f, indent=2)
            except Exception as e:
                print(f"Error saving fixes for {generation_id}: {str(e)}")
    
    def _load_fixes(self, generation_id):
        """
        Load fixes from a file
        
        Args:
            generation_id (str): Generation ID
            
        Returns:
            bool: True if loaded successfully, False otherwise
        """
        file_path = os.path.join(self.fixes_dir, f"{generation_id}.json")
        
        if not os.path.exists(file_path):
            return False
        
        try:
            with open(file_path, 'r') as f:
                self.fixes[generation_id] = json.load(f)
            return True
        except Exception:
            return False
    
    def submit_user_feedback(self, generation_id, feedback, screenshots=None, metadata=None):
        """
        Submit user feedback from manual testing
        
        Args:
            generation_id (str): Generation ID
            feedback (str): User feedback text
            screenshots (list): List of screenshots as base64 encoded strings
            metadata (dict): Additional metadata
            
        Returns:
            dict: Status of the feedback submission
        """
        result = {
            'generation_id': generation_id,
            'timestamp': datetime.now().isoformat(),
            'status': 'pending',
            'feedback': feedback,
            'feedback_saved': False,
            'errors': []
        }
        
        try:
            # Get the testing session information
            session_info = self.testing_sessions.get(generation_id, {})
            
            if not session_info:
                result['status'] = 'error'
                result['errors'].append({
                    'type': 'system',
                    'error': 'No active testing session found for this generation ID'
                })
                return result
            
            # If n8n service is available, use it to submit feedback
            if self.n8n_service:
                # Combine metadata from the session with any additional metadata
                combined_metadata = {}
                combined_metadata.update(session_info.get('metadata', {}))
                if metadata:
                    combined_metadata.update(metadata)
                
                # Submit feedback through n8n workflow
                feedback_response = self.n8n_service.submit_user_feedback(
                    generation_id=generation_id,
                    feedback=feedback,
                    screenshots=screenshots,
                    metadata=combined_metadata
                )
                
                if feedback_response and feedback_response.get('status') == 'success':
                    result['status'] = 'success'
                    result['feedback_saved'] = True
                else:
                    result['status'] = 'error'
                    result['errors'].append({
                        'type': 'system',
                        'error': feedback_response.get('message', 'Failed to submit feedback')
                    })
            else:
                # Fallback if n8n service is not available
                # Just save the feedback locally
                user_test_data = self.user_tests.get(generation_id, {})
                if not user_test_data:
                    user_test_data = {
                        'generation_id': generation_id,
                        'timestamp': datetime.now().isoformat(),
                        'status': 'success',
                        'iframe_url': session_info.get('iframe_url', ''),
                        'feedback': [],
                        'errors': []
                    }
                
                # Add the feedback
                new_feedback = {
                    'timestamp': datetime.now().isoformat(),
                    'text': feedback,
                    'screenshots': [] if screenshots is None else screenshots
                }
                
                if 'feedback' not in user_test_data:
                    user_test_data['feedback'] = []
                
                user_test_data['feedback'].append(new_feedback)
                self.user_tests[generation_id] = user_test_data
                
                # Save to disk
                self._save_user_test_results(generation_id)
                
                result['status'] = 'success'
                result['feedback_saved'] = True
        except Exception as e:
            print(f"Error submitting user feedback: {str(e)}")
            result['status'] = 'error'
            result['errors'].append({
                'type': 'system',
                'error': str(e)
            })
        
        return result
    
    def refresh_testing_iframe(self, generation_id, metadata=None):
        """
        Refresh the user testing iframe after module updates
        
        Args:
            generation_id (str): Generation ID
            metadata (dict): Additional metadata
            
        Returns:
            dict: Status of the refresh operation
        """
        result = {
            'generation_id': generation_id,
            'timestamp': datetime.now().isoformat(),
            'status': 'pending',
            'iframe_url': None,
            'errors': []
        }
        
        try:
            # Get the testing session information
            session_info = self.testing_sessions.get(generation_id, {})
            
            if not session_info:
                result['status'] = 'error'
                result['errors'].append({
                    'type': 'system',
                    'error': 'No active testing session found for this generation ID'
                })
                return result
            
            # If n8n service is available, use it to refresh the iframe
            if self.n8n_service:
                # Combine metadata from the session with any additional metadata
                combined_metadata = {}
                combined_metadata.update(session_info.get('metadata', {}))
                if metadata:
                    combined_metadata.update(metadata)
                
                # Call the refresh workflow
                refresh_response = self.n8n_service.refresh_testing_iframe(
                    generation_id=generation_id,
                    container_url=session_info.get('container_url', ''),
                    module_name=session_info.get('module_name', ''),
                    metadata=combined_metadata
                )
                
                if refresh_response and refresh_response.get('status') == 'success':
                    result['status'] = 'success'
                    if 'iframeUrl' in refresh_response:
                        result['iframe_url'] = refresh_response['iframeUrl']
                        
                        # Update the session information
                        session_info['iframe_url'] = refresh_response['iframeUrl']
                        session_info['updated_at'] = datetime.now().isoformat()
                        self.testing_sessions[generation_id] = session_info
                    else:
                        result['iframe_url'] = session_info.get('iframe_url', '')
                else:
                    result['status'] = 'error'
                    result['errors'].append({
                        'type': 'system',
                        'error': refresh_response.get('message', 'Failed to refresh iframe')
                    })
            else:
                # Fallback if n8n service is not available
                # Just return the existing iframe URL
                result['status'] = 'success'
                result['iframe_url'] = session_info.get('iframe_url', '')
        except Exception as e:
            print(f"Error refreshing testing iframe: {str(e)}")
            result['status'] = 'error'
            result['errors'].append({
                'type': 'system',
                'error': str(e)
            })
        
        return result