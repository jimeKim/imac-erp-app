"""
Authentication & Authorization
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings
from app.core.supabase import supabase
from typing import Optional, List


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Get current authenticated user from JWT token
    """
    token = credentials.credentials
    
    try:
        # Verify JWT token with Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        # Get user profile with role
        profile_response = supabase.table("user_profiles").select("*").eq(
            "id", user_response.user.id
        ).single().execute()
        
        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found"
            )
        
        return {
            "id": user_response.user.id,
            "email": user_response.user.email,
            "role": profile_response.data.get("role", ["readonly"]),
            **profile_response.data
        }
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )


def require_role(required_roles: List[str]):
    """
    Dependency to require specific roles
    
    Usage:
        @router.get("/admin", dependencies=[Depends(require_role(["manager"]))])
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_roles = current_user.get("role", [])
        
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {required_roles}"
            )
        
        return current_user
    
    return role_checker

