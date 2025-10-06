#!/bin/bash

# ERP App Environment Setup Script

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 ERP App Environment Setup${NC}"
echo ""

# Production Frontend Environment
echo -e "${YELLOW}Setting up production frontend environment...${NC}"
cat > .env.production << EOF
# Production Environment Variables
VITE_API_BASE_URL=http://139.59.110.55:8000/api/v1
VITE_API_TIMEOUT_MS=15000
VITE_APP_NAME=IMAC ERP System
VITE_ENABLE_MOCK_API=false
EOF
echo -e "${GREEN}✅ Created .env.production${NC}"

# Backend Environment Template
echo ""
echo -e "${YELLOW}Setting up backend environment template...${NC}"
if [ ! -f "backend/.env" ]; then
    cat > backend/.env.example << EOF
# Backend Environment Variables

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase-dashboard

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# CORS Configuration
ALLOWED_ORIGINS=http://139.59.110.55,http://localhost:5173

# Server Configuration
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=production
EOF
    echo -e "${GREEN}✅ Created backend/.env.example${NC}"
    echo -e "${RED}⚠️  Please copy backend/.env.example to backend/.env and fill in Supabase credentials${NC}"
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Environment setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Go to https://supabase.com and create a project"
echo "2. Run the migration: backend/supabase/migrations/001_initial_schema.sql"
echo "3. Copy Supabase API keys to backend/.env"
echo "4. Run: ./deploy.sh"
echo ""
