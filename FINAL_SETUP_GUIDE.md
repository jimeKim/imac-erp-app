# 🎯 최종 설정 가이드

**작성일**: 2025-10-06  
**상태**: ✅ 기본 배포 완료, 추가 설정 진행  

---

## ✅ 완료된 작업

- [x] 엔진 식별 시스템 구현
- [x] Outbounds API 완전 구현
- [x] 프론트엔드/백엔드 배포
- [x] 헬스체크 개선
- [x] 보안 점검 (Critical 항목)

---

## 📋 다음 단계 (선택)

### 1️⃣ Supabase 마이그레이션 (필수, 5분)

#### 방법 1: Supabase Dashboard (권장)

1. **접속**: https://supabase.com/dashboard/project/qijwwiijpkqzmlamdtmd/sql
2. **SQL 복사**: `backend/supabase/migrations/003_outbounds_tables.sql` 전체 복사
3. **실행**: RUN 버튼 클릭
4. **검증**:
   ```sql
   SELECT * FROM outbounds;
   -- 샘플 데이터 3개 확인
   ```

#### 방법 2: 로컬 파일 복사

```bash
# SQL 파일 확인
cat backend/supabase/migrations/003_outbounds_tables.sql

# 또는
cat /tmp/supabase_migration.sql
```

**가이드 문서**: `SUPABASE_MIGRATION_GUIDE.md`

---

### 2️⃣ Blue-Green 배포 환경 구축 (Optional, 30분)

Zero-downtime 배포를 위한 Blue-Green 환경 구축

#### 자동 설정 (권장)

```bash
# 한 번에 모든 설정 자동 실행
./scripts/setup-blue-green.sh
```

**실행 내용**:
- Green 디렉토리 생성 (`/opt/erp-backend-green`)
- Green 서비스 등록 (`erp-engine-green.service`)
- Nginx Blue-Green 설정 적용
- 스위치 스크립트 설치 (`/usr/local/bin/switch-api-slot.sh`)
- Green 서비스 시작 및 검증

#### 수동 설정

**가이드 문서**: `docs/operations/blue-green-deployment.md`

#### 사용법 (설정 완료 후)

```bash
# Green으로 스위치 (새 버전 배포)
ssh root@139.59.110.55 'switch-api-slot.sh green'

# Blue로 롤백 (5초 이내)
ssh root@139.59.110.55 'switch-api-slot.sh blue'

# 직접 헬스체크
curl http://139.59.110.55/healthz/blue | jq .
curl http://139.59.110.55/healthz/green | jq .
```

---

### 3️⃣ 정기 모니터링 설정 (Optional, 10분)

#### A. 헬스 모니터 설치

```bash
# 1. 스크립트를 서버로 복사
scp scripts/health-monitor.sh root@139.59.110.55:/usr/local/bin/

# 2. 권한 부여
ssh root@139.59.110.55 'chmod +x /usr/local/bin/health-monitor.sh'

# 3. 테스트 실행
ssh root@139.59.110.55 '/usr/local/bin/health-monitor.sh'
```

#### B. Cron Job 설정

```bash
# 서버에서 실행
ssh root@139.59.110.55

# crontab 편집
crontab -e

# 추가 (5분마다 헬스체크)
*/5 * * * * /usr/local/bin/health-monitor.sh >> /var/log/erp-health-monitor.log 2>&1

# 저장 후 확인
crontab -l
```

#### C. 로그 확인

```bash
# 헬스 모니터 로그
ssh root@139.59.110.55 'tail -f /var/log/erp-health-monitor.log'

# 서비스 로그
ssh root@139.59.110.55 'journalctl -u erp-engine.service -f'
```

---

### 4️⃣ 보안 강화 (Optional, 1주일)

#### SSH 키 기반 인증

```bash
# 1. 로컬에서 SSH 키 생성
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. 서버에 공개키 등록
ssh-copy-id root@139.59.110.55

# 3. 비밀번호 인증 비활성화
ssh root@139.59.110.55 "sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config"
ssh root@139.59.110.55 "sudo systemctl restart sshd"
```

#### Nginx 보안 헤더 추가

Blue-Green 설정을 적용하면 자동으로 포함됩니다.

**가이드 문서**: `docs/operations/security-checklist.md`

---

## 🔍 최종 검증

### 시스템 상태 확인

```bash
# 1. 서비스 상태
ssh root@139.59.110.55 'systemctl is-active erp-engine nginx'

# 2. 헬스체크
curl http://139.59.110.55/healthz | jq .

# 3. Outbounds API
curl http://139.59.110.55/api/v1/outbounds/ | jq '.data | length'

# 4. 응답 헤더
curl -s -D - http://139.59.110.55/healthz -o /dev/null | grep -i x-
```

