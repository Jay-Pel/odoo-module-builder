import docker
import asyncio
import os
import tempfile
import zipfile
import logging
import time
import httpx
from typing import Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class DockerManager:
    """Manages Docker containers for Odoo testing"""
    
    def __init__(self):
        try:
            self.client = docker.from_env()
            self.network_name = "omb-test-network"
            self._ensure_network()
        except Exception as e:
            logger.error(f"Failed to initialize Docker client: {e}")
            self.client = None
    
    def _ensure_network(self):
        """Ensure the test network exists"""
        try:
            self.client.networks.get(self.network_name)
        except docker.errors.NotFound:
            logger.info(f"Creating Docker network: {self.network_name}")
            self.client.networks.create(self.network_name, driver="bridge")
    
    async def check_docker(self) -> bool:
        """Check if Docker is available and running"""
        try:
            if not self.client:
                return False
            self.client.ping()
            return True
        except Exception as e:
            logger.error(f"Docker not available: {e}")
            return False
    
    async def setup_odoo_environment(self, session_id: str, odoo_version: int, module_url: str) -> Dict:
        """Set up Odoo and PostgreSQL containers for testing"""
        try:
            logger.info(f"Setting up Odoo environment for session {session_id}")
            
            # Download and extract module
            module_path = await self._download_and_extract_module(module_url, session_id)
            
            # Start PostgreSQL container
            postgres_container = await self._start_postgres_container(session_id)
            
            # Wait for PostgreSQL to be ready
            await self._wait_for_postgres(postgres_container)
            
            # Start Odoo container
            odoo_container = await self._start_odoo_container(
                session_id, 
                odoo_version, 
                module_path,
                postgres_container.name
            )
            
            # Wait for Odoo to be ready
            odoo_url = await self._wait_for_odoo(odoo_container, session_id)
            
            return {
                "session_id": session_id,
                "postgres_container_id": postgres_container.id,
                "odoo_container_id": odoo_container.id,
                "odoo_url": odoo_url,
                "module_path": module_path
            }
            
        except Exception as e:
            logger.error(f"Failed to setup Odoo environment: {e}")
            await self.cleanup_session(session_id)
            raise
    
    async def _download_and_extract_module(self, module_url: str, session_id: str) -> str:
        """Download and extract module ZIP file"""
        temp_dir = tempfile.mkdtemp(prefix=f"omb_module_{session_id}_")
        zip_path = os.path.join(temp_dir, "module.zip")
        
        # Download module ZIP
        async with httpx.AsyncClient() as client:
            response = await client.get(module_url)
            response.raise_for_status()
            
            with open(zip_path, "wb") as f:
                f.write(response.content)
        
        # Extract ZIP
        extract_path = os.path.join(temp_dir, "module")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        
        logger.info(f"Module extracted to: {extract_path}")
        return extract_path
    
    async def _start_postgres_container(self, session_id: str):
        """Start PostgreSQL container"""
        container_name = f"omb-postgres-{session_id}"
        
        try:
            # Remove existing container if it exists
            try:
                existing = self.client.containers.get(container_name)
                existing.remove(force=True)
            except docker.errors.NotFound:
                pass
            
            # Start new PostgreSQL container
            container = self.client.containers.run(
                "postgres:13",
                name=container_name,
                environment={
                    "POSTGRES_DB": f"odoo_{session_id}",
                    "POSTGRES_USER": "odoo",
                    "POSTGRES_PASSWORD": "odoo",
                },
                network=self.network_name,
                detach=True,
                remove=False
            )
            
            logger.info(f"Started PostgreSQL container: {container_name}")
            return container
            
        except Exception as e:
            logger.error(f"Failed to start PostgreSQL container: {e}")
            raise
    
    async def _wait_for_postgres(self, container, timeout: int = 60):
        """Wait for PostgreSQL to be ready"""
        logger.info("Waiting for PostgreSQL to be ready...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                exit_code, output = container.exec_run(
                    ["pg_isready", "-h", "localhost", "-U", "odoo"]
                )
                if exit_code == 0:
                    logger.info("PostgreSQL is ready")
                    return
            except Exception:
                pass
            
            await asyncio.sleep(2)
        
        raise Exception("PostgreSQL did not become ready in time")
    
    async def _start_odoo_container(self, session_id: str, odoo_version: int, module_path: str, postgres_host: str):
        """Start Odoo container"""
        container_name = f"omb-odoo-{session_id}"
        
        try:
            # Remove existing container if it exists
            try:
                existing = self.client.containers.get(container_name)
                existing.remove(force=True)
            except docker.errors.NotFound:
                pass
            
            # Prepare Odoo image based on version
            odoo_image = f"odoo:{odoo_version}.0"
            
            # Start Odoo container
            container = self.client.containers.run(
                odoo_image,
                name=container_name,
                environment={
                    "HOST": postgres_host,
                    "USER": "odoo",
                    "PASSWORD": "odoo",
                },
                ports={"8069/tcp": None},  # Random port
                volumes={
                    module_path: {"bind": "/mnt/extra-addons", "mode": "ro"}
                },
                network=self.network_name,
                detach=True,
                remove=False,
                command=["odoo", "--addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons"]
            )
            
            logger.info(f"Started Odoo container: {container_name}")
            return container
            
        except Exception as e:
            logger.error(f"Failed to start Odoo container: {e}")
            raise
    
    async def _wait_for_odoo(self, container, session_id: str, timeout: int = 120) -> str:
        """Wait for Odoo to be ready and return the URL"""
        logger.info("Waiting for Odoo to be ready...")
        
        # Get the mapped port
        container.reload()
        port_mapping = container.ports.get("8069/tcp")
        if not port_mapping:
            raise Exception("Odoo port not mapped")
        
        host_port = port_mapping[0]["HostPort"]
        odoo_url = f"http://localhost:{host_port}"
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(f"{odoo_url}/web/health", timeout=5)
                    if response.status_code == 200:
                        logger.info(f"Odoo is ready at: {odoo_url}")
                        return odoo_url
            except Exception:
                pass
            
            await asyncio.sleep(5)
        
        raise Exception("Odoo did not become ready in time")
    
    async def install_module(self, session_id: str, module_name: str) -> Dict:
        """Install module in Odoo"""
        try:
            container_name = f"omb-odoo-{session_id}"
            container = self.client.containers.get(container_name)
            
            # Create database and install module
            db_name = f"testdb_{session_id}"
            
            install_command = [
                "odoo",
                "-d", db_name,
                "-i", module_name,
                "--stop-after-init",
                "--addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons"
            ]
            
            logger.info(f"Installing module {module_name} in database {db_name}")
            
            start_time = time.time()
            exit_code, output = container.exec_run(install_command)
            duration = time.time() - start_time
            
            logs = output.decode('utf-8') if output else ""
            success = exit_code == 0 and "CRITICAL" not in logs
            
            result = {
                "success": success,
                "logs": logs,
                "database_name": db_name,
                "module_name": module_name,
                "installation_time": duration
            }
            
            if not success:
                result["error_message"] = f"Installation failed with exit code {exit_code}"
            
            logger.info(f"Module installation {'succeeded' if success else 'failed'}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to install module: {e}")
            return {
                "success": False,
                "logs": "",
                "database_name": "",
                "module_name": module_name,
                "error_message": str(e),
                "installation_time": 0
            }
    
    async def cleanup_session(self, session_id: str):
        """Clean up all containers and resources for a session"""
        try:
            logger.info(f"Cleaning up session: {session_id}")
            
            # Stop and remove containers
            for container_type in ["odoo", "postgres"]:
                container_name = f"omb-{container_type}-{session_id}"
                try:
                    container = self.client.containers.get(container_name)
                    container.stop(timeout=10)
                    container.remove()
                    logger.info(f"Removed {container_type} container: {container_name}")
                except docker.errors.NotFound:
                    logger.info(f"Container not found: {container_name}")
                except Exception as e:
                    logger.error(f"Error removing container {container_name}: {e}")
            
            # Clean up temporary files
            # TODO: Add cleanup of temporary module files
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    async def get_container_logs(self, session_id: str, container_type: str) -> str:
        """Get logs from a container"""
        try:
            container_name = f"omb-{container_type}-{session_id}"
            container = self.client.containers.get(container_name)
            logs = container.logs().decode('utf-8')
            return logs
        except Exception as e:
            logger.error(f"Failed to get logs for {container_name}: {e}")
            return f"Error getting logs: {e}" 