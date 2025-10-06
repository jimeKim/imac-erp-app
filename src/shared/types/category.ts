/**
 * Category Types
 * 상품 카테고리 타입 정의
 */

export interface Category {
  id: string
  name: string
  description: string | null
  is_active: boolean
  parent_id: string | null
  level: number
  path: string
  sequence: number
  created_at: string
  updated_at: string
  item_count: number
  children: Category[]
}

export interface CategoryCreate {
  name: string
  description?: string
  is_active?: boolean
  parent_id?: string | null
  sequence?: number
}

export interface CategoryUpdate {
  name?: string
  description?: string
  is_active?: boolean
  parent_id?: string | null
  sequence?: number
}

export interface CategoriesResponse {
  data: Category[]
  count: number
}
