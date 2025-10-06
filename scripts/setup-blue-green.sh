#!/usr/bin/env bash
# =====================================================
# Blue-Green 배포 환경 자동 설정 스크립트
# 사용법: ./setup-blue-green.sh
# =====================================================

set -euo pipefail

# 컬러 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🔵🟢 Blue-Green 배포 환경 설정          ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo ""

SERVER_IP="139.59.110.55"
SERVER_USER="root"

# 1. Green 디렉토리 준비
echo -e "${YELLOW}📦 Step 1: Green 디렉토리 생성...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} <<'REMOTE_EOF'
set -e

echo "  → /opt/erp-backend-green 생성"
sudo mkdir -p /opt/erp-backend-green

echo "  → Blue에서 Green으로 복제"
sudo rsync -a /opt/erp-backend/ /opt/erp-backend-green/ --exclude=venv

echo "  → 가상환경 생성"
cd /opt/erp-backend-green
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "  → .env 파일 복제"
cp /opt/erp-backend/.env /opt/erp-backend-green/.env

echo "✅ Green 디렉토리 준비 완료"
REMOTE_EOF

# 2. Green 서비스 파일 생성
echo ""
echo -e "${YELLOW}📝 Step 2: Green systemd 서비스 생성...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} <<'REMOTE_EOF'
set -e

cat > /tmp/erp-engine-green.service <<'SERVICE_EOF'
[Unit]
Description=ERP Engine API (Green - Port 8001)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/erp-backend-green
Environment="PATH=/opt/erp-backend-green/venv/bin"
ExecStart=/opt/erp-backend-green/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 5
Restart=always
RestartSec=3
EnvironmentFile=/opt/erp-backend-green/.env

[Install]
WantedBy=multi-user.target
SERVICE_EOF

sudo mv /tmp/erp-engine-green.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable erp-engine-green.service

echo "✅ Green 서비스 등록 완료"
REMOTE_EOF

# 3. Nginx 설정 백업 및 업데이트
echo ""
echo -e "${YELLOW}🔧 Step 3: Nginx Blue-Green 설정 적용...${NC}"

# Nginx 설정 파일 업로드
scp docs/operations/nginx-blue-green.conf ${SERVER_USER}@${SERVER_IP}:/tmp/

ssh ${SERVER_USER}@${SERVER_IP} <<'REMOTE_EOF'
set -e

echo "  → 기존 Nginx 설정 백업"
sudo cp /etc/nginx/sites-available/erp-app /etc/nginx/sites-available/erp-app.backup.$(date +%Y%m%d_%H%M%S)

echo "  → 새 설정 적용"
sudo mv /tmp/nginx-blue-green.conf /etc/nginx/sites-available/erp-app

echo "  → Nginx 설정 테스트"
sudo nginx -t

echo "  → Nginx 리로드"
sudo systemctl reload nginx

echo "✅ Nginx 설정 적용 완료"
REMOTE_EOF

# 4. 스위치 스크립트 설치
echo ""
echo -e "${YELLOW}🔀 Step 4: 스위치 스크립트 설치...${NC}"
scp scripts/switch-api-slot.sh ${SERVER_USER}@${SERVER_IP}:/tmp/

ssh ${SERVER_USER}@${SERVER_IP} <<'REMOTE_EOF'
set -e

sudo mv /tmp/switch-api-slot.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/switch-api-slot.sh

echo "✅ 스위치 스크립트 설치 완료"
REMOTE_EOF

# 5. Green 서비스 시작 및 헬스체크
echo ""
echo -e "${YELLOW}🚀 Step 5: Green 서비스 시작...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} <<'REMOTE_EOF'
set -e

echo "  → Green 서비스 시작"
sudo systemctl start erp-engine-green.service

echo "  → 서비스 시작 대기 (5초)"
sleep 5

echo "  → Green 헬스체크"
for i in {1..5}; do
    if curl -f -s http://127.0.0.1:8001/healthz > /dev/null 2>&1; then
        echo "✅ Green 서비스 정상 구동 중"
        break
    fi
    if [ $i -eq 5 ]; then
        echo "⚠️  Green 헬스체크 실패 (정상적으로 시작 중일 수 있음)"
    fi
    sleep 2
done
REMOTE_EOF

# 6. 최종 검증
echo ""
echo -e "${YELLOW}🔍 Step 6: 최종 검증...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} <<'REMOTE_EOF'
set -e

echo "  → Blue 서비스 상태:"
sudo systemctl is-active erp-engine.service && echo "    ✅ Blue (8000): active" || echo "    ❌ Blue: inactive"

echo "  → Green 서비스 상태:"
sudo systemctl is-active erp-engine-green.service && echo "    ✅ Green (8001): active" || echo "    ❌ Green: inactive"

echo ""
echo "  → Blue 헬스체크:"
if curl -f -s http://127.0.0.1:8000/healthz | jq -r .name 2>/dev/null; then
    echo "    ✅ Blue: $(curl -s http://127.0.0.1:8000/healthz | jq -r .commit)"
else
    echo "    ⚠️  Blue 헬스체크 실패"
fi

echo "  → Green 헬스체크:"
if curl -f -s http://127.0.0.1:8001/healthz | jq -r .name 2>/dev/null; then
    echo "    ✅ Green: $(curl -s http://127.0.0.1:8001/healthz | jq -r .commit)"
else
    echo "    ⚠️  Green 헬스체크 실패"
fi

echo ""
echo "  → 현재 활성 슬롯:"
if [ -f /etc/nginx/green_on ]; then
    echo "    🟢 Green (8001)"
else
    echo "    🔵 Blue (8000)"
fi
REMOTE_EOF

# 완료 메시지
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 Blue-Green 배포 환경 설정 완료!      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}사용법:${NC}"
echo ""
echo "  # Green으로 스위치 (새 버전 배포)"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'switch-api-slot.sh green'"
echo ""
echo "  # Blue로 롤백 (5초 이내)"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'switch-api-slot.sh blue'"
echo ""
echo "  # 직접 헬스체크"
echo "  curl http://${SERVER_IP}/healthz/blue | jq .name"
echo "  curl http://${SERVER_IP}/healthz/green | jq .name"
echo ""
echo -e "${YELLOW}💡 Tip:${NC} 다음 배포부터는 Zero-downtime 배포 가능!"
echo ""
