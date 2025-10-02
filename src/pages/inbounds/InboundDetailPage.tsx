import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Truck, Edit, XCircle, CheckCircle } from 'lucide-react'
import { getInbound } from '@/shared/services/inboundApi'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { ErrorDisplay } from '@/shared/components/feedback'
import { RequirePermission } from '@/shared/components/auth/RequirePermission'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700 border-gray-300',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  approved: 'bg-blue-100 text-blue-700 border-blue-300',
  received: 'bg-green-100 text-green-700 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
}

const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  received: 'Received',
  cancelled: 'Cancelled',
}

/**
 * Inbound 상세 페이지
 */
export default function InboundDetailPage() {
  const { id } = useParams<{ id: string }>()

  const {
    data: inbound,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['inbound', id],
    queryFn: () => getInbound(id!),
    enabled: !!id,
  })

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load inbound"
        description="An error occurred while fetching inbound details"
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
          <p className="text-sm text-muted-foreground">Loading inbound details...</p>
        </div>
      </div>
    )
  }

  if (!inbound) {
    return (
      <ErrorDisplay
        title="Inbound not found"
        description="The requested inbound record could not be found"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/inbounds">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">{inbound.inboundCode}</h1>
            <p className="text-muted-foreground">Supplier: {inbound.supplierName}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <RequirePermission permission="INBOUNDS_UPDATE">
            <Button variant="outline" disabled={inbound.status === 'received'}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </RequirePermission>

          <RequirePermission permission="INBOUNDS_DELETE">
            <Button
              variant="destructive"
              disabled={inbound.status === 'received' || inbound.status === 'cancelled'}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </RequirePermission>
        </div>
      </div>

      {/* 상태 카드 */}
      <Card className={`border-2 ${STATUS_COLORS[inbound.status]}`}>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {inbound.status === 'received' ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <Truck className="h-6 w-6" />
            )}
            <div>
              <p className="font-semibold">{STATUS_LABELS[inbound.status]}</p>
              <p className="text-sm opacity-90">
                {inbound.status === 'received' && inbound.receivedDate
                  ? `Received on ${inbound.receivedDate}`
                  : `Requested for ${inbound.requestedDate}`}
              </p>
            </div>
          </div>

          {inbound.status === 'pending' && (
            <RequirePermission permission="INBOUNDS_UPDATE">
              <Button size="sm">Approve Inbound</Button>
            </RequirePermission>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Inbound Code</span>
              <span className="font-mono font-medium">{inbound.inboundCode}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Supplier</span>
              <span className="font-medium">{inbound.supplierName}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Warehouse</span>
              <span>{inbound.warehouseName}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Requested Date</span>
              <span>{inbound.requestedDate}</span>
            </div>
            {inbound.receivedDate && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Received Date</span>
                <span className="font-medium text-green-600">{inbound.receivedDate}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-lg font-bold text-primary">
                ₩{inbound.totalAmount.toLocaleString()}
              </span>
            </div>
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
              <p className="mt-1">{new Date(inbound.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <p className="mt-1">{new Date(inbound.updatedAt).toLocaleString()}</p>
            </div>
            {inbound.note && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Note</label>
                <p className="mt-1 rounded-md bg-muted p-3 text-sm">{inbound.note}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 라인 아이템 */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items ({inbound.lines.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Item Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Item Name</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Unit Price</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Total Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inbound.lines.map((line) => (
                  <tr key={line.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-sm">{line.itemCode}</td>
                    <td className="px-4 py-3 text-sm font-medium">{line.itemName}</td>
                    <td className="px-4 py-3 text-right font-semibold">{line.quantity}</td>
                    <td className="px-4 py-3 text-right">₩{line.unitPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      ₩{line.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{line.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-muted/30">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-primary">
                    ₩{inbound.totalAmount.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
