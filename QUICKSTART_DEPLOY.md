# 🚀 즉시 배포 가이드 (복붙 실행)

**작성일**: 2025-10-06  
**소요 시간**: 10분  
**목표**: 개선사항 즉시 배포 + 검증

---

## 📋 사전 준비 (1회만)

### 1. 환경변수 설정 (서버)

```bash
# 서버 접속
ssh root@139.59.110.55

# .env 파일 생성/업데이트
cat > /opt/erp-backend/.env <<'EOF'
# 엔진 식별
ENGINE_NAME=erp-backend@opt
ENGINE_COMMIT_SHA=unknown
ENGINE_SCHEMA_VERSION=v1
ENGINE_ENV=production

# Supabase (실제 값으로 변경)
SUPABASE_URL=https://qijwwiijpkqzmlamdtmd.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF

# 권한 설정 (중요!)
chmod 600 /opt/erp-backend/.env

# systemd에 환경파일 연결 확인
grep EnvironmentFile /etc/systemd/system/erp-engine.service || \
  echo "⚠️  EnvironmentFile 설정 필요 (SYSTEM_VERIFICATION_REPORT.md 참조)"
```

### 2. Supabase 마이그레이션 (Outbounds 테이블)

```bash
# Supabase Dashboard → SQL Editor에서 실행
# 파일: backend/supabase/migrations/003_outbounds_tables.sql 복사 붙여넣기
```

또는 로컬에서 파일 내용 확인:

```bash
cat backend/supabase/migrations/003_outbounds_tables.sql
```

---

## 🚀 즉시 배포 (10분)

### Step 1: 로컬 커밋 (1분)

```bash
cd /Users/kjimi/Documents/GitHub/imac-erp-app

# 변경사항 확인
git status

# 핵심 파일만 커밋
git add backend/app/main.py
git add backend/app/api/outbounds.py
git add backend/supabase/migrations/003_outbounds_tables.sql
git add backend/env.template
git add deploy.sh
git add docs/operations/
git add scripts/switch-api-slot.sh
git add SYSTEM_VERIFICATION_REPORT.md
git add QUICKSTART_DEPLOY.md

git commit -m "feat: 엔진 식별 + Outbounds API + Blue-Green 배포

- 엔진 식별: os.getenv로 환경변수 직접 로드
- /healthz 개선: name, commit, schema, env, supabase 노출
- 전역 헤더: X-Engine-*, X-Commit-SHA, X-Schema-Version, X-Env
- Outbounds API 완전 구현 (DRAFT→CONFIRMED→POSTED 워크플로우)
- 재고 차감 로직 (post 시 stocks 업데이트)
- flows 테이블 이벤트 기록
- Nginx Blue-Green 설정 (파일 기반 스위칭)
- Blue-Green 스위치 스크립트
- Supabase 마이그레이션 (outbounds, outbound_items, flows)

관련: #1 운영 백엔드 확정, #2 Outbounds Gap 보완"
```

### Step 2: 서버 배포 (3분)

```bash
# 배포 실행 (commit SHA 자동 주입됨)
./deploy.sh

# 출력 확인:
# "📌 Injecting commit SHA: abc123f"
```

### Step 3: 서비스 재시작 (1분)

```bash
# 서버에서 실행
ssh root@139.59.110.55 <<'EOF'
# daemon 리로드
sudo systemctl daemon-reload

# 서비스 재시작
sudo systemctl restart erp-engine.service

# 상태 확인
sudo systemctl status erp-engine.service --no-pager | head -20
EOF
```

### Step 4: 검증 (5분)

#### A. 헬스체크 (engine 정보 노출 확인)

```bash
# 외부 접근
curl http://139.59.110.55/healthz | jq .

# 기대 결과:
# {
#   "status": "ok",
#   "name": "erp-backend@opt",
#   "commit": "abc123f",  ← 실제 commit SHA
#   "schema": "v1",
#   "env": "production",
#   "supabase": "ok",
#   "app": "ERP App API",
#   "version": "1.0.0"
# }
```

#### B. 응답 헤더 확인

```bash
curl -I http://139.59.110.55/healthz | grep X-

# 기대 결과:
# X-Engine-Name: erp-backend@opt
# X-Commit-SHA: abc123f
# X-Schema-Version: v1
# X-Env: production
```

#### C. Outbounds API 테스트

```bash
# 1. 목록 조회
curl http://139.59.110.55/api/v1/outbounds/ | jq .

# 2. 문서 생성
curl -X POST http://139.59.110.55/api/v1/outbounds/ \
  -H "Content-Type: application/json" \
  -d '{
    "memo": "테스트 출고",
    "items": [
      {"item_id": "test-item-uuid", "qty": 5, "unit_price": 10000}
    ]
  }' | jq .

# 3. API 문서 확인
open http://139.59.110.55/docs
```

---

## 🔒 보안 점검 (5분)

### Critical 항목 체크

```bash
# 1. .env 파일 권한 확인
ssh root@139.59.110.55 "ls -la /opt/erp-backend/.env"
# 출력: -rw------- 1 root root ... .env  ← 600이어야 함

# 2. 권한 수정 (필요시)
ssh root@139.59.110.55 "chmod 600 /opt/erp-backend/.env"

# 3. Service Role Key 노출 여부 (로컬)
grep -r "SUPABASE_SERVICE_ROLE_KEY" dist/ 2>/dev/null && \
  echo "❌ EXPOSED" || echo "✅ Safe"

# 4. Git 추적 여부
git ls-files | grep "\.env$" && \
  echo "❌ TRACKED" || echo "✅ Safe"
```

