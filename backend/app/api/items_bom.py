# app/api/items_bom.py
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.core.supabase import supabase
from app.core.auth import get_current_user, get_current_user_with_permission

router = APIRouter(
    prefix="/api/v1/items",
    tags=["Items BOM"],
)

# Pydantic Models
class BomComponent(BaseModel):
    id: str
    parent_item_id: str
    component_item_id: str
    quantity: float
    unit: str
    sequence: Optional[int] = None
    notes: Optional[str] = None
    created_at: str

class BomComponentCreate(BaseModel):
    component_item_id: str
    quantity: float = Field(..., gt=0, le=9999)
    unit: Optional[str] = "EA"
    notes: Optional[str] = None

class BomTreeItem(BaseModel):
    id: str
    parent_item_id: str
    child_item_id: str
    sku: str
    name: str
    description: Optional[str] = None
    quantity: float
    unit_cost: Optional[float] = None
    unit: Optional[str] = None
    sequence: Optional[int] = None
    children: List["BomTreeItem"] = []

class BomStats(BaseModel):
    total_components: int
    total_cost: float
    max_depth: int

# Helper function to build a recursive BOM tree
async def build_bom_tree(parent_item_id: str, max_depth: int, current_depth: int = 0) -> List[BomTreeItem]:
    if current_depth >= max_depth:
        return []

    # Fetch direct children of the parent
    response = supabase.from_("bom_components").select(
        "*, component_item:items!bom_components_component_item_id_fkey(id, sku, name, description, unit_cost, uom)"
    ).eq("parent_item_id", parent_item_id).order("sequence", desc=False).execute()

    if response.data is None:
        return []

    tree = []
    for component_data in response.data:
        component_item_data = component_data.get("component_item")
        if not component_item_data:
            continue

        child_item_id = component_item_data["id"]
        
        # Recursively build subtree
        children = await build_bom_tree(child_item_id, max_depth, current_depth + 1)

        tree_item = BomTreeItem(
            id=component_data["id"],
            parent_item_id=component_data["parent_item_id"],
            child_item_id=child_item_id,
            sku=component_item_data["sku"],
            name=component_item_data["name"],
            description=component_item_data.get("description"),
            quantity=component_data["quantity"],
            unit_cost=component_item_data.get("unit_cost"),
            unit=component_item_data.get("uom", "EA"),
            sequence=component_data.get("sequence"),
            children=children
        )
        tree.append(tree_item)
    return tree


@router.get("/{item_id}/bom/stats", response_model=BomStats)
async def get_bom_stats(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get BOM statistics for a given item."""
    response = supabase.from_("bom_components").select(
        "*, component_item:items!bom_components_component_item_id_fkey(unit_cost)"
    ).eq("parent_item_id", item_id).execute()

    if response.data is None:
        return BomStats(total_components=0, total_cost=0.0, max_depth=0)

    total_components = len(response.data)
    total_cost = 0.0

    for component in response.data:
        quantity = component.get("quantity", 0)
        unit_cost = component.get("component_item", {}).get("unit_cost", 0) or 0
        total_cost += quantity * unit_cost
    
    return BomStats(
        total_components=total_components,
        total_cost=round(total_cost, 2),
        max_depth=0
    )


@router.get("/{item_id}/bom/tree", response_model=List[BomTreeItem])
async def get_bom_tree(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get the hierarchical BOM tree for a given item."""
    BOM_MAX_DEPTH = 10

    tree = await build_bom_tree(item_id, BOM_MAX_DEPTH)
    
    if not tree:
        # Check if the item itself exists
        item_response = supabase.from_("items").select("id").eq("id", item_id).single().execute()
        if not item_response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        return []
    
    return tree


@router.post("/{item_id}/bom/components", response_model=BomComponent)
async def add_bom_component(
    item_id: str,
    component_in: BomComponentCreate,
    current_user: dict = Depends(get_current_user_with_permission("items:update"))
):
    """Add a component to an item's BOM."""
    # 1. Check if parent item exists
    parent_item_response = supabase.from_("items").select("id").eq("id", item_id).single().execute()
    if not parent_item_response.data:
        raise HTTPException(status_code=404, detail=f"Parent item with ID {item_id} not found")

    # 2. Check if child component item exists
    child_item_response = supabase.from_("items").select("id").eq("id", component_in.component_item_id).single().execute()
    if not child_item_response.data:
        raise HTTPException(status_code=404, detail=f"Component item with ID {component_in.component_item_id} not found")

    # 3. Prevent self-reference
    if item_id == component_in.component_item_id:
        raise HTTPException(
            status_code=400,
            detail="An item cannot be a component of itself."
        )

    # 4. Check for duplicate component for the same parent
    duplicate_check = supabase.from_("bom_components").select("id").eq("parent_item_id", item_id).eq("component_item_id", component_in.component_item_id).execute()
    if duplicate_check.data:
        raise HTTPException(
            status_code=409,
            detail="This component is already part of the BOM for this item."
        )

    # 5. Determine the next sequence number
    max_sequence_response = supabase.from_("bom_components").select("sequence").eq("parent_item_id", item_id).order("sequence", desc=True).limit(1).execute()
    next_sequence = (max_sequence_response.data[0]["sequence"] + 1) if max_sequence_response.data else 1

    # 6. Insert new BOM component
    insert_data = component_in.dict()
    insert_data["parent_item_id"] = item_id
    insert_data["sequence"] = next_sequence

    response = supabase.from_("bom_components").insert(insert_data).execute()

    if response.data:
        return BomComponent(**response.data[0])
    raise HTTPException(status_code=500, detail="Failed to add BOM component")
