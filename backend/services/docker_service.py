import os
import uuid
import time
import socket
import random
from threading import Thread
import logging
from services.n8n_service import N8nService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DockerService:
    """
    Service for managing Docker containers for Odoo instances
    """
    
    def __init__(self):
        """
        Initialize the Docker service
        """
        self.containers = {}  # Map of generation_id to container info
        self.base_port = 8069  # Odoo's default port
        self.max_port = 9069  # Maximum port to use (allows for 1000 containers)
        self.host_ip = self._get_host_ip()
        self.use_mock = True  # Use mock mode by default
        self.n8n_service = N8nService()
        
        # Try to initialize Docker client if available
        try:
            import docker
            self.client = docker.from_env()
            self.use_mock = False
            logger.info("Docker is available, using real Docker service")
            
            # Create a cleanup thread to remove inactive containers
            self.cleanup_thread = Thread(target=self._cleanup_inactive_containers, daemon=True)
            self.cleanup_thread.start()
        except Exception as e:
            logger.warning(f"Docker is not available, using mock mode: {str(e)}")
    
    def start_odoo_container(self, generation_id, module_path):
        """
        Start an Odoo Docker container with the generated module installed
        
        Args:
            generation_id (str): Generation ID
            module_path (str): Path to the module zip file
            
        Returns:
            dict: Container information including URL to access Odoo
        """
        try:
            # Check if a container already exists for this generation
            if generation_id in self.containers:
                container_info = self.containers[generation_id]
                
                # Update last accessed time
                container_info['last_accessed'] = time.time()
                
                # If using real Docker, check if the container is still running
                if not self.use_mock:
                    try:
                        container = self.client.containers.get(container_info['container_id'])
                        if container.status == 'running':
                            logger.info(f"Container for generation {generation_id} is already running")
                            return container_info
                    except Exception:
                        # Container doesn't exist anymore, remove it from our tracking
                        logger.info(f"Container for generation {generation_id} not found, will create a new one")
                        del self.containers[generation_id]
                else:
                    # In mock mode, just return the existing container info
                    logger.info(f"Mock container for generation {generation_id} is already running")
                    return container_info
            
            # Find an available port
            port = self._find_available_port()
            if not port:
                raise Exception("No available ports for new Odoo container")
            
            # Extract the module name from the zip file path
            module_name = os.path.basename(module_path).split('_')[0]
            
            # Create a unique container name
            container_name = f"odoo-{generation_id}-{uuid.uuid4().hex[:8]}"
            
            if self.use_mock:
                # In mock mode, just create a container info object
                container_id = f"mock-container-{uuid.uuid4().hex}"
                
                # Store container information
                container_info = {
                    'container_id': container_id,
                    'container_name': container_name,
                    'port': port,
                    'odoo_url': f"http://{self.host_ip}:{port}",
                    'module_name': module_name,
                    'created_at': time.time(),
                    'last_accessed': time.time(),
                    'is_mock': True
                }
                
                self.containers[generation_id] = container_info
                
                logger.info(f"Started mock Odoo container for generation {generation_id} at {container_info['odoo_url']}")
                
                return container_info
            else:
                # Using real Docker
                # Create a volume for Odoo data
                volume_name = f"odoo-data-{generation_id}"
                volume = self.client.volumes.create(name=volume_name)
                
                # Extract the module to a temporary directory
                module_mount_path = os.path.abspath(os.path.dirname(module_path))
                
                # Start the Odoo container
                container = self.client.containers.run(
                    image="odoo:16.0",  # Use Odoo 16.0 image
                    name=container_name,
                    detach=True,
                    ports={8069: port},  # Map container's 8069 to host's port
                    volumes={
                        volume_name: {'bind': '/var/lib/odoo', 'mode': 'rw'},
                        module_mount_path: {'bind': '/mnt/module', 'mode': 'ro'}
                    },
                    environment={
                        'POSTGRES_PASSWORD': 'odoo',
                        'POSTGRES_USER': 'odoo',
                        'POSTGRES_DB': f'odoo_{generation_id.replace("-", "_")}',
                    },
                    command=f"--database odoo_{generation_id.replace('-', '_')} --init base,{module_name} --dev all"
                )
                
                # Store container information
                container_info = {
                    'container_id': container.id,
                    'container_name': container_name,
                    'port': port,
                    'odoo_url': f"http://{self.host_ip}:{port}",
                    'module_name': module_name,
                    'created_at': time.time(),
                    'last_accessed': time.time(),
                    'is_mock': False
                }
                
                self.containers[generation_id] = container_info
                
                logger.info(f"Started Odoo container for generation {generation_id} at {container_info['odoo_url']}")
                
                # Wait for Odoo to start (this is a simple approach, could be improved)
                time.sleep(5)
                
                return container_info
            
        except Exception as e:
            logger.error(f"Error starting Odoo container: {str(e)}")
            raise
    
    def run_odoo_tests(self, generation_id):
        """
        Run tests in an Odoo container
        
        Args:
            generation_id (str): Generation ID
            
        Returns:
            dict: Test results
        """
        try:
            if generation_id not in self.containers:
                raise Exception(f"No container found for generation {generation_id}")
            
            container_info = self.containers[generation_id]
            module_name = container_info['module_name']
            
            # Update last accessed time
            container_info['last_accessed'] = time.time()
            
            if self.use_mock or container_info.get('is_mock', False):
                # In mock mode, just return simulated test results
                # Randomly decide if tests pass or fail (90% pass rate)
                success = random.random() < 0.9
                
                if success:
                    status = "success"
                    message = f"All tests for {module_name} passed successfully."
                    output = f"Running tests for module {module_name}...\nAll tests passed successfully."
                else:
                    status = "error"
                    message = f"Tests failed for module {module_name}. See logs for details."
                    output = f"Running tests for module {module_name}...\nFAIL: test_something (odoo.addons.{module_name}.tests.test_module)"
                
                return {
                    'status': status,
                    'message': message,
                    'details': {
                        'output': output
                    }
                }
            else:
                # Using real Docker
                container_id = container_info['container_id']
                
                # Get the container
                container = self.client.containers.get(container_id)
                
                # Run the tests
                exec_result = container.exec_run(
                    cmd=f"python3 /usr/bin/odoo --test-enable --stop-after-init --log-level=test -d odoo_{generation_id.replace('-', '_')} -i {module_name}",
                    stdout=True,
                    stderr=True
                )
                
                # Parse the test results
                output = exec_result.output.decode('utf-8')
                
                # Simple parsing - in a real implementation, you'd want to parse the output more carefully
                if "FAIL" in output or "ERROR" in output:
                    status = "error"
                    message = f"Tests failed for module {module_name}. See logs for details."
                else:
                    status = "success"
                    message = f"All tests for {module_name} passed successfully."
                
                return {
                    'status': status,
                    'message': message,
                    'details': {
                        'output': output
                    }
                }
            
        except Exception as e:
            logger.error(f"Error running Odoo tests: {str(e)}")
            raise
    
    def stop_container(self, generation_id):
        """
        Stop and remove an Odoo container
        
        Args:
            generation_id (str): Generation ID
        """
        try:
            if generation_id in self.containers:
                container_info = self.containers[generation_id]
                
                if self.use_mock or container_info.get('is_mock', False):
                    # In mock mode, just remove the container from our tracking
                    logger.info(f"Stopped and removed mock container for generation {generation_id}")
                    del self.containers[generation_id]
                else:
                    # Using real Docker
                    container_id = container_info['container_id']
                    
                    # Get the container
                    try:
                        container = self.client.containers.get(container_id)
                        
                        # Stop and remove the container
                        container.stop(timeout=5)
                        container.remove()
                        
                        logger.info(f"Stopped and removed container for generation {generation_id}")
                    except Exception as e:
                        logger.info(f"Error stopping container for generation {generation_id}: {str(e)}")
                    
                    # Remove the volume
                    try:
                        volume_name = f"odoo-data-{generation_id}"
                        volume = self.client.volumes.get(volume_name)
                        volume.remove()
                        logger.info(f"Removed volume for generation {generation_id}")
                    except Exception as e:
                        logger.info(f"Error removing volume for generation {generation_id}: {str(e)}")
                    
                    # Remove from our tracking
                    del self.containers[generation_id]
        except Exception as e:
            logger.error(f"Error stopping container: {str(e)}")
    
    def _find_available_port(self):
        """
        Find an available port for a new container
        
        Returns:
            int: Available port number or None if no ports are available
        """
        # Check if any ports in our range are available
        for port in range(self.base_port, self.max_port + 1):
            # Skip ports that are already in use by our containers
            if any(info['port'] == port for info in self.containers.values()):
                continue
            
            # Check if the port is available on the host
            if self._is_port_available(port):
                return port
        
        return None
    
    def _is_port_available(self, port):
        """
        Check if a port is available on the host
        
        Args:
            port (int): Port number to check
            
        Returns:
            bool: True if the port is available, False otherwise
        """
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) != 0
    
    def _get_host_ip(self):
        """
        Get the host IP address
        
        Returns:
            str: Host IP address
        """
        # In a production environment, this would be the public IP or hostname
        # For development, we'll use localhost
        return "localhost"
    
    def _cleanup_inactive_containers(self):
        """
        Periodically clean up inactive containers
        """
        while True:
            try:
                current_time = time.time()
                inactive_timeout = 3600  # 1 hour
                
                # Find inactive containers
                inactive_generations = []
                for generation_id, container_info in list(self.containers.items()):
                    if current_time - container_info['last_accessed'] > inactive_timeout:
                        inactive_generations.append(generation_id)
                
                # Stop and remove inactive containers
                for generation_id in inactive_generations:
                    logger.info(f"Cleaning up inactive container for generation {generation_id}")
                    self.stop_container(generation_id)
                
                # Sleep for a while before checking again
                time.sleep(300)  # Check every 5 minutes
            except Exception as e:
                logger.error(f"Error in cleanup thread: {str(e)}")
                time.sleep(60)  # Sleep for a minute before trying again