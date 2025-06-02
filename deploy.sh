#!/bin/bash
# HR Copilot v2 部署脚本
# 用于在云服务器上一键部署应用

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 打印带颜色的信息
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 检查必要工具
check_requirements() {
    info "检查必要工具..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker未安装，请先安装Docker: https://docs.docker.com/engine/install/"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose未安装，请先安装Docker Compose: https://docs.docker.com/compose/install/"
    fi
    
    info "所有必要工具已安装 ✓"
}

# 创建必要的目录
setup_directories() {
    info "创建必要的目录..."
    
    mkdir -p certbot/conf
    mkdir -p certbot/www
    mkdir -p uploads
    mkdir -p logs
    
    info "目录创建完成 ✓"
}

# 检查环境变量文件
check_env_file() {
    info "检查环境变量文件..."
    
    if [ ! -f .env ]; then
        warn ".env文件不存在，创建示例文件..."
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
        warn "请编辑.env文件并设置正确的API密钥"
    else
        info ".env文件已存在 ✓"
    fi
}

# 获取SSL证书
setup_ssl() {
    info "准备获取SSL证书..."
    
    # 检查域名是否设置
    if [ -z "$DOMAIN" ]; then
        read -p "请输入你的域名 (例如: qi.polly.wang): " DOMAIN
    fi
    
    # 检查邮箱是否设置
    if [ -z "$EMAIL" ]; then
        read -p "请输入你的邮箱 (用于Let's Encrypt通知): " EMAIL
    fi
    
    # 创建临时nginx配置用于证书申请
    cat > nginx.temp.conf << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF
    
    # 启动nginx容器以进行证书验证
    info "启动Nginx容器进行证书验证..."
    docker-compose up -d nginx
    
    # 获取证书
    info "申请SSL证书..."
    docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot \
        --email $EMAIL --agree-tos --no-eff-email \
        -d $DOMAIN
    
    # 关闭临时nginx
    docker-compose down
    
    # 恢复正确的nginx配置
    mv nginx.conf nginx.conf.bak
    cat > nginx.conf << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # 重定向HTTP到HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
    
    # Let's Encrypt验证
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}

server {
    listen 443 ssl;
    server_name ${DOMAIN};

    # SSL配置
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    
    # 增加安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
        proxy_pass http://app:8000;
    }

    # 上传文件
    location /uploads/ {
        proxy_pass http://app:8000/uploads/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # API请求
    location /api/ {
        proxy_pass http://app:8000/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket支持(如果需要)
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 文档
    location /docs {
        proxy_pass http://app:8000/docs;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /redoc {
        proxy_pass http://app:8000/redoc;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # 健康检查
    location /health {
        proxy_pass http://app:8000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        
        access_log off;
        add_header Cache-Control no-cache;
    }

    # 前端应用
    location / {
        proxy_pass http://app:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 处理单页应用路由
        try_files \$uri \$uri/ /index.html;
    }

    # 日志
    access_log /var/log/nginx/${DOMAIN}.access.log;
    error_log /var/log/nginx/${DOMAIN}.error.log;
}
EOF
    
    info "SSL证书设置完成 ✓"
}

# 启动应用
start_application() {
    info "构建并启动应用..."
    
    docker-compose up -d --build
    
    info "应用启动完成 ✓"
    info "你现在可以通过 https://$DOMAIN 访问你的HR Copilot应用"
}

# 主函数
main() {
    info "开始部署HR Copilot v2..."
    
    check_requirements
    setup_directories
    check_env_file
    setup_ssl
    start_application
    
    info "部署完成！"
    info "访问地址: https://$DOMAIN"
    info "API文档: https://$DOMAIN/docs"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -d|--domain)
            DOMAIN="$2"
            shift
            shift
            ;;
        -e|--email)
            EMAIL="$2"
            shift
            shift
            ;;
        -h|--help)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  -d, --domain DOMAIN    设置域名"
            echo "  -e, --email EMAIL      设置邮箱地址 (用于Let's Encrypt)"
            echo "  -h, --help             显示帮助信息"
            exit 0
            ;;
        *)
            error "未知参数: $1"
            ;;
    esac
done

# 执行主函数
main
