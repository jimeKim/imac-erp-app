/**
 * Item 관련 타입 정의
 */

export type ItemType = 'FG' | 'SF' | 'MOD' | 'PT' | 'RM' | 'MR' | 'CS' | 'PKG'

export interface ItemCategory {
  id: string
  name: string
  description?: string
}

export interface Item {
  id: string
  name: string

  // New backend fields (engine-core)
  sku?: string
  description?: string
  category_id?: string | null
  category?: ItemCategory | null
  item_type?: ItemType
  uom?: string
  unit_cost?: number | null
  status?: string
  created_by?: string | null
  created_at?: string
  updated_at?: string
  is_manufactured?: boolean
  is_purchased?: boolean
  is_sellable?: boolean
  has_bom?: boolean
  has_variants?: boolean

  // Legacy fields for backward compatibility
  itemCode?: string
  type?: 'assembled' | 'single'
  purchasePrice?: number
  costPrice?: number
  releasePrice?: number
  sellingPrice?: number
  discountPrice?: number
  currentStock?: number
  safetyStock?: number
  isActive?: boolean
  color?: string
  size?: string
  createdAt?: string
  updatedAt?: string
}

export interface ItemListParams {
  page?: number
  pageSize?: number
  search?: string
  type?: 'assembled' | 'single' | 'all'
  isActive?: boolean
  sortBy?: 'name' | 'itemCode' | 'currentStock' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ItemListResponse {
  items: Item[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ItemCreateInput {
  itemCode: string
  name: string
  color?: string
  size?: string
  type: 'assembled' | 'single'
  purchasePrice: number
  costPrice: number
  releasePrice: number
  sellingPrice: number
  discountPrice?: number
  safetyStock: number
}

export interface ItemUpdateInput extends Partial<ItemCreateInput> {
  isActive?: boolean
}
