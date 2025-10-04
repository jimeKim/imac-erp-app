import { useState } from 'react'
import { useInboundsQuery } from '@/features/inbounds/api/inbounds.api'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { Empty, ErrorDisplay } from '@/shared/components/feedback'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function InboundsPageReal() {
  const { t } = useTranslation(['common', 'modules'])
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading, error } = useInboundsQuery({
    page,
    limit: 10,
    status: statusFilter || undefined,
  })

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

  if (error) {
    return (
      <ErrorDisplay
        title={t('modules:inbounds.error.loadFailed')}
        description={error instanceof Error ? error.message : t('common.error')}
        onRetry={() => window.location.reload()}
      />
    )
  }

  const inbounds = data?.inbounds || []
  const pagination = data?.pagination
  const totalPages = pagination?.pages || 0

  return (
    <div className="container mx-auto p-4">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Package className="h-6 w-6" />
            {t('modules:inbounds.title')}
          </h1>
          {pagination && (
            <p className="mt-1 text-sm text-muted-foreground">전체 {pagination.total}개</p>
          )}
        </div>
      </div>

      {/* 필터 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('common.searchFilter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">전체 상태</option>
              <option value="pending">대기</option>
              <option value="received">입고완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 테이블 */}
      <Card>
        <CardContent className="p-0">
          {inbounds.length === 0 ? (
            <Empty
              icon="inbox"
              title={t('modules:inbounds.empty.title')}
              description={t('modules:inbounds.empty.message')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      {t('modules:inbounds.table.itemName')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      {t('modules:inbounds.table.supplier')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      {t('modules:inbounds.table.quantity')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      {t('modules:inbounds.table.unitCost')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium">
                      {t('modules:inbounds.table.status')}
                    </th>
                    <th className="px-4 py-3 text-sm font-medium">{t('common.createdAt')}</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      {t('common.action')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inbounds.map((inbound) => (
                    <tr key={inbound.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-medium">{inbound.item_sku || '-'}</td>
                      <td className="px-4 py-3 text-sm">{inbound.item_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {inbound.supplier || '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {inbound.quantity.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {inbound.unit_cost ? `$${inbound.unit_cost.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            inbound.status === 'received'
                              ? 'bg-green-100 text-green-800'
                              : inbound.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : inbound.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {inbound.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(inbound.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to={`/inbounds/${inbound.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {t('common.view')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {/* 페이지네이션 */}
        {totalPages > 1 && (
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
              {t('common.page', { currentPage: page, totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
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
          <p>Inbounds Count: {inbounds.length}</p>
          <p>Total: {pagination?.total}</p>
          <p>Page: {page}</p>
          <p>Token: {localStorage.getItem('access_token') ? '✅ Present' : '❌ Missing'}</p>
        </div>
      )}
    </div>
  )
}
