# ERP App → Engine Core 통합 계획

## 현재 상황

### ✅ 완료된 작업

1. **erp-app (프론트엔드)**: Phase 0 + Phase 1 MVP 완료
   - React 18 + TypeScript + Vite
   - Items, Stocks, Inbounds, Outbounds 페이지
   - Mock API 기반
2. **erp-engine-system (백엔드)**: 이미 구축 완료
   - FastAPI + Python
   - Items, Stocks, Inbounds API 존재
   - Supabase 연동
   - RBAC 인증 시스템

---

## 🎯 통합 전략

### Option A: engine-core API 활용 (추천 🔥)

**기존 engine-core API를 그대로 사용하여 erp-app 연결**

#### 장점:

- ✅ 백엔드가 이미 완성되어 있음
- ✅ Supabase 연동 완료
- ✅ 인증 시스템 있음
- ✅ Items, Stocks API 이미 구현됨

#### 단점:

- ⚠️ API 계약 확인 필요
- ⚠️ Outbounds API 추가 필요 (engine-core에 없음)

---

## 📋 작업 계획

### Phase 2A-1: engine-core API 분석 및 실행 (1시간)

```bash
# 1. engine-core 실행
cd /Users/kjimi/erp-engine-system/engine-core
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 2. API 문서 확인
open http://localhost:8000/api/docs
```

#### 확인 사항:

- [ ] Items API 엔드포인트
- [ ] Stocks API 엔드포인트
- [ ] Inbounds API 엔드포인트
- [ ] 인증 방식 (JWT?)
- [ ] Request/Response 스키마

---

### Phase 2A-2: erp-app API 클라이언트 수정 (2-3시간)

#### 1. 환경변수 설정

```bash
# /Users/kjimi/erp-app/.env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT_MS=15000
```

#### 2. API 클라이언트 수정

**현재 구조**:

```typescript
// src/shared/services/itemApi.ts
const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK_API !== 'false'

if (USE_MOCK) {
  // Mock 데이터 반환
} else {
  // 실제 API 호출
}
```

**수정 방향**:

1. `USE_MOCK = false` 설정
2. engine-core API 스키마에 맞춰 Request/Response 수정
3. 인증 토큰 헤더 추가

#### 3. 타입 정의 조정

```typescript
// engine-core API 응답 구조에 맞춰 수정
interface ItemResponse {
  id: string
  item_code: string // snake_case
  name: string
  // ...
}
```

---

### Phase 2A-3: Outbounds API 추가 (4-6시간)

**engine-core에 Outbounds API 추가**

#### 1. 파일 생성: `/Users/kjimi/erp-engine-system/engine-core/app/api/outbounds.py`

```python
from fastapi import APIRouter, Depends
from app.models.outbound import Outbound, OutboundCreate
from app.security.rbac import require_role

router = APIRouter(prefix="/api/outbounds", tags=["Outbounds"])

@router.get("", response_model=List[Outbound])
async def list_outbounds(
    page: int = 1,
    page_size: int = 20,
    current_user = Depends(require_role(["staff", "manager"]))
):
    # Supabase query 구현
    pass

@router.post("/{id}/approve", dependencies=[Depends(require_role(["manager"]))])
async def approve_outbound(id: str):
    # Supabase RPC 호출
    pass

@router.post("/{id}/commit", dependencies=[Depends(require_role(["manager"]))])
async def commit_outbound(id: str):
    # Supabase RPC 호출 (재고 차감)
    pass
```

#### 2. main.py에 라우터 추가

```python
# /Users/kjimi/erp-engine-system/engine-core/app/main.py
from app.api.outbounds import router as outbounds_router

app.include_router(outbounds_router)
```

---

## 🔄 대안: 새 백엔드 사용 (Option B)

**방금 만든 /Users/kjimi/erp-app/backend 사용**

#### 장점:

- ✅ 프론트엔드와 완벽히 매칭
- ✅ Outbounds API 이미 설계됨

#### 단점:

- ❌ 모든 API를 새로 구현해야 함
- ❌ 시간이 더 걸림

---

## 💡 추천 방향

### **Option A 선택** (engine-core 활용)

**이유**:

1. 백엔드 80% 완성되어 있음
2. Supabase 연동 이미 완료
3. Outbounds API만 추가하면 됨

**예상 시간**:

- Phase 2A-1: 1시간 (API 분석)
- Phase 2A-2: 2-3시간 (프론트엔드 연동)
- Phase 2A-3: 4-6시간 (Outbounds API 추가)
- **총 7-10시간** (1-2일)

vs Option B: **20-30시간** (3-4일)

---

## 🚀 즉시 시작 가이드

### 1. engine-core API 실행 및 테스트

```bash
cd /Users/kjimi/erp-engine-system/engine-core
source venv/bin/activate  # venv가 있다면
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. API 문서 확인

```bash
# 브라우저에서
http://localhost:8000/api/docs
```

### 3. Items API 테스트

```bash
curl http://localhost:8000/api/items
```

### 4. 프론트엔드 연동 시작

```bash
cd /Users/kjimi/erp-app
echo "VITE_API_BASE_URL=http://localhost:8000/api" >> .env
echo "VITE_ENABLE_MOCK_API=false" >> .env
npm run dev
```

---

## ❓ 다음 액션

**어떻게 진행하시겠습니까?**

**A. engine-core API 분석 및 실행** (추천 🔥)

- → engine-core 실행
- → API 문서 확인
- → Items API 테스트
- → 프론트엔드 연동 계획 수립

**B. Outbounds API 먼저 추가**

- → engine-core에 Outbounds API 구현
- → Supabase RPC 함수 활용
- → 프론트엔드 연동

**C. 새 백엔드 완성 후 연동**

- → /Users/kjimi/erp-app/backend 완성
- → 모든 API 구현
- → 프론트엔드 연동

**D. 하이브리드 접근**

- → Items/Stocks는 engine-core 사용
- → Outbounds는 새 백엔드 사용
- → 점진적 통합

---

저는 **Option A (engine-core 활용)**를 강력히 추천합니다! 🚀

지금 바로 시작하시겠습니까?
