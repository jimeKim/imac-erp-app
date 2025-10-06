import { Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { GridManager, GridConfig } from '@/components/grid'
import { ErrorDisplay } from '@/shared/components/feedback'
import { RequirePermission } from '@/shared/components/auth/RequirePermission'
import stocksGridConfigRaw from '@/config/grids/stocks-grid.json'
import { useStocksQuery, StockItem } from '@/features/stocks/api/stocks.api'

const stocksGridConfig = stocksGridConfigRaw as GridConfig

/**
 * Stocks 목록 페이지 (Excel 스타일 그리드 버전)
 * 
 * 이 페이지는 Excel-like Grid System을 사용합니다.
 * 문서: docs/features/excel-grid-system.md
 */
export default function StocksPageGrid() {
  const { t } = useTranslation(['common', 'modules'])

  const {
    data: stocksData,
    isLoading,
    error,
  } = useStocksQuery({
    page: 1,
    limit: 1000, // GridManager handles pagination state
  })

  const stocks = stocksData?.stocks || []
  const totalStocks = stocksData?.pagination?.total || 0

  if (isLoading) {
    return <p>Loading...</p>
  }

  if (error) {
    return <ErrorDisplay error={error as Error} />
  }

  return (
    <RequirePermission permission="STOCKS_VIEW">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-7 w-7" />
            {t('modules:stocks.title')}
          </h1>
          <p className="text-muted-foreground">
            총 {totalStocks}개의 재고 현황
          </p>
        </div>
      </div>

      <GridManager<StockItem>
        data={stocks}
        config={stocksGridConfig}
        onRowClick={(stock) => console.log('Stock clicked:', stock)}
      />
    </RequirePermission>
  )
}
