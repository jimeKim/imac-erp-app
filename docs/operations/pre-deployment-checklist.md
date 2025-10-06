# 배포 전 최종 체크리스트

**배포일:** 2025-10-07 (월)  
**담당자:** Dev Team  
**Phase:** Phase 2 - BOM 구성품 추가

---

## ✅ 사전 준비 (Pre-deployment)

### 1. 로컬 환경 확인

- [ ] Git 작업 디렉토리 클린 상태 확인

  ```bash
  cd /Users/kjimi/Documents/GitHub/imac-erp-app
  git status
  # 결과: "nothing to commit, working tree clean"
  ```

- [ ] 최신 코드 pull 확인

  ```bash
  git pull origin main
  # 결과: "Already up to date."
  ```

- [ ] 로컬 빌드 테스트
  ```bash
  npm run build
  # 결과: ✓ built in XXXms
  ```

---

### 2. 서버 접속 확인

- [ ] SSH 연결 테스트

  ```bash
  ssh root@139.59.110.55 "echo 'SSH OK'"
  # 결과: SSH OK
  ```

- [ ] 서버 디스크 공간 확인

  ```bash
  ssh root@139.59.110.55 "df -h"
  # 결과: / 파티션 사용률 < 80%
  ```

- [ ] 서비스 상태 확인
  ```bash
  ssh root@139.59.110.55 "systemctl status erp-engine nginx"
  # 결과: active (running)
  ```

---

### 3. 백업 준비

- [ ] 백업 디렉토리 공간 확인

  ```bash
  ssh root@139.59.110.55 "du -sh /opt/erp-backup/"
  # 예상: < 5GB
  ```

- [ ] 이전 백업 정리 (30일 이상 된 것)
  ```bash
  ssh root@139.59.110.55 "find /opt/erp-backup/ -mtime +30 -type d"
  # 필요 시 삭제
  ```

---

## 🗄️ DB 마이그레이션 (Critical)

### 1. Supabase 프로젝트 확인

- [ ] Supabase Dashboard 로그인
  - URL: https://supabase.com
  - 프로젝트 선택 확인

- [ ] 현재 테이블 상태 확인
  ```sql
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name LIKE 'bom%';
  ```

  - 예상 결과: `bom_components` 테이블 존재

---

### 2. 마이그레이션 파일 검토

- [ ] 로컬에서 파일 확인

  ```bash
  cat backend/supabase/migrations/003_bom_constraints.sql
  ```

- [ ] SQL 문법 검증 (육안 확인)
  - [ ] `ALTER TABLE` 구문 확인
  - [ ] `CREATE INDEX` 구문 확인
  - [ ] `CREATE FUNCTION` 구문 확인

---

### 3. 마이그레이션 실행

- [ ] Supabase SQL Editor 열기
- [ ] `003_bom_constraints.sql` 내용 복사
- [ ] 실행 버튼 클릭 (Run)
- [ ] 실행 결과 확인
  ```
  ✅ UNIQUE 제약 추가됨: unique_parent_component
  ✅ CHECK 제약 추가됨: no_self_reference
  ✅ CHECK 제약 추가됨: valid_quantity
  ✅ 인덱스 추가 완료
  ```

---

### 4. 마이그레이션 검증

- [ ] 제약 조건 확인

  ```sql
  SELECT * FROM check_bom_constraints();
  ```

  - 예상 결과: 3개 제약 모두 VALID ✅

- [ ] 인덱스 확인

  ```sql
  SELECT * FROM check_bom_indexes();
  ```

  - 예상 결과: 4개 인덱스 생성 확인

- [ ] 제약 테스트 (중복 삽입 시도)
  ```sql
  -- 실패해야 정상 (중복 방지)
  INSERT INTO bom_components (parent_item_id, component_item_id, quantity)
  VALUES ('test-id', 'test-id', 1);
  -- 예상: ERROR: duplicate key value violates unique constraint
  ```

---

## 🔍 Go/No-Go 체크리스트 실행

### 블록 A: 기능/권한 (4개 항목)

#### A-1. 단일 버튼 컴포넌트

- [ ] 브라우저에서 http://139.59.110.55 접속
- [ ] Hard Reload (Cmd+Shift+R)
- [ ] 로그인: admin / admin123
- [ ] 상품 상세 페이지 이동
- [ ] BOM 구조 탭 클릭
- [ ] "구성품 추가" 버튼 표시 확인

#### A-2. RBAC 권한 체크

- [ ] admin 계정 → 버튼 활성화 확인
- [ ] 로그아웃 → readonly 계정 로그인
- [ ] 버튼 비활성화 (또는 미표시) 확인

#### A-3. 네트워크 오류 처리

- [ ] Chrome DevTools → Network → Offline
- [ ] "구성품 추가" 버튼 클릭
- [ ] 에러 토스트 표시 확인

#### A-4. 중복 추가 시도

- [ ] 동일 구성품 2번 추가 시도
- [ ] 에러 메시지 확인

**블록 A 완료율:** \_\_\_/4 (100% 필수)

---

### 블록 B: 데이터 무결성 (4개 항목)

#### B-1. 중복 구성품 방지

- [ ] DB 제약 확인 (위에서 완료)

#### B-2. 순환 참조 방지

- [ ] 직접 순환 (A → A) 테스트
- [ ] 백엔드 에러 확인

#### B-3. 수량 유효성

- [ ] 수량 0 입력 → 에러
- [ ] 수량 10000 입력 → 에러

#### B-4. 기타

- [ ] 정상 플로우 테스트

**블록 B 완료율:** \_\_\_/4 (100% 필수)

