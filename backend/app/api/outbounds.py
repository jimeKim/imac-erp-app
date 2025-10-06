"""
Outbounds API - 출고 관리
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.core.supabase import supabase
from app.core.config import settings

router = APIRouter(prefix="/api/v1/outbounds", tags=["Outbounds"])


# === 요청/응답 모델 ===

class OutboundItemCreate(BaseModel):
    """출고 라인 생성"""
    item_id: str
    qty: float = Field(gt=0)
    unit_price: float = Field(ge=0, default=0)


class OutboundItemUpdate(BaseModel):
    """출고 라인 수정"""
    qty: Optional[float] = Field(None, gt=0)
    unit_price: Optional[float] = Field(None, ge=0)


class OutboundCreate(BaseModel):
    """출고 문서 생성"""
    store_id: Optional[str] = None
    customer_id: Optional[str] = None
    memo: Optional[str] = None
    items: List[OutboundItemCreate] = []


class OutboundUpdate(BaseModel):
    """출고 메타 업데이트"""
    store_id: Optional[str] = None
    customer_id: Optional[str] = None
    memo: Optional[str] = None


# === 유틸리티 함수 ===

def generate_outbound_no() -> str:
    """출고 문서번호 생성: YYYYMMDD-####"""
    today = datetime.now().strftime("%Y%m%d")
    
    # 오늘 생성된 출고 문서 카운트
    result = supabase.table("outbounds")\
        .select("outbound_no")\
        .like("outbound_no", f"{today}-%")\
        .execute()
    
    count = len(result.data) + 1
    return f"{today}-{count:04d}"


def log_flow(entity_id: str, from_status: Optional[str], to_status: str, actor: str = "system"):
    """flows 테이블에 상태 전이 기록"""
    try:
        supabase.table("flows").insert({
            "entity_type": "outbound",
            "entity_id": entity_id,
            "from_status": from_status,
            "to_status": to_status,
            "actor": actor,
            "payload": {"timestamp": datetime.utcnow().isoformat()}
        }).execute()
    except Exception as e:
        print(f"[WARN] Flow logging failed: {e}")


# === API 엔드포인트 ===

