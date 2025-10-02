/**
 * Stock API 클라이언트
 */

import { api } from './apiClient'
import { Stock, StockListParams, StockListResponse } from '@/shared/types/stock'
import { MOCK_STOCKS, paginateItems } from './mockData'

const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK_API !== 'false'

/**
 * Stocks 목록 조회
 */
export async function getStocks(params: StockListParams = {}): Promise<StockListResponse> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const { page = 1, pageSize = 20, search, lowStockOnly, sortBy, sortOrder = 'asc' } = params

    let stocks = [...MOCK_STOCKS]

    // 검색
    if (search) {
      const searchLower = search.toLowerCase()
      stocks = stocks.filter(
        (stock) =>
          stock.itemName.toLowerCase().includes(searchLower) ||
          stock.itemCode.toLowerCase().includes(searchLower),
      )
    }

    // 안전재고 미만만 조회
    if (lowStockOnly) {
      stocks = stocks.filter((stock) => stock.currentStock < stock.safetyStock)
    }

    // 정렬
    if (sortBy) {
      stocks.sort((a, b) => {
        let aValue: string | number = ''
        let bValue: string | number = ''

        switch (sortBy) {
          case 'itemName':
            aValue = a.itemName
            bValue = b.itemName
            break
          case 'currentStock':
            aValue = a.currentStock
            bValue = b.currentStock
            break
          case 'lastUpdatedAt':
            aValue = new Date(a.lastUpdatedAt).getTime()
            bValue = new Date(b.lastUpdatedAt).getTime()
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

    const total = stocks.length
    const totalPages = Math.ceil(total / pageSize)
    const paginatedStocks = paginateItems(stocks, page, pageSize)

    return {
      stocks: paginatedStocks,
      total,
      page,
      pageSize,
      totalPages,
    }
  }

  return api.get<StockListResponse>('/stocks', { params })
}

/**
 * Stock 상세 조회
 */
export async function getStock(itemId: string): Promise<Stock> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200))

    const stock = MOCK_STOCKS.find((s) => s.itemId === itemId)
    if (!stock) {
      throw new Error('Stock not found')
    }

    return stock
  }

  return api.get<Stock>(`/stocks/${itemId}`)
}
