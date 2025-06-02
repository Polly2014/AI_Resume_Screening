import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """应用配置"""
    
    # 基础配置
    PROJECT_NAME: str = "HR Copilot v2"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"
    
    # 数据库配置
    DATABASE_URL: str = "sqlite:///./hr_copilot.db"
    
    # LLM配置
    OPENROUTER_API_KEY: Optional[str] = None
    LLM_MODEL: str = "openrouter/anthropic/claude-3.7-sonnet"
    
    # 文件上传配置
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: list = [".pdf", ".doc", ".docx"]
    
    # 会话配置
    SESSION_TIMEOUT: int = 3600  # 1小时
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
