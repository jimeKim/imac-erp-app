# BOM 구성품 추가 기능 Go/No-Go 게이트 체크리스트

**배포 대상:** Phase 2 - BOM 구성품 추가  
**배포 환경:** Production (139.59.110.55)  
**체크 일시:** 2025-10-06  
**담당자:** [이름]  
**최종 승인자:** [이름]

---

## 🚦 Go/No-Go 결정 기준

- **✅ GO:** 4개 블록 모두 100% 체크
- **⚠️ CONDITIONAL GO:** 1개 블록 80% 이상, 나머지 100%
- **❌ NO-GO:** 2개 이상 블록 80% 미만

---

## 📦 블록 A: 기능 / 권한 (필수)

### A-1. 단일 버튼 컴포넌트

- [ ] 빈 BOM 상태에서 "구성품 추가" 버튼 표시
- [ ] 기존 BOM 상태에서 "구성품 추가" 버튼 표시
- [ ] 두 버튼이 **동일한 컴포넌트**로 렌더링됨 (코드 확인)
- [ ] 버튼 상태가 **단일 로직**으로 제어됨

**검증 방법:**

```bash
# 코드 확인
grep -n "AddComponentButton" src/features/items/components/BomTree.tsx
# 결과: 두 곳에서 동일 컴포넌트 호출 확인
```

**결과:** [ ] ✅ Pass / [ ] ❌ Fail

---

### A-2. RBAC 권한 체크

- [ ] **admin** 계정: 버튼 활성화 확인
- [ ] **manager** 계정: 버튼 활성화 확인
- [ ] **staff** 계정: 버튼 활성화 확인
- [ ] **readonly** 계정: 버튼 **비활성화** 확인
- [ ] readonly 계정에서 마우스 호버 시 툴팁 표시: "구성품 추가 권한이 없습니다"

**검증 방법:**

1. http://139.59.110.55 접속
2. 각 계정으로 순차 로그인
3. 상품 상세 → BOM 구조 탭 진입
4. "구성품 추가" 버튼 상태 확인

**결과:** [ ] ✅ Pass / [ ] ❌ Fail

---

### A-3. 네트워크 오류 처리

- [ ] "추가" 버튼 클릭 시 **로딩 스피너** 표시
- [ ] 로딩 중 버튼 **비활성화** (중복 클릭 방지)
- [ ] 네트워크 오류 시 **에러 토스트** 표시
- [ ] 오류 후 버튼 **재활성화** (재시도 가능)
- [ ] 재시도 시 정상 동작

**검증 방법:**

1. Chrome DevTools → Network → Offline
2. "구성품 추가" → 항목 선택 → "추가" 클릭
3. 에러 확인 후 → Network → No throttling
4. "추가" 버튼 다시 클릭 → 정상 추가 확인

**결과:** [ ] ✅ Pass / [ ] ❌ Fail

---

### A-4. 중복 추가 시도

- [ ] 동일 구성품 재추가 시 **에러 토스트** 표시
- [ ] 모달 **열린 상태 유지** (닫히지 않음)
- [ ] 다른 구성품 선택 후 **정상 추가 가능**

**검증 방법:**

1. LCD 모듈 추가
2. LCD 모듈 다시 추가 시도
3. 에러 메시지 확인
4. 전원 모듈 추가 → 정상 작동 확인

**결과:** [ ] ✅ Pass / [ ] ❌ Fail

---

**블록 A 완료율:** \_\_\_/4 (100% 필수)

---

## 🔒 블록 B: 데이터 무결성 (필수)

### B-1. 중복 구성품 방지 (DB 레벨)

- [ ] Supabase `bom_components` 테이블에 `UNIQUE(parent_item_id, component_item_id)` 제약 존재
- [ ] 백엔드 API에서 중복 체크 로직 구현
- [ ] HTTP 409 Conflict 반환 (또는 명확한 에러 메시지)

**검증 방법:**

```bash
# DB 제약 확인 (Supabase Dashboard 또는 SQL)
ssh root@139.59.110.55
# Supabase 접속 후 실행
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'bom_components' AND constraint_type = 'UNIQUE';
```

**결과:** [ ] ✅ Pass / [ ] ❌ Fail

---

### B-2. 순환 참조 방지

#### B-2-1. 직접 순환 (A → A)

- [ ] 상품 A에 자기 자신(A)을 구성품으로 추가 시도
- [ ] 백엔드에서 거부 (HTTP 409)
- [ ] 에러 메시지: "상품을 자기 자신의 구성품으로 추가할 수 없습니다"

**결과:** [ ] ✅ Pass / [ ] ❌ Fail

#### B-2-2. 간접 순환 (A → B → C → A)

