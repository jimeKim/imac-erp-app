# 🏭 ERP System - iMac ERP

> 제조업 특화 기업 자원 관리 시스템  
> React 18 + TypeScript + FastAPI + Supabase

[![Phase 2](https://img.shields.io/badge/Phase-2%20Ready-brightgreen.svg)](https://github.com)
[![Phase 3](https://img.shields.io/badge/Phase-3%20Planning-blue.svg)](https://github.com)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.118-green.svg)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)

## 📍 현재 상태

### ✅ Phase 2: BOM 구성품 추가 (배포 준비 완료)

- **BomTree 컴포넌트**: 동적 트리 구조, Supabase 실시간 연동
- **구성품 추가 모달**: RBAC 권한 체크, 중복/순환 참조 검증
- **운영 안정화**: Go/No-Go 체크리스트, 모니터링 대시보드, E2E 테스트
- **DB 제약**: `003_bom_constraints.sql` (UNIQUE, CHECK, 인덱스)
- **배포 스크립트**: `deploy-phase2.sh`, `rollback-phase2.sh`
- **배포 준비도**: 95% (DB 마이그레이션만 실행하면 100%)

### 🎯 Phase 3: Excel Import (설계 완료, 개발 시작 예정)

- **PRD**: 기능 요구사항, UI/UX, 기술 아키텍처 완료
- **킥오프 미팅**: 2025-10-07 (월) 14:00 예정
- **템플릿**: Excel Import 가이드, CSV 템플릿 준비 완료
- **Sprint 계획**: 2주 (10/9 ~ 10/18)

## 📚 Tech Stack

### Frontend

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui**
- **React Router** v6 (라우팅)
- **TanStack Query** v5 (서버 상태 관리)
- **Zustand** (클라이언트 상태 관리)
- **React Hook Form** + **Zod** (폼 검증)
- **i18next** (다국어 지원: ko/zh/en)

### Backend

- **FastAPI 0.118** (Python 웹 프레임워크)
- **Supabase** (PostgreSQL, Auth, Storage)
- **Uvicorn** (ASGI 서버)
- **Pydantic 2.11** (데이터 검증)

### API & Auth

- **Axios** (HTTP 클라이언트, 인터셉터)
- **JWT** (토큰 기반 인증)
- **RBAC** (역할 기반 접근 제어: admin/manager/staff/readonly)

### Advanced Features

- **Excel Grid System** (TanStack Table v8)
- **BOM 트리 구조** (재귀적 계층 구조)
- **i18n** (한국어/영어/중국어 지원)
- **설정 관리** (Item Type, Unit Settings)

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

- **서버**: DigitalOcean Droplet (139.59.110.55)
- **백엔드**: FastAPI + Supabase (`/opt/erp-backend`)
- **프론트엔드**: React + Vite (`/var/www/erp-app`)
- **웹서버**: Nginx (리버스 프록시)

#### Phase 2 배포 (BOM 기능)

```bash
# 1. DB 마이그레이션 (Supabase Dashboard에서 실행)
# → backend/supabase/migrations/003_bom_constraints.sql

# 2. 전체 배포 (자동화)
./scripts/deploy-phase2.sh

# 3. 롤백 (필요 시)
./scripts/rollback-phase2.sh /opt/erp-backup/20251006-HHMMSS
```

#### 빠른 재배포 (프론트엔드만)

```bash
# 빌드 ID 포함하여 배포
VITE_BUILD_ID=$(date +%s) npm run build
scp -r dist/* root@139.59.110.55:/var/www/erp-app/
```

#### 배포 전 체크리스트

```bash
# Go/No-Go 체크리스트 실행
# → docs/operations/go-no-go-checklist.md 참조

# 모니터링 활성화
ssh root@139.59.110.55 "journalctl -u erp-engine -f | grep BOM"
```

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md) 및 [NEXT_ACTIONS.md](./docs/NEXT_ACTIONS.md) 참조

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

## ✅ 완료된 기능

### Phase 1: 기본 CRUD (완료)

- ✅ Items 조회/생성 (Excel Grid System)
- ✅ Stocks 조회 (창고별 필터)
- ✅ Inbounds 조회 (입고 목록)
- ✅ JWT 인증 + RBAC (admin/manager/staff/readonly)
- ✅ 다국어 지원 (한/중/영)
- ✅ Supabase 백엔드 완전 연동

### Phase 2: BOM 구성품 추가 (배포 준비 완료)

- ✅ BomTree 컴포넌트 (동적 트리 구조)
- ✅ 구성품 추가 모달 (RBAC 권한 체크)
- ✅ 중복/순환 참조 검증
- ✅ DB 제약 조건 (UNIQUE, CHECK, 인덱스)
- ✅ 배포 스크립트 (`deploy-phase2.sh`, `rollback-phase2.sh`)
- ✅ Go/No-Go 체크리스트, 모니터링 대시보드, E2E 테스트
- ✅ Excel Grid System (TanStack Table v8)
- ✅ 설정 메뉴 (Item Type Settings, Unit Settings)

## 🔜 다음 작업

### Phase 3: Excel Import (2주, 10/9 ~ 10/18)

- ⏳ Excel 파일 업로드 (.xlsx, .xls)
- ⏳ 미리보기 및 3단계 검증 (형식 → 데이터 → 비즈니스)
- ⏳ 에러 리포트 다운로드
- ⏳ 부분 성공 허용 (유효한 행만 반영)
- ⏳ 감사 로그 (누가, 언제, 무엇을 업로드)

### Phase 4: 고급 기능 (미정)

- ⏳ BOM 버전 관리 (Draft/Active/Archived)
- ⏳ Excel 일괄 수정/삭제
- ⏳ 원가 계산 자동화
- ⏳ Outbounds 승인 워크플로우

## 📚 주요 문서

### 운영 (Operations)

- [📋 다음 실행 액션 가이드](./docs/NEXT_ACTIONS.md) ⭐ **시작하기 좋은 문서**
- [✅ Go/No-Go 체크리스트](./docs/operations/go-no-go-checklist.md)
- [📊 모니터링 대시보드](./docs/operations/monitoring-dashboard.md)
- [🧪 E2E 테스트 시나리오](./docs/operations/e2e-test-scenarios.md)
- [🔒 BOM 안정성 체크리스트](./docs/operations/bom-stability-checklist.md)

### 기능 (Features)

- [📄 Phase 3 Excel Import PRD](./docs/features/phase3-excel-import-prd.md)
- [🌳 BOM 트리 구현 가이드](./docs/implementation/bom-tree-implementation.md)
- [📊 Excel Grid System](./docs/features/excel-grid-system.md)
- [⚙️ Item Type Settings](./docs/features/item-type-settings.md)

### 아키텍처 (Architecture)

- [🏗️ 시스템 아키텍처](./ARCHITECTURE.md)
- [🔄 일관성 체크 리포트](./CONSISTENCY_REPORT.md)
- [🔐 백엔드 개선안 v2](./docs/backend/bom-api-v2-feature-flag.md)

### 배포 (Deployment)

- [🚀 배포 가이드](./DEPLOYMENT.md)
- [⚙️ 최종 설정 가이드](./FINAL_SETUP_GUIDE.md)
- [🆘 복구 가이드](./RECOVERY.md)

### 미팅 자료

- [🎯 Phase 3 킥오프 미팅](./docs/meetings/phase3-kickoff-agenda.md)

### 템플릿

- [📊 Excel Import 가이드](./templates/bom-import-guide.md)
- [📁 Excel Import 템플릿 (CSV)](./templates/bom-import-template.csv)

## 🛠 스크립트

### 배포

- `./scripts/deploy-phase2.sh` - Phase 2 전체 배포 (자동화)
- `./scripts/rollback-phase2.sh` - Phase 2 롤백
- `./quick-deploy.sh` - 프론트엔드만 빠른 배포

### 개발 지원

- `./setup-env.sh` - 환경 설정
- `./server-status.sh` - 서버 상태 확인
- `./test-ssh.sh` - SSH 연결 테스트

## 📄 License

MIT
