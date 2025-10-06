#!/usr/bin/env bash
# =====================================================
# ERP 시스템 헬스 모니터링 스크립트
# 사용법: ./health-monitor.sh [--email your@email.com]
# Cron: */5 * * * * /path/to/health-monitor.sh
# =====================================================

set -euo pipefail

# 설정
SERVER_IP="${SERVER_IP:-139.59.110.55}"
HEALTHZ_URL="http://${SERVER_IP}/healthz"
ALERT_EMAIL="${1:-}"
LOG_FILE="/var/log/erp-health-monitor.log"

# 컬러 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 로그 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 헬스체크 함수
check_health() {
    local response
    local status_code
    
    response=$(curl -s -w "\n%{http_code}" "$HEALTHZ_URL" 2>&1)
    status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" -eq 200 ]; then
        local body=$(echo "$response" | head -n-1)
        local status=$(echo "$body" | jq -r '.status' 2>/dev/null || echo "unknown")
        local commit=$(echo "$body" | jq -r '.commit' 2>/dev/null || echo "unknown")
        local supabase=$(echo "$body" | jq -r '.supabase' 2>/dev/null || echo "unknown")
        
        if [ "$status" = "ok" ] && [ "$supabase" = "ok" ]; then
            log "✅ HEALTHY - commit: $commit, supabase: $supabase"
            return 0
        else
            log "⚠️  DEGRADED - status: $status, supabase: $supabase"
            return 1
        fi
    else
        log "❌ DOWN - HTTP $status_code"
        return 2
    fi
}

# 알림 함수
send_alert() {
    local message="$1"
    
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "🚨 ERP Alert" "$ALERT_EMAIL" 2>/dev/null || true
    fi
    
    # Slack/Discord 웹훅 (옵션)
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"$message\"}" \
    #   "$SLACK_WEBHOOK_URL" 2>/dev/null || true
}

# 메인 로직
main() {
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "🏥 Health Check Starting..."
    
    if check_health; then
        # 정상
        echo -e "${GREEN}✅ System is healthy${NC}"
    else
        # 비정상
        echo -e "${RED}❌ System is unhealthy${NC}"
        
        # 3회 재시도
        local retry_count=3
        local retry_wait=5
        
        for i in $(seq 1 $retry_count); do
            log "  → Retry $i/$retry_count (waiting ${retry_wait}s)..."
            sleep $retry_wait
            
            if check_health; then
                log "  → Recovered!"
                echo -e "${GREEN}✅ System recovered after $i retries${NC}"
                return 0
            fi
        done
        
        # 복구 실패 - 알림 발송
        local alert_msg="ERP Engine is DOWN!\n\nServer: $SERVER_IP\nURL: $HEALTHZ_URL\nTime: $(date)\n\nPlease check immediately."
        send_alert "$alert_msg"
        log "🚨 ALERT SENT - System still down after $retry_count retries"
        
        return 1
    fi
}

# 실행
main "$@"
