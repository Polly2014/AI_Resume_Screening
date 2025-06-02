from sqlalchemy.orm import Session
from app.db.database import engine, Base

async def init_db():
    """初始化数据库，创建所有表"""
    # 导入所有模型以确保它们被注册到Base.metadata
    from app.models import candidate, resume
    
    # 创建所有表
    Base.metadata.create_all(bind=engine)
