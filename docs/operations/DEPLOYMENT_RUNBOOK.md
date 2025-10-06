# 🚀 Phase 2 배포 실행 가이드 (Runbook)

**배포 대상:** BOM 구성품 추가 기능  
**예상 시간:** 60-90분 (준비 30분 + 실행 20분 + 검증 30분)  
**배포일:** 2025-10-07 (월)

---

## ⏰ 타임라인

### 준비 단계 (30분)
- **09:00-09:15** - 사전 체크리스트 실행
- **09:15-09:30** - DB 마이그레이션 실행
- **09:30-10:00** - Go/No-Go 체크리스트 실행

### 실행 단계 (20분)
- **10:00-10:20** - 배포 스크립트 실행

### 검증 단계 (30분)
- **10:20-10:30** - 스모크 테스트
- **10:30-10:50** - E2E 시나리오 테스트
- **10:50-11:00** - 모니터링 활성화

---

## 📋 Step 1: 사전 체크리스트 (09:00-09:15)

### 1-1. 로컬 환경 확인
```bash
cd /Users/kjimi/Documents/GitHub/imac-erp-app

# Git 상태 확인
git status
# 예상: "nothing to commit, working tree clean"

# 최신 코드 확인
git log --oneline -5
# 예상: a02ad4b docs: README 최종 업데이트

# 로컬 빌드 테스트
npm run build
# 예상: ✓ built in XXXms
```

**체크:**
- [ ] Git working tree clean
- [ ] 최신 commit: a02ad4b
- [ ] 로컬 빌드 성공

---

### 1-2. 서버 상태 확인
```bash
# SSH 연결 테스트
ssh root@139.59.110.55 "echo 'SSH OK'"

# 디스크 공간 확인
ssh root@139.59.110.55 "df -h | grep '/'"

# 서비스 상태 확인
ssh root@139.59.110.55 "systemctl status erp-engine --no-pager | head -5"
ssh root@139.59.110.55 "systemctl status nginx --no-pager | head -5"
```

**체크:**
- [ ] SSH 연결 OK
- [ ] 디스크 사용률 < 80%
- [ ] erp-engine: active (running)
- [ ] nginx: active (running)

---

### 1-3. 백업 디렉토리 준비
```bash
# 백업 디렉토리 용량 확인
ssh root@139.59.110.55 "du -sh /opt/erp-backup/"

# 오래된 백업 확인 (30일 이상)
ssh root@139.59.110.55 "find /opt/erp-backup/ -mtime +30 -type d"
```

**체크:**
- [ ] 백업 디렉토리 사용 가능 공간 > 1GB
- [ ] 오래된 백업 목록 확인 (필요 시 삭제)

---

## 🗄️ Step 2: DB 마이그레이션 (09:15-09:30)

### 2-1. Supabase Dashboard 접속
```
1. 브라우저에서 https://supabase.com 접속
2. 로그인 (Google/GitHub 계정)
3. ERP 프로젝트 선택
4. 좌측 메뉴 → SQL Editor 클릭
```

---

### 2-2. 마이그레이션 파일 준비
```bash
# 로컬에서 파일 확인
cat backend/supabase/migrations/003_bom_constraints.sql

# 파일 내용 복사 (Cmd+A → Cmd+C)
```

---

### 2-3. SQL Editor에서 실행
```
1. SQL Editor → "New query" 버튼
2. 쿼리 이름: "003_bom_constraints"
3. 복사한 SQL 붙여넣기 (Cmd+V)
4. "Run" 버튼 클릭 (Cmd+Enter)
5. 실행 결과 확인
```

**예상 출력:**
```
✅ UNIQUE 제약 추가됨: unique_parent_component
✅ CHECK 제약 추가됨: no_self_reference
✅ CHECK 제약 추가됨: valid_quantity
✅ 인덱스 추가 완료
```

---

### 2-4. 마이그레이션 검증
```sql
-- 제약 확인
SELECT * FROM check_bom_constraints();

-- 인덱스 확인
SELECT * FROM check_bom_indexes();
```

**체크:**
- [ ] 제약 3개 모두 VALID
- [ ] 인덱스 4개 모두 생성

---

### 2-5. 제약 동작 테스트
```sql
-- 중복 방지 테스트
INSERT INTO bom_components (parent_item_id, component_item_id, quantity)
VALUES ('test-1', 'test-2', 1);

INSERT INTO bom_components (parent_item_id, component_item_id, quantity)
VALUES ('test-1', 'test-2', 1);
-- 예상: ERROR (duplicate key)

-- 자기 참조 방지 테스트
INSERT INTO bom_components (parent_item_id, component_item_id, quantity)
VALUES ('test-3', 'test-3', 1);
-- 예상: ERROR (check constraint)

-- 테스트 데이터 정리
DELETE FROM bom_components WHERE parent_item_id LIKE 'test-%';
```

