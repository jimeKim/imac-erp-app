import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Package, Search, Filter, Plus } from 'lucide-react'
import { getItems } from '@/shared/services/itemApi'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { Empty, ErrorDisplay } from '@/shared/components/feedback'
import { ItemListParams } from '@/shared/types/item'
import { RequirePermission } from '@/shared/components/auth/RequirePermission'

/**
 * Items 목록 페이지
 */
export default function ItemsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useState<ItemListParams>({
    page: 1,
    pageSize: 20,
    search: '',
    type: 'all',
    isActive: undefined,
    sortBy: 'name',
    sortOrder: 'asc',
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['items', params],
    queryFn: () => getItems(params),
  })

  const handleSearchChange = (value: string) => {
    setParams((prev) => ({ ...prev, search: value, page: 1 }))
  }

  const handleTypeChange = (type: string) => {
    setParams((prev) => ({ ...prev, type: type as ItemListParams['type'], page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }))
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load items"
        description="An error occurred while fetching items"
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
          <h1 className="text-3xl font-bold tracking-tight">{t('modules:items.title')}</h1>
          <p className="text-muted-foreground">Manage your inventory items</p>
        </div>

        <RequirePermission permission="ITEMS_CREATE">
          <Button asChild>
            <Link to="/items/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Link>
          </Button>
        </RequirePermission>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* 검색 */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={params.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-md border bg-background py-2 pl-9 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* 필터 */}
            <div className="flex gap-2">
              <select
                value={params.type || 'all'}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Types</option>
                <option value="single">Single</option>
                <option value="assembled">Assembled</option>
              </select>

              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
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
            <p className="text-sm text-muted-foreground">Loading items...</p>
          </div>
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          {/* 아이템 리스트 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => (
              <Card key={item.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{item.name}</CardTitle>
                    </div>
                    {!item.isActive && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Inactive</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Code:</span>
                    <span className="font-mono font-medium">{item.itemCode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{item.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stock:</span>
                    <span
                      className={
                        item.currentStock < item.safetyStock ? 'font-semibold text-destructive' : ''
                      }
                    >
                      {item.currentStock} / {item.safetyStock}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-semibold">₩{item.sellingPrice.toLocaleString()}</span>
                  </div>

                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/items/${item.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={data.page === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="min-w-[2.5rem]"
                    >
                      {page}
                    </Button>
                  ))}
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
          title="No items found"
          description={
            params.search
              ? `No items match "${params.search}". Try adjusting your search.`
              : 'No items available. Add your first item to get started.'
          }
          action={
            params.search
              ? {
                  label: 'Clear search',
                  onClick: () => handleSearchChange(''),
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
