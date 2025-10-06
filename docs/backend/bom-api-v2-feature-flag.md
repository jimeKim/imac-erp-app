# BOM API v2 개선안 (Feature Flag + DB 제약 중심)

**목적:** 무중단 배포를 위한 단계적 개선  
**원칙:** DB 제약이 1차 방어선, 애플리케이션은 명확한 상태코드로 UX 보정  
**작성일:** 2025-10-06

---

## 📋 개선 전략 (3단계)

### Phase 1: DB 제약 추가 (데이터 무결성)

- **목표:** 데이터베이스 레벨에서 잘못된 데이터 차단
- **영향:** 기존 API 동작 변경 없음 (제약 위반 시 DB 에러 발생)
- **롤백:** 제약 제거로 즉시 복구 가능

### Phase 2: API 로직 개선 (명확한 에러 메시지)

- **목표:** 제약 위반 전에 애플리케이션에서 체크 + 명확한 HTTP 상태코드
- **Feature Flag:** `BOM_STRICT_MODE=true` 환경변수로 신규/구버전 전환
- **롤백:** Feature Flag `false`로 구버전 복귀

### Phase 3: 모니터링 및 최적화

- **목표:** 성능 지표 수집, 느린 쿼리 최적화, 인덱스 추가
- **영향:** 성능 개선만, 기능 변경 없음

---

## 🔧 Phase 1: DB 제약 추가 (Supabase Migration)

### 파일: `backend/supabase/migrations/003_bom_constraints.sql`

```sql
-- =============================================
-- BOM Components 테이블 제약 조건 추가
-- 무결성 보장: 중복 방지, 수량 검증, 순환 참조 방지
-- =============================================

-- 1. 중복 구성품 방지 (UNIQUE 제약)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_parent_component'
    ) THEN
        ALTER TABLE public.bom_components
        ADD CONSTRAINT unique_parent_component
        UNIQUE (parent_item_id, component_item_id);
    END IF;
END $$;

-- 2. 직접 순환 참조 방지 (CHECK 제약)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'no_self_reference'
    ) THEN
        ALTER TABLE public.bom_components
        ADD CONSTRAINT no_self_reference
        CHECK (parent_item_id != component_item_id);
    END IF;
END $$;

-- 3. 수량 유효성 검사 (CHECK 제약)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'valid_quantity'
    ) THEN
        ALTER TABLE public.bom_components
        ADD CONSTRAINT valid_quantity
        CHECK (quantity > 0 AND quantity <= 9999);
    END IF;
END $$;

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_bom_parent
ON public.bom_components(parent_item_id);

CREATE INDEX IF NOT EXISTS idx_bom_component
ON public.bom_components(component_item_id);

-- 복합 인덱스 (순환 참조 체크 성능 향상)
CREATE INDEX IF NOT EXISTS idx_bom_parent_component
ON public.bom_components(parent_item_id, component_item_id);

-- 5. 제약 확인 함수
CREATE OR REPLACE FUNCTION check_bom_constraints()
RETURNS TABLE(
    constraint_name TEXT,
    constraint_type TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.conname::TEXT,
        c.contype::TEXT,
        CASE
            WHEN c.convalidated THEN 'VALID'
            ELSE 'INVALID'
        END::TEXT
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'bom_components'
    AND c.contype IN ('u', 'c'); -- UNIQUE, CHECK
END;
$$ LANGUAGE plpgsql;

-- 실행 예시: SELECT * FROM check_bom_constraints();
```

### 적용 방법

```bash
# Supabase 마이그레이션 실행
ssh root@139.59.110.55
cd /opt/erp-backend
source venv/bin/activate

# 마이그레이션 파일 업로드
scp backend/supabase/migrations/003_bom_constraints.sql root@139.59.110.55:/tmp/

# Supabase CLI로 적용 (또는 Supabase Dashboard에서 SQL 실행)
psql -U postgres -d erp_db -f /tmp/003_bom_constraints.sql

# 제약 확인
psql -U postgres -d erp_db -c "SELECT * FROM check_bom_constraints();"
```

### 롤백 방법

```sql
-- 제약 제거 (필요시)
ALTER TABLE public.bom_components DROP CONSTRAINT IF EXISTS unique_parent_component;
ALTER TABLE public.bom_components DROP CONSTRAINT IF EXISTS no_self_reference;
ALTER TABLE public.bom_components DROP CONSTRAINT IF EXISTS valid_quantity;
```