**체크:**
- [ ] 중복 삽입 실패 (에러 발생)
- [ ] 자기 참조 실패 (에러 발생)
- [ ] 테스트 데이터 정리 완료

---

## ✅ Step 3: Go/No-Go 체크리스트 (09:30-10:00)

### 3-1. 블록 A: 기능/권한 (4개 항목)

#### A-1. 단일 버튼 컴포넌트
```
1. 브라우저에서 http://139.59.110.55 접속
2. Hard Reload (Cmd+Shift+R)
3. 로그인: admin / admin123
4. 상품 목록 → 첫 번째 상품 클릭
5. "BOM 구조" 탭 클릭
6. "구성품 추가" 버튼 표시 확인
```

**체크:**
- [ ] 빈 BOM 상태에서 버튼 표시
- [ ] 기존 BOM 상태에서 버튼 표시

#### A-2. RBAC 권한 체크
```
1. admin 계정 로그인
   → "구성품 추가" 버튼 활성화 확인
2. 로그아웃
3. readonly 계정 로그인 (있다면)
   → "구성품 추가" 버튼 비활성화 확인
```

**체크:**
- [ ] admin: 버튼 활성화
- [ ] readonly: 버튼 비활성화 (또는 미표시)

#### A-3. 네트워크 오류 처리
```
1. Chrome DevTools 열기 (F12)
2. Network 탭 → Offline 체크
3. "구성품 추가" 버튼 클릭
4. 에러 토스트 표시 확인
5. Offline 체크 해제
```

**체크:**
- [ ] 로딩 스피너 표시
- [ ] 로딩 중 버튼 비활성화
- [ ] 에러 토스트 표시

#### A-4. 중복 추가 시도
```
1. 구성품 1개 추가
2. 동일 구성품 재추가 시도
3. 에러 토스트 확인
```

**체크:**
- [ ] 중복 에러 메시지 표시
- [ ] 모달 열린 상태 유지

**블록 A 완료율:** ___/4

---

### 3-2. 블록 B: 데이터 무결성 (4개 항목)

#### B-1. 중복 구성품 방지 (DB 레벨)
- [ ] Step 2에서 확인 완료

#### B-2-1. 직접 순환 (A → A)
```sql
-- Supabase SQL Editor에서 실행
INSERT INTO bom_components (parent_item_id, component_item_id, quantity)
VALUES ('same-id', 'same-id', 1);
-- 예상: ERROR
```

**체크:**
- [ ] 백엔드에서 거부 (에러 발생)

#### B-2-2. 간접 순환 (A → B → C → A)
- [ ] Phase 2.1로 연기 (선택사항)

#### B-3. 수량 유효성
```
1. 구성품 추가 모달 열기
2. 수량 "-1" 입력 → 에러 확인
3. 수량 "10000" 입력 → 에러 확인
4. 수량 "1" 입력 → 정상 동작 확인
```

**체크:**
- [ ] 프론트엔드 검증: 0 < qty ≤ 9999
- [ ] 백엔드 검증: Pydantic 모델

**블록 B 완료율:** ___/4

---

### 3-3. 블록 C: 배포/캐시 (3개 항목)

#### C-1. VITE_BUILD_ID 확인
```javascript
// 브라우저 콘솔에서 실행
console.log(import.meta.env.VITE_BUILD_ID)
```

**체크:**
- [ ] 빌드ID 표시 (숫자)

#### C-2. HTML 캐시 정책
```bash
curl -I http://139.59.110.55/ | grep -i cache-control
```

**예상:**
```
Cache-Control: no-cache, must-revalidate
```

**체크:**
- [ ] HTML 캐시 정책 확인
- [ ] 에셋 캐시 정책 확인 (선택)

#### C-3. Nginx 배포 경로
```bash
ssh root@139.59.110.55 "ls -lh /var/www/erp-app/index.html"
```

**체크:**
- [ ] 파일 존재 확인

**블록 C 완료율:** ___/3

---

### 3-4. Go/No-Go 결정

#### GO 조건
- [ ] 블록 A: 4/4 (100%)
- [ ] 블록 B: 3/4 (75% 이상, B-2-2 제외)
- [ ] 블록 C: 3/3 (100%)

#### 결정
- [ ] **GO** → Step 4로 진행
- [ ] **CONDITIONAL GO** → 모니터링 강화 후 진행
- [ ] **NO-GO** → 이슈 해결 후 재검토

---

## 🚀 Step 4: 배포 실행 (10:00-10:20)

