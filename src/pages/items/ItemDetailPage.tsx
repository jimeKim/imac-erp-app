import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Package, Edit, Trash2, AlertCircle, GitBranch, History, FileText } from 'lucide-react'
import { getItem } from '@/shared/services/itemApi'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { ErrorDisplay } from '@/shared/components/feedback'
import { RequirePermission } from '@/shared/components/auth/RequirePermission'
import { BomTree } from '@/features/items/components/BomTree'

/**
 * Item 상세 페이지
 */
type TabType = 'basic' | 'bom' | 'stock' | 'history'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<TabType>('basic')

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
      {item.currentStock !== undefined && item.safetyStock !== undefined && item.currentStock < item.safetyStock && (
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

      {/* 탭 네비게이션 */}
      <div className="border-b">
        <nav className="flex gap-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'basic'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4" />
            기본 정보
          </button>
          <button
            onClick={() => setActiveTab('bom')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'bom'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            BOM 구조
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
              NEW
            </span>
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'stock'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="h-4 w-4" />
            재고 현황
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="h-4 w-4" />
            거래 이력
          </button>
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'basic' && (
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
            {item.currentStock !== undefined && item.safetyStock !== undefined && (
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
            )}

            {/* 가격 정보 (legacy) */}
            {item.purchasePrice !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.purchasePrice !== undefined && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">Purchase Price</span>
                      <span className="font-medium">₩{item.purchasePrice.toLocaleString()}</span>
                    </div>
                  )}
                  {item.costPrice !== undefined && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">Cost Price</span>
                      <span className="font-medium">₩{item.costPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {item.releasePrice !== undefined && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">Release Price</span>
                      <span className="font-medium">₩{item.releasePrice.toLocaleString()}</span>
                    </div>
                  )}
                  {item.sellingPrice !== undefined && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">Selling Price</span>
                      <span className="font-semibold text-primary">
                        ₩{item.sellingPrice.toLocaleString()}
                      </span>
                    </div>
                  )}
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
            )}

            {/* 단가 정보 (new) */}
            {item.unit_cost !== null && item.unit_cost !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle>Cost Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Unit Cost</span>
                    <span className="font-semibold text-primary">
                      ₩{item.unit_cost.toLocaleString()}
                    </span>
                  </div>
                  {item.uom && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Unit of Measure</span>
                      <span className="font-medium">{item.uom}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
      )}

      {/* BOM 구조 탭 */}
      {activeTab === 'bom' && id && (
        <div>
          <BomTree itemId={id} />
        </div>
      )}

          {/* 재고 현황 탭 */}
          {activeTab === 'stock' && (
            <Card>
              <CardHeader>
                <CardTitle>재고 현황</CardTitle>
              </CardHeader>
              <CardContent>
                {item.currentStock !== undefined && item.safetyStock !== undefined ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                        <p className={`mt-1 text-2xl font-bold ${item.currentStock < item.safetyStock ? 'text-destructive' : ''}`}>
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
                          className={`h-full ${item.currentStock < item.safetyStock ? 'bg-destructive' : 'bg-primary'}`}
                          style={{ width: `${Math.min((item.currentStock / item.safetyStock) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {item.currentStock >= item.safetyStock ? 'Stock level is healthy' : 'Stock level is below safety threshold'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">재고 정보가 없습니다.</p>
                )}
              </CardContent>
            </Card>
          )}

      {/* 거래 이력 탭 */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>거래 이력</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>거래 이력 기능은 곧 제공될 예정입니다</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