---

## 🚀 Phase 2: API 로직 개선 (Feature Flag)

### 환경변수 설정

**파일:** `/opt/erp-backend/.env`

```bash
# BOM 엄격 모드 (Feature Flag)
BOM_STRICT_MODE=true  # true: 신규 검증 로직, false: 구버전 호환

# 순환 참조 체크 최대 깊이
BOM_MAX_DEPTH=10

# 로그 레벨
LOG_LEVEL=INFO
```

### Pydantic 모델 정의

**파일:** `/opt/erp-backend/app/schemas/bom.py`

```python
from pydantic import BaseModel, Field, validator
from typing import Optional
from uuid import UUID

class BomComponentCreate(BaseModel):
    """BOM 구성품 생성 요청"""
    component_item_id: UUID = Field(..., description="구성품 아이템 ID")
    quantity: float = Field(
        gt=0,
        le=9999,
        description="수량 (0보다 크고 9999 이하)"
    )
    unit: str = Field(default="EA", max_length=10, description="단위")
    notes: Optional[str] = Field(None, max_length=500, description="메모")

    @validator('quantity')
    def validate_quantity(cls, v):
        """수량 소수점 자리 제한 (최대 4자리)"""
        if round(v, 4) != v:
            raise ValueError('수량은 소수점 4자리까지 허용됩니다')
        return v

class BomComponentResponse(BaseModel):
    """BOM 구성품 응답"""
    id: UUID
    parent_item_id: UUID
    component_item_id: UUID
    quantity: float
    unit: str
    sequence: Optional[int]
    notes: Optional[str]
    created_at: str
    updated_at: str

class BomErrorDetail(BaseModel):
    """구조화된 에러 응답"""
    error: str  # 에러 코드: duplicate_component, circular_reference, invalid_quantity
    message: str  # 사용자 친화적 메시지
    details: Optional[dict] = None  # 추가 정보
```

### API 엔드포인트 개선

**파일:** `/opt/erp-backend/app/main.py`