- [ ] 백엔드에 재귀 순환 참조 체크 로직 구현 확인
- [ ] 테스트 데이터: A → B → C (정상)
- [ ] C에 A 추가 시도 → 거부 (HTTP 409)
- [ ] 에러 메시지: "순환 참조가 발생합니다"

**검증 방법:**

```bash
# 백엔드 코드 확인
ssh root@139.59.110.55
grep -A 20 "check_circular_reference" /opt/erp-backend/app/main.py
# 함수 존재 여부 확인
```

**결과:** [ ] ✅ Pass / [ ] ⚠️ Partial (직접 순환만) / [ ] ❌ Fail

---

### B-3. 수량 유효성 규칙 일치

**프론트엔드 규칙:**

- [ ] 최소값: 0.01 (또는 0보다 큰 값)
- [ ] 최대값: 9999
- [ ] 소수점 자리: 최대 2자리 (또는 4자리)

**백엔드 규칙:**

- [ ] Pydantic 모델로 수량 검증 (`quantity: float = Field(gt=0, le=9999)`)
- [ ] DB 제약: `CHECK(quantity > 0 AND quantity <= 9999)`
- [ ] HTTP 422 Unprocessable Entity 반환

**검증 방법:**

1. 프론트엔드에서 수량 `-1` 입력 시도 → 거부 확인
2. 수량 `10000` 입력 시도 → 거부 확인
3. 백엔드 코드 확인:

```bash
ssh root@139.59.110.55
grep -A 5 "class BomComponentCreate" /opt/erp-backend/app/main.py
```

**결과:** [ ] ✅ Pass / [ ] ⚠️ Partial (프론트만) / [ ] ❌ Fail

---

**블록 B 완료율:** \_\_\_/4 (100% 필수, B-2-2는 Phase 2.1 허용)

---

## 🚀 블록 C: 배포 / 캐시 (필수)

### C-1. VITE_BUILD_ID 주입

- [ ] `vite.config.ts`에 빌드ID 주입 로직 존재
- [ ] 빌드 시 환경변수 `VITE_BUILD_ID` 설정
- [ ] 브라우저 콘솔에서 빌드ID 확인 가능

**검증 방법:**

```bash
# vite.config.ts 확인
grep "VITE_BUILD_ID" vite.config.ts

# 빌드 후 확인
VITE_BUILD_ID=$(date +%s) npm run build
# 브라우저 콘솔에서 실행
console.log(import.meta.env.VITE_BUILD_ID)
```

**결과:** [ ] ✅ Pass / [ ] ❌ Fail

---

### C-2. Nginx 캐시 정책

#### C-2-1. HTML 캐시 (항상 최신 확인)

- [ ] `index.html`에 `Cache-Control: no-cache, must-revalidate` 헤더 설정
- [ ] 브라우저에서 확인 (DevTools → Network → index.html → Headers)

**검증 방법:**

```bash
curl -I http://139.59.110.55/ | grep -i cache-control
# 출력: Cache-Control: no-cache, must-revalidate
```

**결과:** [ ] ✅ Pass / [ ] ❌ Fail

#### C-2-2. 에셋 캐시 (장기 캐시)

- [ ] `.js`, `.css` 파일에 `Cache-Control: public, immutable, max-age=31536000` 헤더
- [ ] 파일명에 해시 포함 확인 (예: `index-abc123.js`)

**검증 방법:**

```bash
curl -I http://139.59.110.55/assets/index-*.js | grep -i cache-control
# 출력: Cache-Control: public, immutable, max-age=31536000
```

**결과:** [ ] ✅ Pass / [ ] ❌ Fail

---

### C-3. Nginx 배포 경로 일치

- [ ] Nginx `root` 경로: `/var/www/erp-app`
- [ ] 실제 배포 파일 존재 확인
- [ ] `index.html` 접근 가능 확인

**검증 방법:**

```bash
ssh root@139.59.110.55
ls -lh /var/www/erp-app/index.html
# 파일 크기 및 수정 시각 확인

# Nginx 설정 확인
grep "root" /etc/nginx/sites-enabled/erp
```

**결과:** [ ] ✅ Pass / [ ] ❌ Fail

---

**블록 C 완료율:** \_\_\_/3 (100% 필수)

---

## 📊 블록 D: 관측 / 로그 (권장)

### D-1. 백엔드 로깅 (구조화된 로그)

- [ ] BOM 구성품 추가 성공 시 로그 출력
- [ ] 로그 필드: `tenantId`, `parentId`, `childId`, `qty`, `userId`
- [ ] 실패 시 `reason` 필드 포함 (duplicate, cycle, rbac, network)

**검증 방법:**

```bash
ssh root@139.59.110.55
journalctl -u erp-engine -n 50 | grep "BOM_COMPONENT"
```

**예시 로그:**

