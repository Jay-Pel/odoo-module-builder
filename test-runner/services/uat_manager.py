import asyncio
import os
import subprocess
import tempfile
import logging
import time
import httpx
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from .docker_manager import DockerManager

logger = logging.getLogger(__name__)

class UATManager:
    """Manages User Acceptance Testing environments"""
    
    def __init__(self):
        self.docker_manager = DockerManager()
        self.active_uat_sessions: Dict[str, Dict] = {}
        self.cloudflared_processes: Dict[str, subprocess.Popen] = {}
        
    async def create_uat_session(self, session_id: str, project_id: str, user_id: str, 
                                module_url: str, module_name: str, odoo_version: int) -> Dict:
        """Create a new UAT session with persistent Odoo environment"""
        try:
            logger.info(f"Creating UAT session {session_id} for project {project_id}")
            
            # Set up Odoo environment (same as testing, but persistent)
            container_info = await self.docker_manager.setup_odoo_environment(
                session_id=session_id,
                odoo_version=odoo_version,
                module_url=module_url
            )
            
            # Install the module
            installation_result = await self.docker_manager.install_module(
                session_id=session_id,
                module_name=module_name
            )
            
            if not installation_result["success"]:
                await self.docker_manager.cleanup_session(session_id)
                raise Exception(f"Module installation failed: {installation_result.get('error_message')}")
            
            # Create Cloudflare tunnel for secure access
            tunnel_url = await self._create_cloudflare_tunnel(session_id, container_info["odoo_url"])
            
            # Create UAT session record
            expires_at = datetime.now() + timedelta(hours=1)  # 1 hour UAT session
            uat_session = {
                "session_id": session_id,
                "project_id": project_id,
                "user_id": user_id,
                "status": "active",
                "odoo_url": container_info["odoo_url"],
                "tunnel_url": tunnel_url,
                "container_info": container_info,
                "started_at": datetime.now(),
                "expires_at": expires_at,
                "last_activity": datetime.now()
            }
            
            self.active_uat_sessions[session_id] = uat_session
            
            # Schedule cleanup task
            asyncio.create_task(self._schedule_cleanup(session_id, expires_at))
            
            logger.info(f"UAT session {session_id} created successfully")
            return uat_session
            
        except Exception as e:
            logger.error(f"Failed to create UAT session: {e}")
            await self.cleanup_uat_session(session_id)
            raise
    
    async def _create_cloudflare_tunnel(self, session_id: str, odoo_local_url: str) -> str:
        """Create a Cloudflare tunnel for secure access to Odoo"""
        try:
            # Extract port from local URL
            port = odoo_local_url.split(':')[-1]
            
            # Create temporary tunnel configuration
            tunnel_config = {
                "url": f"http://localhost:{port}",
                "no-autoupdate": True,
                "no-tls-verify": True
            }
            
            # Start cloudflared tunnel
            cmd = [
                "cloudflared", "tunnel", 
                "--url", f"http://localhost:{port}",
                "--no-autoupdate",
                "--no-tls-verify"
            ]
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Wait for tunnel URL to be available
            tunnel_url = None
            timeout = 30  # 30 seconds timeout
            start_time = time.time()
            
            while time.time() - start_time < timeout:
                if process.poll() is not None:
                    # Process has terminated
                    stdout, stderr = process.communicate()
                    raise Exception(f"Cloudflared process failed: {stderr}")
                
                # Check if tunnel URL is available in stdout
                try:
                    stdout_line = process.stdout.readline()
                    if stdout_line and "trycloudflare.com" in stdout_line:
                        # Extract tunnel URL from output
                        parts = stdout_line.split()
                        for part in parts:
                            if "trycloudflare.com" in part:
                                tunnel_url = part.strip()
                                break
                        if tunnel_url:
                            break
                except:
                    pass
                
                await asyncio.sleep(1)
            
            if not tunnel_url:
                process.terminate()
                raise Exception("Failed to create Cloudflare tunnel - no URL received")
            
            # Store process for cleanup
            self.cloudflared_processes[session_id] = process
            
            # Ensure tunnel URL has https protocol
            if not tunnel_url.startswith("http"):
                tunnel_url = f"https://{tunnel_url}"
            
            logger.info(f"Created Cloudflare tunnel for session {session_id}: {tunnel_url}")
            return tunnel_url
            
        except Exception as e:
            logger.error(f"Failed to create Cloudflare tunnel: {e}")
            raise
    
    async def get_uat_session(self, session_id: str) -> Optional[Dict]:
        """Get UAT session information"""
        session = self.active_uat_sessions.get(session_id)
        if not session:
            return None
        
        # Check if session is expired
        if datetime.now() > session["expires_at"]:
            await self.cleanup_uat_session(session_id)
            return None
        
        return session
    
    async def update_session_activity(self, session_id: str):
        """Update last activity timestamp for a UAT session"""
        if session_id in self.active_uat_sessions:
            self.active_uat_sessions[session_id]["last_activity"] = datetime.now()
    
    async def extend_uat_session(self, session_id: str, additional_minutes: int = 30) -> bool:
        """Extend UAT session duration"""
        session = self.active_uat_sessions.get(session_id)
        if not session:
            return False
        
        # Extend expiration time
        session["expires_at"] = session["expires_at"] + timedelta(minutes=additional_minutes)
        session["last_activity"] = datetime.now()
        
        logger.info(f"Extended UAT session {session_id} by {additional_minutes} minutes")
        return True
    
    async def cleanup_uat_session(self, session_id: str):
        """Clean up UAT session resources"""
        try:
            logger.info(f"Cleaning up UAT session {session_id}")
            
            # Stop Cloudflare tunnel
            if session_id in self.cloudflared_processes:
                process = self.cloudflared_processes[session_id]
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                del self.cloudflared_processes[session_id]
            
            # Clean up Docker containers
            await self.docker_manager.cleanup_session(session_id)
            
            # Remove from active sessions
            if session_id in self.active_uat_sessions:
                self.active_uat_sessions[session_id]["status"] = "stopped"
                del self.active_uat_sessions[session_id]
            
            logger.info(f"UAT session {session_id} cleaned up successfully")
            
        except Exception as e:
            logger.error(f"Error cleaning up UAT session {session_id}: {e}")
    
    async def _schedule_cleanup(self, session_id: str, expires_at: datetime):
        """Schedule automatic cleanup of UAT session"""
        try:
            # Calculate sleep time
            sleep_time = (expires_at - datetime.now()).total_seconds()
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
            
            # Check if session still exists and is expired
            session = self.active_uat_sessions.get(session_id)
            if session and datetime.now() >= session["expires_at"]:
                await self.cleanup_uat_session(session_id)
                
        except Exception as e:
            logger.error(f"Error in scheduled cleanup for session {session_id}: {e}")
    
    async def list_active_sessions(self) -> List[Dict]:
        """List all active UAT sessions"""
        active_sessions = []
        for session_id, session in self.active_uat_sessions.items():
            if datetime.now() <= session["expires_at"]:
                active_sessions.append({
                    "session_id": session_id,
                    "project_id": session["project_id"],
                    "user_id": session["user_id"],
                    "status": session["status"],
                    "started_at": session["started_at"].isoformat(),
                    "expires_at": session["expires_at"].isoformat(),
                    "tunnel_url": session["tunnel_url"]
                })
        return active_sessions
    
    async def check_tunnel_health(self, session_id: str) -> bool:
        """Check if the Cloudflare tunnel is healthy"""
        session = self.active_uat_sessions.get(session_id)
        if not session or not session.get("tunnel_url"):
            return False
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(session["tunnel_url"])
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Tunnel health check failed for session {session_id}: {e}")
            return False 