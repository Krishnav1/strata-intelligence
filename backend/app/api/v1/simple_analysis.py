from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, BackgroundTasks
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
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    file_type: str = Form(...)
):
    """Upload a file for analysis (no portfolio needed)"""
    try:
        # Validate file_type
        try:
            file_type_enum = FileType(file_type)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file_type. Must be one of: {', '.join([ft.value for ft in FileType])}"
            )
        
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
            "file_type": file_type_enum.value,
            "original_filename": file.filename,
            "file_size": file.size if hasattr(file, 'size') else None,
            "status": "queued",
            "created_at": datetime.now().isoformat()
        }
        
        # Store in session
        CURRENT_SESSION["files"][file_type_enum.value] = file_data
        
        # Save file temporarily
        temp_dir = f"temp/analysis/{session_id}"
        os.makedirs(temp_dir, exist_ok=True)
        temp_file_path = os.path.join(temp_dir, f"{file_type_enum.value}_{file.filename}")
        
        async with aiofiles.open(temp_file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Start background processing
        background_tasks.add_task(
            process_analysis_file_task,
            session_id,
            file_id,
            temp_file_path,
            file_type_enum.value
        )
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "session_id": session_id,
            "file_id": file_id,
            "file_type": file_type_enum.value,
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
        print(f"Processing file: {file_type} at {file_path}")
        
        # Update status
        if file_type in CURRENT_SESSION["files"]:
            CURRENT_SESSION["files"][file_type]["status"] = "processing"
            print(f"Updated status to processing for {file_type}")
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise Exception(f"File not found at {file_path}")
        
        # Read and process file
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                file_content = await f.read()
            print(f"Successfully read file content: {len(file_content)} characters")
        except Exception as e:
            # Try reading as binary if UTF-8 fails
            async with aiofiles.open(file_path, 'rb') as f:
                file_content = await f.read()
            file_content = str(file_content[:1000])  # Convert to string for storage
            print(f"Read file as binary: {len(file_content)} characters")
        
        # Process the file (simplified - just store the data)
        processed_data = {
            "raw_content": file_content[:1000],  # First 1000 chars for preview
            "file_type": file_type,
            "processed_at": datetime.now().isoformat()
        }
        
        # Store processed data
        CURRENT_SESSION["files"][file_type]["processed_data"] = processed_data
        CURRENT_SESSION["files"][file_type]["status"] = "completed"
        print(f"File {file_type} processing completed successfully")
        
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Cleaned up temp file: {file_path}")
            
        # Check if we have enough data to run analysis
        print(f"Checking if analysis can be run...")
        await check_and_run_analysis(session_id)
        print(f"Analysis check completed")
            
    except Exception as e:
        print(f"File processing error for {file_type}: {e}")
        if file_type in CURRENT_SESSION["files"]:
            CURRENT_SESSION["files"][file_type]["status"] = "failed"
            CURRENT_SESSION["files"][file_type]["error"] = str(e)

async def check_and_run_analysis(session_id: str):
    """Check if we have minimum required files and run analysis"""
    try:
        files = CURRENT_SESSION["files"]
        print(f"Checking analysis requirements. Files: {list(files.keys())}")
        
        # Check if we have at least assets data (minimum requirement)
        if "assets" in files and files["assets"]["status"] == "completed":
            print("Assets file found and completed. Running analysis...")
            
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
            print("Analysis completed successfully!")
        else:
            print(f"Analysis requirements not met. Assets status: {files.get('assets', {}).get('status', 'not found')}")
            
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
    # Check if we have any files
    if not CURRENT_SESSION["files"]:
        raise HTTPException(
            status_code=404, 
            detail="No files uploaded yet. Please upload at least assets data."
        )
    
    # Check if we have analysis results
    if not CURRENT_SESSION["analysis_results"]:
        # Check file statuses to provide better error message
        files = CURRENT_SESSION["files"]
        file_statuses = {k: v["status"] for k, v in files.items()}
        
        raise HTTPException(
            status_code=404, 
            detail=f"No analysis results available yet. File statuses: {file_statuses}. Please wait for processing to complete."
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

@router.get("/debug")
async def debug_session():
    """Debug endpoint to see full session state"""
    return {
        "session_id": CURRENT_SESSION["session_id"],
        "files": CURRENT_SESSION["files"],
        "analysis_results": CURRENT_SESSION["analysis_results"],
        "timestamp": datetime.now().isoformat()
    }

@router.post("/trigger-analysis")
async def trigger_analysis():
    """Manually trigger analysis for testing"""
    if not CURRENT_SESSION["session_id"]:
        raise HTTPException(status_code=400, detail="No active session")
    
    await check_and_run_analysis(CURRENT_SESSION["session_id"])
    
    return {
        "success": True,
        "message": "Analysis triggered",
        "analysis_results": CURRENT_SESSION["analysis_results"]
    }
