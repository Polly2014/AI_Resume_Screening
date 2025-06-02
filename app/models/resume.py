from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Resume(Base):
    """简历模型"""
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(500), nullable=False)  # 原始文件名
    file_path = Column(String(1000), nullable=False)  # 存储路径
    file_size = Column(Integer)  # 文件大小（字节）
    file_type = Column(String(10))  # 文件类型 pdf, doc, docx
    
    # 提取的内容
    raw_text = Column(Text)  # 原始文本内容
    extracted_data = Column(JSON)  # 结构化提取的数据
    
    # 处理状态
    processing_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    error_message = Column(Text)  # 错误信息
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)
    
    # 外键关联
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    candidate = relationship("Candidate", back_populates="resumes")
