import { useQuery } from '@tanstack/react-query'
import apiClient from '@/shared/services/apiClient'

/**
 * Stocks API Types (engine-core 형식)
 */
interface StockItem {
  id: string
  item_id: string
  warehouse: string
  qty: number
  updated_at: string
  item_sku?: string
  item_name?: string
  item_uom?: string
}

interface StocksResponse {
  stocks: StockItem[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

/**
 * 재고 목록 조회
 */
export const useStocksQuery = (filters?: {
  page?: number
  limit?: number
  item_id?: string
  warehouse?: string
  low_stock?: boolean
}) => {
  return useQuery({
    queryKey: ['stocks', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.item_id) params.append('item_id', filters.item_id)
      if (filters?.warehouse) params.append('warehouse', filters.warehouse)
      if (filters?.low_stock) params.append('low_stock', 'true')

      const response = await apiClient.get<StocksResponse>('/api/v1/stocks/', { params })
      return response.data
    },
    staleTime: 10_000, // 10초 (재고는 자주 변경)
  })
}

/**
 * 상품별 재고 조회
 */
export const useStocksByItemQuery = (itemId: string) => {
  return useQuery({
    queryKey: ['stocks', 'item', itemId],
    queryFn: async () => {
      const response = await apiClient.get<StockItem[]>(`/api/v1/stocks/item/${itemId}`)
      return response.data
    },
    enabled: !!itemId,
  })
}

/**
 * 부족 재고 조회
 */
export const useLowStockQuery = (threshold?: number) => {
  return useQuery({
    queryKey: ['stocks', 'low-stock', threshold],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (threshold) params.append('threshold', threshold.toString())

      const response = await apiClient.get<StockItem[]>('/api/v1/stocks/low-stock', { params })
      return response.data
    },
  })
}

export type { StockItem, StocksResponse }
