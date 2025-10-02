import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Calendar } from 'lucide-react'
import { getInbounds } from '@/shared/services/inboundApi'
import { Button, Card, CardContent } from '@/shared/components/ui'
import { Empty, ErrorDisplay } from '@/shared/components/feedback'
import { InboundListParams } from '@/shared/types/inbound'
import { RequirePermission } from '@/shared/components/auth/RequirePermission'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  received: 'Received',
  cancelled: 'Cancelled',
}

/**
 * Inbounds 목록 페이지
 */
export default function InboundsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useState<InboundListParams>({
    page: 1,
    pageSize: 20,
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inbounds', params],
    queryFn: () => getInbounds(params),
  })

  const handleSearchChange = (value: string) => {
    setParams((prev) => ({ ...prev, search: value, page: 1 }))
  }

  const handleStatusChange = (status: string) => {
    setParams((prev) => ({
      ...prev,
      status: status as InboundListParams['status'],
      page: 1,
    }))
  }

  const handleDateFromChange = (value: string) => {
    setParams((prev) => ({ ...prev, dateFrom: value, page: 1 }))
  }

  const handleDateToChange = (value: string) => {
    setParams((prev) => ({ ...prev, dateTo: value, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }))
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load inbounds"
        description="An error occurred while fetching inbound records"
        error={error as Error}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('modules:inbounds.title')}</h1>
          <p className="text-muted-foreground">Manage incoming inventory</p>
        </div>

        <RequirePermission permission="INBOUNDS_CREATE">
          <Button asChild>
            <Link to="/inbounds/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Inbound
            </Link>
          </Button>
        </RequirePermission>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* 검색 */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by code or supplier..."
                value={params.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-md border bg-background py-2 pl-9 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* 상태 필터 */}
            <select
              value={params.status || 'all'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* 날짜 필터 */}
          <div className="flex gap-4">
            <div className="flex flex-1 items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={params.dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="From date"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="date"
                value={params.dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="To date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 결과 */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading inbounds...</p>
          </div>
        </div>
      ) : data && data.inbounds.length > 0 ? (
        <>
          {/* 인바운드 테이블 */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Inbound Code</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Supplier</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Warehouse</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Requested Date</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Total Amount</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.inbounds.map((inbound) => (
                      <tr key={inbound.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-sm font-medium">
                          {inbound.inboundCode}
                        </td>
                        <td className="px-4 py-3 text-sm">{inbound.supplierName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {inbound.warehouseName}
                        </td>
                        <td className="px-4 py-3 text-sm">{inbound.requestedDate}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                STATUS_COLORS[inbound.status]
                              }`}
                            >
                              {STATUS_LABELS[inbound.status]}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          ₩{inbound.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/inbounds/${inbound.id}`}>View</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
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
                {Math.min(data.page * data.pageSize, data.total)} of {data.total} records
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
          icon="inbox"
          title="No inbounds found"
          description={
            params.search || params.status !== 'all' || params.dateFrom || params.dateTo
              ? 'No inbounds match your filters. Try adjusting your search criteria.'
              : 'No inbound records available. Create your first inbound to get started.'
          }
          action={
            params.search || params.status !== 'all' || params.dateFrom || params.dateTo
              ? {
                  label: 'Clear filters',
                  onClick: () => {
                    setParams({
                      ...params,
                      search: '',
                      status: 'all',
                      dateFrom: '',
                      dateTo: '',
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