### 4-1. 배포 스크립트 실행
```bash
cd /Users/kjimi/Documents/GitHub/imac-erp-app

# 배포 스크립트 실행
./scripts/deploy-phase2.sh
```

---

### 4-2. 배포 단계별 확인

#### Step 1: Git 태그 생성
```
✅ Git 태그 생성 완료
태그명: v1.2.0-bom-phase2-20251007-100500
```

**체크:** [ ] Git 태그 생성 완료

---

#### Step 2: 서버 백업
```
✅ 백엔드 백업 완료: /opt/erp-backup/20251007-100500/erp-backend
✅ 프론트엔드 백업 완료: /opt/erp-backup/20251007-100500/erp-app
```

**체크:** [ ] 서버 백업 완료

---

#### Step 3: DB 마이그레이션 확인
```
DB 마이그레이션을 완료하셨습니까? (y/N): y
```

**입력:** `y` (Step 2에서 완료)

**체크:** [ ] DB 마이그레이션 확인 완료

---

#### Step 4: 프론트엔드 빌드
```
빌드 ID: 1728281700
✅ 프론트엔드 빌드 완료
```

**체크:** [ ] 프론트엔드 빌드 완료

---

#### Step 5: 프론트엔드 배포
```
sending incremental file list
index.html
assets/index-abc123.js
...
✅ 프론트엔드 배포 완료
```

**체크:** [ ] 프론트엔드 배포 완료

---

#### Step 6: Nginx 캐시 정책 (선택)
```
Nginx 캐시 정책을 적용하시겠습니까? (y/N): y
```

**입력:** `y` (권장)

**체크:** [ ] Nginx 설정 적용 완료

---

#### Step 7: 백엔드 환경변수
```
✅ Feature Flag 추가 완료
BOM_STRICT_MODE=false
BOM_MAX_DEPTH=10
```

**체크:** [ ] 환경변수 설정 완료

---

#### Step 8: 스모크 테스트
```
Health Check 통과 (200)
프론트엔드 접속 확인 (200)
```

**체크:**
- [ ] Health Check 통과
- [ ] 프론트엔드 접속 확인

---

### 4-3. 배포 완료 메시지
```
==========================================
  ✅ BOM Phase 2 배포 완료!
==========================================

Git 태그: v1.2.0-bom-phase2-20251007-100500
빌드 ID: 1728281700
배포 시각: 2025-10-07 10:20:15
```

**배포 소요시간 기록:** _____________

---

## ✅ Step 5: 배포 후 검증 (10:20-10:50)

### 5-1. 즉시 확인 (10:20-10:30)
```
1. 브라우저에서 http://139.59.110.55 접속
2. Hard Reload (Cmd+Shift+R)
3. 로그인: admin / admin123
4. 상품 목록 로딩 확인
5. 상품 상세 → BOM 구조 탭
6. "구성품 추가" 버튼 확인
```

**체크:**
- [ ] 페이지 로딩 정상
- [ ] 로그인 성공
- [ ] BOM 구조 탭 동작
- [ ] 구성품 추가 버튼 표시

---

### 5-2. E2E 시나리오 (10:30-10:40)

#### 시나리오 A: 정상 추가
```
1. "구성품 추가" 버튼 클릭
2. 검색: "LCD"
3. 첫 번째 항목 선택
4. 수량: 1
5. "추가" 버튼 클릭
6. 성공 토스트 확인
7. 트리에 반영 확인
```

**체크:** [ ] 시나리오 A 통과

#### 시나리오 B: 중복 추가
```
1. 방금 추가한 구성품 재추가 시도
2. 에러 토스트 확인
3. "이미 등록된 구성품입니다" 메시지 확인
```

**체크:** [ ] 시나리오 B 통과

#### 시나리오 C: 권한별 동작
```
1. admin 계정: 추가 성공 확인
2. 로그아웃
3. readonly 계정 로그인 (있다면)
4. 버튼 비활성화 확인
```

**체크:** [ ] 시나리오 C 통과

#### 시나리오 D: 네트워크 오류
```
1. Chrome DevTools → Network → Offline
2. 구성품 추가 시도
3. 에러 토스트 확인
4. Offline 해제 → 재시도 → 성공 확인
```

**체크:** [ ] 시나리오 D 통과

**E2E 완료율:** ___/4

---

### 5-3. 모니터링 활성화 (10:40-10:50)

#### 실시간 로그 모니터링
```bash
# 새 터미널 열기
ssh root@139.59.110.55 "journalctl -u erp-engine -f | grep BOM"
```

**체크:** [ ] 로그 모니터링 시작

#### 최근 에러 확인
```bash
ssh root@139.59.110.55 "journalctl -u erp-engine --since '10 minutes ago' | grep ERROR"
```

**예상:** 에러 없음

