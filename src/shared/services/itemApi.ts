/**
 * Item API 클라이언트
 */

import { api } from './apiClient'
import {
  Item,
  ItemListParams,
  ItemListResponse,
  ItemCreateInput,
  ItemUpdateInput,
} from '@/shared/types/item'
import { MOCK_ITEMS, filterItems, sortItems, paginateItems } from './mockData'

const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK_API !== 'false'

/**
 * Items 목록 조회
 */
export async function getItems(params: ItemListParams = {}): Promise<ItemListResponse> {
  if (USE_MOCK) {
    // Mock 데이터 사용
    await new Promise((resolve) => setTimeout(resolve, 300)) // 네트워크 지연 시뮬레이션

    const { page = 1, pageSize = 20, search, type, isActive, sortBy, sortOrder = 'asc' } = params

    let items = filterItems(MOCK_ITEMS, search, type, isActive)
    items = sortItems(items, sortBy, sortOrder)

    const total = items.length
    const totalPages = Math.ceil(total / pageSize)
    const paginatedItems = paginateItems(items, page, pageSize)

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
    }
  }

  // 실제 API 호출
  return api.get<ItemListResponse>('/items', { params })
}

/**
 * Item 상세 조회
 */
export async function getItem(id: string): Promise<Item> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200))

    const item = MOCK_ITEMS.find((i) => i.id === id)
    if (!item) {
      throw new Error('Item not found')
    }

    return item
  }

  // engine-core API 응답 형식: {data: {...}}
  const response = await api.get<{ data: Item }>(`/api/v1/items/${id}`)
  return response.data
}

/**
 * Item 생성
 */
export async function createItem(input: ItemCreateInput): Promise<Item> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newItem: Item = {
      id: `mock-${Date.now()}`,
      ...input,
      discountPrice: input.discountPrice || 0,
      currentStock: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    MOCK_ITEMS.push(newItem)
    return newItem
  }

  return api.post<Item>('/items', input)
}

/**
 * Item 수정
 */
export async function updateItem(id: string, input: ItemUpdateInput): Promise<Item> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const index = MOCK_ITEMS.findIndex((i) => i.id === id)
    if (index === -1) {
      throw new Error('Item not found')
    }

    MOCK_ITEMS[index] = {
      ...MOCK_ITEMS[index],
      ...input,
      updatedAt: new Date().toISOString(),
    }

    return MOCK_ITEMS[index]
  }

  return api.patch<Item>(`/items/${id}`, input)
}

/**
 * Item 삭제
 */
export async function deleteItem(id: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const index = MOCK_ITEMS.findIndex((i) => i.id === id)
    if (index === -1) {
      throw new Error('Item not found')
    }

    MOCK_ITEMS.splice(index, 1)
    return
  }

  return api.delete(`/items/${id}`)
}
