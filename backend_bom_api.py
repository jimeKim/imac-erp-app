"""
백엔드 BOM API 엔드포인트 추가
서버에 업로드하여 /opt/erp-backend/app/main.py에 통합
"""

# main.py에 추가할 코드

BOM_API_CODE = """
# ==================== BOM API ====================

@app.get("/api/v1/items/{item_id}/bom/tree")
async def get_bom_tree(item_id: str):
    '''상품의 BOM 트리 구조 조회'''
    
    # Mock 데이터 (실제 구현 시 Supabase에서 조회)
    # 샘플: LCD 모니터 27인치
    if item_id == "1":
        return {
            "item_id": "1",
            "sku": "SKU-001",
            "name": "LCD 모니터 27인치",
            "type": "FG",
            "has_bom": True,
            "tree": {
                "id": "1",
                "item_id": "1",
                "sku": "SKU-001",
                "name": "LCD 모니터 27인치",
                "type": "FG",
                "quantity": 1,
                "unit": "EA",
                "unit_cost": 250000,
                "total_cost": 410000,
                "children": [
                    {
                        "id": "2",
                        "item_id": "2",
                        "sku": "SKU-MOD-001",
                        "name": "LCD 모듈",
                        "type": "MOD",
                        "quantity": 1,
                        "unit": "EA",
                        "unit_cost": 180000,
                        "total_cost": 230000,
                        "children": [
                            {
                                "id": "3",
                                "item_id": "3",
                                "sku": "SKU-PT-001",
                                "name": "액정 패널 27인치",
                                "type": "PT",
                                "quantity": 1,
                                "unit": "EA",
                                "unit_cost": 150000,
                                "total_cost": 150000,
                                "children": []
                            },
                            {
                                "id": "4",
                                "item_id": "4",
                                "sku": "SKU-PT-002",
                                "name": "백라이트 유닛",
                                "type": "PT",
                                "quantity": 1,
                                "unit": "EA",
                                "unit_cost": 50000,
                                "total_cost": 50000,
                                "children": []
                            },
                            {
                                "id": "5",
                                "item_id": "5",
                                "sku": "SKU-PT-003",
                                "name": "LCD 컨트롤러",
                                "type": "PT",
                                "quantity": 1,
                                "unit": "EA",
                                "unit_cost": 30000,
                                "total_cost": 30000,
                                "children": []
                            }
                        ]
                    },
                    {
                        "id": "6",
                        "item_id": "6",
                        "sku": "SKU-MOD-002",
                        "name": "전원 모듈 (SMPS)",
                        "type": "MOD",
                        "quantity": 1,
                        "unit": "EA",
                        "unit_cost": 35000,
                        "total_cost": 75000,
                        "children": [
                            {
                                "id": "7",
                                "item_id": "7",
                                "sku": "SKU-PT-004",
                                "name": "AC/DC 컨버터",
                                "type": "PT",
                                "quantity": 1,
                                "unit": "EA",
                                "unit_cost": 25000,
                                "total_cost": 25000,
                                "children": []
                            },
                            {
                                "id": "8",
                                "item_id": "8",
                                "sku": "SKU-PT-005",
                                "name": "전원 케이블",
                                "type": "PT",
                                "quantity": 1,
                                "unit": "EA",
                                "unit_cost": 5000,
                                "total_cost": 5000,
                                "children": []
                            },
                            {
                                "id": "9",
                                "item_id": "9",
                                "sku": "SKU-PT-006",
                                "name": "전원 커넥터",
                                "type": "PT",
                                "quantity": 2,
                                "unit": "EA",
                                "unit_cost": 2000,
                                "total_cost": 4000,
                                "children": []
                            }
                        ]
                    },
                    {
                        "id": "10",
                        "item_id": "10",
                        "sku": "SKU-PT-007",
                        "name": "모니터 스탠드",
                        "type": "PT",
                        "quantity": 1,
                        "unit": "EA",
                        "unit_cost": 15000,
                        "total_cost": 15000,
                        "children": []
                    },
                    {
                        "id": "11",
                        "item_id": "11",
                        "sku": "SKU-PKG-001",
                        "name": "포장 박스",
                        "type": "PKG",
                        "quantity": 1,
                        "unit": "EA",
                        "unit_cost": 5000,
                        "total_cost": 5000,
                        "children": []
                    }
                ]
            }
        }
    
    # 다른 상품은 BOM 없음
    return {
        "item_id": item_id,
        "sku": f"SKU-{item_id}",
        "name": "상품명",
        "type": "FG",
        "has_bom": False,
        "tree": {
            "id": item_id,
            "item_id": item_id,
            "sku": f"SKU-{item_id}",
            "name": "상품명",
            "type": "FG",
            "quantity": 1,
            "unit": "EA",
            "children": []
        }
    }


@app.get("/api/v1/items/{item_id}/bom/stats")
async def get_bom_stats(item_id: str):
    '''BOM 통계 조회'''
    
    if item_id == "1":
        return {
            "total_components": 10,
            "max_depth": 3,
            "total_cost": 410000,
            "component_types": {
                "FG": 1,
                "MOD": 2,
                "PT": 6,
                "PKG": 1
            }
        }
    
    return {
        "total_components": 0,
        "max_depth": 0,
        "total_cost": 0,
        "component_types": {}
    }


@app.get("/api/v1/items/{item_id}/bom/components")
async def get_bom_components(item_id: str):
    '''BOM 구성품 목록 (플랫) 조회'''
    
    return {
        "components": []
    }
"""

print("=" * 80)
print("백엔드 BOM API 코드")
print("=" * 80)
print(BOM_API_CODE)
print("=" * 80)
print("\n서버 적용 방법:")
print("1. SSH로 서버 접속: ssh root@139.59.110.55")
print("2. 백엔드 파일 편집: nano /opt/erp-backend/app/main.py")
print("3. 위의 BOM API 코드를 main.py 파일 끝에 추가")
print("4. uvicorn 재시작: systemctl restart erp-engine")
print("=" * 80)
