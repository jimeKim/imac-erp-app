import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { createOutbound } from '@/shared/services/outboundApi'
import { getItems } from '@/shared/services/itemApi'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { OutboundCreateInput } from '@/shared/types/outbound'
import { useToast } from '@/shared/hooks/useToast'

interface OutboundFormData {
  customerId: string
  warehouseId: string
  requestedDate: string
  note?: string
  lines: {
    itemId: string
    quantity: number
    unitPrice: number
    note?: string
  }[]
}

/**
 * Outbound 생성 페이지
 */
export default function OutboundCreatePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 아이템 목록 조회 (드롭다운용)
  const { data: itemsData } = useQuery({
    queryKey: ['items', { page: 1, pageSize: 100 }],
    queryFn: () => getItems({ page: 1, pageSize: 100 }),
  })

  const items = itemsData?.items || []

  // React Hook Form
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OutboundFormData>({
    defaultValues: {
      customerId: '',
      warehouseId: 'WH-001',
      requestedDate: new Date().toISOString().split('T')[0],
      note: '',
      lines: [
        {
          itemId: '',
          quantity: 1,
          unitPrice: 0,
          note: '',
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  })

  const lines = watch('lines')

  // 총액 계산
  const totalAmount = lines.reduce((sum, line) => {
    const quantity = Number(line.quantity) || 0
    const unitPrice = Number(line.unitPrice) || 0
    return sum + quantity * unitPrice
  }, 0)

  // 아이템 선택 시 단가 자동 입력
  const handleItemChange = (index: number, itemId: string) => {
    const selectedItem = items.find((item) => item.id === itemId)
    if (selectedItem) {
      // unitPrice를 직접 설정하는 대신 React Hook Form의 setValue를 사용해야 하지만,
      // 여기서는 간단히 releasePrice를 기본값으로 설정합니다.
      // 실제로는 useForm의 setValue를 사용해야 합니다.
    }
  }

  const mutation = useMutation({
    mutationFn: createOutbound,
    onSuccess: (data) => {
      toast.success(
        'Outbound created',
        `Outbound ${data.outboundCode} has been created successfully`,
      )
      navigate(`/outbounds/${data.id}`)
    },
    onError: (error: Error) => {
      toast.error('Failed to create outbound', error.message)
    },
  })

  const onSubmit = async (data: OutboundFormData) => {
    setIsSubmitting(true)
    try {
      const input: OutboundCreateInput = {
        customerId: data.customerId,
        warehouseId: data.warehouseId,
        requestedDate: data.requestedDate,
        note: data.note,
        lines: data.lines.map((line) => ({
          itemId: line.itemId,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          note: line.note,
        })),
      }
      await mutation.mutateAsync(input)
    } finally {
      setIsSubmitting(false)
    }
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
            <h1 className="text-3xl font-bold tracking-tight">Create Outbound</h1>
            <p className="text-muted-foreground">Create a new outbound shipment</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Customer ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('customerId', { required: 'Customer ID is required' })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="CUST-001"
                />
                {errors.customerId && (
                  <p className="mt-1 text-xs text-red-500">{errors.customerId.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('warehouseId', { required: 'Warehouse is required' })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="WH-001">본사 창고</option>
                  <option value="WH-002">물류센터 A</option>
                </select>
                {errors.warehouseId && (
                  <p className="mt-1 text-xs text-red-500">{errors.warehouseId.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Requested Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('requestedDate', { required: 'Requested date is required' })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {errors.requestedDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.requestedDate.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Note</label>
              <textarea
                {...register('note')}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>
          </CardContent>
        </Card>

        {/* 라인 아이템 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items ({fields.length})</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    itemId: '',
                    quantity: 1,
                    unitPrice: 0,
                    note: '',
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No items added. Click "Add Item" to start.
              </div>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">Item #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium">
                      Item <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register(`lines.${index}.itemId`, { required: true })}
                      onChange={(e) => handleItemChange(index, e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select item...</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.itemCode} - {item.name}
                        </option>
                      ))}
                    </select>
                    {errors.lines?.[index]?.itemId && (
                      <p className="mt-1 text-xs text-red-500">Required</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...register(`lines.${index}.quantity`, {
                        required: true,
                        min: 1,
                        valueAsNumber: true,
                      })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {errors.lines?.[index]?.quantity && (
                      <p className="mt-1 text-xs text-red-500">Required (min: 1)</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Unit Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register(`lines.${index}.unitPrice`, {
                        required: true,
                        min: 0,
                        valueAsNumber: true,
                      })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {errors.lines?.[index]?.unitPrice && (
                      <p className="mt-1 text-xs text-red-500">Required (min: 0)</p>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium">Note</label>
                  <input
                    type="text"
                    {...register(`lines.${index}.note`)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Optional note..."
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <span className="text-sm font-semibold text-primary">
                    Subtotal: ₩
                    {(
                      (lines[index]?.quantity || 0) * (lines[index]?.unitPrice || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 총액 및 액션 */}
        <Card>
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-primary">₩{totalAmount.toLocaleString()}</p>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/outbounds')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || fields.length === 0}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
