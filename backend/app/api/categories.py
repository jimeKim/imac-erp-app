"""
Categories API
상품 카테고리 CRUD API
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from app.core.supabase import supabase
from app.core.auth import get_current_user_with_permission

router = APIRouter(prefix="/categories", tags=["categories"])


# ============================================================================
# Pydantic Models
# ============================================================================

class CategoryBase(BaseModel):
    """카테고리 기본 모델"""
    name: str = Field(..., min_length=1, max_length=100, description="카테고리 이름")
    description: Optional[str] = Field(None, description="카테고리 설명")
    is_active: bool = Field(True, description="활성화 여부")
    parent_id: Optional[str] = Field(None, description="부모 카테고리 ID")
    sequence: Optional[int] = Field(0, description="정렬 순서")


class CategoryCreate(CategoryBase):
    """카테고리 생성 요청"""
    pass


class CategoryUpdate(BaseModel):
    """카테고리 수정 요청"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    parent_id: Optional[str] = None
    sequence: Optional[int] = None


class Category(CategoryBase):
    """카테고리 응답 모델"""
    id: str
    level: int = Field(0, description="계층 깊이 (0=루트)")
    path: str = Field("", description="전체 경로")
    created_at: str
    updated_at: str
    item_count: int = Field(0, description="해당 카테고리의 상품 수")
    children: List['Category'] = Field([], description="하위 카테고리 목록")

    class Config:
        from_attributes = True


# Pydantic 순환 참조 해결
Category.model_rebuild()


class CategoriesResponse(BaseModel):
    """카테고리 목록 응답"""
    data: List[Category]
    count: int


# ============================================================================
# Helper Functions
# ============================================================================

def build_category_tree(categories: List[dict], parent_id: Optional[str] = None) -> List[Category]:
    """
    Flat 카테고리 목록을 트리 구조로 변환
    """
    tree = []
    
    # 현재 레벨의 카테고리 필터링
    current_level = [cat for cat in categories if cat.get("parent_id") == parent_id]
    
    for cat in current_level:
        # 하위 카테고리 재귀 조회
        cat["children"] = build_category_tree(categories, cat["id"])
        tree.append(Category(**cat))
    
    return tree


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/tree", response_model=List[Category])
async def get_categories_tree(
    include_inactive: bool = False,
    current_user: dict = Depends(get_current_user_with_permission("items:read"))
):
    """
    카테고리 계층 구조 조회 (트리 형태)
    
    - **include_inactive**: 비활성 카테고리 포함 여부 (default: False)
    - 루트 카테고리부터 하위 카테고리까지 재귀적으로 반환
    """
    try:
        # 모든 카테고리 조회
        query = supabase.from_("categories").select("*").order("sequence, name")
        
        if not include_inactive:
            query = query.eq("is_active", True)
        
        response = query.execute()
        categories = response.data or []
        
        # 각 카테고리의 상품 수 계산
        for cat in categories:
            count_response = supabase.from_("items").select("id", count="exact").eq("category_id", cat["id"]).execute()
            cat["item_count"] = count_response.count or 0
            cat["children"] = []  # 초기화
        
        # 트리 구조로 변환
        tree = build_category_tree(categories, parent_id=None)
        
        return tree
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch category tree: {str(e)}")


