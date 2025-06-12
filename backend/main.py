from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from datetime import datetime
from services.database import DatabaseService
from services.ai_agents import SpecificationAgent, CodingAgent
from services.websocket_manager import websocket_manager
from core.logging_config import setup_logging, logger

# Load environment variables from .env file
load_dotenv()

# Setup logging
setup_logging()

# Import routers
from routers import auth, projects, specifications, coding, payments, testing, uat

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 OMB v3 API Starting...", service="omb-v3-api", version="1.0.0")
    yield
    # Shutdown
    logger.info("🛑 OMB v3 API Shutting down...", service="omb-v3-api")

app = FastAPI(
    title="Odoo Module Builder v3 API",
    description="SaaS platform for automated Odoo module generation with AI agents",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Vite dev server (alternate port)
        "http://localhost:5175",  # Vite dev server (alternate port)
        "https://*.pages.dev",    # Cloudflare Pages preview
        # Add production domain when ready
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(specifications.router, prefix="/specifications", tags=["Specifications"])
app.include_router(coding.router, prefix="/coding", tags=["Coding"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(testing.router, tags=["Testing"])
app.include_router(uat.router, tags=["UAT"])

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    health_status = {
        "status": "ok",
        "service": "omb-v3-api",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }
    
    # Check database connectivity
    try:
        db_service = DatabaseService()
        # Try a simple database operation
        await db_service.health_check()
        health_status["services"]["database"] = {"status": "healthy", "message": "Connected"}
    except Exception as e:
        health_status["services"]["database"] = {"status": "unhealthy", "message": str(e)}
        health_status["status"] = "degraded"
    
    # Check SpecificationAgent
    try:
        spec_agent = SpecificationAgent()
        health_status["services"]["specification_agent"] = {
            "status": "healthy", 
            "message": "Gemini API configured",
            "api_key_present": bool(os.getenv("GEMINI_API_KEY"))
        }
    except Exception as e:
        health_status["services"]["specification_agent"] = {"status": "unhealthy", "message": str(e)}
        health_status["status"] = "degraded"
    
    # Check CodingAgent
    try:
        coding_agent = CodingAgent()
        health_status["services"]["coding_agent"] = {
            "status": "healthy", 
            "message": "Anthropic API configured",
            "api_key_present": bool(os.getenv("ANTHROPIC_API_KEY"))
        }
    except Exception as e:
        health_status["services"]["coding_agent"] = {"status": "unhealthy", "message": str(e)}
        health_status["status"] = "degraded"
    
    # Check environment variables
    required_env_vars = ["JWT_SECRET_KEY", "GEMINI_API_KEY", "ANTHROPIC_API_KEY"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        health_status["services"]["environment"] = {
            "status": "unhealthy", 
            "message": f"Missing environment variables: {', '.join(missing_vars)}"
        }
        health_status["status"] = "degraded"
    else:
        health_status["services"]["environment"] = {"status": "healthy", "message": "All required variables present"}
    
    return health_status

@app.websocket("/ws/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: str):
    """WebSocket endpoint for real-time project updates"""
    await websocket_manager.connect(websocket, project_id)
    try:
        while True:
            # Keep connection alive and listen for messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, project_id)

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to Odoo Module Builder v3 API",
        "docs": "/docs",
        "health": "/health",
        "websocket": "/ws/{project_id}"
    } 