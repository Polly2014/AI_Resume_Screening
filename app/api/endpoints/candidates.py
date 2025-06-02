from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.crud.candidate import candidate_crud
from app.schemas.candidate import (
    CandidateResponse, 
    CandidateCreate, 
    CandidateUpdate,
    FilterRequest,
    FilterResponse
)

class StatusUpdateRequest(BaseModel):
    """状态更新请求模型"""
    status: str
    notes: Optional[str] = None

router = APIRouter()

@router.get("/", response_model=List[CandidateResponse])
async def get_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """获取候选人列表"""
    candidates = candidate_crud.get_multi(db, skip=skip, limit=limit)
    return candidates

@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    """根据ID获取候选人详情"""
    candidate = candidate_crud.get(db, id=candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")
    return candidate

@router.post("/", response_model=CandidateResponse)
async def create_candidate(
    candidate_in: CandidateCreate,
    db: Session = Depends(get_db)
):
    """创建新候选人"""
    # 检查邮箱是否已存在
    if candidate_in.email:
        existing = candidate_crud.get_by_email(db, email=candidate_in.email)
        if existing:
            raise HTTPException(status_code=400, detail="该邮箱已存在")
    
    candidate = candidate_crud.create(db, obj_in=candidate_in)
    return candidate

@router.patch("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: int,
    candidate_in: CandidateUpdate,
    db: Session = Depends(get_db)
):
    """更新候选人信息"""
    candidate = candidate_crud.get(db, id=candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")
    
    candidate = candidate_crud.update(db, db_obj=candidate, obj_in=candidate_in)
    return candidate

from pydantic import BaseModel

class StatusUpdateRequest(BaseModel):
    """状态更新请求模型"""
    status: str
    notes: Optional[str] = None

@router.patch("/{candidate_id}/status")
async def update_candidate_status(
    candidate_id: int,
    request: StatusUpdateRequest,
    db: Session = Depends(get_db)
):
    """更新候选人状态"""
    candidate = candidate_crud.get(db, id=candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")
    
    # 验证状态值
    valid_statuses = ["pending", "interviewed", "rejected", "hired"]
    if request.status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"无效的状态值。有效值: {', '.join(valid_statuses)}"
        )
    
    update_data = CandidateUpdate(status=request.status)
    if request.notes:
        update_data.notes = request.notes
    
    candidate = candidate_crud.update(db, db_obj=candidate, obj_in=update_data)
    return {"message": "状态更新成功", "candidate": candidate}

@router.delete("/{candidate_id}")
async def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    """删除候选人"""
    candidate = candidate_crud.get(db, id=candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")
    
    candidate_crud.delete(db, id=candidate_id)
    return {"message": "候选人删除成功"}

@router.post("/filter", response_model=FilterResponse)
async def filter_candidates(
    filter_request: FilterRequest,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """筛选候选人"""
    candidates = candidate_crud.filter_candidates(
        db,
        keywords=filter_request.keywords,
        education=filter_request.education,
        min_experience=filter_request.min_experience,
        max_experience=filter_request.max_experience,
        skills=filter_request.skills,
        status=filter_request.status,
        skip=skip,
        limit=limit
    )
    
    return FilterResponse(
        candidates=candidates,
        total_count=len(candidates),
        filter_criteria=filter_request.dict(exclude_unset=True)
    )
