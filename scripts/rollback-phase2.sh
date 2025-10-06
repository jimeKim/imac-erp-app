#!/bin/bash

# =============================================
# BOM Phase 2 롤백 스크립트
# 배포 전 상태로 복구
# =============================================

set -e  # 에러 발생 시 즉시 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 서버 정보
SERVER="root@139.59.110.55"
REMOTE_BACKEND_DIR="/opt/erp-backend"
REMOTE_FRONTEND_DIR="/var/www/erp-app"

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 백업 디렉토리 확인
BACKUP_DIR="$1"

if [ -z "$BACKUP_DIR" ]; then
    log_error "백업 디렉토리를 지정해주세요."
    echo ""
    echo "사용법: $0 <backup_directory>"
    echo "예시:   $0 /opt/erp-backup/20251006-143000"
    echo ""
    exit 1
fi

echo ""
echo "=========================================="
echo "  🔄 BOM Phase 2 롤백 시작"
echo "=========================================="
echo ""

log_warning "⚠️ 경고: 이 작업은 시스템을 이전 상태로 되돌립니다."
log_info "백업 디렉토리: $BACKUP_DIR"
log_info "롤백 일시: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 사용자 확인
read -p "🔄 롤백을 시작하시겠습니까? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    log_warning "롤백이 취소되었습니다."
    exit 0
fi

echo ""

# ==========================================
# Step 1: 백업 디렉토리 존재 확인
# ==========================================
log_info "Step 1: 백업 디렉토리 확인"

BACKUP_EXISTS=$(ssh "$SERVER" "[ -d '$BACKUP_DIR' ] && echo 'yes' || echo 'no'")

if [ "$BACKUP_EXISTS" != "yes" ]; then
    log_error "백업 디렉토리를 찾을 수 없습니다: $BACKUP_DIR"
    log_info "사용 가능한 백업 목록:"
    ssh "$SERVER" "ls -lh /opt/erp-backup/"
    exit 1
fi

log_success "백업 디렉토리 확인 완료"

echo ""

# ==========================================
# Step 2: 프론트엔드 롤백
# ==========================================
log_info "Step 2: 프론트엔드 롤백"

ssh "$SERVER" << EOFSSH
    if [ -d "$BACKUP_DIR/erp-app" ]; then
        # 현재 상태 임시 백업
        mv "$REMOTE_FRONTEND_DIR" "${REMOTE_FRONTEND_DIR}.rollback-tmp"
        
        # 백업에서 복원
        cp -r "$BACKUP_DIR/erp-app" "$REMOTE_FRONTEND_DIR"
        
        echo "✅ 프론트엔드 롤백 완료"
    else
        echo "⚠️ 프론트엔드 백업을 찾을 수 없습니다."
    fi
EOFSSH

log_success "프론트엔드 롤백 완료"

echo ""

# ==========================================
# Step 3: 백엔드 롤백
# ==========================================
log_info "Step 3: 백엔드 롤백"

ssh "$SERVER" << EOFSSH
    if [ -d "$BACKUP_DIR/erp-backend" ]; then
        # 현재 상태 임시 백업
        mv "$REMOTE_BACKEND_DIR" "${REMOTE_BACKEND_DIR}.rollback-tmp"
        
        # 백업에서 복원
        cp -r "$BACKUP_DIR/erp-backend" "$REMOTE_BACKEND_DIR"
        
        # 백엔드 서비스 재시작
        systemctl restart erp-engine
        
        echo "✅ 백엔드 롤백 완료"
    else
        echo "⚠️ 백엔드 백업을 찾을 수 없습니다."
    fi
EOFSSH

log_success "백엔드 롤백 완료"

echo ""

# ==========================================
# Step 4: Nginx 캐시 퍼지
# ==========================================
log_info "Step 4: Nginx 캐시 퍼지"

ssh "$SERVER" << 'EOFSSH'
    # Nginx 리로드
    systemctl reload nginx
    
    echo "✅ Nginx 캐시 퍼지 완료"
EOFSSH

log_success "Nginx 캐시 퍼지 완료"

echo ""

# ==========================================
# Step 5: DB 제약 롤백 (선택)
# ==========================================
log_info "Step 5: DB 제약 롤백 (선택)"

log_warning "⚠️ DB 제약 롤백은 신중하게 결정해주세요."
log_info "   - 데이터 무결성에 영향을 줄 수 있습니다."
log_info "   - 롤백 전에 반드시 DBA와 상의하세요."
echo ""

