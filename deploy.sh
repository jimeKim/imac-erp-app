#!/bin/bash

# ERP App Deployment Script for DigitalOcean
# Server: 139.59.110.55

set -e

echo "🚀 Starting ERP App Deployment..."

# Configuration
SERVER_IP="139.59.110.55"
SERVER_USER="root"  # 또는 실제 사용자명
BACKEND_DIR="/opt/erp-backend"
FRONTEND_DIR="/var/www/erp-app"
PROJECT_DIR="$(pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Step 1: Building Frontend...${NC}"
npm run build
echo -e "${GREEN}✅ Frontend build complete${NC}"

echo -e "${YELLOW}📦 Step 2: Preparing Backend...${NC}"
cd backend
if [ ! -f ".env" ]; then
    echo -e "${RED}⚠️  Backend .env file not found. Please create it from .env.example${NC}"
    exit 1
fi

# Git commit SHA 추출 및 .env에 주입 (운영 소스 추적)
COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo -e "${YELLOW}📌 Injecting commit SHA: ${COMMIT_SHA}${NC}"

# .env에 ENGINE_COMMIT_SHA 업데이트 (기존 값 덮어쓰기)
if grep -q "ENGINE_COMMIT_SHA=" .env; then
    sed -i.bak "s/ENGINE_COMMIT_SHA=.*/ENGINE_COMMIT_SHA=${COMMIT_SHA}/" .env
else
    echo "ENGINE_COMMIT_SHA=${COMMIT_SHA}" >> .env
fi

cd ..
echo -e "${GREEN}✅ Backend prepared (commit: ${COMMIT_SHA})${NC}"

echo -e "${YELLOW}🔗 Step 3: Connecting to server...${NC}"
echo "Server: $SERVER_USER@$SERVER_IP"

# Create deployment archive
echo -e "${YELLOW}📁 Creating deployment package...${NC}"
tar -czf /tmp/erp-frontend.tar.gz -C dist .
tar -czf /tmp/erp-backend.tar.gz -C backend .

echo -e "${YELLOW}📤 Step 4: Uploading files to server...${NC}"

# Upload frontend
ssh $SERVER_USER@$SERVER_IP "sudo mkdir -p $FRONTEND_DIR && sudo chown $SERVER_USER:$SERVER_USER $FRONTEND_DIR"
scp /tmp/erp-frontend.tar.gz $SERVER_USER@$SERVER_IP:/tmp/
ssh $SERVER_USER@$SERVER_IP "cd $FRONTEND_DIR && tar -xzf /tmp/erp-frontend.tar.gz && rm /tmp/erp-frontend.tar.gz"

# Upload backend
ssh $SERVER_USER@$SERVER_IP "sudo mkdir -p $BACKEND_DIR && sudo chown $SERVER_USER:$SERVER_USER $BACKEND_DIR"
scp /tmp/erp-backend.tar.gz $SERVER_USER@$SERVER_IP:/tmp/
ssh $SERVER_USER@$SERVER_IP "cd $BACKEND_DIR && tar -xzf /tmp/erp-backend.tar.gz && rm /tmp/erp-backend.tar.gz"

echo -e "${GREEN}✅ Files uploaded${NC}"

# Server setup commands
echo -e "${YELLOW}⚙️  Step 5: Setting up server environment...${NC}"

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    set -e
    
    echo "Installing system dependencies..."
    
    # Update package list
    sudo apt-get update -qq
    
    # Install Python and pip if not exists
    if ! command -v python3 &> /dev/null; then
        sudo apt-get install -y python3 python3-pip python3-venv
    fi
    
    # Install Nginx if not exists
    if ! command -v nginx &> /dev/null; then
        sudo apt-get install -y nginx
    fi
    
    # Setup Python virtual environment
    cd /opt/erp-backend
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    
    # Install Python dependencies
    pip install --upgrade pip
    pip install -r requirements.txt
    
    echo "✅ Server environment ready"
ENDSSH

echo -e "${GREEN}✅ Server environment configured${NC}"

echo -e "${YELLOW}🔧 Step 6: Configuring Nginx...${NC}"

# Upload Nginx configuration
cat > /tmp/erp-nginx.conf << 'EOF'
# ERP App Nginx Configuration

# Backend API
upstream erp_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name 139.59.110.55;

    # Frontend
    location / {
        root /var/www/erp-app;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://erp_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Docs
    location /docs {
        proxy_pass http://erp_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # OpenAPI spec
    location /openapi.json {
        proxy_pass http://erp_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
EOF

scp /tmp/erp-nginx.conf $SERVER_USER@$SERVER_IP:/tmp/

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    sudo mv /tmp/erp-nginx.conf /etc/nginx/sites-available/erp-app
    sudo ln -sf /etc/nginx/sites-available/erp-app /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl reload nginx
    echo "✅ Nginx configured and reloaded"
ENDSSH

echo -e "${GREEN}✅ Nginx configured${NC}"

echo -e "${YELLOW}🔧 Step 7: Setting up systemd service for backend...${NC}"

cat > /tmp/erp-backend.service << 'EOF'
[Unit]
Description=ERP Backend API (FastAPI)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/erp-backend
Environment="PATH=/opt/erp-backend/venv/bin"
ExecStart=/opt/erp-backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

scp /tmp/erp-backend.service $SERVER_USER@$SERVER_IP:/tmp/

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    sudo mv /tmp/erp-backend.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable erp-backend
    sudo systemctl restart erp-backend
    echo "✅ Backend service configured"
ENDSSH

echo -e "${GREEN}✅ Backend service running${NC}"

echo -e "${YELLOW}🔥 Step 8: Configuring firewall...${NC}"

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    if command -v ufw &> /dev/null; then
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw allow 22/tcp
        sudo ufw --force enable
        echo "✅ Firewall configured"
    else
        echo "⚠️  UFW not found, skipping firewall configuration"
    fi
ENDSSH

# Cleanup
rm -f /tmp/erp-frontend.tar.gz /tmp/erp-backend.tar.gz /tmp/erp-nginx.conf /tmp/erp-backend.service

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "📱 Access your application:"
echo "   Frontend: http://139.59.110.55"
echo "   Backend API: http://139.59.110.55/api/v1"
echo "   API Docs: http://139.59.110.55/docs"
echo ""
echo "🔍 Check status:"
echo "   ssh $SERVER_USER@$SERVER_IP 'sudo systemctl status erp-backend'"
echo "   ssh $SERVER_USER@$SERVER_IP 'sudo systemctl status nginx'"
echo ""
echo "📝 View logs:"
echo "   ssh $SERVER_USER@$SERVER_IP 'sudo journalctl -u erp-backend -f'"
echo ""
