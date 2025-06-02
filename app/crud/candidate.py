from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateCreate, CandidateUpdate

class CandidateCRUD:
    """候选人CRUD操作"""
    
    def create(self, db: Session, *, obj_in: CandidateCreate) -> Candidate:
        """创建候选人"""
        db_obj = Candidate(**obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get(self, db: Session, id: int) -> Optional[Candidate]:
        """根据ID获取候选人"""
        return db.query(Candidate).filter(Candidate.id == id).first()
    
    def get_by_email(self, db: Session, email: str) -> Optional[Candidate]:
        """根据邮箱获取候选人"""
        return db.query(Candidate).filter(Candidate.email == email).first()
    
    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Candidate]:
        """获取候选人列表"""
        return db.query(Candidate).offset(skip).limit(limit).all()
    
    def update(
        self, 
        db: Session, 
        *, 
        db_obj: Candidate, 
        obj_in: CandidateUpdate
    ) -> Candidate:
        """更新候选人信息"""
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, *, id: int) -> Candidate:
        """删除候选人"""
        obj = db.query(Candidate).get(id)
        db.delete(obj)
        db.commit()
        return obj
    
    def filter_candidates(
        self,
        db: Session,
        *,
        keywords: Optional[List[str]] = None,
        education: Optional[str] = None,
        min_experience: Optional[int] = None,
        max_experience: Optional[int] = None,
        skills: Optional[List[str]] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Candidate]:
        """筛选候选人"""
        query = db.query(Candidate)
        
        # 关键词筛选（姓名、职位、公司）
        if keywords:
            keyword_filters = []
            for keyword in keywords:
                keyword_filter = or_(
                    Candidate.name.contains(keyword),
                    Candidate.current_position.contains(keyword),
                    Candidate.current_company.contains(keyword)
                )
                keyword_filters.append(keyword_filter)
            query = query.filter(or_(*keyword_filters))
        
        # 教育背景筛选
        if education:
            query = query.filter(Candidate.education.contains(education))
        
        # 工作年限筛选
        if min_experience is not None:
            query = query.filter(Candidate.experience_years >= min_experience)
        if max_experience is not None:
            query = query.filter(Candidate.experience_years <= max_experience)
        
        # 技能筛选
        if skills:
            for skill in skills:
                # 使用JSON_EXTRACT函数或者类似的SQL查询
                # 但SQLite对JSON支持有限，改用字符串包含检查
                query = query.filter(Candidate.skills.op('LIKE')(f'%"{skill}"%'))
        
        # 状态筛选
        if status:
            query = query.filter(Candidate.status == status)
        
        return query.offset(skip).limit(limit).all()

# 创建CRUD实例
candidate_crud = CandidateCRUD()
