# Outbound MVP Flow

## Phase 0: 초안 저장까지

### User Journey

1. **로그인** (JWT Cookie)
   - Role: staff 이상

2. **출고 목록 조회** (`/outbounds`)
   - 검색: 출고코드, 거래처명
   - 필터: 상태(초안/제출/승인/완료), 기간
   - 정렬: 요청일자, 생성일자

3. **출고 등록** (`/outbounds/new`)
   - 헤더 입력:
     - 거래처 선택 (autocomplete)
     - 창고 선택
     - 요청일자
   - 라인 추가:
     - 상품 검색/선택
     - 수량 입력
     - 단가 자동 조회
     - 소계 계산
   - **초안 저장** → 출고코드 생성

4. **출고 상세** (`/outbounds/:id`)
   - 헤더/라인 표시
   - 제출 버튼 (비활성 - Phase 1)
   - 승인 버튼 (비활성 - Phase 1, manager only)
   - 커밋 버튼 (비활성 - Phase 1, manager only)

## States

```
draft → pending → approved → committed
  ↓        ↓         ↓
canceled
```

## RBAC

| Role | 조회 | 초안 | 제출 | 승인 | 커밋 |
|------|------|------|------|------|------|
| readonly | ✅ | ❌ | ❌ | ❌ | ❌ |
| staff | ✅ | ✅ | ✅ | ❌ | ❌ |
| manager | ✅ | ✅ | ✅ | ✅ | ✅ |

## API Endpoints

- `GET /api/v1/outbounds` - 목록
- `GET /api/v1/outbounds/:id` - 상세
- `POST /api/v1/outbounds` - 생성 (초안)
- `PATCH /api/v1/outbounds/:id` - 수정
- `POST /api/v1/outbounds/:id/submit` - 제출 (Phase 1)
- `POST /api/v1/outbounds/:id/approve` - 승인 (Phase 1)
- `POST /api/v1/outbounds/:id/commit` - 커밋 (Phase 1)

