#!/usr/bin/env python3
"""
Startup script for Strata Intelligence Backend
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

async def main():
    """Main startup function"""
    print("🚀 Starting Strata Intelligence Backend...")
    
    try:
        # Import after path setup
        import uvicorn
        from app.core.config import settings
        
        print(f"📊 Project: {settings.PROJECT_NAME}")
        print(f"🔗 Supabase URL: {settings.SUPABASE_URL}")
        print(f"🌐 CORS Origins: {settings.ALLOWED_ORIGINS}")
        print("=" * 50)
        
        # Run the FastAPI application
        config = uvicorn.Config(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
            access_log=True
        )
        
        server = uvicorn.Server(config)
        await server.serve()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down gracefully...")
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
