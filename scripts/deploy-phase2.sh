#!/bin/bash

# =============================================
# BOM Phase 2 배포 스크립트
# 프론트엔드 + 백엔드 + DB 마이그레이션
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

# 배포 전 확인
echo ""
echo "=========================================="
echo "  BOM Phase 2 배포 시작"
echo "=========================================="
echo ""

log_info "배포 대상 서버: $SERVER"
log_info "배포 일시: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 사용자 확인
read -p "🚀 배포를 시작하시겠습니까? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    log_warning "배포가 취소되었습니다."
    exit 0
fi

echo ""

# ==========================================
# Step 1: Git 태그 생성 및 백업
# ==========================================
log_info "Step 1: Git 태그 생성 및 백업"

# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)
log_info "현재 브랜치: $CURRENT_BRANCH"

# 변경사항 확인
if [[ -n $(git status -s) ]]; then
    log_error "커밋되지 않은 변경사항이 있습니다."
    git status -s
    exit 1
fi

# Git 태그 생성
TAG_NAME="v1.2.0-bom-phase2-$(date +%Y%m%d-%H%M%S)"
log_info "Git 태그 생성: $TAG_NAME"
git tag -a "$TAG_NAME" -m "BOM Phase 2 배포: 구성품 추가 기능"
git push origin "$TAG_NAME"
log_success "Git 태그 생성 완료"

# 서버 백업
log_info "서버 파일 백업 중..."
ssh "$SERVER" << EOFSSH
    BACKUP_DIR="/opt/erp-backup/\$(date +%Y%m%d-%H%M%S)"
    mkdir -p "\$BACKUP_DIR"
    
    # 백엔드 백업
    if [ -d "$REMOTE_BACKEND_DIR" ]; then
        cp -r "$REMOTE_BACKEND_DIR" "\$BACKUP_DIR/erp-backend"
        echo "✅ 백엔드 백업 완료: \$BACKUP_DIR/erp-backend"
    fi
    
    # 프론트엔드 백업
    if [ -d "$REMOTE_FRONTEND_DIR" ]; then
        cp -r "$REMOTE_FRONTEND_DIR" "\$BACKUP_DIR/erp-app"
        echo "✅ 프론트엔드 백업 완료: \$BACKUP_DIR/erp-app"
    fi
    
    echo "\$BACKUP_DIR" > /tmp/last_backup_dir.txt
EOFSSH
log_success "서버 백업 완료"

echo ""

# ==========================================
# Step 2: DB 마이그레이션
# ==========================================
log_info "Step 2: DB 마이그레이션 (제약 조건 추가)"

# 마이그레이션 파일 확인
MIGRATION_FILE="backend/supabase/migrations/003_bom_constraints.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    log_error "마이그레이션 파일을 찾을 수 없습니다: $MIGRATION_FILE"
    exit 1
fi

log_info "마이그레이션 파일 업로드 중..."
scp "$MIGRATION_FILE" "$SERVER:/tmp/"
log_success "마이그레이션 파일 업로드 완료"

log_warning "⚠️ DB 마이그레이션은 Supabase Dashboard에서 수동으로 실행해주세요."
log_info "   1. Supabase Dashboard → SQL Editor"
log_info "   2. /tmp/003_bom_constraints.sql 내용 복사"
log_info "   3. 실행 후 결과 확인"
log_info "   4. SELECT * FROM check_bom_constraints(); 로 검증"
echo ""

read -p "DB 마이그레이션을 완료하셨습니까? (y/N): " migration_confirm
if [[ ! $migration_confirm =~ ^[Yy]$ ]]; then
    log_error "DB 마이그레이션이 완료되지 않았습니다. 배포를 중단합니다."
    exit 1
fi

echo ""

# ==========================================
# Step 3: 프론트엔드 빌드 및 배포
# ==========================================
log_info "Step 3: 프론트엔드 빌드 및 배포"

# 빌드 ID 생성
BUILD_ID=$(date +%s)
log_info "빌드 ID: $BUILD_ID"

# 프론트엔드 빌드
log_info "프론트엔드 빌드 중..."
VITE_BUILD_ID="$BUILD_ID" npm run build
log_success "프론트엔드 빌드 완료"

# 빌드 결과 확인
if [ ! -d "dist" ]; then
    log_error "빌드 결과물을 찾을 수 없습니다: dist/"
    exit 1
fi

