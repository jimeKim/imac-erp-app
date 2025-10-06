#!/usr/bin/env bash
# =====================================================
# ERP Blue-Green API 슬롯 스위치 스크립트
# 사용법: ./switch-api-slot.sh {green|blue}
# =====================================================

set -euo pipefail

# 컬러 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
FLAG_FILE="/etc/nginx/green_on"
SERVER_IP="139.59.110.55"

# 사용법 출력
usage() {
    echo "Usage: $0 {green|blue}"
    echo ""
    echo "Examples:"
    echo "  $0 green   # Switch to Green slot (8001)"
    echo "  $0 blue    # Rollback to Blue slot (8000)"
    exit 1
}

# 인자 확인
if [ $# -ne 1 ]; then
    usage
fi

TARGET_SLOT="$1"

# 슬롯 검증
if [ "$TARGET_SLOT" != "green" ] && [ "$TARGET_SLOT" != "blue" ]; then
    echo -e "${RED}❌ Invalid slot: $TARGET_SLOT${NC}"
    usage
fi

echo -e "${BLUE}🔄 ERP API Slot Switch${NC}"
echo -e "Target: ${YELLOW}$TARGET_SLOT${NC}"
echo ""

# 1. 현재 슬롯 확인
if [ -f "$FLAG_FILE" ]; then
    CURRENT_SLOT="green"
else
    CURRENT_SLOT="blue"
fi

echo -e "Current slot: ${YELLOW}$CURRENT_SLOT${NC}"

if [ "$CURRENT_SLOT" == "$TARGET_SLOT" ]; then
    echo -e "${GREEN}✅ Already on $TARGET_SLOT slot${NC}"
    exit 0
fi

# 2. 대상 슬롯 헬스체크
echo -e "${YELLOW}🏥 Health checking $TARGET_SLOT slot...${NC}"

if [ "$TARGET_SLOT" == "green" ]; then
    HEALTH_URL="http://127.0.0.1:8001/healthz"
else
    HEALTH_URL="http://127.0.0.1:8000/healthz"
fi

# 헬스체크 (3회 시도)
HEALTH_OK=false
for i in {1..3}; do
    if curl -f -s --max-time 3 "$HEALTH_URL" > /dev/null 2>&1; then
        HEALTH_OK=true
        break
    fi
    echo -e "  ${YELLOW}⏳ Retry $i/3...${NC}"
    sleep 1
done

if [ "$HEALTH_OK" = false ]; then
    echo -e "${RED}❌ Health check failed for $TARGET_SLOT slot${NC}"
    echo -e "${RED}   Cannot switch to unhealthy slot${NC}"
    exit 1
fi

echo -e "${GREEN}✅ $TARGET_SLOT slot is healthy${NC}"

# 3. 스위치 실행
echo -e "${YELLOW}🔄 Switching to $TARGET_SLOT...${NC}"

case "$TARGET_SLOT" in
    green)
        sudo touch "$FLAG_FILE"
        ;;
    blue)
        sudo rm -f "$FLAG_FILE"
        ;;
esac

# 4. Nginx 설정 테스트
echo -e "${YELLOW}🔍 Testing nginx configuration...${NC}"
if ! sudo nginx -t > /dev/null 2>&1; then
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    # 롤백
    if [ "$TARGET_SLOT" == "green" ]; then
        sudo rm -f "$FLAG_FILE"
    else
        sudo touch "$FLAG_FILE"
    fi
    exit 1
fi

# 5. Nginx 리로드
echo -e "${YELLOW}♻️  Reloading nginx...${NC}"
sudo systemctl reload nginx

# 6. 검증
echo -e "${YELLOW}✅ Verifying switch...${NC}"
sleep 1

# 외부 헬스체크
VERIFY_OK=false
for i in {1..3}; do
    RESPONSE=$(curl -s http://$SERVER_IP/healthz | jq -r .name 2>/dev/null || echo "")
    if [ -n "$RESPONSE" ]; then
        VERIFY_OK=true
        break
    fi
    sleep 1
done

if [ "$VERIFY_OK" = false ]; then
    echo -e "${RED}⚠️  Warning: Could not verify switch${NC}"
else
    echo -e "${GREEN}✅ Switch verified successfully${NC}"
fi

# 7. 결과 출력
echo ""
echo -e "${GREEN}🎉 Successfully switched to $TARGET_SLOT slot!${NC}"
echo ""
echo "Current configuration:"
echo "  Active slot: $TARGET_SLOT"
echo "  Flag file:   $FLAG_FILE $([ -f "$FLAG_FILE" ] && echo "(exists)" || echo "(not exists)")"
echo ""
echo "Test commands:"
echo "  curl http://$SERVER_IP/healthz | jq .name"
echo "  curl http://$SERVER_IP/healthz | jq .commit"
echo ""

if [ "$TARGET_SLOT" == "green" ]; then
    echo -e "${BLUE}💡 Tip: To rollback, run: $0 blue${NC}"
else
    echo -e "${BLUE}💡 Tip: To switch to green, run: $0 green${NC}"
fi
