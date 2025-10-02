/**
 * Mock 데이터
 *
 * 백엔드 API가 준비되기 전까지 사용할 Mock 데이터
 */

import { Item } from '@/shared/types/item'
import { Stock } from '@/shared/types/stock'

/**
 * Mock Items 데이터
 */
export const MOCK_ITEMS: Item[] = [
  {
    id: '1',
    itemCode: 'ITEM-001',
    name: '노트북 거치대 (화이트)',
    color: '화이트',
    size: 'M',
    type: 'single',
    purchasePrice: 15000,
    costPrice: 18000,
    releasePrice: 25000,
    sellingPrice: 29000,
    discountPrice: 27000,
    currentStock: 150,
    safetyStock: 50,
    isActive: true,
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-10-01T14:30:00Z',
  },
  {
    id: '2',
    itemCode: 'ITEM-002',
    name: '무선 마우스 (블랙)',
    color: '블랙',
    size: 'S',
    type: 'single',
    purchasePrice: 12000,
    costPrice: 14000,
    releasePrice: 20000,
    sellingPrice: 23000,
    currentStock: 85,
    safetyStock: 100,
    isActive: true,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-09-28T11:20:00Z',
  },
  {
    id: '3',
    itemCode: 'ITEM-003',
    name: '기계식 키보드 RGB (화이트)',
    color: '화이트',
    size: 'L',
    type: 'single',
    purchasePrice: 45000,
    costPrice: 50000,
    releasePrice: 75000,
    sellingPrice: 89000,
    discountPrice: 79000,
    currentStock: 32,
    safetyStock: 20,
    isActive: true,
    createdAt: '2024-02-01T08:30:00Z',
    updatedAt: '2024-10-02T09:15:00Z',
  },
  {
    id: '4',
    itemCode: 'ITEM-004',
    name: '모니터 암 (싱글)',
    color: '블랙',
    type: 'single',
    purchasePrice: 35000,
    costPrice: 40000,
    releasePrice: 60000,
    sellingPrice: 69000,
    currentStock: 45,
    safetyStock: 30,
    isActive: true,
    createdAt: '2024-02-10T13:00:00Z',
    updatedAt: '2024-09-30T16:45:00Z',
  },
  {
    id: '5',
    itemCode: 'ITEM-005',
    name: '책상 정리 세트 (베이지)',
    color: '베이지',
    type: 'assembled',
    purchasePrice: 25000,
    costPrice: 30000,
    releasePrice: 45000,
    sellingPrice: 52000,
    discountPrice: 48000,
    currentStock: 120,
    safetyStock: 40,
    isActive: true,
    createdAt: '2024-02-15T11:30:00Z',
    updatedAt: '2024-10-01T10:00:00Z',
  },
  {
    id: '6',
    itemCode: 'ITEM-006',
    name: 'USB-C 허브 (그레이)',
    color: '그레이',
    size: 'S',
    type: 'single',
    purchasePrice: 18000,
    costPrice: 22000,
    releasePrice: 35000,
    sellingPrice: 39000,
    currentStock: 15,
    safetyStock: 25,
    isActive: true,
    createdAt: '2024-03-01T09:45:00Z',
    updatedAt: '2024-09-29T14:20:00Z',
  },
  {
    id: '7',
    itemCode: 'ITEM-007',
    name: '블루투스 스피커 (화이트)',
    color: '화이트',
    size: 'M',
    type: 'single',
    purchasePrice: 28000,
    costPrice: 33000,
    releasePrice: 50000,
    sellingPrice: 58000,
    discountPrice: 54000,
    currentStock: 68,
    safetyStock: 30,
    isActive: true,
    createdAt: '2024-03-10T10:20:00Z',
    updatedAt: '2024-10-02T08:30:00Z',
  },
  {
    id: '8',
    itemCode: 'ITEM-008',
    name: 'LED 스탠드 (블랙)',
    color: '블랙',
    type: 'single',
    purchasePrice: 32000,
    costPrice: 38000,
    releasePrice: 55000,
    sellingPrice: 63000,
    currentStock: 42,
    safetyStock: 20,
    isActive: true,
    createdAt: '2024-03-20T14:00:00Z',
    updatedAt: '2024-09-28T17:10:00Z',
  },
  {
    id: '9',
    itemCode: 'ITEM-009',
    name: '태블릿 거치대 (실버)',
    color: '실버',
    size: 'M',
    type: 'single',
    purchasePrice: 22000,
    costPrice: 26000,
    releasePrice: 38000,
    sellingPrice: 44000,
    currentStock: 95,
    safetyStock: 40,
    isActive: true,
    createdAt: '2024-04-01T11:00:00Z',
    updatedAt: '2024-10-01T13:25:00Z',
  },
  {
    id: '10',
    itemCode: 'ITEM-010',
    name: '케이블 정리함 세트',
    type: 'assembled',
    purchasePrice: 15000,
    costPrice: 18000,
    releasePrice: 28000,
    sellingPrice: 32000,
    discountPrice: 29000,
    currentStock: 8,
    safetyStock: 15,
    isActive: false,
    createdAt: '2024-04-10T09:30:00Z',
    updatedAt: '2024-09-15T10:00:00Z',
  },
]

/**
 * Mock Stocks 데이터
 */
export const MOCK_STOCKS: Stock[] = MOCK_ITEMS.map((item) => ({
  id: `stock-${item.id}`,
  itemId: item.id,
  itemCode: item.itemCode,
  itemName: item.name,
  warehouseId: 'WH-001',
  warehouseName: '본사 창고',
  currentStock: item.currentStock,
  safetyStock: item.safetyStock,
  availableStock: item.currentStock - Math.floor(item.currentStock * 0.1), // 10% 예약
  reservedStock: Math.floor(item.currentStock * 0.1),
  lastUpdatedAt: item.updatedAt,
}))

/**
 * Mock 데이터 필터링 유틸리티
 */
export function filterItems(items: Item[], search?: string, type?: string, isActive?: boolean) {
  let filtered = [...items]

  if (search) {
    const searchLower = search.toLowerCase()
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.itemCode.toLowerCase().includes(searchLower),
    )
  }

  if (type && type !== 'all') {
    filtered = filtered.filter((item) => item.type === type)
  }

  if (isActive !== undefined) {
    filtered = filtered.filter((item) => item.isActive === isActive)
  }

  return filtered
}

export function sortItems(items: Item[], sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc') {
  const sorted = [...items]

  if (!sortBy) return sorted

  sorted.sort((a, b) => {
    let aValue: string | number = ''
    let bValue: string | number = ''

    switch (sortBy) {
      case 'name':
        aValue = a.name
        bValue = b.name
        break
      case 'itemCode':
        aValue = a.itemCode
        bValue = b.itemCode
        break
      case 'currentStock':
        aValue = a.currentStock
        bValue = b.currentStock
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      default:
        return 0
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return sortOrder === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number)
  })

  return sorted
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return items.slice(start, end)
}
