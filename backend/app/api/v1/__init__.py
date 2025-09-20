from fastapi import APIRouter

from . import portfolios, files, analysis, data, debug, simple_analysis

api_router = APIRouter()

# Include all route modules
api_router.include_router(simple_analysis.router, prefix="/simple", tags=["Simple Analysis"])
api_router.include_router(portfolios.router, prefix="/portfolios", tags=["portfolios"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(data.router, prefix="/data", tags=["data"])
api_router.include_router(debug.router, prefix="/debug", tags=["Debug"])
