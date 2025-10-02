import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, Search, AlertTriangle, TrendingDown } from 'lucide-react'
import { getStocks } from '@/shared/services/stockApi'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { Empty, ErrorDisplay } from '@/shared/components/feedback'
import { StockListParams } from '@/shared/types/stock'

/**
 * Stocks 현황 페이지
 */
export default function StocksPage() {
  const { t } = useTranslation()
  const [params, setParams] = useState<StockListParams>({
    page: 1,
    pageSize: 20,
    search: '',
    lowStockOnly: false,
    sortBy: 'itemName',
    sortOrder: 'asc',
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stocks', params],
    queryFn: () => getStocks(params),
  })

  const handleSearchChange = (value: string) => {
    setParams((prev) => ({ ...prev, search: value, page: 1 }))
  }

  const toggleLowStockOnly = () => {
    setParams((prev) => ({ ...prev, lowStockOnly: !prev.lowStockOnly, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }))
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load stocks"
        description="An error occurred while fetching stock information"
        error={error as Error}
        onRetry={() => refetch()}
      />
    )
  }

  // 통계 계산
  const totalItems = data?.total || 0
  const lowStockCount = data?.stocks.filter((s) => s.currentStock < s.safetyStock).length || 0
  const totalValue = data?.stocks.reduce((sum, s) => sum + s.currentStock * 1000, 0) || 0 // 임시 가격

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('modules:stocks.title')}</h1>
        <p className="text-muted-foreground">Monitor your inventory stock levels</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Below safety stock level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Estimated inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* 검색 */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by item name or code..."
                value={params.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-md border bg-background py-2 pl-9 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* 필터 */}
            <div className="flex gap-2">
              <Button
                variant={params.lowStockOnly ? 'default' : 'outline'}
                size="sm"
                onClick={toggleLowStockOnly}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Low Stock Only
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 결과 */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading stocks...</p>
          </div>
        </div>
      ) : data && data.stocks.length > 0 ? (
        <>
          {/* 재고 테이블 */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Item Code</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Item Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Warehouse</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Current Stock</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Safety Stock</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Available</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.stocks.map((stock) => {
                      const isLowStock = stock.currentStock < stock.safetyStock

                      return (
                        <tr key={stock.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-mono text-sm">{stock.itemCode}</td>
                          <td className="px-4 py-3 text-sm font-medium">{stock.itemName}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {stock.warehouseName || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`font-semibold ${isLowStock ? 'text-destructive' : ''}`}
                            >
                              {stock.currentStock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {stock.safetyStock}
                          </td>
                          <td className="px-4 py-3 text-right">{stock.availableStock}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {isLowStock ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                                  <AlertTriangle className="h-3 w-3" />
                                  Low
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                  OK
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/items/${stock.itemId}`}>View</Link>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 페이지네이션 */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(data.page - 1) * data.pageSize + 1} to{' '}
                {Math.min(data.page * data.pageSize, data.total)} of {data.total} items
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page === 1}
                  onClick={() => handlePageChange(data.page - 1)}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={data.page === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[2.5rem]"
                      >
                        {page}
                      </Button>
                    ),
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page === data.totalPages}
                  onClick={() => handlePageChange(data.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Empty
          icon="search"
          title="No stocks found"
          description={
            params.search
              ? `No stocks match "${params.search}". Try adjusting your search.`
              : params.lowStockOnly
                ? 'No low stock items found. All items are above safety stock level.'
                : 'No stock data available.'
          }
          action={
            params.search || params.lowStockOnly
              ? {
                  label: 'Clear filters',
                  onClick: () => {
                    setParams({
                      ...params,
                      search: '',
                      lowStockOnly: false,
                      page: 1,
                    })
                  },
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
