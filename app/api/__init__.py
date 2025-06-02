from fastapi import APIRouter

from app.api.endpoints import candidates, resumes, filters

api_router = APIRouter()

# 包含所有端点路由
api_router.include_router(candidates.router, prefix="/candidates", tags=["candidates"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(filters.router, prefix="/filters", tags=["filters"])
