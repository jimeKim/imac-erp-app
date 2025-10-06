import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Info } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { useToast } from '@/shared/hooks/useToast'
import { useTranslation } from 'react-i18next'
import { useItemTypeSettings } from '@/shared/hooks/useItemTypeSettings'
import { useClassificationScheme } from '@/shared/hooks/useClassificationScheme'
import { mapLegacyType } from '@/shared/config/classification-schemes'
import { CategorySelect } from '@/features/categories/components/CategorySelect'
import { useCreateItemMutation } from '@/features/items/api/items-crud.api'

interface ItemFormData {
  sku: string
  name: string
  description: string
  category_id: string
  item_type: string
  uom: string
  unit_cost: string
  status: string
}

/**
 * 상품 생성 페이지
 */
export default function ItemCreatePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation(['modules', 'common'])
  const { filterEnabledTypes } = useItemTypeSettings()
  const { requiresBOM, requiresRouting } = useClassificationScheme()
  const createItemMutation = useCreateItemMutation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<ItemFormData>({
    sku: '',
    name: '',
    description: '',
    category_id: '',
    item_type: 'FG',
    uom: 'EA',
    unit_cost: '',
    status: 'active',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ItemFormData, string>>>({})

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // 에러 초기화
    if (errors[name as keyof ItemFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ItemFormData, string>> = {}

    if (!formData.sku.trim()) {
      newErrors.sku = t('modules:items.validation.skuRequired')
    }

    if (!formData.name.trim()) {
      newErrors.name = t('modules:items.validation.nameRequired')
    }

    // 분류 체계 검증 (Phase 1: 경고만)
    const schemeCode = mapLegacyType(formData.item_type)

    if (requiresBOM(schemeCode)) {
      // Phase 1: BOM 필수 체크 (경고만, 나중에 저장 후 추가 가능)
      console.warn(`[Classification] BOM required for ${schemeCode}`)
    }

    if (requiresRouting(schemeCode)) {
      // Phase 1: 공정 필수 체크 (경고만)
      console.warn(`[Classification] Routing required for ${schemeCode}`)
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Real API call
      await createItemMutation.mutateAsync(formData)

      toast.success(t('common:success'), t('modules:items.messages.createSuccess'))

      navigate('/items-real')
    } catch (error: unknown) {
      // Handle API errors
      const apiError = error as { response?: { data?: { code?: string; message?: string } } }

      if (apiError.response?.data?.code === 'bom_required') {
        toast.error(t('common:error'), '이 분류는 BOM(자재명세서) 연결이 필요합니다.')
      } else if (apiError.response?.data?.code === 'routing_required') {
        toast.error(t('common:error'), '이 분류는 공정(Routing) 정보가 필요합니다.')
      } else if (apiError.response?.data?.code === 'sku_duplicate') {
        toast.error(t('common:error'), `이미 존재하는 SKU입니다: ${formData.sku}`)
      } else {
        toast.error(
          t('common:error'),
          apiError.response?.data?.message || t('modules:items.errors.createFailed'),
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('modules:items.create')}</h1>
          <p className="text-muted-foreground">{t('modules:items.createDescription')}</p>
        </div>
        <Link to="/items-real">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common:back')}
          </Button>
        </Link>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t('modules:items.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SKU */}
            <div>
              <label htmlFor="sku" className="mb-1 block text-sm font-medium">
                {t('modules:items.sku')} <span className="text-destructive">*</span>
              </label>
              <input
                id="sku"
                name="sku"
                type="text"
                value={formData.sku}
                onChange={handleChange}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="ITEM-001"
              />
              {errors.sku && <p className="mt-1 text-sm text-destructive">{errors.sku}</p>}
            </div>

            {/* 상품명 */}
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                {t('modules:items.name')} <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={t('modules:items.namePlaceholder')}
              />
              {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
            </div>

            {/* 설명 */}
            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium">
                {t('modules:items.description')}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={t('modules:items.descriptionPlaceholder')}
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label htmlFor="category_id" className="mb-1 block text-sm font-medium">
                {t('modules:items.category')}
              </label>
              <CategorySelect
                value={formData.category_id}
                onChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
                placeholder="-- 카테고리 선택 --"
              />
            </div>

            {/* 상품 유형 */}
            <div>
              <label htmlFor="item_type" className="mb-1 block text-sm font-medium">
                {t('modules:items.itemType')} *
              </label>
              <select
                id="item_type"
                name="item_type"
                value={formData.item_type}
                onChange={handleChange}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {filterEnabledTypes(['FG', 'SF', 'MOD', 'PT', 'RM']).length > 0 && (
                  <optgroup label={t('modules:settings.manufacturing')}>
                    {filterEnabledTypes(['FG', 'SF', 'MOD', 'PT', 'RM']).map((typeCode) => (
                      <option key={typeCode} value={typeCode}>
                        {t(`modules:items.types.${typeCode}`)}
                      </option>
                    ))}
                  </optgroup>
                )}
                {filterEnabledTypes(['MR', 'CS', 'PKG']).length > 0 && (
                  <optgroup label={t('modules:settings.others')}>
                    {filterEnabledTypes(['MR', 'CS', 'PKG']).map((typeCode) => (
                      <option key={typeCode} value={typeCode}>
                        {t(`modules:items.types.${typeCode}`)}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(`modules:items.typeDescriptions.${formData.item_type}`)}
              </p>

              {/* 분류 체계 정보 (Phase 1) */}
              {(() => {
                const schemeCode = mapLegacyType(formData.item_type)
                const needsBOM = requiresBOM(schemeCode)
                const needsRouting = requiresRouting(schemeCode)

                if (!needsBOM && !needsRouting) return null

                return (
                  <div className="mt-2 space-y-1">
                    {needsBOM && (
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Info className="h-3 w-3" />
                        <span>이 분류는 BOM(자재명세서) 연결이 필요합니다.</span>
                      </div>
                    )}
                    {needsRouting && (
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Info className="h-3 w-3" />
                        <span>이 분류는 공정(Routing) 정보가 필요합니다.</span>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* 단위 */}
              <div>
                <label htmlFor="uom" className="mb-1 block text-sm font-medium">
                  {t('modules:items.uom')}
                </label>
                <select
                  id="uom"
                  name="uom"
                  value={formData.uom}
                  onChange={handleChange}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="EA">EA (개)</option>
                  <option value="BOX">BOX (박스)</option>
                  <option value="KG">KG (킬로그램)</option>
                  <option value="L">L (리터)</option>
                  <option value="M">M (미터)</option>
                </select>
              </div>

              {/* 단가 */}
              <div>
                <label htmlFor="unit_cost" className="mb-1 block text-sm font-medium">
                  {t('modules:items.unitCost')}
                </label>
                <input
                  id="unit_cost"
                  name="unit_cost"
                  type="number"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={handleChange}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="0.00"
                />
              </div>

              {/* 상태 */}
              <div>
                <label htmlFor="status" className="mb-1 block text-sm font-medium">
                  {t('modules:items.status')}
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="active">{t('modules:items.statusActive')}</option>
                  <option value="inactive">{t('modules:items.statusInactive')}</option>
                </select>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-4">
              <Link to="/items-real">
                <Button type="button" variant="outline">
                  {t('common:cancel')}
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? t('common:saving') : t('common:save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