---

### 블록 C: 배포/캐시 (3개 항목)

#### C-1. VITE_BUILD_ID 확인

- [ ] 브라우저 콘솔에서 확인
  ```javascript
  console.log(import.meta.env.VITE_BUILD_ID)
  ```

#### C-2. HTML 캐시 정책

- [ ] 캐시 헤더 확인
  ```bash
  curl -I http://139.59.110.55/ | grep -i cache-control
  ```

#### C-3. Nginx 배포 경로

- [ ] 파일 존재 확인
  ```bash
  ssh root@139.59.110.55 "ls -lh /var/www/erp-app/index.html"
  ```

**블록 C 완료율:** \_\_\_/3 (100% 필수)

---

## 🚀 배포 실행

### 1. 배포 스크립트 실행

- [ ] 배포 명령 실행

  ```bash
  ./scripts/deploy-phase2.sh
  ```

- [ ] 각 단계 확인
  - [ ] Step 1: Git 태그 생성 완료
  - [ ] Step 2: 서버 백업 완료
  - [ ] Step 3: DB 마이그레이션 확인 완료
  - [ ] Step 4: 프론트엔드 빌드 완료
  - [ ] Step 5: 프론트엔드 배포 완료
  - [ ] Step 6: Nginx 캐시 정책 적용 (선택)
  - [ ] Step 7: 백엔드 환경변수 설정
  - [ ] Step 8: 스모크 테스트 통과

---

### 2. 배포 후 검증 (Post-deployment)

#### 즉시 확인 (배포 후 5분 이내)

- [ ] 브라우저에서 http://139.59.110.55 접속
- [ ] Hard Reload (Cmd+Shift+R)
- [ ] 로그인 성공
- [ ] 상품 목록 로딩 확인
- [ ] BOM 구조 탭 동작 확인
- [ ] "구성품 추가" 버튼 동작 확인

#### E2E 시나리오 A: 정상 추가

- [ ] 구성품 1개 추가
- [ ] 성공 토스트 확인
- [ ] 트리에 반영 확인

#### E2E 시나리오 B: 중복 추가

- [ ] 동일 구성품 추가 시도
- [ ] 에러 토스트 확인

#### E2E 시나리오 C: 권한별 동작

- [ ] admin 계정: 추가 성공
- [ ] readonly 계정: 버튼 비활성화

#### E2E 시나리오 D: 네트워크 오류

- [ ] Offline 모드에서 시도
- [ ] 재시도 UX 확인

---

### 3. 모니터링 활성화

#### 로그 확인 (실시간)

- [ ] 백엔드 로그 모니터링 시작
  ```bash
  ssh root@139.59.110.55 "journalctl -u erp-engine -f | grep BOM"
  ```

#### 에러 로그 확인

- [ ] 최근 10분 에러 확인
  ```bash
  ssh root@139.59.110.55 "journalctl -u erp-engine --since '10 minutes ago' | grep ERROR"
  ```

#### Health Check

- [ ] API Health 확인
  ```bash
  curl http://139.59.110.55/api/v1/health
  # 예상: {"status": "ok"}
  ```

---

## 📊 모니터링 대시보드 설정

### 1일차 (배포일)

- [ ] 시간당 성공/실패 건수 기록
- [ ] 이상 징후 모니터링
- [ ] 사용자 피드백 수집

### 3일차

- [ ] 누적 통계 확인
- [ ] 성공률 계산 (목표: ≥ 95%)
- [ ] p95 응답시간 측정 (목표: < 300ms)

### 7일차

- [ ] 주간 리포트 작성
- [ ] Top 3 실패 원인 분석
- [ ] Phase 3 킥오프 준비

---

## 🔄 롤백 준비

### 롤백 트리거 (즉시 롤백)

- [ ] 성공률 < 50% (30분 연속)
- [ ] Critical Error 발생
- [ ] 서비스 다운타임 > 5분

### 롤백 명령

```bash
# 백업 디렉토리 확인
ssh root@139.59.110.55 "cat /tmp/last_backup_dir.txt"

# 롤백 실행
./scripts/rollback-phase2.sh /opt/erp-backup/YYYYMMDD-HHMMSS
```

---

## ✅ 최종 승인

### Go/No-Go 결정

- **GO 조건:**
  - [ ] 블록 A: 4/4 (100%)
  - [ ] 블록 B: 4/4 (100%)
  - [ ] 블록 C: 3/3 (100%)
  - [ ] 블록 D: 2/3 (67% 이상)

- **NO-GO 조건:**
  - [ ] 블록 A, B, C 중 하나라도 < 100%
  - [ ] Critical 이슈 미해결

### 결정

- [ ] **GO** - 배포 진행
- [ ] **NO-GO** - 이슈 해결 후 재검토
- [ ] **CONDITIONAL GO** - 조건부 배포 (모니터링 강화)

### 승인자 서명

- **검토자:** ************\_************ (날짜: **\_\_\_**)
- **승인자:** ************\_************ (날짜: **\_\_\_**)

---

## 📝 배포 완료 보고

### 배포 정보

- **배포일시:** **********\_**********
- **배포 소요시간:** **********\_**********
- **Git 태그:** **********\_**********
- **백업 디렉토리:** **********\_**********

### 배포 결과

- [ ] 성공
- [ ] 부분 성공 (이슈: ********\_\_\_********)
- [ ] 실패 (사유: ********\_\_\_********)

### 이슈 및 대응

1. ***
2. ***

---

**작성일:** 2025-10-06  
**최종 수정:** 2025-10-06  
**담당자:** Dev Team
