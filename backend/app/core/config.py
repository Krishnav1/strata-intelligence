from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Strata Intelligence API"
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "https://strata-intelligence.vercel.app",
        "https://strata-intelligence-git-main-krishnav1s-projects.vercel.app",
        # Allow all Vercel preview deployments
        "https://*.vercel.app"
    ]
    
    # Supabase Settings
    SUPABASE_URL: str = "https://mdmghgcsvfzsafteuiqi.supabase.co"
    SUPABASE_ANON_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbWdoZ2NzdmZ6c2FmdGV1aXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDU4MDEsImV4cCI6MjA3Mzg4MTgwMX0.t03A-zAz7R8GU-fj_av1UlUKOvCOBbS02D61ealXUk8"
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    
    # Database Settings
    # Use env var so we can provide either the Direct URI or Transaction Pooler URI per environment
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Redis Settings (for Celery)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # File Storage Settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_FILE_TYPES: List[str] = [".csv", ".xlsx", ".xls"]
    
    # Analysis Settings
    DEFAULT_RISK_FREE_RATE: float = 0.065  # 6.5% for India
    DEFAULT_CONFIDENCE_LEVEL: float = 0.95
    MAX_MONTE_CARLO_SIMULATIONS: int = 10000
    
    # Security Settings
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
