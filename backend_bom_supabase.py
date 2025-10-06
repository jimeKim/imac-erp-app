"""
백엔드 BOM API - Supabase 연동 버전
서버에 업로드하여 /opt/erp-backend/app/main.py의 BOM API 부분을 대체
"""

BOM_SUPABASE_CODE = '''
# ==================== BOM API (Supabase 연동) ====================

from typing import Dict, List, Any

def build_bom_tree(parent_id: str, level: int = 0) -> List[Dict[str, Any]]:
    """재귀적으로 BOM 트리 구축"""
    
    # Supabase에서 해당 부모의 구성품 조회
    response = supabase.table("bom_components_view").select("*").eq("parent_item_id", parent_id).order("sequence").execute()
    
    children = []
    for comp in response.data:
        child_node = {
            "id": comp["component_item_id"],
            "item_id": comp["component_item_id"],
            "sku": comp["component_sku"],
            "name": comp["component_name"],
            "type": comp["component_type"],
            "quantity": float(comp["quantity"]),
            "unit": comp["unit"],
            "unit_cost": float(comp["component_unit_cost"]) if comp["component_unit_cost"] else 0,
            "total_cost": float(comp["total_cost"]) if comp["total_cost"] else 0,
            "notes": comp.get("notes"),
            "level": level + 1,
            "children": build_bom_tree(comp["component_item_id"], level + 1)
        }
        children.append(child_node)
    
    return children


def calculate_total_cost(parent_id: str) -> float:
    """BOM 전체 원가 재귀 계산"""
    
    response = supabase.table("bom_components_view").select("*").eq("parent_item_id", parent_id).execute()
    
    total = 0.0
    for comp in response.data:
        # 직접 비용
        direct_cost = float(comp["total_cost"]) if comp["total_cost"] else 0
        total += direct_cost
        
        # 하위 BOM 비용 (재귀)
        sub_cost = calculate_total_cost(comp["component_item_id"])
        total += sub_cost * float(comp["quantity"])
    
    return total


def count_bom_components(parent_id: str, depth: int = 0) -> Dict[str, Any]:
    """BOM 통계 재귀 계산"""
    
    stats = {"total": 0, "max_depth": depth, "types": {}}
    
    response = supabase.table("bom_components_view").select("*").eq("parent_item_id", parent_id).execute()
    
    for comp in response.data:
        stats["total"] += 1
        
        comp_type = comp["component_type"]
        stats["types"][comp_type] = stats["types"].get(comp_type, 0) + 1
        
        # 재귀 호출
        sub_stats = count_bom_components(comp["component_item_id"], depth + 1)
        stats["total"] += sub_stats["total"]
        stats["max_depth"] = max(stats["max_depth"], sub_stats["max_depth"])
        
        # 타입 합산
        for t, count in sub_stats["types"].items():
            stats["types"][t] = stats["types"].get(t, 0) + count
    
    return stats


@app.get("/api/v1/items/{item_id}/bom/tree")
async def get_bom_tree(item_id: str):
    """상품의 BOM 트리 구조 조회 (Supabase)"""
    
    try:
        # 부모 상품 정보 조회
        parent_response = supabase.table("items").select("*").eq("id", item_id).execute()
        
        if not parent_response.data:
            return {
                "item_id": item_id,
                "sku": "N/A",
                "name": "Unknown Item",
                "type": "FG",
                "has_bom": False,
                "tree": {
                    "id": item_id,
                    "item_id": item_id,
                    "sku": "N/A",
                    "name": "Unknown Item",
                    "type": "FG",
                    "quantity": 1,
                    "unit": "EA",
                    "children": []
                }
            }
        
        parent = parent_response.data[0]
        
        # BOM 구성품 확인
        bom_check = supabase.table("bom_components").select("id").eq("parent_item_id", item_id).limit(1).execute()
        has_bom = len(bom_check.data) > 0
        
        # BOM 트리 구축
        children = build_bom_tree(item_id)
        
        # 총 비용 계산
        total_cost = calculate_total_cost(item_id) + float(parent.get("unit_cost", 0))
        
        return {
            "item_id": item_id,
            "sku": parent["sku"],
            "name": parent["name"],
            "type": parent["item_type"],
            "has_bom": has_bom,
            "tree": {
                "id": item_id,
                "item_id": item_id,
                "sku": parent["sku"],
                "name": parent["name"],
                "type": parent["item_type"],
                "quantity": 1,
                "unit": parent.get("uom", "EA"),
                "unit_cost": float(parent.get("unit_cost", 0)),
                "total_cost": total_cost,
                "children": children
            }
        }
    
    except Exception as e:
        print(f"Error in get_bom_tree: {str(e)}")
        return {
            "error": str(e),
            "item_id": item_id,
            "has_bom": False
        }


@app.get("/api/v1/items/{item_id}/bom/stats")
async def get_bom_stats(item_id: str):
    """BOM 통계 조회 (Supabase)"""
    
    try:
        stats = count_bom_components(item_id)
        total_cost = calculate_total_cost(item_id)
        
        # 부모 상품 원가 추가
        parent_response = supabase.table("items").select("unit_cost").eq("id", item_id).execute()
        if parent_response.data and parent_response.data[0].get("unit_cost"):
            total_cost += float(parent_response.data[0]["unit_cost"])
        
        return {
            "total_components": stats["total"],
            "max_depth": stats["max_depth"],
            "total_cost": total_cost,
            "component_types": stats["types"]
        }
    
    except Exception as e:
        print(f"Error in get_bom_stats: {str(e)}")
        return {
            "total_components": 0,
            "max_depth": 0,
            "total_cost": 0,
            "component_types": {}
        }


@app.get("/api/v1/items/{item_id}/bom/components")
async def get_bom_components(item_id: str):
    """BOM 구성품 목록 (플랫) 조회 (Supabase)"""
    
    try:
        response = supabase.table("bom_components_view").select("*").eq("parent_item_id", item_id).order("sequence").execute()
        
        return {
            "components": response.data
        }
    
    except Exception as e:
        print(f"Error in get_bom_components: {str(e)}")
        return {
            "components": []
        }
'''

print("=" * 80)
print("백엔드 BOM API - Supabase 연동 코드")
print("=" * 80)
print(BOM_SUPABASE_CODE)
print("=" * 80)
print("\n이제 서버에 적용합니다...")
