from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
import os
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.auth import verify_supabase_token
from app.api.v1 import api_router
from app.core.database import init_db

security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Strata Intelligence Backend...")
    await init_db()
    yield
    # Shutdown
    print("🛑 Shutting down Strata Intelligence Backend...")

app = FastAPI(
    title="Strata Intelligence API",
    description="Professional Portfolio Intelligence Platform Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "Strata Intelligence API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "strata-intelligence-api"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
