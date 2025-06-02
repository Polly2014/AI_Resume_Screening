import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.crud.candidate import candidate_crud
from app.services.llm_service import llm_service

router = APIRouter()
logger = logging.getLogger("app.api.filters")

class OptimizeRequest(BaseModel):
    """筛选优化请求"""
    natural_language_query: str

class OptimizeResponse(BaseModel):
    """筛选优化响应"""
    original_query: str
    optimized_criteria: Dict[str, Any]
    suggestions: List[str]

class SmartMatchRequest(BaseModel):
    """智能匹配请求"""
    job_requirements: str
    candidate_ids: List[int] = []  # 如果为空，则匹配所有候选人

class SmartMatchResponse(BaseModel):
    """智能匹配响应"""
    job_requirements: str
    matches: List[Dict[str, Any]]
    total_candidates: int

@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_filter_criteria(
    request: OptimizeRequest,
    db: Session = Depends(get_db)
):
    """使用LLM优化筛选条件"""
    logger.info(f"开始优化筛选条件，查询: {request.natural_language_query}")
    
    try:
        # 使用LLM优化筛选条件
        logger.debug("调用LLM服务优化筛选条件")
        optimized_criteria = await llm_service.optimize_filter_criteria(
            request.natural_language_query
        )
        
        logger.info(f"筛选条件优化完成，生成的条件: {list(optimized_criteria.keys())}")
        
        # 生成建议
        suggestions = []
        if optimized_criteria.get("keywords"):
            suggestions.append(f"关键词匹配: {', '.join(optimized_criteria['keywords'])}")
        
        if optimized_criteria.get("skills"):
            suggestions.append(f"技能要求: {', '.join(optimized_criteria['skills'])}")
        
        if optimized_criteria.get("min_experience"):
            suggestions.append(f"最少工作经验: {optimized_criteria['min_experience']}年")
        
        if optimized_criteria.get("education"):
            suggestions.append(f"教育要求: {optimized_criteria['education']}")
        
        logger.info(f"生成 {len(suggestions)} 条建议")
        
        return OptimizeResponse(
            original_query=request.natural_language_query,
            optimized_criteria=optimized_criteria,
            suggestions=suggestions
        )
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"筛选条件优化失败: {error_msg}")
        raise HTTPException(
            status_code=500, 
            detail=f"筛选条件优化失败: {error_msg}"
        )

@router.post("/smart-match", response_model=SmartMatchResponse)
async def smart_candidate_matching(
    request: SmartMatchRequest,
    db: Session = Depends(get_db)
):
    """智能候选人匹配"""
    logger.info(f"开始智能候选人匹配，候选人数量: {len(request.candidate_ids) if request.candidate_ids else '全部'}")
    logger.debug(f"职位要求: {request.job_requirements}")
    
    try:
        # 获取候选人数据
        if request.candidate_ids:
            # 获取指定的候选人
            logger.debug(f"获取指定候选人: {request.candidate_ids}")
            candidates = []
            for candidate_id in request.candidate_ids:
                candidate = candidate_crud.get(db, candidate_id)
                if candidate:
                    candidates.append(candidate)
                else:
                    logger.warning(f"未找到候选人: candidate_id={candidate_id}")
        else:
            # 获取所有候选人
            logger.debug("获取所有候选人数据")
            candidates = candidate_crud.get_multi(db, skip=0, limit=1000)
        
        logger.info(f"获取到 {len(candidates)} 个候选人")
        
        if not candidates:
            logger.warning("没有找到任何候选人")
            return SmartMatchResponse(
                job_requirements=request.job_requirements,
                matches=[],
                total_candidates=0
            )
        
        # 准备候选人数据
        logger.debug("准备候选人数据用于LLM匹配")
        candidates_data = []
        for candidate in candidates:
            candidate_dict = {
                "id": candidate.id,
                "name": candidate.name,
                "email": candidate.email,
                "phone": candidate.phone,
                "education": candidate.education,
                "experience_years": candidate.experience_years,
                "current_position": candidate.current_position,
                "current_company": candidate.current_company,
                "skills": candidate.skills or [],
                "status": candidate.status
            }
            candidates_data.append(candidate_dict)
        
        logger.info(f"候选人数据准备完成，共 {len(candidates_data)} 个候选人")
        
        # 使用LLM进行智能匹配
        logger.debug("调用LLM服务进行智能匹配")
        llm_matches = await llm_service.smart_candidate_matching(
            request.job_requirements,
            candidates_data
        )
        
        # 为匹配结果添加候选人完整信息
        logger.debug("为匹配结果添加候选人详细信息")
        enriched_matches = []
        candidate_dict = {c.id: c for c in candidates}  # 创建候选人ID到对象的映射
        
        for match in llm_matches:
            candidate_id = match.get("candidate_id")
            if candidate_id and candidate_id in candidate_dict:
                candidate = candidate_dict[candidate_id]
                enriched_match = {
                    "candidate_id": candidate_id,
                    "name": candidate.name,
                    "email": candidate.email,
                    "phone": candidate.phone,
                    "education": candidate.education,
                    "experience_years": candidate.experience_years,
                    "current_position": candidate.current_position,
                    "current_company": candidate.current_company,
                    "skills": candidate.skills or [],
                    "status": candidate.status,
                    "score": match.get("score", 0),
                    "reasons": match.get("reasons", []),
                    "concerns": match.get("concerns", [])
                }
                enriched_matches.append(enriched_match)
        
        logger.info(f"智能匹配完成，生成 {len(enriched_matches)} 个匹配结果")
        
        return SmartMatchResponse(
            job_requirements=request.job_requirements,
            matches=enriched_matches,
            total_candidates=len(candidates)
        )
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"智能匹配失败: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail=f"智能匹配失败: {error_msg}"
        )

@router.get("/suggestions")
async def get_filter_suggestions():
    """获取筛选建议"""
    return {
        "common_skills": [
            "Python", "Java", "JavaScript", "React", "Vue.js", 
            "Node.js", "Django", "Spring Boot", "MySQL", "PostgreSQL",
            "Docker", "Kubernetes", "AWS", "Git", "Linux"
        ],
        "education_levels": [
            "高中", "大专", "本科", "硕士", "博士"
        ],
        "experience_ranges": [
            {"label": "应届生", "min": 0, "max": 1},
            {"label": "1-3年", "min": 1, "max": 3},
            {"label": "3-5年", "min": 3, "max": 5},
            {"label": "5-10年", "min": 5, "max": 10},
            {"label": "10年以上", "min": 10, "max": None}
        ],
        "status_options": [
            {"value": "pending", "label": "待处理"},
            {"value": "interviewed", "label": "已面试"},
            {"value": "rejected", "label": "已拒绝"},
            {"value": "hired", "label": "已录用"}
        ]
    }
