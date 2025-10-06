# 다음 실행 액션 가이드

**작성일:** 2025-10-06  
**목적:** Phase 2 완료 → Phase 3 킥오프 전 실행할 구체적 액션

---

## ✅ **Phase 2: 완료된 작업**

### 📦 문서화 (100%)

- [x] Go/No-Go 체크리스트: `docs/operations/go-no-go-checklist.md`
- [x] 백엔드 개선안 v2: `docs/backend/bom-api-v2-feature-flag.md`
- [x] 모니터링 대시보드: `docs/operations/monitoring-dashboard.md`
- [x] E2E 테스트 시나리오: `docs/operations/e2e-test-scenarios.md`

### 🔧 구현 (85%)

- [x] 버튼 단일화 + RBAC: `src/features/items/components/BomTree.tsx`
- [x] 빌드ID 주입: `vite.config.ts`
- [ ] DB 제약 적용: `backend/supabase/migrations/003_bom_constraints.sql` (생성 완료, 적용 대기)
- [ ] 백엔드 API 개선: (Feature Flag 방식 설계 완료, 구현 대기)

### 🚀 배포 준비 (100%)

- [x] 배포 스크립트: `scripts/deploy-phase2.sh` ✅ 실행 가능
- [x] 롤백 스크립트: `scripts/rollback-phase2.sh` ✅ 실행 가능
- [x] DB 마이그레이션: `backend/supabase/migrations/003_bom_constraints.sql`

---

## 🎯 **오늘 할 일 (2025-10-06)**

### 1️⃣ Go/No-Go 체크리스트 실행 (30분)

#### A. 프론트엔드 확인

```bash
# 브라우저에서 확인
# 1. http://139.59.110.55 접속
# 2. Cmd+Shift+R (Hard Reload)
# 3. 로그인 → 상품 상세 → BOM 구조 탭
# 4. "구성품 추가" 버튼 확인

# 코드 확인
grep -n "AddComponentButton" src/features/items/components/BomTree.tsx
# 결과: 43행, 205행 (두 곳에서 동일 컴포넌트 사용)
```

**체크:**

- [ ] 빈 BOM 상태에서 버튼 표시
- [ ] 기존 BOM 상태에서 버튼 표시
- [ ] admin 계정: 버튼 활성화
- [ ] readonly 계정: 버튼 비활성화

---

#### B. 캐시 정책 확인

```bash
# HTML 캐시
curl -I http://139.59.110.55/ | grep -i cache-control
# 예상: Cache-Control: no-cache, must-revalidate

# 에셋 캐시
curl -I http://139.59.110.55/assets/index-*.js | grep -i cache-control
# 예상: Cache-Control: public, immutable, max-age=31536000
```

**체크:**

- [ ] HTML 캐시 정책 확인
- [ ] 에셋 캐시 정책 확인
- [ ] 빌드ID 브라우저 콘솔 확인: `console.log(import.meta.env.VITE_BUILD_ID)`

---

#### C. 결과 기록

`docs/operations/go-no-go-checklist.md` 파일을 열고:

- 각 항목 체크박스 ✅ 표시
- 완료율 계산
- GO/CONDITIONAL GO/NO-GO 결정
- 검토자 서명

---

### 2️⃣ DB 제약 적용 (15분)

#### Step 1: 마이그레이션 파일 확인

```bash
cat backend/supabase/migrations/003_bom_constraints.sql
```

#### Step 2: Supabase Dashboard에서 실행

1. https://supabase.com → 프로젝트 선택
2. SQL Editor 열기
3. `003_bom_constraints.sql` 내용 복사
4. 실행 (Run)

#### Step 3: 제약 확인

```sql
SELECT * FROM check_bom_constraints();
```

**예상 결과:**

```
constraint_name           | constraint_type | status
--------------------------|-----------------|----------
unique_parent_component   | UNIQUE          | VALID ✅
no_self_reference         | CHECK           | VALID ✅
valid_quantity            | CHECK           | VALID ✅
```

