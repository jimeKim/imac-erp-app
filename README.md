# ERP System

> 기업 자원 관리 시스템 - React 18 + TypeScript + Vite

[![Phase 0](https://img.shields.io/badge/Phase-0%20Complete-green.svg)](https://github.com)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)

## ✅ Phase 0 완료 (15/20 Todos)

프론트엔드 기반 구축이 완료되었습니다. 이제 백엔드 API와 연결할 준비가 되었습니다.

## 📚 Tech Stack

### Frontend

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui**
- **React Router** v6 (라우팅)
- **TanStack Query** v5 (서버 상태 관리)
- **Zustand** (클라이언트 상태 관리)
- **React Hook Form** + **Zod** (폼 검증)
- **i18next** (다국어 지원: ko/zh/en)

### API & Auth

- **Axios** (HTTP 클라이언트, 인터셉터)
- **JWT** (HTTPOnly 쿠키 권장)
- **RBAC** (역할 기반 접근 제어)

### Code Quality

- **ESLint** + **Prettier** (코드 포맷팅)
- **Husky** + **lint-staged** (pre-commit 훅)
- **Vitest** (단위 테스트)
- **Playwright** (E2E 테스트)

## 🚀 Quick Start

### 개발 환경

#### 프론트엔드 실행

```bash
npm install
npm run dev
# http://localhost:5173
```

#### 백엔드 실행 (로컬)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 프로덕션 배포

#### 서버 정보
- **서버**: DigitalOcean (139.59.110.55)
- **백엔드**: FastAPI + Supabase (포트 8000)
- **프론트엔드**: React + Vite (포트 80)

#### 자동 배포 (권장)

```bash
# 1. 환경 설정
./setup-env.sh

# 2. Supabase 프로젝트 생성 및 API 키 입력
# backend/.env 파일에 Supabase 정보 입력

# 3. 전체 배포
./deploy.sh

# 4. 상태 확인
./server-status.sh
```

#### 빠른 재배포 (프론트엔드만)

```bash
./quick-deploy.sh
```

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md) 참조

### 로그인

- **URL**: http://139.59.110.55 (프로덕션) 또는 http://localhost:5173 (로컬)
- **ID**: admin
- **PW**: admin

### 환경 변수

로컬 개발:
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ENABLE_MOCK_API=true
```

프로덕션:
```bash
VITE_API_BASE_URL=http://139.59.110.55:8000/api/v1
VITE_ENABLE_MOCK_API=false
```

## 📜 Scripts

```bash
# 개발
npm run dev              # Vite 개발 서버 실행

# 빌드
npm run build            # 프로덕션 빌드
npm run preview          # 빌드 결과 프리뷰

# 코드 품질
npm run lint             # ESLint 실행
npm run format           # Prettier 포맷팅

# 테스트
npm run test             # Vitest 단위 테스트
npm run test:ui          # Vitest UI
npm run test:coverage    # 테스트 커버리지
npm run e2e              # Playwright E2E 테스트
npm run e2e:ui           # Playwright UI
npm run e2e:headed       # Playwright (브라우저 보이기)
```

## 📁 Project Structure

```
erp-app/
├── src/
│   ├── app/                    # 앱 설정
│   │   ├── contexts/           # React 컨텍스트
│   │   ├── layouts/            # 레이아웃 컴포넌트
│   │   ├── providers/          # 프로바이더 (Query, Auth)
│   │   ├── routes/             # 라우팅 설정
│   │   └── App.tsx             # 앱 진입점
│   ├── pages/                  # 페이지 컴포넌트
│   │   ├── auth/               # 인증 (로그인)
│   │   ├── items/              # 재고 관리
│   │   ├── stocks/             # 재고 현황
│   │   ├── inbounds/           # 입고 관리
│   │   ├── outbounds/          # 출고 관리
│   │   └── errors/             # 에러 페이지
│   ├── shared/                 # 공용 코드
│   │   ├── components/         # 공용 컴포넌트
│   │   │   ├── ui/             # UI 컴포넌트 (Button, Card)
│   │   │   ├── auth/           # 인증 컴포넌트 (ProtectedRoute)
│   │   │   └── feedback/       # 피드백 (Toast, Empty, Error)
│   │   ├── hooks/              # 커스텀 훅
│   │   ├── services/           # 서비스 (API, i18n)
│   │   ├── types/              # TypeScript 타입
│   │   ├── constants/          # 상수 (roles, errorCodes)
│   │   └── utils/              # 유틸리티
│   ├── styles/                 # 글로벌 스타일
│   └── main.tsx                # 앱 엔트리
├── public/                     # 정적 파일
│   └── locales/                # 다국어 번역 파일
│       ├── ko/                 # 한국어
│       ├── zh/                 # 중국어
│       └── en/                 # 영어
├── docs/                       # 문서
│   ├── ADR/                    # Architecture Decision Records
│   ├── flows/                  # 사용자 플로우
│   ├── i18n-guide.md           # 다국어 가이드
│   └── env-guide.md            # 환경 변수 가이드
├── e2e/                        # E2E 테스트
├── .env.example                # 환경 변수 예시
└── README.md                   # 프로젝트 문서
```

## 🎯 Core Modules

### 1. Items (재고 관리)

- 재고 목록 조회 (검색, 필터, 정렬, 페이지네이션)
- 재고 상세 정보
- 재고 등록/수정 (staff, manager)

### 2. Stocks (재고 현황)

- 재고 현황 대시보드
- 재고 수량 조정 (manager)
- 안전 재고 알림

### 3. Inbounds (입고 관리)

- 입고 목록 (기간/공급처 필터)
- 입고 등록/수정 (staff, manager)
- 입고 승인 (manager)

### 4. Outbounds (출고 관리)

- 출고 목록 (기간/고객 필터)
- 출고 등록 (staff, manager)
- 출고 승인 (manager)
- 출고 커밋 - 재고 차감 (manager)

## 🔐 RBAC (Role-Based Access Control)

| 역할         | 권한                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| **readonly** | Items (View), Stocks (View), Inbounds (View), Outbounds (View)                                                      |
| **staff**    | Items (View, Create, Update), Stocks (View), Inbounds (View, Create, Update), Outbounds (View, Create, Update)      |
| **manager**  | 모든 권한 + Items (Delete), Inbounds (Delete), Outbounds (Delete, Approve, Commit), Stocks (Update), Users (Manage) |

자세한 내용은 [src/shared/constants/roles.ts](src/shared/constants/roles.ts) 참조

## 🌍 Internationalization

지원 언어:

- 한국어 (ko)
- 中文 (zh)
- English (en)

새 언어 추가 방법은 [docs/i18n-guide.md](docs/i18n-guide.md) 참조

## 🔧 Environment Variables

필수 환경 변수:

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1  # 백엔드 API URL
VITE_API_TIMEOUT_MS=15000                       # API 타임아웃
VITE_APP_NAME=ERP System                        # 앱 이름
```

자세한 내용은 [docs/env-guide.md](docs/env-guide.md) 참조

## 🧪 Testing

### 단위 테스트 (Vitest)

```bash
npm run test              # 테스트 실행
npm run test:ui           # UI 모드
npm run test:coverage     # 커버리지
```

현재 테스트:

- cn 유틸리티 (5 tests)
- Button 컴포넌트 (5 tests)
- RBAC 시스템 (8 tests)

### E2E 테스트 (Playwright)

```bash
npm run e2e               # E2E 테스트 실행
npm run e2e:ui            # UI 모드
npm run e2e:headed        # 브라우저 보이기
```

현재 테스트:

- 홈페이지 로드
- 언어 전환 (ko/zh/en)
- 에러 메시지 데모
- RBAC 시스템 표시
- 진행률 표시
- UI 컴포넌트 데모

## 💡 Development Guidelines

### Coding Standards

- TypeScript strict 모드 사용
- ESLint + Prettier 자동 포맷팅
- Husky pre-commit 훅으로 자동 검증

### Component Structure

- Feature-based 폴더 구조
- Lazy loading으로 번들 최적화
- Compound component 패턴 사용

### API Integration

- TanStack Query로 서버 상태 관리
- Axios 인터셉터로 에러 처리
- 다국어 에러 메시지 매핑

## ✅ 완료된 기능 (Phase 1 완료)

- ✅ Items 조회 (19개 상품, 페이지네이션, 검색)
- ✅ Stocks 조회 (18개 재고, 창고별 필터)
- ✅ Inbounds 조회 (입고 목록, 상태별 필터)
- ✅ JWT 인증 시스템 (admin/admin)
- ✅ 좌측 사이드바 네비게이션
- ✅ 다국어 지원 (한/중/영)
- ✅ engine-core 백엔드 완전 연동

## 🔜 다음 작업 (Phase 2)

- ⏳ **Outbounds API 연동** (가장 우선순위)
  - 출고 생성/승인/커밋
  - 상태 머신 로직
  - 재고 차감 트랜잭션
- ⏳ Items 생성/수정 폼
- ⏳ 에러 복구 전략 (Retry, Offline)
- ⏳ 프로덕션 환경 설정

## 📄 License

MIT
