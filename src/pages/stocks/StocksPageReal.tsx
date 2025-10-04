import { useState } from 'react'
import { useStocksQuery } from '@/features/stocks/api/stocks.api'
import { Package, Search, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { Empty, ErrorDisplay } from '@/shared/components/feedback'
import { useTranslation } from 'react-i18next'

/**
 * Stocks 목록 페이지 (engine-core 실제 API 연동)
 */
export default function StocksPageReal() {
  const { t } = useTranslation(['common', 'modules'])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  const {
    data: stocksData,
    isLoading,
    error,
  } = useStocksQuery({
    page,
    limit: 10,
    low_stock: showLowStockOnly,
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-gray-600">{t('common.loading')}...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <ErrorDisplay
          title={t('modules:stocks.error.loadFailed')}
          description={error instanceof Error ? error.message : t('common.error')}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  const stocks = stocksData?.stocks || []
  const pagination = stocksData?.pagination

  // 검색 필터링 (클라이언트 사이드)
  const filteredStocks = search
    ? stocks.filter(
        (stock) =>
          stock.item_sku?.toLowerCase().includes(search.toLowerCase()) ||
          stock.item_name?.toLowerCase().includes(search.toLowerCase()),
      )
    : stocks

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Package className="h-6 w-6" />
            {t('modules:stocks.title')}
          </h1>
          {pagination && (
            <p className="mt-1 text-sm text-muted-foreground">
              총 {pagination.total}개의 재고 항목
            </p>
          )}
        </div>
        <Button
          variant={showLowStockOnly ? 'default' : 'outline'}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          {showLowStockOnly ? '전체 보기' : '부족 재고만'}
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('common.searchFilter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('modules:stocks.searchPlaceholder')}
              className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredStocks.length === 0 ? (
            <Empty
              icon="inbox"
              title={t('modules:stocks.empty.title')}
              description={t('modules:stocks.empty.message')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      {t('modules:stocks.table.itemName')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      {t('modules:stocks.table.warehouse')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      {t('modules:stocks.table.uom')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      {t('modules:stocks.table.quantity')}
                    </th>
                    <th className="px-4 py-3 text-sm font-medium">{t('common.updatedAt')}</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">
                      {t('modules:stocks.table.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {filteredStocks.map((stock) => {
                    const isLowStock = stock.qty <= 10 // 임시 기준값

                    return (
                      <tr key={stock.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium">{stock.item_sku || '-'}</td>
                        <td className="px-4 py-3 text-sm">{stock.item_name || '-'}</td>
                        <td className="px-4 py-3 text-sm">{stock.warehouse}</td>
                        <td className="px-4 py-3 text-sm">{stock.item_uom || '-'}</td>
                        <td
                          className={`px-4 py-3 text-right text-sm font-semibold ${
                            isLowStock ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {stock.qty.toFixed(0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(stock.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isLowStock ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              재고 부족
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              정상
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-end space-x-2 border-t p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{t('common.previous')}</span>
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
              disabled={page >= pagination.pages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">{t('common.next')}</span>
            </Button>
          </div>
        )}
      </Card>

      {/* Debug Info */}
      {import.meta.env.DEV && (
        <div className="mt-8 rounded-md bg-gray-100 p-4 text-sm text-gray-700">
          <h3 className="mb-2 font-semibold">Debug:</h3>
          <p>API Base URL: {import.meta.env.VITE_API_BASE_URL}</p>
          <p>Stocks Count: {filteredStocks.length}</p>
          <p>Total: {pagination?.total}</p>
          <p>Page: {page}</p>
          <p>Low Stock Only: {showLowStockOnly ? 'Yes' : 'No'}</p>
          <p>Token: {localStorage.getItem('access_token') ? '✅ Present' : '❌ Missing'}</p>
        </div>
      )}
    </div>
  )
}
