import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Edit2 } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { useUpdateBomComponent } from '@/features/items/api/bom.api'
import { useToast } from '@/shared/hooks/useToast'

interface EditBomComponentModalProps {
  isOpen: boolean
  onClose: () => void
  componentId: string
  componentName: string
  parentItemId: string
  initialQuantity: number
  initialUnit: string
}

/**
 * BOM 구성품 수정 모달
 */
export function EditBomComponentModal({
  isOpen,
  onClose,
  componentId,
  componentName,
  parentItemId,
  initialQuantity,
  initialUnit,
}: EditBomComponentModalProps) {
  const { t } = useTranslation(['modules', 'common'])
  const { toast } = useToast()

  const [quantity, setQuantity] = useState(initialQuantity.toString())
  const [unit, setUnit] = useState(initialUnit)

  const updateComponentMutation = useUpdateBomComponent()

  // 초기값 업데이트
  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity.toString())
      setUnit(initialUnit)
    }
  }, [isOpen, initialQuantity, initialUnit])

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleClose = () => {
    setQuantity(initialQuantity.toString())
    setUnit(initialUnit)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const quantityNum = parseFloat(quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error(t('common:errors.title'), '수량은 0보다 큰 숫자여야 합니다.')
      return
    }

    try {
      await updateComponentMutation.mutateAsync({
        id: componentId,
        parentItemId: parentItemId,
        data: {
          quantity: quantityNum,
          unit: unit,
        },
      })

      toast.success(
        t('modules:items.bom.updateSuccess'),
        `"${componentName}" 구성품이 수정되었습니다.`,
      )
      handleClose()
    } catch (_error) {
      toast.error(t('common:errors.title'), '구성품 수정에 실패했습니다.')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Edit2 className="h-5 w-5" />
            {t('modules:items.bom.editComponent')}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-6 text-sm text-gray-600">
          {componentName} 구성품의 수량과 단위를 수정합니다.
        </p>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 수량 입력 */}
          <div>
            <label htmlFor="quantity" className="mb-1 block text-sm font-medium text-gray-700">
              {t('modules:items.bom.quantity')}
            </label>
            <input
              id="quantity"
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="1"
              autoFocus
            />
          </div>

          {/* 단위 선택 */}
          <div>
            <label htmlFor="unit" className="mb-1 block text-sm font-medium text-gray-700">
              {t('modules:items.bom.unit')}
            </label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="EA">EA (개)</option>
              <option value="KG">KG (킬로그램)</option>
              <option value="G">G (그램)</option>
              <option value="L">L (리터)</option>
              <option value="ML">ML (밀리리터)</option>
              <option value="M">M (미터)</option>
              <option value="CM">CM (센티미터)</option>
              <option value="SET">SET (세트)</option>
            </select>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateComponentMutation.isPending}
            >
              {t('common:common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={updateComponentMutation.isPending || !quantity || quantity === '0'}
            >
              {updateComponentMutation.isPending
                ? t('common:common.saving')
                : t('common:common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
