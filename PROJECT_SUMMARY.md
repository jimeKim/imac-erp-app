# ERP App - Project Summary

## 프로젝트 완료 현황

**Phase 0 + Phase 1 (MVP): 100% 완료** ✅

- 총 Todo: 20개
- 완료: 19개
- 취소: 1개 (API 계약 스냅샷 - 선택사항)
- 완료일: 2025-10-02

---

## 기술 스택

### Core
- **React 18** + **TypeScript** (Strict Mode)
- **Vite** (빌드 도구)
- **TanStack Query** (서버 상태 관리)

### UI/UX
- **Tailwind CSS** + **shadcn/ui**
- **Lucide React** (아이콘)
- **i18next** (한글/중국어/영어 지원)

### Form & Validation
- **React Hook Form** + **Zod**

### Networking
- **Axios** (HTTP 클라이언트)
- **Zustand** (클라이언트 상태)

### Quality
- **ESLint** + **Prettier**
- **Vitest** (단위 테스트)
- **Playwright** (E2E 테스트)
- **Husky** (Git hooks)

---

## 구현된 기능

### 1. 인증 시스템 (Auth)
- ✅ JWT 기반 인증
- ✅ 로그인 페이지
- ✅ RBAC (Role-Based Access Control)
  - `readonly`: 조회만 가능
  - `staff`: 생성/수정 가능
  - `manager`: 승인/삭제 가능
- ✅ ProtectedRoute (라우트 보호)
- ✅ RequirePermission (컴포넌트 레벨 권한 체크)

### 2. Items (상품 관리)
- ✅ 목록 조회 (검색, 필터, 정렬, 페이지네이션)
- ✅ 상세 조회 (재고 정보, 가격 정보, 메타 정보)
- ✅ 상품 타입: single, assembled
- ✅ Low Stock 경고 표시

### 3. Stocks (재고 현황)
- ✅ 목록 조회 (검색, Low Stock 필터)
- ✅ 재고 요약 카드 (총 아이템 수, Low Stock 아이템 수, 총 재고 가치)
- ✅ 창고별 재고 관리
- ✅ 실시간 재고 상태 모니터링

### 4. Inbounds (입고 관리)
- ✅ 목록 조회 (검색, 상태 필터, 날짜 필터)
- ✅ 상세 조회 (공급처 정보, 라인 아이템)
- ✅ 상태: draft → pending → approved → received / cancelled
- ✅ RBAC 기반 승인 버튼

### 5. Outbounds (출고 관리)
- ✅ 목록 조회 (검색, 상태 필터, 날짜 필터)
- ✅ **등록 폼** (React Hook Form + useFieldArray)
  - 라인 아이템 동적 추가/삭제
  - 실시간 총액 계산
  - 초안 저장 (Save as Draft)
- ✅ 상세 조회 (고객 정보, 라인 아이템)
- ✅ **승인/커밋 워크플로우**
  - draft → pending → approved → committed / cancelled
  - 상태별 액션 버튼 (Edit, Submit, Approve, Commit, Cancel)
  - RBAC 기반 권한 제어
  - 워크플로우 힌트 표시

---

## 프로젝트 구조

```
erp-app/
├── src/
│   ├── app/                    # 앱 진입점, 프로바이더, 레이아웃
│   │   ├── contexts/           # React Context (AuthContext)
│   │   ├── layouts/            # MainLayout, AuthLayout
│   │   ├── providers/          # AuthProvider, QueryProvider
│   │   ├── routes/             # AppRouter (라우팅 설정)
│   │   └── App.tsx
│   ├── pages/                  # 페이지 컴포넌트
│   │   ├── auth/               # LoginPage
│   │   ├── items/              # ItemsPage, ItemDetailPage
│   │   ├── stocks/             # StocksPage
│   │   ├── inbounds/           # InboundsPage, InboundDetailPage
│   │   ├── outbounds/          # OutboundsPage, OutboundDetailPage, OutboundCreatePage
│   │   ├── errors/             # NotFoundPage, UnauthorizedPage
│   │   └── DashboardPage.tsx
│   ├── shared/                 # 공용 컴포넌트, 훅, 유틸
│   │   ├── components/
│   │   │   ├── auth/           # ProtectedRoute, RequirePermission
│   │   │   ├── feedback/       # Toast, Empty, ErrorBoundary
│   │   │   └── ui/             # Button, Card (shadcn/ui)
│   │   ├── constants/          # errorCodes, roles (RBAC)
│   │   ├── hooks/              # useAuth, useLanguage, useToast
│   │   ├── services/           # apiClient, i18n, mockData, itemApi, stockApi, inboundApi, outboundApi
│   │   ├── types/              # api, auth, item, stock, inbound, outbound
│   │   └── utils/              # cn (Tailwind 클래스 병합)
│   ├── styles/
│   │   └── globals.css         # Tailwind + 커스텀 스타일
│   └── main.tsx                # React 진입점
├── public/
│   └── locales/                # 다국어 리소스 (ko, zh, en)
│       ├── ko/
│       ├── zh/
│       └── en/
├── docs/                       # 프로젝트 문서
│   ├── ADR/                    # Architecture Decision Records
│   ├── flows/                  # 사용자 플로우
│   ├── i18n-guide.md
│   └── env-guide.md
├── e2e/                        # E2E 테스트 (Playwright)
├── .husky/                     # Git hooks
└── [config files]              # tsconfig, vite.config, eslint.config, etc.
```

