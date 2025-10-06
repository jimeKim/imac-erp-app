"""
Authentication & Authorization
Backend dev token 기반 인증 (main.py 로그인 API와 호환)
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.supabase import supabase
from typing import Optional, List


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Get current authenticated user from dev token
    (main.py의 로그인 API와 호환)
    """
    token = credentials.credentials
    
    try:
        print(f"[AUTH DEBUG] Received token: {token[:20]}..." if len(token) > 20 else f"[AUTH DEBUG] Received token: {token}")
        
        # dev_token_ 형식 검증
        if not token.startswith("dev_token_"):
            print(f"[AUTH DEBUG] Token format invalid. Expected 'dev_token_*', got: {token[:20]}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format"
            )
        
        # 토큰에서 이메일 추출
        email = token.replace("dev_token_", "")
        
        # user_roles 테이블에서 사용자 조회
        result = supabase.table("user_roles").select("*").eq("email", email).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        user = result.data[0]
        
        return {
            "id": user.get("id", email),
            "email": user["email"],
            "role": user["role"],
            "username": user.get("username", email),
            **user
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )


def get_current_user_with_permission(permission: str):
    """
    특정 권한을 가진 사용자만 허용
    
    Usage:
        @router.get("/items", dependencies=[Depends(get_current_user_with_permission("items:read"))])
    """
    async def permission_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role", "readonly")
        
        # 권한 체크 로직 (간단 버전)
        # admin, manager는 모든 권한 허용
        if user_role in ["admin", "manager"]:
            return current_user
        
        # staff는 읽기/쓰기 허용
        if user_role == "staff" and not permission.endswith(":delete"):
            return current_user
        
        # readonly는 읽기만 허용
        if user_role == "readonly" and permission.endswith(":read"):
            return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required: {permission}"
        )
    
    return permission_checker


def require_role(required_roles: List[str]):
    """
    Dependency to require specific roles
    
    Usage:
        @router.get("/admin", dependencies=[Depends(require_role(["manager", "admin"]))])
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role", "readonly")
        
        if user_role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {required_roles}"
            )
        
        return current_user
    
    return role_checker