---

## 🔵🟢 Blue-Green 배포 준비 (Optional, 30분)

### 1. Green 슬롯 준비

```bash
ssh root@139.59.110.55 <<'EOF'
# Green 디렉토리 복제
sudo mkdir -p /opt/erp-backend-green
sudo rsync -a /opt/erp-backend/ /opt/erp-backend-green/

# Green 서비스 파일 생성
sudo nano /etc/systemd/system/erp-engine-green.service
EOF
```

Green 서비스 내용:

```ini
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
```

### 2. Nginx Blue-Green 설정

```bash
# 서버에서 실행
ssh root@139.59.110.55

# Nginx 설정 적용
sudo nano /etc/nginx/sites-available/erp-app
# docs/operations/nginx-blue-green.conf 내용 복사 붙여넣기

# 테스트
sudo nginx -t

# 적용
sudo systemctl reload nginx
```

### 3. 스위치 스크립트 설치

```bash
# 로컬에서 서버로 업로드
scp scripts/switch-api-slot.sh root@139.59.110.55:/usr/local/bin/

# 서버에서 권한 부여
ssh root@139.59.110.55 "chmod +x /usr/local/bin/switch-api-slot.sh"
```

### 4. 사용법

```bash
# Green으로 스위치 (새 버전 배포)
ssh root@139.59.110.55 "/usr/local/bin/switch-api-slot.sh green"

# Blue로 롤백 (5초 이내)
ssh root@139.59.110.55 "/usr/local/bin/switch-api-slot.sh blue"

# 직접 헬스체크
curl http://139.59.110.55/healthz/blue | jq .name
curl http://139.59.110.55/healthz/green | jq .name
```

---

## 📊 모니터링

### 로그 확인

```bash
# 실시간 로그
ssh root@139.59.110.55 "journalctl -u erp-engine.service -f"

# 최근 에러
ssh root@139.59.110.55 "journalctl -u erp-engine.service --since today | grep -i error"

# Nginx 에러
ssh root@139.59.110.55 "tail -50 /var/log/nginx/error.log"
```

### 헬스체크 자동화

```bash
# 5분마다 헬스체크 (서버에서)
ssh root@139.59.110.55
crontab -e

# 추가:
*/5 * * * * curl -f http://127.0.0.1:8000/healthz || echo "❌ ERP Engine Down!" | mail -s "Alert" admin@example.com
```

---

## 🐛 트러블슈팅

### 서비스가 시작되지 않음

```bash
# 로그 확인
ssh root@139.59.110.55 "journalctl -u erp-engine.service -n 50"

# 수동 실행으로 에러 확인
ssh root@139.59.110.55 <<'EOF'
cd /opt/erp-backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
EOF
```

### Outbounds API가 없음

```bash
# 로그에서 확인
ssh root@139.59.110.55 "journalctl -u erp-engine.service | grep -i outbound"

# 출력:
# [INFO] Outbounds API registered  ← 정상
# [WARN] Outbounds API not available  ← app/api/outbounds.py 파일 누락
```

### 환경변수가 로드되지 않음

```bash
# systemd 서비스 확인
ssh root@139.59.110.55 "systemctl cat erp-engine.service | grep EnvironmentFile"

# 출력: EnvironmentFile=/opt/erp-backend/.env  ← 있어야 함

# 없다면 추가:
ssh root@139.59.110.55 <<'EOF'
sudo sed -i '/\[Service\]/a EnvironmentFile=/opt/erp-backend/.env' /etc/systemd/system/erp-engine.service
sudo systemctl daemon-reload
sudo systemctl restart erp-engine.service
EOF
```

---

## ✅ 완료 체크리스트

### 즉시 실행 (오늘)

- [ ] 로컬 커밋
- [ ] 서버 배포 (./deploy.sh)
- [ ] 서비스 재시작
- [ ] 헬스체크 확인 (engine 정보 노출)
- [ ] 응답 헤더 확인
- [ ] Outbounds API 테스트
- [ ] .env 권한 600 확인
- [ ] Service Role Key 노출 점검

### 1주일 이내

- [ ] Blue-Green 배포 준비
- [ ] SSH 키 기반 인증
- [ ] Nginx 보안 헤더
- [ ] UFW 방화벽 활성화

### 1개월 이내

- [ ] SSL/TLS 인증서 (도메인 준비 후)
- [ ] 백업 자동화
- [ ] 로그 모니터링
- [ ] 정기 보안 점검

---

## 🎉 완료!

배포가 성공적으로 완료되었습니다.

**다음 확인 명령어**:

```bash
# 엔진 정보 확인
curl http://139.59.110.55/healthz | jq '{name, commit, schema, env}'

# Outbounds API 확인
curl http://139.59.110.55/api/v1/outbounds/ | jq '.data | length'

# 서비스 상태
ssh root@139.59.110.55 "systemctl is-active erp-engine nginx"
```

**관련 문서**:

- `SYSTEM_VERIFICATION_REPORT.md` - 전체 검증 보고서
- `docs/operations/blue-green-deployment.md` - Blue-Green 배포 가이드
- `docs/operations/security-checklist.md` - 보안 체크리스트

---

**작성**: 2025-10-06  
**Status**: 🟢 Production Ready