```python
import os
from fastapi import HTTPException, Depends, status
from app.schemas.bom import BomComponentCreate, BomComponentResponse, BomErrorDetail
import logging

logger = logging.getLogger(__name__)

# Feature Flag
BOM_STRICT_MODE = os.getenv("BOM_STRICT_MODE", "false").lower() == "true"
BOM_MAX_DEPTH = int(os.getenv("BOM_MAX_DEPTH", "10"))


def check_circular_reference(
    parent_id: str,
    target_id: str,
    supabase_client,
    visited: set = None,
    depth: int = 0
) -> bool:
    """
    재귀적으로 순환 참조 체크

    Args:
        parent_id: 현재 검사 중인 상위 항목
        target_id: 추가하려는 구성품
        supabase_client: Supabase 클라이언트
        visited: 방문한 노드 집합 (순환 방지)
        depth: 현재 깊이

    Returns:
        bool: 순환 참조 발견 시 True
    """
    if visited is None:
        visited = set()

    # 최대 깊이 제한 (성능)
    if depth > BOM_MAX_DEPTH:
        logger.warning(f"BOM depth exceeded {BOM_MAX_DEPTH}: parent={parent_id}, target={target_id}")
        return False

    # 이미 방문한 노드 (순환 방지)
    if target_id in visited:
        return False

    visited.add(target_id)

    # target_id의 하위 구성품들을 조회
    try:
        result = supabase_client.table("bom_components")\
            .select("component_item_id")\
            .eq("parent_item_id", target_id)\
            .execute()

        children = result.data or []

        for child in children:
            child_id = child["component_item_id"]

            # 하위 구성품이 최초 parent와 같으면 순환 참조
            if child_id == parent_id:
                logger.warning(
                    f"Circular reference detected: {parent_id} -> ... -> {target_id} -> {child_id}"
                )
                return True

            # 재귀 검사
            if check_circular_reference(parent_id, child_id, supabase_client, visited, depth + 1):
                return True

        return False

    except Exception as e:
        logger.error(f"Error checking circular reference: {e}", exc_info=True)
        return False


@app.post(
    "/api/v1/items/{item_id}/bom/components",
    response_model=dict,
    status_code=status.HTTP_201_CREATED
)
async def add_bom_component(
    item_id: str,
    component_data: BomComponentCreate,
    current_user: dict = Depends(get_current_user)  # 권한 체크
):
    """
    BOM 구성품 추가

    - Feature Flag `BOM_STRICT_MODE`로 신규/구버전 전환
    - DB 제약이 1차 방어선, API는 명확한 에러 메시지 제공
    """
    try:
        # 권한 체크 (admin, manager, staff만 가능)
        if current_user.get("role") not in ["admin", "manager", "staff"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "insufficient_permissions",
                    "message": "구성품 추가 권한이 없습니다"
                }
            )

        # Feature Flag: 엄격 모드에서만 사전 검증
        if BOM_STRICT_MODE:
            # 1. 직접 순환 참조 체크
            if str(component_data.component_item_id) == item_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "error": "circular_reference",
                        "message": "상품을 자기 자신의 구성품으로 추가할 수 없습니다"
                    }
                )

            # 2. 중복 구성품 체크
            existing = supabase.table("bom_components")\
                .select("id")\
                .eq("parent_item_id", item_id)\
                .eq("component_item_id", str(component_data.component_item_id))\
                .execute()

            if existing.data:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "error": "duplicate_component",
                        "message": "이미 등록된 구성품입니다"
                    }
                )

            # 3. 간접 순환 참조 체크
            if check_circular_reference(
                item_id,
                str(component_data.component_item_id),
                supabase
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "error": "circular_reference",
                        "message": "순환 참조가 발생합니다. 이 구성품은 이미 상위 항목을 포함하고 있습니다",
                        "details": {
                            "parent_id": item_id,
                            "component_id": str(component_data.component_item_id)
                        }
                    }
                )

        # 4. 다음 sequence 번호 계산
        max_seq = supabase.table("bom_components")\
            .select("sequence")\
            .eq("parent_item_id", item_id)\
            .order("sequence", desc=True)\
            .limit(1)\
            .execute()

        next_sequence = 1
        if max_seq.data and max_seq.data[0].get("sequence") is not None:
            next_sequence = max_seq.data[0]["sequence"] + 1

        # 5. BOM 구성품 추가
        insert_data = {
            "parent_item_id": item_id,
            "component_item_id": str(component_data.component_item_id),
            "quantity": component_data.quantity,
            "unit": component_data.unit,
            "sequence": next_sequence,
        }

        if component_data.notes:
            insert_data["notes"] = component_data.notes

        result = supabase.table("bom_components").insert(insert_data).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "insert_failed",
                    "message": "구성품 추가에 실패했습니다"
                }
            )

        # 6. 성공 로깅
        logger.info(
            f"BOM_COMPONENT_ADDED: "
            f"tenant={current_user.get('tenant_id', 'N/A')}, "
            f"parent={item_id}, "
            f"child={component_data.component_item_id}, "
            f"qty={component_data.quantity}, "
            f"user={current_user.get('id', 'N/A')}"
        )

        return {
            "success": True,
            "data": result.data[0]
        }

    except HTTPException:
        raise  # FastAPI가 자동 처리

    except Exception as e:
        # 7. DB 제약 위반 에러 처리
        error_message = str(e).lower()

        if "unique_parent_component" in error_message:
            # DB 제약: 중복 구성품
            logger.warning(
                f"BOM_COMPONENT_ADD_ERROR: reason=duplicate, "
                f"parent={item_id}, child={component_data.component_item_id}, "
                f"user={current_user.get('id', 'N/A')}"
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": "duplicate_component",
                    "message": "이미 등록된 구성품입니다 (DB 제약)"
                }
            )

        elif "no_self_reference" in error_message:
            # DB 제약: 자기 참조
            logger.warning(
                f"BOM_COMPONENT_ADD_ERROR: reason=self_reference, "
                f"parent={item_id}, child={component_data.component_item_id}, "
                f"user={current_user.get('id', 'N/A')}"
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": "circular_reference",
                    "message": "상품을 자기 자신의 구성품으로 추가할 수 없습니다 (DB 제약)"
                }
            )

        elif "valid_quantity" in error_message:
            # DB 제약: 수량 유효성
            logger.warning(
                f"BOM_COMPONENT_ADD_ERROR: reason=invalid_quantity, "
                f"parent={item_id}, qty={component_data.quantity}, "
                f"user={current_user.get('id', 'N/A')}"
            )
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error": "invalid_quantity",
                    "message": "수량은 0보다 크고 9999 이하여야 합니다 (DB 제약)"
                }
            )

        else:
            # 8. 예상치 못한 에러
            logger.error(
                f"BOM_COMPONENT_ADD_ERROR: reason=unknown, "
                f"parent={item_id}, error={str(e)}, "
                f"user={current_user.get('id', 'N/A')}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "internal_error",
                    "message": "서버 오류가 발생했습니다"
                }
            )
```

