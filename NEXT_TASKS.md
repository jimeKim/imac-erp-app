# 다음 세션 작업 계획

> **작성일**: 2025-10-04  
> **현재 상태**: Items/Stocks/Inbounds API 연동 완료 ✅

---

## 🎯 우선순위 1: Outbounds API 구현

**예상 시간**: 4-6시간  
**난이도**: ⭐⭐⭐⭐⭐ (가장 복잡)  
**비즈니스 가치**: 🔥 매우 높음

### 사전 준비

1. **engine-core 확인**
   ```bash
   cd /Users/kjimi/erp-engine-system/engine-core
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **API 엔드포인트 확인**
   - Swagger UI: http://localhost:8000/docs
   - `/api/v1/outbounds/` 엔드포인트 테스트
   - 상태 전환 로직 이해 (draft → pending → approved → committed)

3. **기존 코드 참조**
   - `src/features/items/api/items.api.ts` (API 호출 패턴)
   - `src/pages/items/ItemsPageReal.tsx` (페이지 구조)
   - `src/pages/inbounds/InboundsPageReal.tsx` (상태별 필터링)

---

## 📋 작업 체크리스트

### Step 1: API 서비스 생성 (1시간)

- [ ] `src/features/outbounds/api/outbounds.api.ts` 생성
  - [ ] `useOutboundsQuery` (목록 조회)
  - [ ] `useOutboundDetailQuery` (상세 조회)
  - [ ] `useCreateOutboundMutation` (생성)
  - [ ] `useUpdateOutboundMutation` (수정)
  - [ ] `useSubmitOutboundMutation` (제출)
  - [ ] `useApproveOutboundMutation` (승인)
  - [ ] `useCommitOutboundMutation` (커밋)
  - [ ] `useCancelOutboundMutation` (취소)

### Step 2: 목록 페이지 (1-2시간)

- [ ] `src/pages/outbounds/OutboundsPageReal.tsx` 생성
  - [ ] 테이블 레이아웃 (Items 참조)
  - [ ] 검색 및 필터 (날짜, 고객, 상태)
  - [ ] 페이지네이션
  - [ ] 상태별 색상 구분
  - [ ] "출고 등록" 버튼
  - [ ] i18n 번역 키 추가

### Step 3: 출고 생성 폼 (2-3시간)

- [ ] `src/pages/outbounds/OutboundCreatePage.tsx` 생성 (또는 기존 수정)
  - [ ] React Hook Form + Zod 검증
  - [ ] 헤더 정보 입력 (고객, 요청일자)
  - [ ] 라인 아이템 추가/삭제
  - [ ] 품목 선택 (Items API 연동)
  - [ ] 재고 확인 (Stocks API 연동)
  - [ ] 수량 검증 (재고 부족 경고)
  - [ ] 저장 및 제출

### Step 4: 상태 전환 버튼 (1시간)

- [ ] 상세 페이지에 상태별 액션 버튼 추가
  - [ ] "제출" (draft → pending) - staff, manager
  - [ ] "승인" (pending → approved) - manager only
  - [ ] "커밋" (approved → committed) - manager only
  - [ ] "취소" (any → canceled) - manager only
  - [ ] RBAC 권한 검증
  - [ ] 확인 다이얼로그 추가

### Step 5: 라우팅 및 네비게이션 (30분)

- [ ] `src/app/routes/index.tsx` 업데이트
  - [ ] `/outbounds-real` 경로 추가
  - [ ] `/outbounds/create` 경로 추가
  - [ ] `/outbounds/:id` 경로 추가
- [ ] `src/app/layouts/MainLayout.tsx` 사이드바 업데이트
  - [ ] "출고 관리" 메뉴 추가
  - [ ] 활성 상태 표시

### Step 6: 테스트 (1시간)

- [ ] 브라우저 테스트
  - [ ] 출고 생성 (happy path)
  - [ ] 상태 전환 (draft → pending → approved → committed)
  - [ ] 재고 부족 시 에러 처리
  - [ ] 권한별 버튼 표시 확인
- [ ] 콘솔 에러 확인
- [ ] 네트워크 탭 확인

---

## ⚠️ 예상 어려움 및 대응

### 1. 상태 머신 복잡도
- **문제**: draft → pending → approved → committed 흐름 관리
- **해결**: 
  - engine-core의 `/api/v1/outbounds/{id}/submit`, `/approve`, `/commit` 엔드포인트 활용
  - 각 상태별 허용 액션 매핑 (예: approved에서만 commit 가능)

### 2. 재고 차감 검증
- **문제**: 커밋 시 재고가 충분한지 확인
- **해결**:
  - 출고 생성 시 Stocks API로 재고 확인
  - 커밋 전 다시 한번 백엔드에서 검증 (race condition 방지)
  - 재고 부족 시 명확한 에러 메시지 표시

### 3. 트랜잭션 에러 처리
- **문제**: 커밋 중 에러 발생 시 롤백
- **해결**:
  - 백엔드의 트랜잭션 처리에 의존
  - 프론트엔드는 에러 메시지만 표시
  - Retry 로직 추가 (TanStack Query의 `retry` 옵션)

### 4. RBAC 권한 검증
- **문제**: staff는 생성/제출만, manager는 승인/커밋
- **해결**:
  - `RequirePermission` 컴포넌트 활용
  - `src/shared/constants/roles.ts`의 `hasPermission` 사용
  - 버튼 disabled 또는 숨김 처리

---

## 🔍 참고 코드 위치

```bash
# API 호출 패턴
src/features/items/api/items.api.ts
src/features/stocks/api/stocks.api.ts
src/features/inbounds/api/inbounds.api.ts

