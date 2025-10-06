"""
Items API
상품 CRUD API with Classification Scheme Validation

Phase 1: item_type 기반 검증 (BOM/라우팅 필수)
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from app.core.supabase import supabase
from app.core.auth import get_current_user_with_permission
from app.config.classification_schemes import (
    get_scheme,
    get_behavior_flags,
    map_legacy_type,
    LEGACY_TYPE_MAPPING
)

router = APIRouter(
    prefix="/api/v1/items",
    tags=["Items"]
)


# ============================================================================
# Pydantic Models
# ============================================================================

class ItemBase(BaseModel):
    sku: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category_id: Optional[str] = None
    item_type: str = Field(..., description="분류 코드 (FG, SF, MOD, PT, RM, MR, CS, PKG)")
    uom: str = Field("EA", description="단위")
    unit_cost: Optional[float] = None
    status: str = Field("active", description="상태")


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    item_type: Optional[str] = None
    uom: Optional[str] = None
    unit_cost: Optional[float] = None
    status: Optional[str] = None


class Item(ItemBase):
    id: str
    created_at: str
    updated_at: str


class ItemsResponse(BaseModel):
    data: List[Item]
    count: int


# ============================================================================
# Validation Logic
# ============================================================================

def validate_item_before_save(
    item_type: str,
    item_id: Optional[str] = None,
    scheme_id: str = "simple"
) -> None:
    """
    상품 저장 전 검증
    
    Args:
        item_type: 상품 분류 코드 (FG, SF, MOD...)
        item_id: 상품 ID (수정 시)
        scheme_id: 분류 체계 스킴 ID
        
    Raises:
        HTTPException: 검증 실패 시
    """
    # 1. 기존 item_type을 새 스킴 코드로 매핑
    scheme_code = map_legacy_type(item_type)
    
    # 2. 행동 플래그 조회
    flags = get_behavior_flags(scheme_id, scheme_code)
    
    if not flags:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "invalid_classification",
                "message": f"유효하지 않은 분류 코드: {item_type}"
            }
        )
    
    # 3. BOM 필수 검증
    if flags["requires_bom"]:
        # BOM 연결 확인
        if item_id:
            response = supabase.table("items_bom").select("id").eq("parent_item_id", item_id).execute()
            has_bom = len(response.data) > 0
        else:
            has_bom = False  # 신규 생성 시에는 BOM 없음 (생성 후 추가 가능)
        
        # Phase 1: 경고만 (나중에 강제로 변경 가능)
        # if not has_bom and item_id:  # 수정 시에만 체크
        #     raise HTTPException(
        #         status_code=422,
        #         detail={
        #             "code": "bom_required",
        #             "message": f"이 분류({scheme_code})는 BOM 연결이 필요합니다.",
        #             "item_type": item_type,
        #             "scheme_code": scheme_code
        #         }
        #     )
    
    # 4. 라우팅 필수 검증
    if flags["requires_routing"]:
        # 공정/라우팅 연결 확인
        # Phase 1: 라우팅 테이블이 없으므로 스킵
        # if item_id:
        #     response = supabase.table("item_routings").select("id").eq("item_id", item_id).execute()
        #     has_routing = len(response.data) > 0
        # else:
        #     has_routing = False
        
        # Phase 1: 경고만
        pass
    
    # 검증 통과
    return None


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("", response_model=Item, status_code=201)
async def create_item(
    item_in: ItemCreate,
    current_user: dict = Depends(get_current_user_with_permission("items:create"))
):
    """
    상품 생성
    
    **검증 규칙:**
    - BOM 필수: ASSEMBLY, PRODUCTION
    - 라우팅 필수: PRODUCTION
    """
    # 1. 분류 검증
    validate_item_before_save(item_in.item_type, scheme_id="simple")
    
    # 2. SKU 중복 체크
    existing = supabase.table("items").select("id").eq("sku", item_in.sku).execute()
    if existing.data:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "sku_duplicate",
                "message": f"이미 존재하는 SKU입니다: {item_in.sku}"
            }
        )
    
    # 3. 상품 생성
    response = supabase.table("items").insert({
        "sku": item_in.sku,
        "name": item_in.name,
        "description": item_in.description,
        "category_id": item_in.category_id,
        "item_type": item_in.item_type,
        "uom": item_in.uom,
        "unit_cost": item_in.unit_cost,
        "status": item_in.status
    }).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create item")
    
    return Item(**response.data[0])


@router.get("/{item_id}", response_model=Item)
async def get_item(
    item_id: str,
    current_user: dict = Depends(get_current_user_with_permission("items:read"))
):
    """상품 상세 조회"""
    response = supabase.table("items").select("*").eq("id", item_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return Item(**response.data[0])


@router.get("", response_model=ItemsResponse)
async def get_items(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    item_type: Optional[str] = None,
    category_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user_with_permission("items:read"))
):
    """상품 목록 조회"""
    query = supabase.table("items").select("*", count="exact")
    
    # 필터 적용
    if status:
        query = query.eq("status", status)
    if item_type:
        query = query.eq("item_type", item_type)
    if category_id:
        query = query.eq("category_id", category_id)
    
    # 페이지네이션
    query = query.range(skip, skip + limit - 1)
    
    response = query.execute()
    
    return ItemsResponse(
        data=[Item(**item) for item in response.data],
        count=response.count or 0
    )


@router.patch("/{item_id}", response_model=Item)
async def update_item(
    item_id: str,
    item_in: ItemUpdate,
    current_user: dict = Depends(get_current_user_with_permission("items:update"))
):
    """
    상품 수정
    
    **검증 규칙:**
    - item_type 변경 시 BOM/라우팅 필수 검증
    """
    # 1. 기존 상품 조회
    existing = supabase.table("items").select("*").eq("id", item_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # 2. 분류가 변경되면 검증
    if item_in.item_type and item_in.item_type != existing.data[0]["item_type"]:
        validate_item_before_save(item_in.item_type, item_id=item_id, scheme_id="simple")
    
    # 3. 업데이트 데이터 준비
    update_data = {k: v for k, v in item_in.dict(exclude_unset=True).items() if v is not None}
    
    if not update_data:
        return Item(**existing.data[0])
    
    # 4. 상품 수정
    response = supabase.table("items").update(update_data).eq("id", item_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update item")
    
    return Item(**response.data[0])


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: str,
    current_user: dict = Depends(get_current_user_with_permission("items:delete"))
):
    """상품 삭제"""
    # 1. BOM 연결 확인
    bom_response = supabase.table("items_bom").select("id").eq("parent_item_id", item_id).execute()
    if bom_response.data:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "bom_exists",
                "message": "BOM이 연결된 상품은 삭제할 수 없습니다."
            }
        )
    
    # 2. 상품 삭제
    response = supabase.table("items").delete().eq("id", item_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return None


# ============================================================================
# Helper Endpoint: 분류 체계 정보 조회
# ============================================================================

@router.get("/classification/schemes", response_model=dict)
async def get_classification_schemes(
    current_user: dict = Depends(get_current_user_with_permission("items:read"))
):
    """
    사용 가능한 분류 체계 목록 조회
    
    **Phase 1:** simple 스킴만 제공
    """
    scheme = get_scheme("simple")
    
    return {
        "current_scheme": "simple",
        "available_schemes": ["simple"],
        "scheme": {
            "id": scheme["id"],
            "name": scheme["name"],
            "description": scheme["description"],
            "labels": [
                {
                    "code": label["code"],
                    "name": label["name"],
                    "description": label["description"],
                    "icon": label["icon"],
                    "behavior": label["behavior"]
                }
                for label in scheme["labels"]
            ]
        },
        "legacy_mapping": LEGACY_TYPE_MAPPING
    }
