import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, Settings } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { useToast } from '@/shared/hooks/useToast'

const ITEM_TYPES = {
  manufacturing: ['FG', 'SF', 'MOD', 'PT', 'RM'],
  others: ['MR', 'CS', 'PKG'],
}

const DEFAULT_ENABLED_TYPES = ['FG', 'SF', 'MOD', 'PT', 'RM', 'MR']

/**
 * 상품 유형 설정 페이지
 * LocalStorage에 활성화된 item_type 저장
 */
export default function ItemTypeSettingsPage() {
  const { t } = useTranslation(['modules', 'common'])
  const { toast } = useToast()
  const [enabledTypes, setEnabledTypes] = useState<string[]>(DEFAULT_ENABLED_TYPES)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // LocalStorage에서 설정 로드
  useEffect(() => {
    const stored = localStorage.getItem('enabled_item_types')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEnabledTypes(parsed)
        }
      } catch (error) {
        console.error('Failed to parse enabled_item_types:', error)
      }
    }
  }, [])

  const handleToggle = (typeCode: string) => {
    setEnabledTypes((prev) => {
      if (prev.includes(typeCode)) {
        // 최소 1개는 유지
        if (prev.length === 1) {
          toast.error(
            t('common:error'),
            t('modules:settings.atLeastOne')
          )
          return prev
        }
        return prev.filter((t) => t !== typeCode)
      } else {
        return [...prev, typeCode]
      }
    })
  }

  const handleSelectAll = () => {
    setEnabledTypes([...ITEM_TYPES.manufacturing, ...ITEM_TYPES.others])
  }

  const handleDeselectAll = () => {
    // 최소 1개는 유지 (FG)
    setEnabledTypes(['FG'])
    toast.warning(
      t('common:common.warning'),
      t('modules:settings.atLeastOne')
    )
  }

  const handleSave = async () => {
    if (enabledTypes.length === 0) {
      toast.error(
        t('common:error'),
        t('modules:settings.atLeastOne')
      )
      return
    }

    setIsSubmitting(true)

    try {
      // LocalStorage에 저장
      localStorage.setItem('enabled_item_types', JSON.stringify(enabledTypes))

      // 성공 메시지
      toast.success(
        t('common:success'),
        t('modules:settings.settingsSaved')
      )

      // 새로고침하여 변경사항 반영
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      toast.error(
        t('common:error'),
        error instanceof Error ? error.message : 'Failed to save settings'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            <h1 className="text-2xl font-bold">{t('modules:settings.itemTypes')}</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('modules:settings.itemTypesDescription')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSelectAll}>
            {t('modules:settings.selectAll')}
          </Button>
          <Button variant="outline" onClick={handleDeselectAll}>
            {t('modules:settings.deselectAll')}
          </Button>
        </div>
      </div>

      {/* 설정 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('modules:settings.enabledTypes')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 제조 계층 */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              {t('modules:settings.manufacturing')}
            </h3>
            <div className="space-y-2">
              {ITEM_TYPES.manufacturing.map((typeCode) => (
                <label
                  key={typeCode}
                  className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={enabledTypes.includes(typeCode)}
                    onChange={() => handleToggle(typeCode)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {t(`modules:items.types.${typeCode}`)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t(`modules:items.typeDescriptions.${typeCode}`)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 기타 */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              {t('modules:settings.others')}
            </h3>
            <div className="space-y-2">
              {ITEM_TYPES.others.map((typeCode) => (
                <label
                  key={typeCode}
                  className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={enabledTypes.includes(typeCode)}
                    onChange={() => handleToggle(typeCode)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {t(`modules:items.types.${typeCode}`)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t(`modules:items.typeDescriptions.${typeCode}`)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={handleSave} disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? t('common:saving') : t('modules:settings.saveSettings')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 활성화된 유형 미리보기 */}
      <Card>
        <CardHeader>
          <CardTitle>미리보기</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {enabledTypes.map((typeCode) => (
              <div
                key={typeCode}
                className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium"
              >
                {t(`modules:items.types.${typeCode}`)}
              </div>
            ))}
          </div>
          {enabledTypes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('modules:settings.atLeastOne')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
