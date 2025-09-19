from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from supabase import create_client, Client
import httpx
from typing import Optional, Dict, Any

from .config import settings

security = HTTPBearer()
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

async def verify_supabase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Verify Supabase JWT token and return user information
    """
    token = credentials.credentials
    
    try:
        # Verify token with Supabase
        response = supabase.auth.get_user(token)
        
        if not response.user:
            raise AuthenticationError("Invalid token")
            
        # Extract user information
        user_data = {
            "user_id": response.user.id,
            "email": response.user.email,
            "user_metadata": response.user.user_metadata or {},
            "app_metadata": response.user.app_metadata or {},
        }
        
        return user_data
        
    except Exception as e:
        print(f"Token verification error: {e}")
        raise AuthenticationError("Token verification failed")

async def get_current_user(user_data: Dict[str, Any] = Depends(verify_supabase_token)) -> Dict[str, Any]:
    """
    Get current authenticated user
    """
    return user_data

async def get_current_user_id(user_data: Dict[str, Any] = Depends(get_current_user)) -> str:
    """
    Get current user ID
    """
    return user_data["user_id"]

class SupabaseAuth:
    """
    Supabase authentication helper class
    """
    
    def __init__(self):
        self.client = supabase
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user profile from profiles table
        """
        try:
            response = self.client.table("profiles").select("*").eq("id", user_id).single().execute()
            return response.data
        except Exception as e:
            print(f"Error fetching user profile: {e}")
            return None
    
    async def create_or_update_profile(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create or update user profile
        """
        profile_data = {
            "id": user_data["user_id"],
            "email": user_data["email"],
            "full_name": user_data["user_metadata"].get("full_name"),
            "avatar_url": user_data["user_metadata"].get("avatar_url"),
            "updated_at": "now()"
        }
        
        try:
            response = self.client.table("profiles").upsert(profile_data).execute()
            return response.data[0] if response.data else profile_data
        except Exception as e:
            print(f"Error creating/updating profile: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create/update profile"
            )

# Global auth instance
auth_service = SupabaseAuth()