# 프론트엔드 배포
log_info "프론트엔드 배포 중..."
ssh "$SERVER" "mkdir -p $REMOTE_FRONTEND_DIR"
rsync -avz --delete dist/ "$SERVER:$REMOTE_FRONTEND_DIR/"
log_success "프론트엔드 배포 완료"

echo ""

# ==========================================
# Step 4: Nginx 캐시 정책 적용 (선택)
# ==========================================
log_info "Step 4: Nginx 캐시 정책 적용 (선택)"

read -p "Nginx 캐시 정책을 적용하시겠습니까? (y/N): " nginx_confirm
if [[ $nginx_confirm =~ ^[Yy]$ ]]; then
    log_info "Nginx 설정 업로드 중..."
    scp docs/operations/nginx-cache-optimization.conf "$SERVER:/tmp/erp-nginx.conf"
    
    ssh "$SERVER" << 'EOFSSH'
        # Nginx 설정 백업
        cp /etc/nginx/sites-enabled/erp /etc/nginx/sites-enabled/erp.backup
        
        # 새 설정 적용
        cp /tmp/erp-nginx.conf /etc/nginx/sites-enabled/erp
        
        # 설정 검증
        nginx -t
        if [ $? -eq 0 ]; then
            systemctl reload nginx
            echo "✅ Nginx 설정 적용 완료"
        else
            echo "❌ Nginx 설정 오류. 이전 설정으로 롤백합니다."
            cp /etc/nginx/sites-enabled/erp.backup /etc/nginx/sites-enabled/erp
            exit 1
        fi
EOFSSH
    log_success "Nginx 캐시 정책 적용 완료"
else
    log_warning "Nginx 캐시 정책 적용을 건너뜁니다."
fi

echo ""

# ==========================================
# Step 5: 백엔드 환경변수 설정
# ==========================================
log_info "Step 5: 백엔드 환경변수 설정"

ssh "$SERVER" << 'EOFSSH'
    cd /opt/erp-backend
    
    # .env 파일에 Feature Flag 추가
    if ! grep -q "BOM_STRICT_MODE" .env; then
        echo "" >> .env
        echo "# BOM Feature Flags" >> .env
        echo "BOM_STRICT_MODE=false" >> .env
        echo "BOM_MAX_DEPTH=10" >> .env
        echo "✅ Feature Flag 추가 완료"
    else
        echo "⚠️ Feature Flag 이미 존재"
    fi
EOFSSH

log_success "환경변수 설정 완료"

echo ""

# ==========================================
# Step 6: 스모크 테스트
# ==========================================
log_info "Step 6: 스모크 테스트"

log_info "서버 Health Check..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "http://139.59.110.55/api/v1/health" || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    log_success "Health Check 통과 (200)"
else
    log_warning "Health Check 실패 (HTTP $HEALTH_CHECK)"
fi

log_info "프론트엔드 접속 확인..."
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "http://139.59.110.55/" || echo "000")

if [ "$FRONTEND_CHECK" = "200" ]; then
    log_success "프론트엔드 접속 확인 (200)"
else
    log_warning "프론트엔드 접속 실패 (HTTP $FRONTEND_CHECK)"
fi

echo ""

# ==========================================
# Step 7: 배포 완료
# ==========================================
echo ""
echo "=========================================="
echo "  ✅ BOM Phase 2 배포 완료!"
echo "=========================================="
echo ""

log_success "Git 태그: $TAG_NAME"
log_success "빌드 ID: $BUILD_ID"
log_success "배포 시각: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

log_info "📋 다음 단계:"
log_info "   1. http://139.59.110.55 접속 (Hard Reload: Cmd+Shift+R)"
log_info "   2. 로그인 → 상품 상세 → BOM 구조 탭"
log_info "   3. '구성품 추가' 버튼 확인 및 테스트"
log_info "   4. Go/No-Go 체크리스트 실행: docs/operations/go-no-go-checklist.md"
echo ""

log_warning "⚠️ 모니터링:"
log_info "   - 로그 확인: ssh $SERVER 'journalctl -u erp-engine -f | grep BOM'"
log_info "   - 성능 지표: docs/operations/monitoring-dashboard.md 참조"
echo ""

# 백업 디렉토리 출력
BACKUP_DIR=$(ssh "$SERVER" "cat /tmp/last_backup_dir.txt")
log_info "🔄 롤백 시: ./scripts/rollback-phase2.sh $BACKUP_DIR"
echo ""
