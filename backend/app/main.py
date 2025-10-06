"""
ERP Engine API - FastAPI Main Application
"""
import os
from fastapi import FastAPI, HTTPException, Depends, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings
from app.core.supabase import supabase

# Outbounds API 라우터
try:
    from app.api.outbounds import router as outbounds_router
    OUTBOUNDS_ENABLED = True
except ImportError:
    OUTBOUNDS_ENABLED = False
    print("[WARN] Outbounds API not available")

security = HTTPBearer()

# 엔진 식별 정보 (환경변수에서 직접 로드)
ENGINE_NAME = os.getenv("ENGINE_NAME", "erp-backend@opt")
ENGINE_COMMIT_SHA = os.getenv("ENGINE_COMMIT_SHA", "unknown")
ENGINE_SCHEMA_VERSION = os.getenv("ENGINE_SCHEMA_VERSION", "v1")
ENGINE_ENV = os.getenv("ENGINE_ENV", "production")

# 요청/응답 모델
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    department: Optional[str] = None

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Outbounds API 라우터 등록
if OUTBOUNDS_ENABLED:
    app.include_router(outbounds_router)
    print("[INFO] Outbounds API registered")


# 전역 응답 헤더 미들웨어 (운영 소스 추적)
@app.middleware("http")
async def add_engine_headers(request: Request, call_next):
    """모든 응답에 엔진 식별 헤더 추가 (브라우저 네트워크 탭에서 즉시 확인 가능)"""
    response = await call_next(request)
    response.headers["X-Engine-Name"] = ENGINE_NAME
    response.headers["X-Commit-SHA"] = ENGINE_COMMIT_SHA
    response.headers["X-Schema-Version"] = ENGINE_SCHEMA_VERSION
    response.headers["X-Env"] = ENGINE_ENV
    return response


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


@app.get("/healthz")
def healthz():
    """Health check with Supabase connection test and engine identification"""
    # Supabase 연결 테스트 (간단 조회)
    try:
        supabase.table("items").select("id").limit(1).execute()
        supabase_status = "ok"
    except Exception as e:
        supabase_status = f"error:{type(e).__name__}"
    
    return {
        "status": "ok",
        "name": ENGINE_NAME,
        "commit": ENGINE_COMMIT_SHA,
        "schema": ENGINE_SCHEMA_VERSION,
        "env": ENGINE_ENV,
        "supabase": supabase_status,
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# Backward compatibility
@app.get("/health")
async def health_check_legacy():
    """Legacy health check endpoint (use /healthz)"""
    return await health_check()


# Authentication API
@app.post("/api/v1/auth/token")
async def login_token(username: str = Form(...), password: str = Form(...)):
    """
    OAuth2 호환 로그인 API (form-urlencoded)
    TODO: 실제 JWT 토큰 생성 및 비밀번호 검증 구현
    """
    try:
        # user_roles 테이블에서 사용자 조회 (username = email)
        result = supabase.table("user_roles")\
            .select("*")\
            .eq("email", username)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user = result.data[0]
        
        # TODO: 실제 비밀번호 검증 (현재는 admin123만 허용)
        if password != "admin123":
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # 간단한 토큰 생성 (개발용 - 실제로는 JWT 사용)
        fake_token = f"dev_token_{user['email']}"
        
        return {
            "access_token": fake_token,
            "token_type": "bearer",
            "role": user["role"],
            "user_id": user["email"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/auth/login")
async def login_json(request: LoginRequest):
    """
    JSON 형식 로그인 API (하위 호환)
    """
    return await login_token(username=request.email, password=request.password)


@app.get("/api/v1/auth/me")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    현재 로그인한 사용자 정보 조회
    TODO: 실제 JWT 토큰 검증 구현
    """
    try:
        # 토큰에서 이메일 추출 (개발용)
        token = credentials.credentials
        if not token.startswith("dev_token_"):
            raise HTTPException(status_code=401, detail="Invalid token")
        
        email = token.replace("dev_token_", "")
        
        # user_roles 테이블에서 사용자 조회
        result = supabase.table("user_roles")\
            .select("*")\
            .eq("email", email)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=401, detail="User not found")
        
        user = result.data[0]
        return {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "department": user.get("department")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")


# Items API
@app.get("/api/v1/items/")
async def get_items(page: int = 1, limit: int = 10):
    """Get all items from Supabase with pagination"""
    try:
        skip = (page - 1) * limit
        result = supabase.table("items").select("*").range(skip, skip + limit - 1).execute()
        return {"data": result.data, "count": len(result.data)}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/v1/items/{item_id}")
async def get_item(item_id: str):
    """Get specific item by ID"""
    try:
        result = supabase.table("items").select("*").eq("id", item_id).single().execute()
        return {"data": result.data}
    except Exception as e:
        return {"error": str(e)}


# Inbounds API
@app.get("/api/v1/inbounds/")
async def get_inbounds(page: int = 1, limit: int = 10):
    """Get all inbounds from Supabase with pagination"""
    try:
        skip = (page - 1) * limit
        result = supabase.table("inbounds").select("*").range(skip, skip + limit - 1).execute()
        return {"data": result.data, "count": len(result.data)}
    except Exception as e:
        return {"error": str(e)}


# Stocks API
@app.get("/api/v1/stocks/")
async def get_stocks(page: int = 1, limit: int = 10):
    """Get all stocks from Supabase with pagination"""
    try:
        skip = (page - 1) * limit
        result = supabase.table("stocks").select("*").range(skip, skip + limit - 1).execute()
        return {"data": result.data, "count": len(result.data)}
    except Exception as e:
        return {"error": str(e)}


# Engines API (중요!)
@app.get("/api/engines")
async def get_engines(skip: int = 0, limit: int = 100):
    """Get all engines from Supabase"""
    try:
        result = supabase.table("engines").select("*").range(skip, skip + limit - 1).execute()
        return {"data": result.data, "count": len(result.data)}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/engines/{engine_id}")
async def get_engine(engine_id: str):
    """Get specific engine by ID"""
    try:
        result = supabase.table("engines").select("*").eq("id", engine_id).single().execute()
        return {"data": result.data}
    except Exception as e:
        return {"error": str(e)}


# Flows API
@app.get("/api/flows")
async def get_flows(skip: int = 0, limit: int = 100):
    """Get all flows from Supabase"""
    try:
        result = supabase.table("flows").select("*").range(skip, skip + limit - 1).execute()
        return {"data": result.data, "count": len(result.data)}
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    import multiprocessing
    
    # 코어 기반 워커 산정: (코어수 * 2) + 1
    workers = (multiprocessing.cpu_count() * 2) + 1
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        workers=workers,
        log_level="info"
    )
