#!/bin/bash

# Server Status Check Script

SERVER_IP="139.59.110.55"
SERVER_USER="root"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Checking ERP App Server Status${NC}"
echo ""

echo -e "${YELLOW}📊 Service Status:${NC}"
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    echo "Backend Service:"
    systemctl is-active erp-backend && echo "  ✅ Running" || echo "  ❌ Stopped"
    
    echo ""
    echo "Nginx Service:"
    systemctl is-active nginx && echo "  ✅ Running" || echo "  ❌ Stopped"
    
    echo ""
    echo "Recent Backend Logs:"
    journalctl -u erp-backend -n 5 --no-pager
ENDSSH

echo ""
echo -e "${YELLOW}🌐 Endpoint Tests:${NC}"

# Test frontend
if curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP | grep -q "200"; then
    echo -e "Frontend: ${GREEN}✅ http://$SERVER_IP${NC}"
else
    echo -e "Frontend: ${RED}❌ http://$SERVER_IP${NC}"
fi

# Test backend API
if curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP/api/v1/health | grep -q "200"; then
    echo -e "Backend API: ${GREEN}✅ http://$SERVER_IP/api/v1${NC}"
else
    echo -e "Backend API: ${RED}❌ http://$SERVER_IP/api/v1${NC}"
fi

# Test API docs
if curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP/docs | grep -q "200"; then
    echo -e "API Docs: ${GREEN}✅ http://$SERVER_IP/docs${NC}"
else
    echo -e "API Docs: ${RED}❌ http://$SERVER_IP/docs${NC}"
fi

echo ""
