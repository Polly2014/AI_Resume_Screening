# Docker 部署指南

本文档提供了使用 Docker 部署 HR Copilot v2 应用的详细说明。

## 先决条件

- 安装 [Docker](https://docs.docker.com/get-docker/)
- 安装 [Docker Compose](https://docs.docker.com/compose/install/)
- 域名 (本例中使用 `qi.polly.wang`)
- 服务器端口 80 和 443 必须可用且允许流量通过

## 快速部署

最简单的方法是使用提供的部署脚本:

```bash
# 赋予脚本执行权限
chmod +x deploy.sh

# 运行部署脚本，指定域名和邮箱
./deploy.sh --domain qi.polly.wang --email your.email@example.com
```

该脚本将自动:
1. 检查必要工具是否已安装
2. 创建必要的目录结构
3. 设置环境变量文件
4. 申请并配置SSL证书
5. 构建并启动应用

## 手动部署步骤

如果你想手动执行部署步骤，请按照以下指南操作:

### 1. 设置环境变量

创建 `.env` 文件:

```bash
cat > .env << EOF
# HR Copilot v2 环境变量

# 基础配置
PROJECT_NAME=HR Copilot v2
VERSION=0.1.0
API_V1_STR=/api

# 数据库配置 
DATABASE_URL=sqlite:///./hr_copilot.db

# LLM配置
OPENROUTER_API_KEY=your_openrouter_api_key
LLM_MODEL=openrouter/anthropic/claude-3.7-sonnet

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=[".pdf", ".doc", ".docx"]

# 会话配置
SESSION_TIMEOUT=3600
EOF
```

确保替换 `your_openrouter_api_key` 为你实际的API密钥。

### 2. 创建必要的目录

```bash
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p uploads
mkdir -p logs
```

### 3. 获取SSL证书

使用Let's Encrypt获取证书:

```bash
# 创建用于证书申请的临时nginx配置
cat > nginx.temp.conf << EOF
server {
    listen 80;
    server_name qi.polly.wang;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

# 启动nginx
docker-compose up -d nginx

# 获取证书
docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot \
    --email your.email@example.com --agree-tos --no-eff-email \
    -d qi.polly.wang

# 停止临时nginx
docker-compose down
```

### 4. 启动应用

```bash
docker-compose up -d --build
```

## 验证部署

部署完成后，你可以通过以下URL访问应用:

- 主应用: https://qi.polly.wang
- API文档: https://qi.polly.wang/docs
- 健康检查: https://qi.polly.wang/health

## 维护操作

### 查看日志

```bash
# 查看应用日志
docker-compose logs app

# 查看nginx日志
docker-compose logs nginx

# 跟踪实时日志
docker-compose logs -f app
```

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

### 停止应用

```bash
docker-compose down
```

### 备份数据

```bash
# 备份数据库
cp hr_copilot.db hr_copilot.db.backup

# 备份上传文件
tar -czf uploads_backup.tar.gz uploads/
```

## 故障排除

如果遇到问题，请尝试以下步骤:

1. 检查容器状态:
   ```bash
   docker-compose ps
   ```

2. 检查容器日志:
   ```bash
   docker-compose logs
   ```

3. 重启服务:
   ```bash
   docker-compose restart
   ```

4. 如果问题仍然存在，尝试完全重建:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```
