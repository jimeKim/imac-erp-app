import { useItemsQuery } from '@/features/items/api/items.api'
import { Package, PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ErrorDisplay } from '@/shared/components/feedback'
import { RequirePermission } from '@/shared/components/auth/RequirePermission'
import { useTranslation } from 'react-i18next'
import { GridManager, GridConfig } from '@/components/grid'
import itemsGridConfigRaw from '@/config/grids/items-grid.json'

const itemsGridConfig = itemsGridConfigRaw as GridConfig

/**
 * Items 목록 페이지 (셀형 그리드 버전)
 */
export default function ItemsPageRealGrid() {
  const { t } = useTranslation(['common', 'modules'])

  const {
    data: itemsData,
    isLoading,
    error,
  } = useItemsQuery({
    page: 1,
    limit: 1000, // Grid가 클라이언트 페이지네이션 처리
  })

  const items = itemsData?.items || []

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="text-muted-foreground">{t('common.loading')}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorDisplay
          title={t('modules:items.error.loadFailed')}
          description={(error as { message?: string }).message || 'Unknown error'}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Package className="h-6 w-6" />
            {t('modules:items.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {items.length}개의 상품
          </p>
        </div>
        <RequirePermission permission="ITEMS_CREATE">
          <Link
            to="/items/create"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <PlusCircle className="h-4 w-4" />
            {t('modules:items.create')}
          </Link>
        </RequirePermission>
      </div>

      {/* Grid */}
      <GridManager
        data={items}
        config={itemsGridConfig}
      />
    </div>
  )
}
