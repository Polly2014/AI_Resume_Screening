from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.resume import Resume

class ResumeCRUD:
    """简历CRUD操作"""
    
    def create(
        self, 
        db: Session, 
        *,
        filename: str,
        file_path: str,
        file_size: int,
        file_type: str,
        candidate_id: int
    ) -> Resume:
        """创建简历记录"""
        db_obj = Resume(
            filename=filename,
            file_path=file_path,
            file_size=file_size,
            file_type=file_type,
            candidate_id=candidate_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get(self, db: Session, id: int) -> Optional[Resume]:
        """根据ID获取简历"""
        return db.query(Resume).filter(Resume.id == id).first()
    
    def get_by_candidate(self, db: Session, candidate_id: int) -> List[Resume]:
        """获取候选人的所有简历"""
        return db.query(Resume).filter(Resume.candidate_id == candidate_id).all()
    
    def update_processing_status(
        self,
        db: Session,
        *,
        resume_id: int,
        status: str,
        raw_text: Optional[str] = None,
        extracted_data: Optional[dict] = None,
        error_message: Optional[str] = None
    ) -> Optional[Resume]:
        """更新简历处理状态"""
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if resume:
            resume.processing_status = status
            if raw_text:
                resume.raw_text = raw_text
            if extracted_data:
                resume.extracted_data = extracted_data
            if error_message:
                resume.error_message = error_message
            
            db.add(resume)
            db.commit()
            db.refresh(resume)
        return resume

# 创建CRUD实例
resume_crud = ResumeCRUD()
