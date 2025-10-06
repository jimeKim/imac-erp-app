#!/bin/bash

# Quick Deploy Script for ERP App
# For rapid deployments after initial setup

set -e

SERVER_IP="139.59.110.55"
SERVER_USER="root"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⚡ Quick Deploy to $SERVER_IP${NC}"

# Build
echo -e "${YELLOW}📦 Building frontend...${NC}"
npm run build

# Deploy frontend only
echo -e "${YELLOW}📤 Deploying frontend...${NC}"
tar -czf /tmp/erp-frontend.tar.gz -C dist .
scp /tmp/erp-frontend.tar.gz $SERVER_USER@$SERVER_IP:/tmp/
ssh $SERVER_USER@$SERVER_IP "cd /var/www/erp-app && tar -xzf /tmp/erp-frontend.tar.gz && rm /tmp/erp-frontend.tar.gz"
rm /tmp/erp-frontend.tar.gz

echo -e "${GREEN}✅ Frontend deployed!${NC}"
echo -e "Access: http://$SERVER_IP"