### 브라우저 확인

- 🌐 **프론트엔드**: http://139.59.110.55
- 📖 **API 문서**: http://139.59.110.55/docs
- 🏥 **헬스체크**: http://139.59.110.55/healthz

---

## 📊 현재 시스템 현황

### 배포 정보
```
Commit:       e4b884e
Engine:       erp-backend@opt
Schema:       v1
Environment:  production
```

### 서비스 상태
```
erp-engine:   ✅ active (5 workers)
nginx:        ✅ active
Supabase:     ✅ connected
```

### API 엔드포인트
```
Items:        ✅ /api/v1/items/
Stocks:       ✅ /api/v1/stocks/
Inbounds:     ✅ /api/v1/inbounds/
Outbounds:    ✅ /api/v1/outbounds/ (15개 엔드포인트)
```

---

## 🗂️ 생성된 문서 목록

### 핵심 가이드
1. **`SUPABASE_MIGRATION_GUIDE.md`** - Supabase 마이그레이션 가이드
2. **`SYSTEM_VERIFICATION_REPORT.md`** - 전체 검증 보고서
3. **`QUICKSTART_DEPLOY.md`** - 10분 즉시 배포 가이드
4. **`FINAL_SETUP_GUIDE.md`** - 본 문서 (최종 설정)

### 운영 가이드
5. **`docs/operations/blue-green-deployment.md`** - Blue-Green 배포
6. **`docs/operations/security-checklist.md`** - 4단계 보안 체크리스트
7. **`docs/operations/nginx-blue-green.conf`** - Nginx 설정 템플릿

### 스크립트
8. **`scripts/switch-api-slot.sh`** - Blue-Green 스위치
9. **`scripts/setup-blue-green.sh`** - Blue-Green 자동 설정
10. **`scripts/health-monitor.sh`** - 헬스 모니터링

### 코드
11. **`backend/app/api/outbounds.py`** - Outbounds API (15개 엔드포인트)
12. **`backend/supabase/migrations/003_outbounds_tables.sql`** - DB 마이그레이션

---

## ⏭️ 권장 실행 순서

### 즉시 실행 (5분)
```bash
# 1. Supabase 마이그레이션
# → Supabase Dashboard에서 003_outbounds_tables.sql 실행

# 2. 검증
curl http://139.59.110.55/api/v1/outbounds/ | jq .
```

### 여유 있을 때 (30분)
```bash
# 1. Blue-Green 배포 환경 구축
./scripts/setup-blue-green.sh

# 2. 모니터링 설정
scp scripts/health-monitor.sh root@139.59.110.55:/usr/local/bin/
ssh root@139.59.110.55 'chmod +x /usr/local/bin/health-monitor.sh'
# cron job 설정 (5분마다)
```

### 정기 점검 (주간)
```bash
# 1. 보안 체크리스트 실행
# → docs/operations/security-checklist.md 참조

# 2. 로그 확인
ssh root@139.59.110.55 'journalctl -u erp-engine.service --since today | grep -i error'

# 3. 시스템 업데이트
ssh root@139.59.110.55 'sudo apt-get update && sudo apt-get upgrade -y'
```

---

## 🆘 문제 발생 시

### 서비스가 시작되지 않음
```bash
# 로그 확인
ssh root@139.59.110.55 'journalctl -u erp-engine.service -n 50'

# 수동 실행
ssh root@139.59.110.55 'cd /opt/erp-backend && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000'
```

### API가 응답하지 않음
```bash
# 서비스 재시작
ssh root@139.59.110.55 'sudo systemctl restart erp-engine.service'

# Nginx 재시작
ssh root@139.59.110.55 'sudo systemctl restart nginx'
```

### Outbounds API 404 에러
```bash
# Supabase 마이그레이션 실행 확인
# → SUPABASE_MIGRATION_GUIDE.md 참조
```

---

## 📞 지원

**문서 위치**: `/Users/kjimi/Documents/GitHub/imac-erp-app/`

**주요 명령어**:
```bash
# 전체 상태 확인
./scripts/health-monitor.sh

# Blue-Green 스위치
ssh root@139.59.110.55 'switch-api-slot.sh green'

# 배포
./deploy.sh
```

---

**작성**: 2025-10-06  
**Status**: 🟢 Production Ready  
**Next**: Supabase 마이그레이션 → Blue-Green 배포
