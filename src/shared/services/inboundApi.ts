/**
 * Inbound API 클라이언트
 */

import { api } from './apiClient'
import { Inbound, InboundListParams, InboundListResponse } from '@/shared/types/inbound'
import { MOCK_INBOUNDS, paginateItems } from './mockData'

const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK_API !== 'false'

/**
 * Inbounds 목록 조회
 */
export async function getInbounds(params: InboundListParams = {}): Promise<InboundListResponse> {
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

    let inbounds = [...MOCK_INBOUNDS]

    // 검색
    if (search) {
      const searchLower = search.toLowerCase()
      inbounds = inbounds.filter(
        (inbound) =>
          inbound.inboundCode.toLowerCase().includes(searchLower) ||
          inbound.supplierName.toLowerCase().includes(searchLower),
      )
    }

    // 상태 필터
    if (status && status !== 'all') {
      inbounds = inbounds.filter((inbound) => inbound.status === status)
    }

    // 날짜 필터
    if (dateFrom) {
      inbounds = inbounds.filter((inbound) => inbound.requestedDate >= dateFrom)
    }
    if (dateTo) {
      inbounds = inbounds.filter((inbound) => inbound.requestedDate <= dateTo)
    }

    // 정렬
    if (sortBy) {
      inbounds.sort((a, b) => {
        let aValue: string | number = ''
        let bValue: string | number = ''

        switch (sortBy) {
          case 'inboundCode':
            aValue = a.inboundCode
            bValue = b.inboundCode
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

    const total = inbounds.length
    const totalPages = Math.ceil(total / pageSize)
    const paginatedInbounds = paginateItems(inbounds, page, pageSize)

    return {
      inbounds: paginatedInbounds,
      total,
      page,
      pageSize,
      totalPages,
    }
  }

  return api.get<InboundListResponse>('/inbounds', { params })
}

/**
 * Inbound 상세 조회
 */
export async function getInbound(id: string): Promise<Inbound> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200))

    const inbound = MOCK_INBOUNDS.find((i) => i.id === id)
    if (!inbound) {
      throw new Error('Inbound not found')
    }

    return inbound
  }

  return api.get<Inbound>(`/inbounds/${id}`)
}
