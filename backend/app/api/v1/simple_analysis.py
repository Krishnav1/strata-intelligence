from fastapi import APIRouter, HTTPException, status, UploadFile, File, BackgroundTasks
from typing import List, Dict, Any, Optional
import aiofiles
import os
import uuid
from datetime import datetime

from ...core.database import db
from ...services.data_processor import data_processor
from ...services.analytics_engine import analytics_engine
from ...models.schemas import FileStatusResponse, BaseResponse, FileType

router = APIRouter()

# Global analysis session - simplified approach
CURRENT_SESSION = {
    "session_id": None,
    "files": {},
    "analysis_results": {}
}

@router.post("/upload")
async def upload_analysis_file(
    file_type: FileType,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Upload a file for analysis (no portfolio needed)"""
    try:
        # Initialize session if needed
        if not CURRENT_SESSION["session_id"]:
            CURRENT_SESSION["session_id"] = str(uuid.uuid4())
            CURRENT_SESSION["files"] = {}
            CURRENT_SESSION["analysis_results"] = {}
        
        session_id = CURRENT_SESSION["session_id"]
        
        # Validate file type
        if not file.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
        # Create file record
        file_id = str(uuid.uuid4())
        file_data = {
            "id": file_id,
            "session_id": session_id,
            "file_type": file_type.value,
            "original_filename": file.filename,
            "file_size": file.size if hasattr(file, 'size') else None,
            "status": "queued",
            "created_at": datetime.now().isoformat()
        }
        
        # Store in session
        CURRENT_SESSION["files"][file_type.value] = file_data
        
        # Save file temporarily
        temp_dir = f"temp/analysis/{session_id}"
        os.makedirs(temp_dir, exist_ok=True)
        temp_file_path = os.path.join(temp_dir, f"{file_type.value}_{file.filename}")
        
        async with aiofiles.open(temp_file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Start background processing
        background_tasks.add_task(
            process_analysis_file_task,
            session_id,
            file_id,
            temp_file_path,
            file_type.value
        )
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "session_id": session_id,
            "file_id": file_id,
            "file_type": file_type.value,
            "status": "queued"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )

async def process_analysis_file_task(session_id: str, file_id: str, file_path: str, file_type: str):
    """Background task to process uploaded file"""
    try:
        # Update status
        if file_type in CURRENT_SESSION["files"]:
            CURRENT_SESSION["files"][file_type]["status"] = "processing"
        
        # Read and process file
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
            file_content = await f.read()
        
        # Process the file (simplified - just store the data)
        # In a real implementation, you'd parse CSV/Excel and validate
        processed_data = {
            "raw_content": file_content[:1000],  # First 1000 chars for preview
            "file_type": file_type,
            "processed_at": datetime.now().isoformat()
        }
        
        # Store processed data
        CURRENT_SESSION["files"][file_type]["processed_data"] = processed_data
        CURRENT_SESSION["files"][file_type]["status"] = "completed"
        
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)
            
        # Check if we have enough data to run analysis
        await check_and_run_analysis(session_id)
            
    except Exception as e:
        print(f"File processing error: {e}")
        if file_type in CURRENT_SESSION["files"]:
            CURRENT_SESSION["files"][file_type]["status"] = "failed"
            CURRENT_SESSION["files"][file_type]["error"] = str(e)

async def check_and_run_analysis(session_id: str):
    """Check if we have minimum required files and run analysis"""
    try:
        files = CURRENT_SESSION["files"]
        
        # Check if we have at least assets data (minimum requirement)
        if "assets" in files and files["assets"]["status"] == "completed":
            # Run basic analysis
            analysis_result = {
                "performance_metrics": {
                    "total_return": 0.15,  # Mock data
                    "volatility": 0.12,
                    "sharpe_ratio": 1.25,
                    "max_drawdown": -0.08
                },
                "risk_metrics": {
                    "var_95": -0.05,
                    "beta": 1.1,
                    "correlation": 0.85
                },
                "generated_at": datetime.now().isoformat(),
                "status": "completed"
            }
            
            CURRENT_SESSION["analysis_results"] = analysis_result
            
    except Exception as e:
        print(f"Analysis error: {e}")
        CURRENT_SESSION["analysis_results"] = {
            "status": "failed",
            "error": str(e)
        }

@router.get("/session")
async def get_current_session():
    """Get current analysis session status"""
    return {
        "session_id": CURRENT_SESSION["session_id"],
        "files": CURRENT_SESSION["files"],
        "analysis_results": CURRENT_SESSION["analysis_results"]
    }

@router.get("/files")
async def get_uploaded_files():
    """Get all uploaded files in current session"""
    return {
        "files": CURRENT_SESSION["files"]
    }

@router.get("/analysis")
async def get_analysis_results():
    """Get analysis results for current session"""
    if not CURRENT_SESSION["analysis_results"]:
        raise HTTPException(
            status_code=404, 
            detail="No analysis results available. Please upload at least assets data."
        )
    
    return CURRENT_SESSION["analysis_results"]

@router.post("/reset")
async def reset_session():
    """Reset current session and start fresh"""
    CURRENT_SESSION["session_id"] = None
    CURRENT_SESSION["files"] = {}
    CURRENT_SESSION["analysis_results"] = {}
    
    return {
        "success": True,
        "message": "Session reset successfully"
    }

@router.get("/status")
async def get_analysis_status():
    """Get overall analysis status"""
    files = CURRENT_SESSION["files"]
    
    status_summary = {
        "session_active": CURRENT_SESSION["session_id"] is not None,
        "files_uploaded": len(files),
        "files_processed": len([f for f in files.values() if f["status"] == "completed"]),
        "analysis_ready": bool(CURRENT_SESSION["analysis_results"]),
        "required_files": ["assets"],
        "optional_files": ["factors", "benchmarks", "sector_holdings"]
    }
    
    return status_summary
