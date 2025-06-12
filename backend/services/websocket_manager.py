from typing import Dict, List
from fastapi import WebSocket
import json
import asyncio
from core.logging_config import logger

class WebSocketManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Store active connections by project_id
        self.active_connections: Dict[str, List[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, project_id: str):
        """Accept a WebSocket connection and add it to the project's connection list"""
        await websocket.accept()
        
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
            
        self.active_connections[project_id].append(websocket)
        logger.info("WebSocket connected", project_id=project_id, 
                   total_connections=len(self.active_connections[project_id]))
        
    def disconnect(self, websocket: WebSocket, project_id: str):
        """Remove a WebSocket connection from the project's connection list"""
        if project_id in self.active_connections:
            if websocket in self.active_connections[project_id]:
                self.active_connections[project_id].remove(websocket)
                logger.info("WebSocket disconnected", project_id=project_id,
                           remaining_connections=len(self.active_connections[project_id]))
                
            # Clean up empty project lists
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]
                
    async def send_project_update(self, project_id: str, message: dict):
        """Send a message to all connections for a specific project"""
        if project_id not in self.active_connections:
            return
            
        # Prepare the message
        message_json = json.dumps(message)
        connections_to_remove = []
        
        # Send to all connections for this project
        for connection in self.active_connections[project_id]:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.warning("Failed to send message to WebSocket", 
                              project_id=project_id, error=str(e))
                connections_to_remove.append(connection)
        
        # Remove dead connections
        for connection in connections_to_remove:
            self.disconnect(connection, project_id)
            
    async def broadcast_to_project(self, project_id: str, event_type: str, data: dict):
        """Broadcast an event to all connections for a project"""
        message = {
            "type": event_type,
            "project_id": project_id,
            "timestamp": asyncio.get_event_loop().time(),
            "data": data
        }
        await self.send_project_update(project_id, message)
        
    def get_connection_count(self, project_id: str = None) -> int:
        """Get the number of active connections for a project or all projects"""
        if project_id:
            return len(self.active_connections.get(project_id, []))
        else:
            return sum(len(connections) for connections in self.active_connections.values())

# Global WebSocket manager instance
websocket_manager = WebSocketManager() 