**체크:** [ ] 에러 로그 없음

#### Health Check
```bash
curl http://139.59.110.55/api/v1/health
```

**예상:**
```json
{"status": "ok"}
```

**체크:** [ ] Health Check 정상

---

## 📊 Step 6: 모니터링 대시보드 설정 (11:00~)

### 6-1. 일일 모니터링 설정
```bash
# 매일 오전 9시 실행할 스크립트
cat > /tmp/bom_daily_check.sh << 'EOF'
#!/bin/bash
echo "=== BOM 일일 체크 ($(date)) ==="
ssh root@139.59.110.55 "journalctl -u erp-engine --since '24 hours ago' | grep BOM_COMPONENT_ADDED | wc -l"
echo "성공 건수"
ssh root@139.59.110.55 "journalctl -u erp-engine --since '24 hours ago' | grep BOM_COMPONENT_ADD_ERROR | wc -l"
echo "실패 건수"
EOF

chmod +x /tmp/bom_daily_check.sh
```

**체크:** [ ] 일일 체크 스크립트 생성

---

### 6-2. 모니터링 대시보드 업데이트
```
파일: docs/operations/monitoring-dashboard.md

업데이트 항목:
- 날짜: 2025-10-07
- 총 시도: 0건 (시작)
- 성공: 0건
- 실패: 0건
- p50 응답: N/A
```

**체크:** [ ] 대시보드 초기화

---

## 🎯 배포 완료 체크리스트

### 사전 준비
- [ ] 로컬 환경 확인
- [ ] 서버 상태 확인
- [ ] 백업 디렉토리 준비

### DB 마이그레이션
- [ ] Supabase 접속
- [ ] SQL 실행
- [ ] 제약 검증
- [ ] 동작 테스트

### Go/No-Go
- [ ] 블록 A: ___/4
- [ ] 블록 B: ___/4
- [ ] 블록 C: ___/3
- [ ] GO 결정

### 배포 실행
- [ ] Git 태그 생성
- [ ] 서버 백업
- [ ] 프론트엔드 빌드
- [ ] 프론트엔드 배포
- [ ] Nginx 설정 (선택)
- [ ] 환경변수 설정
- [ ] 스모크 테스트

### 배포 후 검증
- [ ] 즉시 확인
- [ ] E2E 시나리오 ___/4
- [ ] 모니터링 활성화

### 모니터링
- [ ] 로그 모니터링 시작
- [ ] 일일 체크 스크립트
- [ ] 대시보드 초기화

---

## 🔄 롤백 절차 (긴급 시)

### 롤백 트리거
- [ ] 성공률 < 50% (30분 연속)
- [ ] Critical Error 발생
- [ ] 서비스 다운타임 > 5분

### 롤백 실행
```bash
# 백업 디렉토리 확인
ssh root@139.59.110.55 "cat /tmp/last_backup_dir.txt"
# 예시: /opt/erp-backup/20251007-100500

# 롤백 스크립트 실행
./scripts/rollback-phase2.sh /opt/erp-backup/20251007-100500

# 단계:
# 1. 프론트엔드 롤백
# 2. 백엔드 롤백
# 3. Nginx 캐시 퍼지
# 4. DB 제약 롤백 (선택)
# 5. 서비스 재시작
```

---

## 📝 배포 완료 보고

### 배포 정보
- **배포 일시:** _____________________
- **배포 소요시간:** _____________________
- **Git 태그:** _____________________
- **빌드 ID:** _____________________
- **백업 디렉토리:** _____________________

### 배포 결과
- [ ] ✅ 성공
- [ ] ⚠️ 부분 성공 (이슈: ___________________)
- [ ] ❌ 실패 (사유: ___________________)

### E2E 결과
- 시나리오 A: [ ] Pass / [ ] Fail
- 시나리오 B: [ ] Pass / [ ] Fail
- 시나리오 C: [ ] Pass / [ ] Fail
- 시나리오 D: [ ] Pass / [ ] Fail

### 이슈 및 대응
1. ___________________________________________________
2. ___________________________________________________

---

## 📞 긴급 연락처

- **Dev Lead:** _____________________
- **Backend Dev:** _____________________
- **QA Lead:** _____________________
- **PM:** _____________________

---

**작성일:** 2025-10-06  
**최종 수정:** 2025-10-06  
**담당자:** Operations Team

---

## 🔗 관련 문서

- [배포 전 체크리스트](./pre-deployment-checklist.md)
- [DB 마이그레이션 가이드](./db-migration-guide.md)
- [Go/No-Go 체크리스트](./go-no-go-checklist.md)
- [모니터링 대시보드](./monitoring-dashboard.md)
- [E2E 테스트 시나리오](./e2e-test-scenarios.md)
