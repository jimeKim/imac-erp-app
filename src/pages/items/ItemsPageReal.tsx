import { useState, type ChangeEvent } from 'react'
import { useItemsQuery } from '@/features/items/api/items.api'
import { Link } from 'react-router-dom'
import { Package, Search, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { Empty, ErrorDisplay } from '@/shared/components/feedback'
import { RequirePermission } from '@/shared/components/auth/RequirePermission'
import { useTranslation } from 'react-i18next'

/**
 * Items 목록 페이지 (engine-core 실제 API 연동)
 */
export default function ItemsPageReal() {
  const { t } = useTranslation(['common', 'modules'])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  const {
    data: itemsData,
    isLoading,
    error,
  } = useItemsQuery({
    page,
    limit: pageSize,
    search: searchTerm || undefined,
  })

  const items = itemsData?.items || []
  const pagination = itemsData?.pagination

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1) // 검색 시 페이지 초기화
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="text-muted-foreground">{t('common.loading')}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorDisplay
          title={t('modules:items.error.loadFailed')}
          description={(error as { message?: string }).message || 'Unknown error'}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Package className="h-6 w-6" />
            {t('modules:items.title')}
          </h1>
          {pagination && (
            <p className="mt-1 text-sm text-muted-foreground">총 {pagination.total}개의 상품</p>
          )}
        </div>
        <RequirePermission permission="ITEMS_CREATE">
          <Link
            to="/items/create"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <PlusCircle className="h-4 w-4" />
            {t('modules:items.create')}
          </Link>
        </RequirePermission>
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
              placeholder={t('modules:items.searchPlaceholder')}
              className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <Empty
              icon="inbox"
              title={t('modules:items.empty.title')}
              description={t('modules:items.empty.message')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      {t('modules:items.sku')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      {t('modules:items.table.itemName')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">UOM</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      {t('modules:items.table.cost', '단가')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      {t('common.createdAt')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium">
                      {t('modules:items.itemType')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-sm">
                        <Link
                          to={`/items/${item.id}`}
                          className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {item.sku}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{item.uom}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        {item.unit_cost !== null ? `₩${item.unit_cost.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.item_type ? (
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {t(`modules:items.types.${item.item_type}`)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-end space-x-2 p-4">
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
        <div className="mt-4 rounded-lg bg-gray-100 p-4 text-xs">
          <p>
            <strong>Debug:</strong>
          </p>
          <p>API Base URL: {import.meta.env.VITE_API_BASE_URL}</p>
          <p>Items Count: {items.length}</p>
          <p>Total: {pagination?.total || 0}</p>
          <p>Page: {page}</p>
          <p>Token: {localStorage.getItem('access_token') ? '✅ Present' : '❌ Missing'}</p>
        </div>
      )}
    </div>
  )
}
