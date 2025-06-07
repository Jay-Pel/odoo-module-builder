from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

# Import routers
from routers import auth, projects, specifications, coding, payments, testing, uat

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 OMB v3 API Starting...")
    yield
    # Shutdown
    print("🛑 OMB v3 API Shutting down...")

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
    """Health check endpoint"""
    return {"status": "ok", "service": "omb-v3-api", "version": "1.0.0"}

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to Odoo Module Builder v3 API",
        "docs": "/docs",
        "health": "/health"
    } 