# 페이지 구조
src/pages/items/ItemsPageReal.tsx
src/pages/stocks/StocksPageReal.tsx
src/pages/inbounds/InboundsPageReal.tsx

# 폼 예제
src/pages/auth/LoginPage.tsx

# 권한 검증
src/shared/components/auth/RequirePermission.tsx
src/shared/constants/roles.ts

# 백엔드 API
/Users/kjimi/erp-engine-system/engine-core/app/api/outbounds.py
```

---

## 📊 예상 타임라인

| 작업 | 예상 시간 | 누적 시간 |
|------|-----------|-----------|
| API 서비스 생성 | 1h | 1h |
| 목록 페이지 | 1-2h | 2-3h |
| 출고 생성 폼 | 2-3h | 4-6h |
| 상태 전환 버튼 | 1h | 5-7h |
| 라우팅/네비게이션 | 30m | 5.5-7.5h |
| 테스트 | 1h | 6.5-8.5h |

**총 예상 시간**: 6.5-8.5시간

---

## ✅ 완료 후 체크리스트

- [ ] Git 커밋 및 푸시
- [ ] README 업데이트
- [ ] 스크린샷 추가 (선택)
- [ ] 다음 작업 계획 (Items CRUD)

---

## 💡 팁

1. **한 번에 하나씩**: 목록 → 생성 → 상태 전환 순서대로
2. **작은 단위로 커밋**: 각 Step마다 커밋
3. **브라우저 콘솔 활용**: Network 탭에서 API 응답 확인
4. **기존 코드 재사용**: Items/Inbounds 페이지 복사 후 수정
5. **에러 처리 먼저**: Happy path보다 에러 케이스 먼저 구현

---

## 🚀 다음 다음 작업 (Phase 3)

1. **Items CRUD** (2-3시간)
   - 상품 등록 폼
   - 상품 수정 폼
   - 유효성 검증 (Zod)

2. **에러 복구 전략** (1-2시간)
   - Retry 로직
   - Offline 모드
   - 낙관적 업데이트

3. **성능 최적화** (1-2시간)
   - 가상 스크롤 (대량 데이터)
   - 이미지 최적화
   - 코드 스플리팅

4. **프로덕션 준비** (2-3시간)
   - 환경별 설정 분리
   - 에러 모니터링 (Sentry)
   - CI/CD 파이프라인

---

**파이팅! 🔥**

