from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
import uuid

from app.core.auth import get_current_user_id
from app.core.database import db

router = APIRouter()

@router.get("/check-rls/{portfolio_id}", response_model=List[Dict[str, Any]], tags=["Debug"])
async def debug_check_storage_rls(
    portfolio_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Debugs the storage RLS policy by checking portfolio ownership.
    This is a temporary endpoint and should be removed in production.
    """
    try:
        # Validate that portfolio_id is a valid UUID
        uuid.UUID(portfolio_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portfolio_id format. Must be a valid UUID."
        )

    try:
        # The Supabase client can call RPC functions directly
        response = await db.client.rpc(
            "debug_storage_rls",
            {"p_portfolio_id": portfolio_id, "p_user_id": current_user_id}
        ).execute()

        if response.data:
            return response.data
        else:
            # Handle cases where the RPC might return an error or no data
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to execute debug function or no data returned."
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while running the debug check: {str(e)}"
        )