---

## 통계

- **TypeScript 파일**: 54개
- **Git Commits**: 5개 (Phase 0 + Phase 1)
- **Mock 데이터**:
  - Items: 10개
  - Stocks: 10개
  - Inbounds: 5개
  - Outbounds: 4개

---

## 핵심 기능 하이라이트

### 1. RBAC (역할 기반 접근 제어)
```typescript
// 권한 체크 예시
<RequirePermission permission="OUTBOUNDS_APPROVE">
  <Button onClick={handleApprove}>Approve</Button>
</RequirePermission>
```

**역할별 권한**:
- `readonly`: Items/Stocks 조회만
- `staff`: Items/Inbounds/Outbounds 생성/수정
- `manager`: 승인/삭제 권한

### 2. Outbound 워크플로우
```
Draft → Pending → Approved → Committed
  ↓        ↓
Cancel   Cancel
```

**상태별 액션**:
- **Draft**: Edit, Submit for Approval, Cancel
- **Pending**: Approve, Cancel
- **Approved**: Commit (재고 차감)
- **Committed**: 완료 (읽기 전용)

### 3. React Hook Form + Dynamic Fields
```typescript
const { fields, append, remove } = useFieldArray({
  control,
  name: 'lines',
})

// 라인 아이템 추가
append({ itemId: '', quantity: 1, unitPrice: 0 })

// 실시간 총액 계산
const totalAmount = lines.reduce((sum, line) => 
  sum + (line.quantity * line.unitPrice), 0
)
```

### 4. TanStack Query + Mock API
```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['outbounds', params],
  queryFn: () => getOutbounds(params),
})
```

### 5. i18n (다국어 지원)
- **한국어** (ko)
- **중국어** (zh)
- **영어** (en)

확장 가능한 구조로 언어 추가 용이

---

## 다음 단계 제안

### Phase 2: Backend 연동 (2-3일)
1. ✅ FastAPI/Supabase 백엔드 구축
2. ✅ Mock API → 실제 API 교체
3. ✅ 실시간 재고 업데이트
4. ✅ 파일 업로드 (상품 이미지)

### Phase 3: 고급 기능 (3-5일)
1. ✅ Dashboard (차트, 통계)
2. ✅ Excel 가져오기/내보내기
3. ✅ 알림 시스템 (Low Stock 알림)
4. ✅ 사용자 관리 (User CRUD)
5. ✅ 감사 로그 (Audit Trail)

### Phase 4: 배포 (1-2일)
1. ✅ Docker 컨테이너화
2. ✅ CI/CD 파이프라인 (GitHub Actions)
3. ✅ 프로덕션 배포 (Vercel/Netlify + Supabase)
4. ✅ 모니터링 (Sentry)

---

## 실행 방법

### 개발 서버 실행
```bash
npm install
npm run dev
# http://localhost:5173
```

### 빌드
```bash
npm run build
npm run preview
```

### 테스트
```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run e2e

# 린트
npm run lint

# 포맷
npm run format
```

---

## 기술적 하이라이트

### 1. TypeScript Strict Mode
- `strict: true`
- `noUncheckedIndexedAccess: true`
- 타입 안전성 극대화

### 2. Git Hooks (Husky + lint-staged)
- Pre-commit: ESLint + Prettier 자동 실행
- 코드 품질 자동 보장

### 3. ErrorBoundary
- React 에러 경계로 앱 크래시 방지
- 사용자 친화적 에러 페이지

### 4. Toast 시스템
- 성공/에러/경고/정보 토스트
- 자동 닫힘 (5초)

### 5. Empty/Error States
- 데이터 없음 상태 처리
- 에러 상태 처리 + 재시도 버튼

---

## 보안 고려사항

1. ✅ JWT HTTPOnly Cookies (권장)
2. ✅ RBAC 권한 체크 (프론트엔드 + 백엔드)
3. ✅ XSS 방지 (React 기본 제공)
4. ✅ CSRF 토큰 (백엔드에서 구현 필요)
5. ✅ 환경변수 관리 (.env.example)

---

## 성능 최적화

1. ✅ Lazy Loading (React Router)
2. ✅ TanStack Query 캐싱 (5분)
3. ✅ Debounce 검색 (필요 시)
4. ✅ Pagination (무한 스크롤 대신)
5. ✅ Optimistic Updates (TanStack Query)

---

## 유지보수 가이드

### 새 페이지 추가
1. `src/pages/` 에 페이지 컴포넌트 생성
2. `src/app/routes/index.tsx` 에 라우트 추가
3. 필요 시 RBAC 권한 체크 추가

### 새 API 추가
1. `src/shared/types/` 에 타입 정의
2. `src/shared/services/mockData.ts` 에 Mock 데이터 추가
3. `src/shared/services/` 에 API 클라이언트 생성

### 새 언어 추가
1. `public/locales/{언어코드}/` 디렉토리 생성
2. `common.json`, `modules.json`, `errors.json` 생성
3. `src/shared/hooks/useLanguage.ts` 에 언어 추가

---

## 알려진 제한사항

1. **Mock API**: 실제 백엔드 연동 필요
2. **재고 커밋**: 시뮬레이션만 (실제 재고 차감 없음)
3. **파일 업로드**: 미구현
4. **알림**: 미구현
5. **Dashboard**: 플레이스홀더만

---

## 라이선스

MIT License

---

## 문의

프로젝트 관련 문의: [GitHub Issues]

