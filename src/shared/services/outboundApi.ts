/**
 * Outbound API 클라이언트
 */

import { api } from './apiClient'
import {
  Outbound,
  OutboundListParams,
  OutboundListResponse,
  OutboundCreateInput,
} from '@/shared/types/outbound'
import { MOCK_OUTBOUNDS, paginateItems, MOCK_ITEMS } from './mockData'

const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK_API !== 'false'

/**
 * Outbounds 목록 조회
 */
export async function getOutbounds(params: OutboundListParams = {}): Promise<OutboundListResponse> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const {
      page = 1,
      pageSize = 20,
      search,
      status,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder = 'desc',
    } = params

    let outbounds = [...MOCK_OUTBOUNDS]

    // 검색
    if (search) {
      const searchLower = search.toLowerCase()
      outbounds = outbounds.filter(
        (outbound) =>
          outbound.outboundCode.toLowerCase().includes(searchLower) ||
          outbound.customerName.toLowerCase().includes(searchLower),
      )
    }

    // 상태 필터
    if (status && status !== 'all') {
      outbounds = outbounds.filter((outbound) => outbound.status === status)
    }

    // 날짜 필터
    if (dateFrom) {
      outbounds = outbounds.filter((outbound) => outbound.requestedDate >= dateFrom)
    }
    if (dateTo) {
      outbounds = outbounds.filter((outbound) => outbound.requestedDate <= dateTo)
    }

    // 정렬
    if (sortBy) {
      outbounds.sort((a, b) => {
        let aValue: string | number = ''
        let bValue: string | number = ''

        switch (sortBy) {
          case 'outboundCode':
            aValue = a.outboundCode
            bValue = b.outboundCode
            break
          case 'requestedDate':
            aValue = new Date(a.requestedDate).getTime()
            bValue = new Date(b.requestedDate).getTime()
            break
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
            break
          case 'totalAmount':
            aValue = a.totalAmount
            bValue = b.totalAmount
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
    }

    const total = outbounds.length
    const totalPages = Math.ceil(total / pageSize)
    const paginatedOutbounds = paginateItems(outbounds, page, pageSize)

    return {
      outbounds: paginatedOutbounds,
      total,
      page,
      pageSize,
      totalPages,
    }
  }

  return api.get<OutboundListResponse>('/outbounds', { params })
}

/**
 * Outbound 상세 조회
 */
export async function getOutbound(id: string): Promise<Outbound> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200))

    const outbound = MOCK_OUTBOUNDS.find((o) => o.id === id)
    if (!outbound) {
      throw new Error('Outbound not found')
    }

    return outbound
  }

  return api.get<Outbound>(`/outbounds/${id}`)
}

/**
 * Outbound 생성
 */
export async function createOutbound(input: OutboundCreateInput): Promise<Outbound> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const now = new Date().toISOString()
    const newOutbound: Outbound = {
      id: `OUT-MOCK-${Date.now()}`,
      outboundCode: `OUT-2024-${String(MOCK_OUTBOUNDS.length + 1).padStart(3, '0')}`,
      customerId: input.customerId,
      customerName: 'Mock Customer',
      warehouseId: input.warehouseId,
      warehouseName: '본사 창고',
      requestedDate: input.requestedDate,
      status: 'draft',
      totalAmount: input.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
      lines: input.lines.map((line, index) => {
        const item = MOCK_ITEMS.find((i) => i.id === line.itemId)
        return {
          id: `LINE-MOCK-${Date.now()}-${index}`,
          itemId: line.itemId,
          itemCode: item?.itemCode || 'UNKNOWN',
          itemName: item?.name || 'Unknown Item',
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          totalPrice: line.quantity * line.unitPrice,
          note: line.note,
        }
      }),
      note: input.note,
      createdBy: 'user-current',
      createdAt: now,
      updatedAt: now,
    }

    MOCK_OUTBOUNDS.push(newOutbound)
    return newOutbound
  }

  return api.post<Outbound>('/outbounds', input)
}
