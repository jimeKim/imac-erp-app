"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # App
    APP_NAME: str = "ERP App API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Engine Identification (for multi-backend tracking)
    ENGINE_NAME: str = "erp-backend@opt"  # 운영 소스 식별
    ENGINE_COMMIT_SHA: str = "dev"  # Git commit SHA (배포 시 주입)
    ENGINE_SCHEMA_VERSION: str = "v1"  # DB 스키마 버전
    ENGINE_ENV: str = "production"  # development, staging, production
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    
    # Database
    DATABASE_URL: str = ""  # Supabase PostgreSQL URL (optional)
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

