# 多阶段构建Dockerfile for HR Copilot v2
# ------------------------------
# 第一阶段: 构建前端
# ------------------------------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package.json frontend/package-lock.json* ./

# 安装依赖
RUN npm ci

# 复制前端源代码
COPY frontend/ ./

# 设置生产环境变量
ENV NODE_ENV=production

# 设置API地址为后端服务 - 使用相对路径避免跨域问题
ENV REACT_APP_API_URL=/api

# 构建前端应用
RUN npm run build

# ------------------------------
# 第二阶段: 构建后端
# ------------------------------
FROM python:3.9-slim AS backend

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安装Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# 配置Poetry不创建虚拟环境(在容器中不需要)
RUN poetry config virtualenvs.create false

# 复制项目依赖文件
COPY pyproject.toml poetry.lock ./

# 安装项目依赖
RUN poetry install --no-dev

# 复制后端代码
COPY app/ ./app/

# 复制前端构建产物
COPY --from=frontend-build /app/frontend/build ./frontend/build

# 创建必要的目录
RUN mkdir -p uploads logs

# 设置环境变量
ENV PYTHONPATH=/app
ENV PORT=8000

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 创建非root用户运行应用
RUN useradd -m appuser
RUN chown -R appuser:appuser /app
USER appuser

# 启动脚本
COPY <<EOF /app/start.sh
#!/bin/sh
# 等待依赖服务启动(如有)
# sleep 10

# 将前端静态文件复制到FastAPI可以服务的位置
mkdir -p /app/static
cp -r /app/frontend/build/* /app/static/

# 启动Uvicorn服务器
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
EOF

RUN chmod +x /app/start.sh

# 启动应用
CMD ["/app/start.sh"]