**체크:**

- [ ] 제약 3개 모두 VALID
- [ ] 인덱스 4개 생성 확인: `SELECT * FROM check_bom_indexes();`

---

### 3️⃣ Phase 3 PRD 검토 회의 예약 (5분)

#### 미팅 초대장 발송

- **제목:** Phase 3: BOM Excel Import 킥오프
- **일시:** 2025-10-07 (월) 14:00 - 15:30 (90분)
- **참석자:**
  - Product Manager (필수)
  - Dev Lead (필수)
  - Frontend Developer (필수)
  - QA Lead (필수)
  - UX Designer (선택)

#### 첨부 자료

1. `docs/features/phase3-excel-import-prd.md`
2. `docs/meetings/phase3-kickoff-agenda.md`
3. `templates/bom-import-guide.md`
4. `templates/bom-import-template.csv`

#### 사전 과제 (미팅 전 확인)

- [ ] PRD 문서 읽기 (15분)
- [ ] 미결정 사항 5개 검토
- [ ] 의견 정리 (찬성/반대/대안)

---

## 📅 **이번 주 할 일 (2025-10-07 ~ 10-11)**

### 월요일 (10/7)

- [ ] **오전:** Go/No-Go 체크리스트 최종 확인
- [ ] **오후:** Phase 3 킥오프 미팅 (14:00)
- [ ] **저녁:** 미결정 사항 5개 결정 완료

### 화요일 (10/8)

- [ ] DB 테이블 스키마 생성 (`bom_import_sessions`, `bom_import_logs`)
- [ ] UI 목업 초안 작성 (Figma)
- [ ] Sprint Backlog 생성

### 수요일 (10/9)

- [ ] Sprint 시작 (Day 1)
- [ ] 프론트엔드: 파일 업로드 UI 개발
- [ ] 백엔드: Excel 파싱 로직 개발

### 목요일 (10/10)

- [ ] 프론트엔드: Drag & Drop 기능 추가
- [ ] 백엔드: 형식 검증 로직 (Level 1)

### 금요일 (10/11)

- [ ] 통합 테스트 (파일 업로드 → 파싱 → 검증)
- [ ] Week 1 회고 및 Week 2 계획

---

## 🚀 **배포 시나리오 (Phase 2.1)**

### 시나리오 A: 전체 배포 (권장)

```bash
# 배포 실행
./scripts/deploy-phase2.sh

# 단계:
# 1. Git 태그 생성
# 2. 서버 백업
# 3. DB 마이그레이션 (수동 확인)
# 4. 프론트엔드 빌드 & 배포
# 5. Nginx 캐시 정책 적용
# 6. 백엔드 환경변수 설정
# 7. 스모크 테스트

# 예상 시간: 20분
```

---

### 시나리오 B: 단계별 배포 (안전)

#### Step 1: DB 제약만 먼저 적용

```bash
# Supabase Dashboard에서 003_bom_constraints.sql 실행
# 모니터링 1일 → 제약 위반 로그 확인
```

#### Step 2: 프론트엔드만 배포

```bash
VITE_BUILD_ID=$(date +%s) npm run build
scp -r dist/* root@139.59.110.55:/var/www/erp-app/
```

#### Step 3: 백엔드 환경변수 설정

```bash
ssh root@139.59.110.55
cd /opt/erp-backend
echo "BOM_STRICT_MODE=false" >> .env
systemctl restart erp-engine
```

#### Step 4: Feature Flag 활성화 (2일 후)

```bash
ssh root@139.59.110.55
cd /opt/erp-backend
sed -i 's/BOM_STRICT_MODE=false/BOM_STRICT_MODE=true/' .env
systemctl restart erp-engine
```

---

## 🔄 **롤백 시나리오**

### 문제 발생 시