```
BOM_COMPONENT_ADDED: tenant=default, parent=59e04536, child=a1b2c3d4, qty=1, user=admin
BOM_COMPONENT_ADD_ERROR: reason=duplicate, parent=59e04536, child=a1b2c3d4, user=admin
```

**결과:** [ ] ✅ Pass / [ ] ⚠️ Partial / [ ] ❌ Fail

---

### D-2. 프론트엔드 에러 추적 (Sentry 태깅)

- [ ] Sentry 초기화 코드 존재
- [ ] BOM 에러 시 태그 추가: `bom_error_type: duplicate|cycle|rbac|network`

**검증 방법:**

```bash
grep -r "Sentry" src/
# Sentry.captureException 호출 확인
```

**결과:** [ ] ✅ Pass / [ ] ⚠️ Partial (미구현) / [ ] ❌ Fail

---

### D-3. 성능 지표 수집

- [ ] 평균 응답 시간 측정 (p50, p95)
- [ ] 30회 이상 샘플 수집
- [ ] 목표: p95 < 300ms

**검증 방법:**

```javascript
// 브라우저 콘솔에서 30회 반복 측정
const times = []
for (let i = 0; i < 30; i++) {
  const start = performance.now()
  // "추가" 버튼 클릭
  const end = performance.now()
  times.push(end - start)
}
times.sort((a, b) => a - b)
console.log('p50:', times[15], 'p95:', times[28])
```

**결과:** [ ] ✅ Pass (p95 < 300ms) / [ ] ⚠️ Partial / [ ] ❌ Fail

---

**블록 D 완료율:** \_\_\_/3 (80% 이상 권장, 필수 아님)

---

## 📋 최종 결정

### 체크리스트 요약

| 블록                 | 항목 수 | 완료     | 완료율  | 필수 여부 |
| -------------------- | ------- | -------- | ------- | --------- |
| **A. 기능/권한**     | 4       | \_\_\_/4 | \_\_\_% | ✅ 필수   |
| **B. 데이터 무결성** | 4       | \_\_\_/4 | \_\_\_% | ✅ 필수   |
| **C. 배포/캐시**     | 3       | \_\_\_/3 | \_\_\_% | ✅ 필수   |
| **D. 관측/로그**     | 3       | \_\_\_/3 | \_\_\_% | ⚠️ 권장   |

### 결정

- [ ] **✅ GO** - 블록 A, B, C 모두 100% / 블록 D 80% 이상
- [ ] **⚠️ CONDITIONAL GO** - 블록 D 50% 이상, 나머지 100% (1주일 내 보완 약속)
- [ ] **❌ NO-GO** - 블록 A, B, C 중 하나라도 80% 미만

### 승인자 서명

**검토자:** ************\_************ (날짜: **\_\_\_**)  
**최종 승인자:** ************\_************ (날짜: **\_\_\_**)

---

### No-Go 시 액션 플랜

**미완료 항목:**

1. [항목명] - [담당자] - [완료 예정일]
2. [항목명] - [담당자] - [완료 예정일]

**재검토 일시:** ******\_\_\_\_******

---

## 🚀 Go 후 즉시 실행 항목 (배포 당일)

### 1. 배포 전 백업

```bash
# Git 태그
git tag v1.2.0-bom-phase2
git push origin v1.2.0-bom-phase2

# 서버 백업
ssh root@139.59.110.55 << 'EOFSSH'
  mkdir -p /opt/erp-backup/$(date +%Y%m%d-%H%M%S)
  cp -r /opt/erp-backend /opt/erp-backup/$(date +%Y%m%d-%H%M%S)/
  cp -r /var/www/erp-app /opt/erp-backup/$(date +%Y%m%d-%H%M%S)/
EOFSSH
```

### 2. 배포 실행

```bash
# 프론트엔드
VITE_BUILD_ID=$(date +%s) npm run build
scp -r dist/* root@139.59.110.55:/var/www/erp-app/

# 백엔드 (개선안 적용 시)
scp /tmp/bom_api_improved.py root@139.59.110.55:/tmp/
ssh root@139.59.110.55 "systemctl restart erp-engine"
```

### 3. 스모크 테스트 (5분)

- [ ] http://139.59.110.55 접속 → Hard Reload (Cmd+Shift+R)
- [ ] 로그인 → 상품 상세 → BOM 구조 탭
- [ ] 구성품 2개 연속 추가 → 성공 확인
- [ ] 중복 추가 시도 → 에러 확인

### 4. 모니터링 활성화

```bash
# 로그 실시간 확인 (배포 후 10분)
ssh root@139.59.110.55
journalctl -u erp-engine -f | grep BOM
```

---

**문서 버전:** v1.0  
**최종 수정:** 2025-10-06  
**담당자:** Operations Team