### 배포 전략

```bash
# 1. DB 제약 먼저 적용 (Phase 1)
# → 기존 API 동작 변경 없음, DB가 잘못된 데이터 차단

# 2. 백엔드 코드 배포 (Phase 2) with BOM_STRICT_MODE=false
# → 구버전 호환 모드로 배포

# 3. 모니터링 (1~2일)
# → DB 제약 위반 로그 확인

# 4. Feature Flag 활성화: BOM_STRICT_MODE=true
# → 신규 검증 로직 활성화

# 5. 성능 모니터링 (Phase 3)
# → 느린 쿼리 식별 및 인덱스 최적화
```

---

## 📊 Phase 3: 모니터링 및 최적화

### 로그 수집 쿼리

```sql
-- 일일 통계 (Supabase 또는 PostgreSQL에서 실행)
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_additions,
    COUNT(DISTINCT parent_item_id) as unique_parents,
    AVG(quantity) as avg_quantity,
    MAX(quantity) as max_quantity
FROM public.bom_components
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 느린 쿼리 식별

```sql
-- 순환 참조 체크 성능 분석
EXPLAIN ANALYZE
SELECT component_item_id
FROM public.bom_components
WHERE parent_item_id = '59e04536-0f1f-41a9-8fb3-33c71477999f';

-- 인덱스 사용 확인
-- idx_bom_parent_component 사용 여부 확인
```

### 추가 인덱스 (필요시)

```sql
-- BOM 트리 조회 최적화
CREATE INDEX IF NOT EXISTS idx_bom_tree
ON public.bom_components(parent_item_id, component_item_id, sequence);

-- 통계 조회 최적화
CREATE INDEX IF NOT EXISTS idx_bom_created_at
ON public.bom_components(created_at DESC);
```

---

## ✅ 체크리스트

### Phase 1: DB 제약

- [ ] 마이그레이션 파일 작성: `003_bom_constraints.sql`
- [ ] 제약 적용 실행
- [ ] 제약 확인: `SELECT * FROM check_bom_constraints();`
- [ ] 기존 데이터 제약 위반 확인 및 수정

### Phase 2: API 개선

- [ ] Pydantic 모델 정의: `app/schemas/bom.py`
- [ ] API 로직 개선: `app/main.py`
- [ ] Feature Flag 설정: `.env` 파일
- [ ] 로깅 구조화 확인
- [ ] 에러 메시지 다국어 지원 (선택)

### Phase 3: 모니터링

- [ ] 성능 지표 수집 쿼리 작성
- [ ] 느린 쿼리 식별
- [ ] 인덱스 추가 (필요시)
- [ ] 대시보드 구성 (Grafana/Metabase 등)

---

## 🔄 롤백 플랜

### 시나리오 1: DB 제약 문제 (Phase 1)

```sql
-- 제약 즉시 제거
ALTER TABLE public.bom_components DROP CONSTRAINT unique_parent_component;
ALTER TABLE public.bom_components DROP CONSTRAINT no_self_reference;
ALTER TABLE public.bom_components DROP CONSTRAINT valid_quantity;
```

### 시나리오 2: API 로직 문제 (Phase 2)

```bash
# Feature Flag 비활성화
ssh root@139.59.110.55
echo "BOM_STRICT_MODE=false" >> /opt/erp-backend/.env
systemctl restart erp-engine
```

### 시나리오 3: 성능 저하 (Phase 3)

```sql
-- 인덱스 제거
DROP INDEX IF EXISTS idx_bom_tree;
```

---

**문서 버전:** v2.0  
**최종 수정:** 2025-10-06  
**담당자:** Backend Team
