"""
Pydantic Models (Schemas)
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


# ==================== Enums ====================

class ItemType(str, Enum):
    SINGLE = "single"
    ASSEMBLED = "assembled"


class OutboundStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    COMMITTED = "committed"
    CANCELLED = "cancelled"


# ==================== Items ====================

class ItemBase(BaseModel):
    item_code: str
    name: str
    color: Optional[str] = None
    size: Optional[str] = None
    type: ItemType
    purchase_price: float = 0
    cost_price: float = 0
    release_price: float = 0
    selling_price: float = 0
    discount_price: float = 0
    current_stock: int = 0
    safety_stock: int = 10
    is_active: bool = True


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    type: Optional[ItemType] = None
    purchase_price: Optional[float] = None
    cost_price: Optional[float] = None
    release_price: Optional[float] = None
    selling_price: Optional[float] = None
    discount_price: Optional[float] = None
    current_stock: Optional[int] = None
    safety_stock: Optional[int] = None
    is_active: Optional[bool] = None


class Item(ItemBase):
    id: str
    reserved_stock: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Stocks ====================

class Stock(BaseModel):
    id: str
    item_code: str
    item_name: str
    warehouse_id: str
    warehouse_name: str
    current_stock: int
    reserved_stock: int
    available_stock: int
    safety_stock: int
    cost_price: float
    stock_level: str  # 'low', 'normal', 'high'
    last_updated_at: datetime


# ==================== Outbounds ====================

class OutboundLineBase(BaseModel):
    item_id: str
    quantity: int = Field(gt=0)
    unit_price: float = 0
    note: Optional[str] = None


class OutboundLineCreate(OutboundLineBase):
    pass


class OutboundLine(OutboundLineBase):
    id: str
    outbound_id: str
    total_price: float


class OutboundBase(BaseModel):
    customer_id: str
    warehouse_id: str
    requested_date: date
    note: Optional[str] = None


class OutboundCreate(OutboundBase):
    lines: List[OutboundLineCreate]


class OutboundUpdate(BaseModel):
    customer_id: Optional[str] = None
    warehouse_id: Optional[str] = None
    requested_date: Optional[date] = None
    note: Optional[str] = None
    lines: Optional[List[OutboundLineCreate]] = None


class Outbound(OutboundBase):
    id: str
    outbound_code: str
    status: OutboundStatus
    total_amount: float = 0
    shipped_date: Optional[date] = None
    committed_date: Optional[date] = None
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    committed_by: Optional[str] = None
    committed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    lines: List[OutboundLine] = []

    class Config:
        from_attributes = True


# ==================== Responses ====================

class ItemListResponse(BaseModel):
    items: List[Item]
    total: int
    page: int
    page_size: int
    total_pages: int


class StockListResponse(BaseModel):
    stocks: List[Stock]
    total: int
    total_low_stock_items: int
    total_stock_value: float
    page: int
    page_size: int
    total_pages: int


class OutboundListResponse(BaseModel):
    outbounds: List[Outbound]
    total: int
    page: int
    page_size: int
    total_pages: int


class MessageResponse(BaseModel):
    success: bool
    message: str

