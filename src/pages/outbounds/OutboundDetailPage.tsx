import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, TruckIcon, Edit, XCircle, CheckCircle, Send, PackageCheck } from 'lucide-react'
import { getOutbound } from '@/shared/services/outboundApi'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { ErrorDisplay } from '@/shared/components/feedback'
import { RequirePermission } from '@/shared/components/auth/RequirePermission'
import { useToast } from '@/shared/hooks/useToast'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700 border-gray-300',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  approved: 'bg-blue-100 text-blue-700 border-blue-300',
  committed: 'bg-green-100 text-green-700 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
}

const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  committed: 'Committed',
  cancelled: 'Cancelled',
}

/**
 * Outbound 상세 페이지
 */
export default function OutboundDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    data: outbound,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['outbound', id],
    queryFn: () => getOutbound(id!),
    enabled: !!id,
  })

  // 상태 전환 핸들러 (Mock)
  const handleSubmitForApproval = async () => {
    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Submitted for approval', 'Outbound has been submitted and is pending approval')
      refetch()
    } catch (_err) {
      toast.error('Failed to submit', 'An error occurred while submitting the outbound')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Outbound approved', 'The outbound has been approved successfully')
      refetch()
    } catch (_err) {
      toast.error('Failed to approve', 'An error occurred while approving the outbound')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCommit = async () => {
    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success(
        'Outbound committed',
        'The outbound has been committed and inventory has been updated',
      )
      refetch()
    } catch (_err) {
      toast.error('Failed to commit', 'An error occurred while committing the outbound')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this outbound?')) return

    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Outbound cancelled', 'The outbound has been cancelled')
      refetch()
    } catch (_err) {
      toast.error('Failed to cancel', 'An error occurred while cancelling the outbound')
    } finally {
      setIsProcessing(false)
    }
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load outbound"
        description="An error occurred while fetching outbound details"
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
          <p className="text-sm text-muted-foreground">Loading outbound details...</p>
        </div>
      </div>
    )
  }

  if (!outbound) {
    return (
      <ErrorDisplay
        title="Outbound not found"
        description="The requested outbound record could not be found"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/outbounds">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">{outbound.outboundCode}</h1>
            <p className="text-muted-foreground">Customer: {outbound.customerName}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* 상태별 액션 버튼 (RBAC) */}
          {outbound.status === 'draft' && (
            <>
              <RequirePermission permission="OUTBOUNDS_UPDATE">
                <Button variant="outline" disabled={isProcessing}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </RequirePermission>
              <RequirePermission permission="OUTBOUNDS_UPDATE">
                <Button onClick={handleSubmitForApproval} disabled={isProcessing}>
                  <Send className="mr-2 h-4 w-4" />
                  Submit for Approval
                </Button>
              </RequirePermission>
            </>
          )}

          {outbound.status === 'pending' && (
            <RequirePermission permission="OUTBOUNDS_APPROVE">
              <Button onClick={handleApprove} disabled={isProcessing}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </RequirePermission>
          )}

          {outbound.status === 'approved' && (
            <RequirePermission permission="OUTBOUNDS_APPROVE">
              <Button onClick={handleCommit} disabled={isProcessing}>
                <PackageCheck className="mr-2 h-4 w-4" />
                Commit
              </Button>
            </RequirePermission>
          )}

          {(outbound.status === 'draft' || outbound.status === 'pending') && (
            <RequirePermission permission="OUTBOUNDS_DELETE">
              <Button variant="destructive" onClick={handleCancel} disabled={isProcessing}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </RequirePermission>
          )}
        </div>
      </div>

      {/* 상태 카드 */}
      <Card className={`border-2 ${STATUS_COLORS[outbound.status]}`}>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {outbound.status === 'committed' ? (
              <PackageCheck className="h-6 w-6" />
            ) : (
              <TruckIcon className="h-6 w-6" />
            )}
            <div>
              <p className="font-semibold">{STATUS_LABELS[outbound.status]}</p>
              <p className="text-sm opacity-90">
                {outbound.status === 'committed' && outbound.committedDate
                  ? `Committed on ${outbound.committedDate}`
                  : outbound.status === 'approved' && outbound.shippedDate
                    ? `Shipped on ${outbound.shippedDate}`
                    : `Requested for ${outbound.requestedDate}`}
              </p>
            </div>
          </div>

          {/* 워크플로우 힌트 */}
          {outbound.status === 'draft' && (
            <div className="text-right text-sm text-muted-foreground">
              <p className="font-medium">Next: Submit for Approval</p>
              <p className="text-xs">Draft → Pending → Approved → Committed</p>
            </div>
          )}
          {outbound.status === 'pending' && (
            <div className="text-right text-sm text-muted-foreground">
              <p className="font-medium">Awaiting Manager Approval</p>
              <p className="text-xs">Pending → Approved → Committed</p>
            </div>
          )}
          {outbound.status === 'approved' && (
            <div className="text-right text-sm text-muted-foreground">
              <p className="font-medium">Ready to Commit</p>
              <p className="text-xs">Commit to update inventory</p>
            </div>
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
              <span className="text-sm text-muted-foreground">Outbound Code</span>
              <span className="font-mono font-medium">{outbound.outboundCode}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Customer</span>
              <span className="font-medium">{outbound.customerName}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Warehouse</span>
              <span>{outbound.warehouseName}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Requested Date</span>
              <span>{outbound.requestedDate}</span>
            </div>
            {outbound.shippedDate && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Shipped Date</span>
                <span className="font-medium text-blue-600">{outbound.shippedDate}</span>
              </div>
            )}
            {outbound.committedDate && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Committed Date</span>
                <span className="font-medium text-green-600">{outbound.committedDate}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-lg font-bold text-primary">
                ₩{outbound.totalAmount.toLocaleString()}
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
              <p className="mt-1">{new Date(outbound.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <p className="mt-1">{new Date(outbound.updatedAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created By</label>
              <p className="mt-1">{outbound.createdBy}</p>
            </div>
            {outbound.note && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Note</label>
                <p className="mt-1 rounded-md bg-muted p-3 text-sm">{outbound.note}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 라인 아이템 */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items ({outbound.lines.length})</CardTitle>
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
                {outbound.lines.map((line) => (
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
                    ₩{outbound.totalAmount.toLocaleString()}
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
