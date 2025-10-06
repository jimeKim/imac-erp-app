/**
 * BOM (Bill of Materials) 관련 타입 정의
 */

import { ItemType } from './item'

/**
 * BOM 구성품 아이템
 */
export interface BomComponent {
  id: string
  item_id: string
  parent_item_id: string
  component_item_id: string
  quantity: number
  unit: string
  sequence?: number
  notes?: string
  created_at: string
  updated_at: string
  
  // 조인된 상품 정보
  component_sku?: string
  component_name?: string
  component_type?: ItemType
  component_unit_cost?: number
}

/**
 * BOM 트리 노드 (재귀 구조)
 */
export interface BomTreeNode {
  id: string
  item_id: string
  sku: string
  name: string
  type: ItemType
  quantity: number
  unit: string
  unit_cost?: number
  total_cost?: number
  notes?: string
  children?: BomTreeNode[]
  level?: number
  is_expanded?: boolean
}

/**
 * BOM 생성 입력
 */
export interface BomCreateInput {
  parent_item_id: string
  component_item_id: string
  quantity: number
  unit: string
  sequence?: number
  notes?: string
}

/**
 * BOM 업데이트 입력
 */
export interface BomUpdateInput {
  quantity?: number
  unit?: string
  sequence?: number
  notes?: string
}

/**
 * BOM 트리 응답
 */
export interface BomTreeResponse {
  item_id: string
  sku: string
  name: string
  type: ItemType
  has_bom: boolean
  components: BomComponent[]
  tree: BomTreeNode
}

/**
 * BOM 통계
 */
export interface BomStats {
  total_components: number
  max_depth: number
  total_cost: number
  component_types: Record<ItemType, number>
}
