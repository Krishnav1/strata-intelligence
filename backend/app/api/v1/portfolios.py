from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

from ...core.auth import get_current_user_id
from ...core.database import db
from ...models.schemas import PortfolioCreate, PortfolioResponse, BaseResponse

router = APIRouter()

@router.get("/", response_model=List[PortfolioResponse])
async def get_portfolios(user_id: str = Depends(get_current_user_id)):
    """Get all portfolios for the current user"""
    try:
        portfolios = await db.get_user_portfolios(user_id)
        return portfolios
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch portfolios: {str(e)}"
        )

@router.post("/", response_model=PortfolioResponse)
async def create_portfolio(
    portfolio_data: PortfolioCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new portfolio"""
    try:
        # Create portfolio in database
        portfolio_dict = {
            "user_id": user_id,
            "name": portfolio_data.name,
            "description": portfolio_data.description
        }
        
        response = db.client.table("portfolios").insert(portfolio_dict).execute()
        
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create portfolio"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create portfolio: {str(e)}"
        )

@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(
    portfolio_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific portfolio"""
    try:
        portfolio = await db.get_portfolio(portfolio_id, user_id)
        
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found"
            )
        
        return portfolio
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch portfolio: {str(e)}"
        )

@router.delete("/{portfolio_id}", response_model=BaseResponse)
async def delete_portfolio(
    portfolio_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a portfolio"""
    try:
        # Verify ownership
        portfolio = await db.get_portfolio(portfolio_id, user_id)
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found"
            )
        
        # Delete portfolio (cascade will handle related data)
        db.client.table("portfolios").delete().eq("id", portfolio_id).eq("user_id", user_id).execute()
        
        return BaseResponse(message="Portfolio deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete portfolio: {str(e)}"
        )

@router.get("/{portfolio_id}/summary")
async def get_portfolio_summary(
    portfolio_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get portfolio summary with file counts and status"""
    try:
        # Verify ownership
        portfolio = await db.get_portfolio(portfolio_id, user_id)
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found"
            )
        
        # Get file counts
        files = await db.get_portfolio_files(portfolio_id)
        
        file_summary = {
            'total_files': len(files),
            'by_type': {},
            'by_status': {},
            'upload_complete': True
        }
        
        required_types = ['assets', 'factors', 'benchmarks', 'sector_holdings']
        
        for file_type in required_types:
            type_files = [f for f in files if f['file_type'] == file_type]
            file_summary['by_type'][file_type] = {
                'count': len(type_files),
                'status': type_files[0]['status'] if type_files else 'missing'
            }
            
            if not type_files or type_files[0]['status'] != 'succeeded':
                file_summary['upload_complete'] = False
        
        for status in ['queued', 'running', 'succeeded', 'failed']:
            status_files = [f for f in files if f['status'] == status]
            file_summary['by_status'][status] = len(status_files)
        
        return {
            'portfolio': portfolio,
            'files': file_summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch portfolio summary: {str(e)}"
        )
