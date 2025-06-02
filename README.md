# AI-powered Resume Screening System (HR Copilot v2)

一个基于AI的HR简历筛选助手系统，帮助HR专员简化日常招聘任务，提高简历处理效率和筛选质量。

## 主要功能

- **简历批量上传**: 支持PDF和Word文档格式
- **智能信息提取**: 结合规则提取和LLM智能提取
- **人才库管理**: 浏览、管理候选人信息
- **智能筛选**: 支持传统关键词筛选和AI自然语言筛选
- **状态跟踪**: 标记候选人状态（面试、拒绝、待定等）

## 技术栈

### 后端
- **框架**: FastAPI (Python)
- **包管理**: Poetry
- **LLM集成**: litellm + OpenRouter + Claude 3.5 Sonnet
- **数据库**: SQLite
- **文件存储**: 本地存储

### 前端
- **框架**: React
- **UI库**: Ant Design
- **样式**: 简洁的白灰色设计

## 快速开始

### 后端启动

1. 安装依赖：
```bash
poetry install
```

2. 启动开发服务器：
```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端启动

```bash
cd frontend
npm install
npm start
```

## API文档

启动后端服务后，访问 `http://localhost:8000/docs` 查看API文档。

## 环境变量

创建 `.env` 文件：
```
OPENROUTER_API_KEY=your_openrouter_api_key
DATABASE_URL=sqlite:///./hr_copilot.db
```

## 项目结构

```
Hr_Copilot_v2/
├── app/                    # FastAPI应用
│   ├── api/               # API路由
│   ├── core/              # 核心配置
│   ├── crud/              # 数据库操作
│   ├── db/                # 数据库配置
│   ├── models/            # 数据模型
│   ├── schemas/           # Pydantic模式
│   ├── services/          # 业务逻辑
│   └── main.py           # 应用入口
├── frontend/              # React前端
├── tests/                 # 测试
├── uploads/               # 上传文件目录
└── docker-compose.yml     # Docker配置
```

## 许可证

MIT License
