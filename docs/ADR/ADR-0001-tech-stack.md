# ADR-0001: Tech Stack 선정

## Status

Accepted

## Context

ERP 시스템 프론트엔드 개발을 위한 기술 스택 결정이 필요합니다.

## Decision

### Core Framework

- **React 18**: 성숙한 생태계, 대규모 커뮤니티
- **TypeScript**: 타입 안정성, IDE 지원
- **Vite**: 빠른 HMR, 최신 번들러

### State Management

- **TanStack Query**: 서버 상태 관리, 캐싱, 리페칭
- **Zustand**: 경량 클라이언트 상태 관리

### UI/Styling

- **Tailwind CSS**: 유틸리티 우선, 빠른 개발
- **shadcn/ui**: 커스터마이징 가능한 컴포넌트
- **Lucide React**: 일관된 아이콘 세트

### Form & Validation

- **React Hook Form**: 성능, DX
- **Zod**: 스키마 기반 검증

### Networking

- **Axios**: 인터셉터, 에러 처리

### Internationalization

- **i18next**: 한글/중국어 지원

### Quality Assurance

- **ESLint + Prettier**: 코드 품질
- **Vitest**: 단위 테스트
- **Playwright**: E2E 테스트
- **Husky**: Git hooks

## Consequences

### Positive

- 검증된 기술 조합
- 빠른 개발 속도
- 타입 안정성
- 확장 가능한 구조

### Negative

- 초기 러닝 커브
- 번들 사이즈 증가 가능성

## Alternatives Considered

- Vue 3: 러닝 커브는 낮으나 생태계가 상대적으로 작음
- Next.js: SSR 불필요, 오버엔지니어링 우려
