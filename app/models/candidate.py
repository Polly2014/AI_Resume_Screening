from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Candidate(Base):
    """候选人模型"""
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, index=True)
    phone = Column(String(20))
    
    # 基本信息
    education = Column(String(200))  # 教育背景
    experience_years = Column(Integer)  # 工作年限
    current_position = Column(String(200))  # 当前职位
    current_company = Column(String(200))  # 当前公司
    skills = Column(JSON)  # 技能列表
    
    # 状态管理
    status = Column(String(50), default="pending")  # pending, interviewed, rejected, hired
    notes = Column(Text)  # 备注
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    resumes = relationship("Resume", back_populates="candidate", cascade="all, delete-orphan")
