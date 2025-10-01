# ERP App

기업 자원 관리 시스템 프론트엔드

## Tech Stack

### Core
- React 18 + TypeScript
- Vite (빌드 도구)
- TanStack Query (서버 상태 관리)

### UI/UX
- Tailwind CSS + shadcn/ui
- Lucide React (아이콘)
- i18next (한글/중국어)

### Form & Validation
- React Hook Form + Zod

### Networking
- Axios (HTTP 클라이언트)
- Zustand (클라이언트 상태)

### Quality
- ESLint + Prettier
- Vitest (단위 테스트)
- Playwright (E2E 테스트)
- Husky (Git hooks)

## Quick Start

```bash
# 의존성 설치
npm install

# 개발 서버 (http://localhost:5173)
npm run dev

# 빌드
npm run build

# 프리뷰
npm run preview

# 테스트
npm run test
npm run e2e

# 린트 & 포맷
npm run lint
npm run format
```

## Environment Variables

`.env.example` 참고:

```env
VITE_API_BASE_URL=https://api.example.com
VITE_API_TIMEOUT_MS=15000
VITE_APP_NAME=ERP App
```

## Core Modules

- **Items**: 상품 관리 (조회/검색)
- **Stocks**: 재고 현황 (실시간 모니터링)
- **Inbounds**: 입고 관리
- **Outbounds**: 출고 관리 (초안→제출→승인→커밋)

## Architecture

```
src/
├── app/          # 앱 진입점, 프로바이더, 레이아웃
├── features/     # 도메인별 기능 모듈
├── shared/       # 공용 컴포넌트, 훅, 유틸
└── styles/       # 글로벌 스타일
```

## Authentication

- JWT (HTTPOnly Cookie 권장)
- 역할: readonly / staff / manager
- RBAC 기반 메뉴/버튼 노출 제어

## API Integration

- Base URL: `VITE_API_BASE_URL`
- 엔진: FastAPI + Supabase
- 에러 처리: 표준 토스트 메시지

