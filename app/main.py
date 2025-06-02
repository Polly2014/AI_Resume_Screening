from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging

from app.api import api_router
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.db.init_db import init_db

# 初始化日志系统
app_logger = setup_logging()

# 创建uploads目录
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="HR Copilot v2",
    description="AI-powered HR resume screening assistant system",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件服务
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 前端静态文件服务
if os.path.exists("static"):
    app_logger.info("挂载前端静态文件目录")
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
elif os.path.exists("frontend/build"):
    app_logger.info("挂载前端构建目录")
    app.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")

# 包含API路由
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    app_logger.info("应用启动中...")
    await init_db()
    app_logger.info("数据库初始化完成")
    app_logger.info("HR Copilot v2 应用启动成功")

@app.get("/")
async def root():
    """根路径健康检查"""
    app_logger.debug("根路径健康检查被调用")
    return {"message": "HR Copilot v2 API is running!"}

@app.get("/health")
async def health_check():
    """健康检查端点"""
    app_logger.debug("健康检查端点被调用")
    return {"status": "healthy", "version": "0.1.0"}
