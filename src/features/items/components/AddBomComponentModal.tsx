import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, X } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { useItemsQuery, type Item as ApiItem } from '@/features/items/api/items.api'
import { useAddBomComponent } from '@/features/items/api/bom.api'
import { useToast } from '@/shared/hooks/useToast'

interface AddBomComponentModalProps {
  isOpen: boolean
  onClose: () => void
  parentItemId: string
  parentItemName: string
}

/**
 * BOM 구성품 추가 모달
 */
export function AddBomComponentModal({
  isOpen,
  onClose,
  parentItemId,
  parentItemName,
}: AddBomComponentModalProps) {
  const { t } = useTranslation(['modules', 'common'])
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<ApiItem | null>(null)
  const [quantity, setQuantity] = useState('1')

  // 상품 목록 조회
  const { data: itemsData } = useItemsQuery({
    page: 1,
    limit: 1000, // 전체 조회
  })

  const addComponentMutation = useAddBomComponent()

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // 검색어로 필터링된 상품 목록
  const filteredItems = useMemo(() => {
    const items = itemsData?.items || []
    if (!searchTerm) return items

    const lowerSearch = searchTerm.toLowerCase()
    return items.filter(
      (item) =>
        item.id !== parentItemId && // 자기 자신은 제외
        (item.name?.toLowerCase().includes(lowerSearch) ||
          item.sku?.toLowerCase().includes(lowerSearch) ||
          item.description?.toLowerCase().includes(lowerSearch)),
    )
  }, [itemsData, searchTerm, parentItemId])

  const handleAdd = async () => {
    if (!selectedItem) {
      toast.error('구성품을 선택해주세요')
      return
    }

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error('수량은 0보다 큰 숫자여야 합니다')
      return
    }

    try {
      await addComponentMutation.mutateAsync({
        parent_item_id: parentItemId,
        component_item_id: selectedItem.id,
        quantity: qty,
        unit: selectedItem.uom || 'EA',
      })

      toast.success('구성품이 추가되었습니다')
      handleClose()
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error.message || '구성품 추가에 실패했습니다'
      toast.error(errorMsg)
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    setSelectedItem(null)
    setQuantity('1')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-2xl rounded-lg bg-background p-6 shadow-lg mx-4">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t('modules:items.bom.addComponent')}
            </h2>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {parentItemName}에 구성품을 추가합니다
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* 상품 검색 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">구성품 검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="상품명, SKU로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* 상품 목록 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">상품 선택</label>
            <div className="max-h-60 overflow-y-auto rounded-md border">
              {filteredItems.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  검색 결과가 없습니다
                </div>
              ) : (
                <div className="divide-y">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-accent ${
                        selectedItem?.id === item.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{item.sku}</span>
                            {item.item_type && (
                              <>
                                <span>•</span>
                                <span>{t(`modules:items.bom.typeLabels.${item.item_type}`)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {item.unit_cost && (
                          <div className="text-sm font-medium">
                            ₩{item.unit_cost.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 선택된 상품 정보 */}
          {selectedItem && (
            <div className="rounded-md bg-primary/5 p-3">
              <div className="text-sm font-medium">선택된 구성품</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {selectedItem.name} ({selectedItem.sku})
              </div>
            </div>
          )}

          {/* 수량 입력 */}
          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium">수량</label>
            <input
              id="quantity"
              type="number"
              min="0.0001"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            {t('common:cancel')}
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedItem || addComponentMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            {addComponentMutation.isPending ? '추가 중...' : t('common:add')}
          </Button>
        </div>
      </div>
    </div>
  )
}
