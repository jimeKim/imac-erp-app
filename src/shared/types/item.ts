/**
 * Item 관련 타입 정의
 */

export interface Item {
  id: string
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
  currentStock: number
  safetyStock: number
  isActive: boolean
  createdAt: string
  updatedAt: string
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
