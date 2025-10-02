/**
 * Mock 데이터
 *
 * 백엔드 API가 준비되기 전까지 사용할 Mock 데이터
 */

import { Item } from '@/shared/types/item'
import { Stock } from '@/shared/types/stock'
import { Inbound } from '@/shared/types/inbound'
import { Outbound } from '@/shared/types/outbound'

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
  availableStock: item.currentStock - Math.floor(item.currentStock * 0.1),
  reservedStock: Math.floor(item.currentStock * 0.1),
  lastUpdatedAt: item.updatedAt,
}))

/**
 * Mock Inbounds 데이터
 */
export const MOCK_INBOUNDS: Inbound[] = [
  {
    id: 'INB-001',
    inboundCode: 'INB-2024-001',
    supplierId: 'SUP-001',
    supplierName: '(주)테크서플라이',
    warehouseId: 'WH-001',
    warehouseName: '본사 창고',
    requestedDate: '2024-09-20',
    receivedDate: '2024-09-22',
    status: 'received',
    totalAmount: 1250000,
    lines: [
      {
        id: 'LINE-001',
        itemId: '1',
        itemCode: 'ITEM-001',
        itemName: '노트북 거치대 (화이트)',
        quantity: 50,
        unitPrice: 15000,
        totalPrice: 750000,
      },
      {
        id: 'LINE-002',
        itemId: '3',
        itemCode: 'ITEM-003',
        itemName: '기계식 키보드 RGB (화이트)',
        quantity: 10,
        unitPrice: 45000,
        totalPrice: 450000,
        note: '신제품 입고',
      },
    ],
    note: '9월 정기 입고',
    createdBy: 'user-001',
    createdAt: '2024-09-18T09:00:00Z',
    updatedAt: '2024-09-22T14:30:00Z',
  },
  {
    id: 'INB-002',
    inboundCode: 'INB-2024-002',
    supplierId: 'SUP-002',
    supplierName: '글로벌전자',
    warehouseId: 'WH-001',
    warehouseName: '본사 창고',
    requestedDate: '2024-09-25',
    status: 'approved',
    totalAmount: 960000,
    lines: [
      {
        id: 'LINE-003',
        itemId: '2',
        itemCode: 'ITEM-002',
        itemName: '무선 마우스 (블랙)',
        quantity: 80,
        unitPrice: 12000,
        totalPrice: 960000,
      },
    ],
    createdBy: 'user-001',
    createdAt: '2024-09-23T10:30:00Z',
    updatedAt: '2024-09-24T11:20:00Z',
  },
  {
    id: 'INB-003',
    inboundCode: 'INB-2024-003',
    supplierId: 'SUP-001',
    supplierName: '(주)테크서플라이',
    warehouseId: 'WH-001',
    warehouseName: '본사 창고',
    requestedDate: '2024-10-01',
    status: 'pending',
    totalAmount: 1400000,
    lines: [
      {
        id: 'LINE-004',
        itemId: '4',
        itemCode: 'ITEM-004',
        itemName: '모니터 암 (싱글)',
        quantity: 40,
        unitPrice: 35000,
        totalPrice: 1400000,
      },
    ],
    note: '긴급 발주',
    createdBy: 'user-002',
    createdAt: '2024-09-28T15:00:00Z',
    updatedAt: '2024-09-28T15:00:00Z',
  },
  {
    id: 'INB-004',
    inboundCode: 'INB-2024-004',
    supplierId: 'SUP-003',
    supplierName: '오피스마켓',
    warehouseId: 'WH-001',
    warehouseName: '본사 창고',
    requestedDate: '2024-10-05',
    status: 'draft',
    totalAmount: 1650000,
    lines: [
      {
        id: 'LINE-005',
        itemId: '5',
        itemCode: 'ITEM-005',
        itemName: '책상 정리 세트 (베이지)',
        quantity: 30,
        unitPrice: 25000,
        totalPrice: 750000,
      },
      {
        id: 'LINE-006',
        itemId: '7',
        itemCode: 'ITEM-007',
        itemName: '블루투스 스피커 (화이트)',
        quantity: 30,
        unitPrice: 28000,
        totalPrice: 840000,
      },
    ],
    createdBy: 'user-001',
    createdAt: '2024-10-02T09:00:00Z',
    updatedAt: '2024-10-02T09:00:00Z',
  },
  {
    id: 'INB-005',
    inboundCode: 'INB-2024-005',
    supplierId: 'SUP-002',
    supplierName: '글로벌전자',
    warehouseId: 'WH-001',
    warehouseName: '본사 창고',
    requestedDate: '2024-09-15',
    receivedDate: '2024-09-17',
    status: 'received',
    totalAmount: 1824000,
    lines: [
      {
        id: 'LINE-007',
        itemId: '6',
        itemCode: 'ITEM-006',
        itemName: 'USB-C 허브 (그레이)',
        quantity: 100,
        unitPrice: 18000,
        totalPrice: 1800000,
      },
    ],
    createdBy: 'user-002',
    createdAt: '2024-09-13T11:00:00Z',
    updatedAt: '2024-09-17T16:00:00Z',
  },
]