```bash
# 백업 디렉토리 확인
ssh root@139.59.110.55 "ls -lh /opt/erp-backup/"

# 롤백 실행
./scripts/rollback-phase2.sh /opt/erp-backup/20251006-HHMMSS

# 단계:
# 1. 백업 디렉토리 확인
# 2. 프론트엔드 롤백
# 3. 백엔드 롤백
# 4. Nginx 캐시 퍼지
# 5. DB 제약 롤백 (선택)
# 6. 서비스 상태 확인

# 예상 시간: 10분
```

---

## 📊 **모니터링 체크 (배포 후 1주일)**

### 일일 점검 (매일 오전 9시)

```bash
# 로그 확인
ssh root@139.59.110.55 "journalctl -u erp-engine --since '24 hours ago' | grep BOM_COMPONENT"

# 통계 확인
ssh root@139.59.110.55 "journalctl -u erp-engine --since '24 hours ago' | grep BOM_COMPONENT_ADDED | wc -l"
# 성공 건수

ssh root@139.59.110.55 "journalctl -u erp-engine --since '24 hours ago' | grep BOM_COMPONENT_ADD_ERROR | wc -l"
# 실패 건수
```

### 모니터링 대시보드 업데이트

`docs/operations/monitoring-dashboard.md` 파일 갱신:

- 총 시도/성공/실패 건수
- p50/p95 응답시간
- Top 3 실패 원인
- 사용자 피드백

---

## 📝 **체크리스트 템플릿**

### 배포 전

- [ ] Go/No-Go 체크리스트 완료 (블록 A, B, C 모두 100%)
- [ ] Git 커밋 및 푸시 완료
- [ ] 팀원들에게 배포 공지
- [ ] 백업 스크립트 테스트

### 배포 중

- [ ] `./scripts/deploy-phase2.sh` 실행
- [ ] 각 단계 성공 확인
- [ ] 스모크 테스트 통과

### 배포 후

- [ ] 브라우저 Hard Reload 후 테스트
- [ ] E2E 시나리오 A~D 실행
- [ ] 모니터링 활성화
- [ ] 배포 완료 공지

---

## 🎯 **성공 기준**

### Phase 2 (BOM 구성품 추가)

- [x] 기능 구현 100%
- [ ] 배포 완료
- [ ] Go/No-Go 체크리스트 Pass
- [ ] 1주일 운영 안정화 (성공률 ≥ 95%)

### Phase 3 (Excel Import)

- [ ] PRD 승인 완료
- [ ] 미결정 사항 5개 결정
- [ ] Sprint 시작 (2주)
- [ ] MVP 배포 (Week 2 끝)

---

## 📞 **문의 및 지원**

### 긴급 문제 (Critical)

- **담당자:** Dev Lead
- **채널:** Slack #erp-critical
- **대응 시간:** 30분 이내

### 일반 문의

- **담당자:** Operations Team
- **채널:** Slack #erp-support
- **대응 시간:** 4시간 이내

### 문서 관련

- **담당자:** Product Manager
- **채널:** Slack #erp-docs
- **대응 시간:** 1일 이내

---

## 🔗 **빠른 링크**

### 문서

- [Go/No-Go 체크리스트](./operations/go-no-go-checklist.md)
- [백엔드 개선안 v2](./backend/bom-api-v2-feature-flag.md)
- [모니터링 대시보드](./operations/monitoring-dashboard.md)
- [Phase 3 PRD](./features/phase3-excel-import-prd.md)

### 스크립트

- [배포 스크립트](../scripts/deploy-phase2.sh)
- [롤백 스크립트](../scripts/rollback-phase2.sh)

### 템플릿

- [Excel Import 가이드](../templates/bom-import-guide.md)
- [Excel 템플릿 (CSV)](../templates/bom-import-template.csv)

---

**문서 버전:** v1.0  
**최종 수정:** 2025-10-06  
**담당자:** Project Team  
**다음 갱신:** 배포 완료 후
