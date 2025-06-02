from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# 候选人相关Schema
class CandidateBase(BaseModel):
    """候选人基础Schema"""
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    education: Optional[str] = None
    experience_years: Optional[int] = None
    current_position: Optional[str] = None
    current_company: Optional[str] = None
    skills: Optional[List[str]] = []
    notes: Optional[str] = None

class CandidateCreate(CandidateBase):
    """创建候选人Schema"""
    pass

class CandidateUpdate(BaseModel):
    """更新候选人Schema"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    education: Optional[str] = None
    experience_years: Optional[int] = None
    current_position: Optional[str] = None
    current_company: Optional[str] = None
    skills: Optional[List[str]] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class CandidateResponse(CandidateBase):
    """候选人响应Schema"""
    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# 简历相关Schema
class ResumeBase(BaseModel):
    """简历基础Schema"""
    filename: str
    file_type: str

class ResumeResponse(ResumeBase):
    """简历响应Schema"""
    id: int
    file_size: int
    processing_status: str
    created_at: datetime
    processed_at: Optional[datetime] = None
    candidate_id: int
    
    class Config:
        from_attributes = True

# 上传响应Schema
class UploadResponse(BaseModel):
    """文件上传响应Schema"""
    message: str
    uploaded_files: List[str]
    failed_files: List[Dict[str, str]]
    total_processed: int

# 筛选请求Schema
class FilterRequest(BaseModel):
    """筛选请求Schema"""
    keywords: Optional[List[str]] = []
    education: Optional[str] = None
    min_experience: Optional[int] = None
    max_experience: Optional[int] = None
    skills: Optional[List[str]] = []
    status: Optional[str] = None
    natural_language_query: Optional[str] = None  # AI筛选查询

class FilterResponse(BaseModel):
    """筛选响应Schema"""
    candidates: List[CandidateResponse]
    total_count: int
    filter_criteria: Dict[str, Any]
