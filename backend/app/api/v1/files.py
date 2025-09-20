from fastapi import APIRouter, HTTPException, status, UploadFile, File, BackgroundTasks
from typing import List, Dict, Any
import aiofiles
import os
from datetime import datetime, timedelta

from ...core.database import db
from ...services.data_processor import data_processor
from ...models.schemas import FileStatusResponse, BaseResponse, FileType

router = APIRouter()

async def process_uploaded_file_task(portfolio_id: str, file_id: str, file_path: str, file_type: str):
    """Background task to process uploaded file"""
    try:
        # Read file content
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
            file_content = await f.read()
        
        # Process the file
        success = await data_processor.process_and_store_file(
            portfolio_id, file_id, file_content, file_type
        )
        
        # Clean up temporary file
        if os.path.exists(file_path):
            os.remove(file_path)
            
    except Exception as e:
        print(f"File processing error: {e}")
        await db.update_file_status(file_id, "failed", str(e))

@router.post("/upload/{portfolio_id}")
async def upload_file(
    portfolio_id: str,
    file_type: FileType,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Upload and process a data file"""
    try:
        # Skip portfolio ownership check for development
        # Just verify portfolio exists
        portfolio = await db.client.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not portfolio.data:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        # Validate file type
        if not file.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
        # Create file record
        file_data = {
            "portfolio_id": portfolio_id,
            "file_type": file_type.value,
            "original_filename": file.filename,
            "file_size": file.size if hasattr(file, 'size') else None,
            "storage_path": f"temp/{portfolio_id}/{file_type.value}_{datetime.now().isoformat()}_{file.filename}",
            "status": "queued"
        }
        
        response = db.client.table("files").insert(file_data).execute()
        file_record = response.data[0]
        file_id = file_record["id"]
        
        # Save file temporarily
        temp_dir = f"temp/{portfolio_id}"
        os.makedirs(temp_dir, exist_ok=True)
        temp_file_path = os.path.join(temp_dir, f"{file_id}_{file.filename}")
        
        async with aiofiles.open(temp_file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Start background processing
        background_tasks.add_task(
            process_uploaded_file_task,
            portfolio_id,
            file_id,
            temp_file_path,
            file_type.value
        )
        
        return FileStatusResponse(**file_record)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )

@router.get("/{portfolio_id}", response_model=List[FileStatusResponse])
async def get_portfolio_files(portfolio_id: str):
    """Get all files for a portfolio"""
    try:
        # Skip ownership check for development
        files = await db.get_portfolio_files(portfolio_id)
        return files
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get files: {str(e)}"
        )

@router.get("/status/{file_id}", response_model=FileStatusResponse)
async def get_file_status(file_id: str):
    """Get file processing status"""
    try:
        # Get file info
        response = db.client.table("files").select("*").eq("id", file_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = response.data
        
        # Verify user owns the portfolio
        portfolio = await db.get_portfolio(file_info["portfolio_id"], user_id)
        if not portfolio:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return FileStatusResponse(**file_info)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file status: {str(e)}"
        )

@router.delete("/{file_id}", response_model=BaseResponse)
async def delete_file(file_id: str):
    """Delete a file"""
    try:
        # Get file info
        response = db.client.table("files").select("*").eq("id", file_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = response.data
        
        # Verify user owns the portfolio
        portfolio = await db.get_portfolio(file_info["portfolio_id"], user_id)
        if not portfolio:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete from storage if exists
        storage_path = file_info.get("storage_path")
        if storage_path:
            try:
                # Delete from Supabase storage
                db.client.storage.from_("portfolio-files").remove([storage_path])
            except:
                pass  # File might not exist in storage
        
        # Delete file record
        db.client.table("files").delete().eq("id", file_id).execute()
        
        return BaseResponse(message="File deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )

@router.post("/{portfolio_id}/reprocess/{file_id}")
async def reprocess_file(
    portfolio_id: str,
    file_id: str,
    background_tasks: BackgroundTasks
):
    """Reprocess a failed file"""
    try:
        # Skip portfolio ownership check for demo mode
        
        # Get file info
        response = db.client.table("files").select("*").eq("id", file_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = response.data
        
        if file_info["status"] not in ["failed", "succeeded"]:
            raise HTTPException(status_code=400, detail="File is currently being processed")
        
        # Reset status to queued
        await db.update_file_status(file_id, "queued")
        
        # Get file from storage and reprocess
        storage_path = file_info["storage_path"]
        if storage_path:
            try:
                # Download from Supabase storage
                file_response = db.client.storage.from_("portfolio-files").download(storage_path)
                file_content = file_response.decode('utf-8')
                
                # Start reprocessing
                success = await data_processor.process_and_store_file(
                    portfolio_id, file_id, file_content, file_info["file_type"]
                )
                
                return BaseResponse(message="File reprocessing started")
                
            except Exception as e:
                await db.update_file_status(file_id, "failed", f"Reprocessing failed: {str(e)}")
                raise HTTPException(status_code=500, detail="Failed to reprocess file")
        else:
            raise HTTPException(status_code=400, detail="File not found in storage")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reprocess file: {str(e)}"
        )

@router.get("/{portfolio_id}/validation-summary")
async def get_validation_summary(
    portfolio_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get data validation summary for portfolio"""
    try:
        # Verify portfolio ownership
        portfolio = await db.get_portfolio(portfolio_id, user_id)
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        files = await db.get_portfolio_files(portfolio_id)
        
        summary = {
            'total_files': len(files),
            'required_files': ['assets', 'factors', 'benchmarks', 'sector_holdings'],
            'uploaded_types': list(set(f['file_type'] for f in files if f['status'] == 'succeeded')),
            'missing_types': [],
            'validation_status': 'complete',
            'issues': []
        }
        
        # Check for missing file types
        for required_type in summary['required_files']:
            if required_type not in summary['uploaded_types']:
                summary['missing_types'].append(required_type)
                summary['validation_status'] = 'incomplete'
        
        # Check for failed files
        failed_files = [f for f in files if f['status'] == 'failed']
        if failed_files:
            summary['validation_status'] = 'issues'
            for failed_file in failed_files:
                summary['issues'].append({
                    'file_type': failed_file['file_type'],
                    'filename': failed_file['original_filename'],
                    'error': failed_file.get('error_message', 'Processing failed')
                })
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get validation summary: {str(e)}"
        )