read -p "DB 제약을 롤백하시겠습니까? (y/N): " db_rollback_confirm
if [[ $db_rollback_confirm =~ ^[Yy]$ ]]; then
    log_warning "Supabase Dashboard에서 다음 SQL을 실행하세요:"
    echo ""
    echo "-- BOM 제약 롤백"
    echo "ALTER TABLE public.bom_components DROP CONSTRAINT IF EXISTS unique_parent_component;"
    echo "ALTER TABLE public.bom_components DROP CONSTRAINT IF EXISTS no_self_reference;"
    echo "ALTER TABLE public.bom_components DROP CONSTRAINT IF EXISTS valid_quantity;"
    echo ""
    echo "-- 인덱스 삭제"
    echo "DROP INDEX IF EXISTS idx_bom_parent;"
    echo "DROP INDEX IF EXISTS idx_bom_component;"
    echo "DROP INDEX IF EXISTS idx_bom_parent_component;"
    echo "DROP INDEX IF EXISTS idx_bom_sequence;"
    echo ""
    echo "-- 함수 삭제"
    echo "DROP FUNCTION IF EXISTS check_bom_constraints();"
    echo "DROP FUNCTION IF EXISTS check_bom_indexes();"
    echo ""
    
    read -p "DB 제약 롤백을 완료하셨습니까? (y/N): " db_done
    if [[ $db_done =~ ^[Yy]$ ]]; then
        log_success "DB 제약 롤백 완료"
    else
        log_warning "DB 제약 롤백을 건너뜁니다."
    fi
else
    log_info "DB 제약 롤백을 건너뜁니다."
fi

echo ""

# ==========================================
# Step 6: 서비스 상태 확인
# ==========================================
log_info "Step 6: 서비스 상태 확인"

log_info "백엔드 서비스 상태..."
ssh "$SERVER" "systemctl status erp-engine --no-pager | head -10"

log_info "Health Check..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "http://139.59.110.55/api/v1/health" || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    log_success "Health Check 통과 (200)"
else
    log_error "Health Check 실패 (HTTP $HEALTH_CHECK)"
    log_warning "서비스 로그를 확인하세요: ssh $SERVER 'journalctl -u erp-engine -n 50'"
fi

echo ""

# ==========================================
# Step 7: Git 태그 정리 (선택)
# ==========================================
log_info "Step 7: Git 태그 정리 (선택)"

read -p "배포 시 생성된 Git 태그를 삭제하시겠습니까? (y/N): " tag_delete_confirm
if [[ $tag_delete_confirm =~ ^[Yy]$ ]]; then
    log_info "최근 Git 태그 목록:"
    git tag | grep "v1.2.0-bom-phase2" | tail -5
    echo ""
    
    read -p "삭제할 태그명을 입력하세요: " tag_to_delete
    if [ -n "$tag_to_delete" ]; then
        git tag -d "$tag_to_delete"
        git push origin ":refs/tags/$tag_to_delete"
        log_success "Git 태그 삭제 완료: $tag_to_delete"
    fi
else
    log_info "Git 태그를 유지합니다."
fi

echo ""

# ==========================================
# Step 8: 임시 백업 정리
# ==========================================
log_info "Step 8: 임시 백업 정리"

read -p "롤백 임시 백업 파일을 삭제하시겠습니까? (y/N): " cleanup_confirm
if [[ $cleanup_confirm =~ ^[Yy]$ ]]; then
    ssh "$SERVER" << EOFSSH
        rm -rf "${REMOTE_FRONTEND_DIR}.rollback-tmp"
        rm -rf "${REMOTE_BACKEND_DIR}.rollback-tmp"
        echo "✅ 임시 백업 파일 삭제 완료"
EOFSSH
    log_success "임시 백업 정리 완료"
else
    log_warning "임시 백업을 유지합니다."
    log_info "   프론트엔드: ${REMOTE_FRONTEND_DIR}.rollback-tmp"
    log_info "   백엔드: ${REMOTE_BACKEND_DIR}.rollback-tmp"
fi

echo ""

# ==========================================
# Step 9: 롤백 완료
# ==========================================
echo ""
echo "=========================================="
echo "  ✅ BOM Phase 2 롤백 완료!"
echo "=========================================="
echo ""

log_success "백업 디렉토리: $BACKUP_DIR"
log_success "롤백 시각: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

log_info "📋 다음 단계:"
log_info "   1. http://139.59.110.55 접속 (Hard Reload: Cmd+Shift+R)"
log_info "   2. 기능 정상 동작 확인"
log_info "   3. 롤백 사유 문서화"
log_info "   4. 재배포 계획 수립"
echo ""

log_warning "⚠️ 모니터링:"
log_info "   - 로그 확인: ssh $SERVER 'journalctl -u erp-engine -f'"
log_info "   - 에러 확인: ssh $SERVER 'journalctl -u erp-engine --since \"10 minutes ago\" | grep ERROR'"
echo ""