@router.get("/")
def list_outbounds(
    status: Optional[str] = None,
    q: Optional[str] = None,
    page: int = 1,
    size: int = 20
):
    """출고 목록 조회"""
    try:
        skip = (page - 1) * size
        query = supabase.table("outbounds").select("*", count="exact")
        
        # 상태 필터
        if status:
            query = query.eq("status", status.upper())
        
        # 검색어 필터 (문서번호, 메모)
        if q:
            query = query.or_(f"outbound_no.ilike.%{q}%,memo.ilike.%{q}%")
        
        result = query.order("created_at", desc=True)\
            .range(skip, skip + size - 1)\
            .execute()
        
        return {
            "data": result.data,
            "total": result.count,
            "page": page,
            "size": size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", status_code=201)
def create_outbound(data: OutboundCreate):
    """출고 문서 생성 (DRAFT 상태)"""
    try:
        # 문서 생성
        outbound_no = generate_outbound_no()
        result = supabase.table("outbounds").insert({
            "outbound_no": outbound_no,
            "status": "DRAFT",
            "store_id": data.store_id,
            "customer_id": data.customer_id,
            "memo": data.memo
        }).execute()
        
        outbound = result.data[0]
        outbound_id = outbound["id"]
        
        # 라인 아이템 추가
        items_data = []
        for item in data.items:
            items_data.append({
                "outbound_id": outbound_id,
                "item_id": item.item_id,
                "qty": item.qty,
                "unit_price": item.unit_price
            })
        
        if items_data:
            supabase.table("outbound_items").insert(items_data).execute()
        
        # Flow 기록
        log_flow(outbound_id, None, "DRAFT", "user:system")
        
        return {
            "id": outbound_id,
            "outbound_no": outbound_no,
            "status": "DRAFT",
            "items": items_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{outbound_id}")
def get_outbound(outbound_id: str):
    """출고 문서 상세 조회"""
    try:
        # 문서 조회
        result = supabase.table("outbounds")\
            .select("*")\
            .eq("id", outbound_id)\
            .single()\
            .execute()
        
        outbound = result.data
        
        # 라인 아이템 조회
        items_result = supabase.table("outbound_items")\
            .select("*")\
            .eq("outbound_id", outbound_id)\
            .execute()
        
        outbound["items"] = items_result.data
        
        return {"data": outbound}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Outbound not found")


@router.patch("/{outbound_id}")
def update_outbound(outbound_id: str, data: OutboundUpdate):
    """출고 메타 업데이트 (DRAFT만 가능)"""
    try:
        # 상태 확인
        result = supabase.table("outbounds")\
            .select("status")\
            .eq("id", outbound_id)\
            .single()\
            .execute()
        
        if result.data["status"] != "DRAFT":
            raise HTTPException(status_code=400, detail="Only DRAFT outbounds can be updated")
        
        # 업데이트
        update_data = data.dict(exclude_none=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        supabase.table("outbounds")\
            .update(update_data)\
            .eq("id", outbound_id)\
            .execute()
        
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{outbound_id}/items")
def add_outbound_item(outbound_id: str, item: OutboundItemCreate):
    """라인 아이템 추가 (DRAFT만 가능)"""
    try:
        # 상태 확인
        result = supabase.table("outbounds")\
            .select("status")\
            .eq("id", outbound_id)\
            .single()\
            .execute()
        
        if result.data["status"] != "DRAFT":
            raise HTTPException(status_code=400, detail="Only DRAFT outbounds can add items")
        
        # 라인 추가
        supabase.table("outbound_items").insert({
            "outbound_id": outbound_id,
            "item_id": item.item_id,
            "qty": item.qty,
            "unit_price": item.unit_price
        }).execute()
        
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{outbound_id}/items/{item_id}")
def update_outbound_item(outbound_id: str, item_id: str, data: OutboundItemUpdate):
    """라인 아이템 수정 (DRAFT만 가능)"""
    try:
        # 상태 확인
        result = supabase.table("outbounds")\
            .select("status")\
            .eq("id", outbound_id)\
            .single()\
            .execute()
        
        if result.data["status"] != "DRAFT":
            raise HTTPException(status_code=400, detail="Only DRAFT outbounds can update items")
        
        # 라인 수정
        update_data = data.dict(exclude_none=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        supabase.table("outbound_items")\
            .update(update_data)\
            .eq("id", item_id)\
            .eq("outbound_id", outbound_id)\
            .execute()
        
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{outbound_id}/items/{item_id}")
def delete_outbound_item(outbound_id: str, item_id: str):
    """라인 아이템 삭제 (DRAFT만 가능)"""
    try:
        # 상태 확인
        result = supabase.table("outbounds")\
            .select("status")\
            .eq("id", outbound_id)\
            .single()\
            .execute()
        
        if result.data["status"] != "DRAFT":
            raise HTTPException(status_code=400, detail="Only DRAFT outbounds can delete items")
        
        # 라인 삭제
        supabase.table("outbound_items")\
            .delete()\
            .eq("id", item_id)\
            .eq("outbound_id", outbound_id)\
            .execute()
        
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{outbound_id}/confirm")
def confirm_outbound(outbound_id: str):
    """출고 확정 (DRAFT → CONFIRMED)"""
    try:
        # 상태 확인
        result = supabase.table("outbounds")\
            .select("status")\
            .eq("id", outbound_id)\
            .single()\
            .execute()
        
        current_status = result.data["status"]
        if current_status != "DRAFT":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot confirm from status: {current_status}"
            )
        
        # 라인 아이템 검증
        items_result = supabase.table("outbound_items")\
            .select("*")\
            .eq("outbound_id", outbound_id)\
            .execute()
        
        if not items_result.data:
            raise HTTPException(status_code=400, detail="Cannot confirm without items")
        
        # 상태 업데이트
        supabase.table("outbounds")\
            .update({"status": "CONFIRMED", "updated_at": datetime.utcnow().isoformat()})\
            .eq("id", outbound_id)\
            .execute()
        
        # Flow 기록
        log_flow(outbound_id, "DRAFT", "CONFIRMED", "user:system")
        
        return {"status": "CONFIRMED"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{outbound_id}/post")
def post_outbound(outbound_id: str):
    """출고 반영 (CONFIRMED → POSTED) - 재고 차감"""
    try:
        # 상태 확인
        result = supabase.table("outbounds")\
            .select("status")\
            .eq("id", outbound_id)\
            .single()\
            .execute()
        
        current_status = result.data["status"]
        if current_status != "CONFIRMED":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot post from status: {current_status}"
            )
        
        # 라인 아이템 조회
        items_result = supabase.table("outbound_items")\
            .select("item_id, qty")\
            .eq("outbound_id", outbound_id)\
            .execute()
        
        # 재고 차감 (각 아이템별)
        for item in items_result.data:
            item_id = item["item_id"]
            qty = item["qty"]
            
            # 현재 재고 확인
            stock_result = supabase.table("stocks")\
                .select("onhand")\
                .eq("item_id", item_id)\
                .single()\
                .execute()
            
            if not stock_result.data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock not found for item: {item_id}"
                )
            
            current_onhand = stock_result.data["onhand"]
            if current_onhand < qty:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for item: {item_id} (available: {current_onhand}, required: {qty})"
                )
            
            # 재고 차감
            new_onhand = current_onhand - qty
            supabase.table("stocks")\
                .update({"onhand": new_onhand, "updated_at": datetime.utcnow().isoformat()})\
                .eq("item_id", item_id)\
                .execute()
        
        # 상태 업데이트
        supabase.table("outbounds")\
            .update({"status": "POSTED", "updated_at": datetime.utcnow().isoformat()})\
            .eq("id", outbound_id)\
            .execute()
        
        # Flow 기록
        log_flow(outbound_id, "CONFIRMED", "POSTED", "user:system")
        
        return {"status": "POSTED"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{outbound_id}/cancel")
def cancel_outbound(outbound_id: str):
    """출고 취소 (DRAFT/CONFIRMED → CANCELED)"""
    try:
        # 상태 확인
        result = supabase.table("outbounds")\
            .select("status")\
            .eq("id", outbound_id)\
            .single()\
            .execute()
        
        current_status = result.data["status"]
        if current_status == "POSTED":
            raise HTTPException(
                status_code=400,
                detail="Cannot cancel POSTED outbound (use return flow)"
            )
        
        if current_status == "CANCELED":
            raise HTTPException(status_code=400, detail="Already canceled")
        
        # 상태 업데이트
        supabase.table("outbounds")\
            .update({"status": "CANCELED", "updated_at": datetime.utcnow().isoformat()})\
            .eq("id", outbound_id)\
            .execute()
        
        # Flow 기록
        log_flow(outbound_id, current_status, "CANCELED", "user:system")
        
        return {"status": "CANCELED"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