/**
 * Mock Outbounds 데이터
 */
export const MOCK_OUTBOUNDS: Outbound[] = [
  {
    id: 'OUT-001',
    outboundCode: 'OUT-2024-001',
    customerId: 'CUST-001',
    customerName: '(주)테크솔루션',
    warehouseId: 'WH-001',
    warehouseName: '본사 창고',
    requestedDate: '2024-09-25',
    shippedDate: '2024-09-26',
    committedDate: '2024-09-26',
    status: 'committed',
    totalAmount: 1450000,
    lines: [
      {
        id: 'LINE-OUT-001',
        itemId: '1',
        itemCode: 'ITEM-001',
        itemName: '노트북 거치대 (화이트)',
        quantity: 30,
        unitPrice: 25000,
        totalPrice: 750000,
      },
      {
        id: 'LINE-OUT-002',
        itemId: '3',
        itemCode: 'ITEM-003',
        itemName: '기계식 키보드 RGB (화이트)',
        quantity: 10,
        unitPrice: 75000,
        totalPrice: 750000,
      },
    ],
    note: '정기 배송',
    createdBy: 'user-001',
    createdAt: '2024-09-23T10:00:00Z',
    updatedAt: '2024-09-26T15:30:00Z',
  },
  {
    id: 'OUT-002',
    outboundCode: 'OUT-2024-002',
    customerId: 'CUST-002',
    customerName: '글로벌마켓',
    warehouseId: 'WH-001',
    warehouseName: '본사 창고',
    requestedDate: '2024-09-28',
    status: 'approved',
    totalAmount: 1840000,
    lines: [
      {
        id: 'LINE-OUT-003',
        itemId: '2',
        itemCode: 'ITEM-002',
        itemName: '무선 마우스 (블랙)',
        quantity: 50,
        unitPrice: 20000,
        totalPrice: 1000000,
      },
      {
        id: 'LINE-OUT-004',
        itemId: '7',
        itemCode: 'ITEM-007',
        itemName: '블루투스 스피커 (화이트)',
        quantity: 20,
        unitPrice: 50000,
        totalPrice: 1000000,
      },
    ],
    createdBy: 'user-002',
    createdAt: '2024-09-26T09:30:00Z',
    updatedAt: '2024-09-27T14:20:00Z',
  },
  {
    id: 'OUT-003',
    outboundCode: 'OUT-2024-003',
    customerId: 'CUST-001',
    customerName: '(주)테크솔루션',
    warehouseId: 'WH-001',
    warehouseName: '본사 창고',
    requestedDate: '2024-10-02',
    status: 'pending',
    totalAmount: 2400000,
    lines: [
      {
        id: 'LINE-OUT-005',
        itemId: '4',
        itemCode: 'ITEM-004',
        itemName: '모니터 암 (싱글)',
        quantity: 40,
        unitPrice: 60000,
        totalPrice: 2400000,
      },
    ],
    note: '긴급 출고',
    createdBy: 'user-001',
    createdAt: '2024-10-01T11:00:00Z',
    updatedAt: '2024-10-01T11:00:00Z',
  },
  {
    id: 'OUT-004',
    outboundCode: 'OUT-2024-004',
    customerId: 'CUST-003',
    customerName: '스마트오피스',
    warehouseId: 'WH-001',
    warehouseName: '본사 창고',
    requestedDate: '2024-10-05',
    status: 'draft',
    totalAmount: 1350000,
    lines: [
      {
        id: 'LINE-OUT-006',
        itemId: '5',
        itemCode: 'ITEM-005',
        itemName: '책상 정리 세트 (베이지)',
        quantity: 30,
        unitPrice: 45000,
        totalPrice: 1350000,
      },
    ],
    createdBy: 'user-001',
    createdAt: '2024-10-02T14:00:00Z',
    updatedAt: '2024-10-02T14:00:00Z',
  },
]

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
