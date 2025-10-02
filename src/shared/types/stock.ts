/**
 * Stock 관련 타입 정의
 */

export interface Stock {
  id: string
  itemId: string
  itemCode: string
  itemName: string
  warehouseId?: string
  warehouseName?: string
  currentStock: number
  safetyStock: number
  availableStock: number // 현재고 - 예약/보류
  reservedStock: number
  lastUpdatedAt: string
}

export interface StockListParams {
  page?: number
  pageSize?: number
  search?: string
  warehouseId?: string
  lowStockOnly?: boolean // 안전재고 미만만 조회
  sortBy?: 'itemName' | 'currentStock' | 'lastUpdatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface StockListResponse {
  stocks: Stock[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface StockAdjustmentInput {
  itemId: string
  warehouseId?: string
  quantity: number // 양수: 증가, 음수: 감소
  reason: string
  note?: string
}

export interface StockHistory {
  id: string
  itemId: string
  itemCode: string
  itemName: string
  warehouseId?: string
  quantityChange: number
  quantityAfter: number
  type: 'inbound' | 'outbound' | 'adjustment' | 'transfer'
  reason?: string
  note?: string
  createdBy: string
  createdAt: string
}
