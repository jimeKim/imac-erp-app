import { Table } from '@tanstack/react-table'
import { Search, FilterX } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { ColumnVisibilityDropdown } from './ColumnVisibilityDropdown'
import { GridConfig } from './types'

interface GridToolbarProps<T> {
  table: Table<T>
  config: GridConfig
  globalFilter: string
  setGlobalFilter: (value: string) => void
}

/**
 * Grid 상단 도구 모음
 */
export function GridToolbar<T>({
  table,
  config,
  globalFilter,
  setGlobalFilter,
}: GridToolbarProps<T>) {
  const hasActiveFilters = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between gap-2 p-4 border-b">
      {/* 왼쪽: 전역 검색 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="전체 검색..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* 오른쪽: 액션 버튼들 */}
      <div className="flex items-center gap-2">
        {/* 컬럼 표시/숨김 */}
        {config.features.columnVisibility && <ColumnVisibilityDropdown table={table} />}

        {/* 필터 초기화 */}
        {config.features.filtering && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              table.resetColumnFilters()
              setGlobalFilter('')
            }}
            disabled={!hasActiveFilters && !globalFilter}
            className="h-9"
          >
            <FilterX className="mr-2 h-4 w-4" />
            필터 초기화
          </Button>
        )}
      </div>
    </div>
  )
}
