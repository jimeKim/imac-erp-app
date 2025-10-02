import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Package, Edit, Trash2, AlertCircle } from 'lucide-react'
import { getItem } from '@/shared/services/itemApi'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { ErrorDisplay } from '@/shared/components/feedback'
import { RequirePermission } from '@/shared/components/auth/RequirePermission'

/**
 * Item 상세 페이지
 */
export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()

  const {
    data: item,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItem(id!),
    enabled: !!id,
  })

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load item"
        description="An error occurred while fetching item details"
        error={error as Error}
        onRetry={() => refetch()}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading item details...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <ErrorDisplay title="Item not found" description="The requested item could not be found" />
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/items">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <p className="text-muted-foreground">Item Code: {item.itemCode}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <RequirePermission permission="ITEMS_UPDATE">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </RequirePermission>

          <RequirePermission permission="ITEMS_DELETE">
            <Button variant="destructive" disabled>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </RequirePermission>
        </div>
      </div>

      {/* 재고 경고 */}
      {item.currentStock < item.safetyStock && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Low Stock Alert</p>
              <p className="text-sm text-muted-foreground">
                Current stock ({item.currentStock}) is below safety stock ({item.safetyStock})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="mt-1 capitalize">{item.type}</p>
              </div>
              {item.color && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Color</label>
                  <p className="mt-1">{item.color}</p>
                </div>
              )}
              {item.size && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Size</label>
                  <p className="mt-1">{item.size}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="mt-1">
                  {item.isActive ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-muted-foreground">Inactive</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 재고 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    item.currentStock < item.safetyStock ? 'text-destructive' : ''
                  }`}
                >
                  {item.currentStock}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Safety Stock</label>
                <p className="mt-1 text-2xl font-bold">{item.safetyStock}</p>
              </div>
            </div>

            <div className="pt-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${
                    item.currentStock < item.safetyStock ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{
                    width: `${Math.min((item.currentStock / item.safetyStock) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {item.currentStock >= item.safetyStock
                  ? 'Stock level is healthy'
                  : 'Stock level is below safety threshold'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 가격 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Purchase Price</span>
              <span className="font-medium">₩{item.purchasePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Cost Price</span>
              <span className="font-medium">₩{item.costPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Release Price</span>
              <span className="font-medium">₩{item.releasePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Selling Price</span>
              <span className="font-semibold text-primary">
                ₩{item.sellingPrice.toLocaleString()}
              </span>
            </div>
            {item.discountPrice && item.discountPrice > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Discount Price</span>
                <span className="font-semibold text-green-600">
                  ₩{item.discountPrice.toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 메타 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created At</label>
              <p className="mt-1">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <p className="mt-1">{new Date(item.updatedAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