@router.get("", response_model=CategoriesResponse)
async def get_categories(
    include_inactive: bool = False,
    level: Optional[int] = None,
    current_user: dict = Depends(get_current_user_with_permission("items:read"))
):
    """
    카테고리 목록 조회 (Flat 리스트)
    
    - **include_inactive**: 비활성 카테고리 포함 여부 (default: False)
    - **level**: 특정 레벨만 조회 (0=루트, 1=1단계 하위, ...)
    """
    try:
        # 카테고리 조회
        query = supabase.from_("categories").select("*").order("path")
        
        if not include_inactive:
            query = query.eq("is_active", True)
        
        if level is not None:
            query = query.eq("level", level)
        
        response = query.execute()
        categories = response.data or []
        
        # 각 카테고리의 상품 수 계산
        for cat in categories:
            count_response = supabase.from_("items").select("id", count="exact").eq("category_id", cat["id"]).execute()
            cat["item_count"] = count_response.count or 0
            cat["children"] = []  # Flat 리스트이므로 빈 배열
        
        return CategoriesResponse(
            data=categories,
            count=len(categories)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")


@router.get("/{category_id}", response_model=Category)
async def get_category(
    category_id: str,
    current_user: dict = Depends(get_current_user_with_permission("items:read"))
):
    """특정 카테고리 조회 (하위 카테고리 포함)"""
    try:
        response = supabase.from_("categories").select("*").eq("id", category_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Category not found")
        
        category = response.data
        
        # 상품 수 조회
        count_response = supabase.from_("items").select("id", count="exact").eq("category_id", category_id).execute()
        category["item_count"] = count_response.count or 0
        
        # 하위 카테고리 조회
        children_response = supabase.from_("categories").select("*").eq("parent_id", category_id).order("sequence, name").execute()
        category["children"] = children_response.data or []
        
        return Category(**category)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch category: {str(e)}")


@router.post("", response_model=Category, status_code=201)
async def create_category(
    category_in: CategoryCreate,
    current_user: dict = Depends(get_current_user_with_permission("items:create"))
):
    """
    새 카테고리 생성
    
    - **name**: 카테고리 이름 (중복 불가)
    - **description**: 카테고리 설명
    - **parent_id**: 부모 카테고리 ID (선택, 없으면 루트 카테고리)
    - **sequence**: 정렬 순서 (선택)
    - **is_active**: 활성화 여부 (default: true)
    
    level과 path는 트리거에 의해 자동 계산됩니다.
    """
    try:
        # 중복 확인
        existing = supabase.from_("categories").select("id").eq("name", category_in.name).execute()
        if existing.data:
            raise HTTPException(
                status_code=409,
                detail=f"Category with name '{category_in.name}' already exists"
            )
        
        # 부모 카테고리 존재 확인
        if category_in.parent_id:
            parent = supabase.from_("categories").select("id").eq("id", category_in.parent_id).single().execute()
            if not parent.data:
                raise HTTPException(status_code=404, detail="Parent category not found")
        
        # 카테고리 생성 (level, path는 트리거에서 자동 계산)
        response = supabase.from_("categories").insert(category_in.model_dump()).execute()
        
        if response.data:
            category = response.data[0]
            category["item_count"] = 0
            category["children"] = []
            return Category(**category)
        
        raise HTTPException(status_code=500, detail="Failed to create category")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")


@router.patch("/{category_id}", response_model=Category)
async def update_category(
    category_id: str,
    category_in: CategoryUpdate,
    current_user: dict = Depends(get_current_user_with_permission("items:update"))
):
    """
    카테고리 수정
    
    - **name**: 카테고리 이름 (선택)
    - **description**: 카테고리 설명 (선택)
    - **parent_id**: 부모 카테고리 ID 변경 (선택)
    - **sequence**: 정렬 순서 (선택)
    - **is_active**: 활성화 여부 (선택)
    
    level과 path는 트리거에 의해 자동 재계산됩니다.
    """
    try:
        # 존재 확인
        existing = supabase.from_("categories").select("*").eq("id", category_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # 이름 중복 확인 (이름 변경 시)
        if category_in.name and category_in.name != existing.data["name"]:
            duplicate = supabase.from_("categories").select("id").eq("name", category_in.name).execute()
            if duplicate.data:
                raise HTTPException(
                    status_code=409,
                    detail=f"Category with name '{category_in.name}' already exists"
                )
        
        # 부모 카테고리 변경 시 순환 참조 방지
        if category_in.parent_id and category_in.parent_id != existing.data.get("parent_id"):
            # 자기 자신을 부모로 설정 방지
            if category_in.parent_id == category_id:
                raise HTTPException(status_code=400, detail="Cannot set self as parent")
            
            # 부모 카테고리 존재 확인
            parent = supabase.from_("categories").select("id, path").eq("id", category_in.parent_id).single().execute()
            if not parent.data:
                raise HTTPException(status_code=404, detail="Parent category not found")
            
            # 하위 카테고리를 부모로 설정하려는 시도 방지
            if parent.data["path"].startswith(existing.data["path"] + "/"):
                raise HTTPException(status_code=400, detail="Cannot set descendant as parent")
        
        # 업데이트할 데이터만 추출
        update_data = category_in.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # 카테고리 수정 (level, path는 트리거에서 자동 재계산)
        response = supabase.from_("categories").update(update_data).eq("id", category_id).execute()
        
        if response.data:
            category = response.data[0]
            # 상품 수 조회
            count_response = supabase.from_("items").select("id", count="exact").eq("category_id", category_id).execute()
            category["item_count"] = count_response.count or 0
            category["children"] = []
            return Category(**category)
        
        raise HTTPException(status_code=500, detail="Failed to update category")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update category: {str(e)}")


@router.delete("/{category_id}", status_code=204)
async def delete_category(
    category_id: str,
    force: bool = False,
    current_user: dict = Depends(get_current_user_with_permission("items:delete"))
):
    """
    카테고리 삭제
    
    - **force**: true인 경우 하위 카테고리/상품이 있어도 삭제 (CASCADE)
    - **force**: false인 경우 하위 카테고리/상품이 있으면 삭제 불가 (default)
    """
    try:
        # 존재 확인
        existing = supabase.from_("categories").select("id").eq("id", category_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # 하위 카테고리 확인
        children_response = supabase.from_("categories").select("id", count="exact").eq("parent_id", category_id).execute()
        children_count = children_response.count or 0
        
        if children_count > 0 and not force:
            raise HTTPException(
                status_code=409,
                detail=f"Cannot delete category with {children_count} child categories. Use force=true to delete anyway."
            )
        
        # 상품 수 확인
        items_response = supabase.from_("items").select("id", count="exact").eq("category_id", category_id).execute()
        item_count = items_response.count or 0
        
        if item_count > 0 and not force:
            raise HTTPException(
                status_code=409,
                detail=f"Cannot delete category with {item_count} items. Use force=true to delete anyway."
            )
        
        # 카테고리 삭제 (CASCADE로 인해 하위 카테고리도 자동 삭제, 상품의 category_id는 NULL로 변경)
        supabase.from_("categories").delete().eq("id", category_id).execute()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")


@router.post("/{category_id}/toggle", response_model=Category)
async def toggle_category_status(
    category_id: str,
    current_user: dict = Depends(get_current_user_with_permission("items:update"))
):
    """카테고리 활성화/비활성화 토글"""
    try:
        # 현재 상태 조회
        existing = supabase.from_("categories").select("is_active").eq("id", category_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # 상태 토글
        new_status = not existing.data["is_active"]
        response = supabase.from_("categories").update({"is_active": new_status}).eq("id", category_id).execute()
        
        if response.data:
            category = response.data[0]
            # 상품 수 조회
            count_response = supabase.from_("items").select("id", count="exact").eq("category_id", category_id).execute()
            category["item_count"] = count_response.count or 0
            category["children"] = []
            return Category(**category)
        
        raise HTTPException(status_code=500, detail="Failed to toggle category status")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle category status: {str(e)}")
