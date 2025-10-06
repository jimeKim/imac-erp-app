import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { useTranslation } from 'react-i18next'
import { GridConfig } from './types'
import { GridToolbar } from './GridToolbar'
import { ColumnHeader } from './ColumnHeader'
import { ColumnFilter } from './ColumnFilter'
import { useGridPersistence } from './hooks/useGridPersistence'

interface GridManagerProps<T> {
  data: T[]
  config: GridConfig
  onRowClick?: (row: T) => void
}

/**
 * ERP 공통 Grid Manager
 * 컬럼 표시/숨김, 정렬, 필터링, 페이지네이션 지원
 */
export function GridManager<T extends Record<string, any>>({
  data,
  config,
  onRowClick,
}: GridManagerProps<T>) {
  const { t } = useTranslation(['modules'])
  const [globalFilter, setGlobalFilter] = useState('')

  // 컬럼 정의 생성
  const columns = useMemo<ColumnDef<T>[]>(
    () =>
      config.columns.map((col) => {
        const columnDef: any = {
          id: col.id,
          accessorKey: col.field,
          header: ({ column }: any) => <ColumnHeader column={column} title={col.label} />,
          cell: ({ row, getValue }: any) => {
            const value = getValue()

            // SKU 링크 렌더링
            if (col.type === 'link' && col.field === 'sku') {
              return (
                <Link
                  to={`/items/${row.original.id}`}
                  className="text-primary hover:underline font-mono text-sm"
                >
                  {value as string}
                </Link>
              )
            }

            // Badge 렌더링 (item_type)
            if (col.type === 'badge' && value) {
              const label =
                col.field === 'item_type'
                  ? t(`modules:items.types.${value}`)
                  : (value as string)

              return (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  {label}
                </span>
              )
            }

            // Number 렌더링 (단가 등)
            if (col.type === 'number' && value !== null && value !== undefined) {
              return (
                <span className="text-right block">₩{(value as number).toLocaleString()}</span>
              )
            }

            // Date 렌더링
            if (col.type === 'date' && value) {
              return <span className="text-sm">{new Date(value as string).toLocaleDateString()}</span>
            }

            // 기본 텍스트 렌더링
            return <span className="text-sm">{value as string}</span>
          },
          enableSorting: col.sortable ?? true,
          enableColumnFilter: col.filterable ?? true,
          enableHiding: col.hideable ?? true,
          size: col.width,
        }

        // 필터 함수 지정
        if (col.filterType === 'text') {
          columnDef.filterFn = 'multiSelect'
        } else if (col.filterType === 'number') {
          columnDef.filterFn = 'numberRange'
        } else if (col.filterType === 'select') {
          columnDef.filterFn = 'multiSelect'
        }

        return columnDef
      }),
    [config.columns, t],
  )

  // Table 인스턴스 생성
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: config.initialState?.pagination?.pageSize || 20,
      },
      sorting: config.initialState?.sorting || [],
      columnVisibility: config.initialState?.columnVisibility || {},
    },
    // 필터 함수 커스터마이징
    filterFns: {
      numberRange: (row, columnId, filterValue) => {
        const [min, max] = filterValue as [number | undefined, number | undefined]
        const value = row.getValue(columnId) as number
        
        if (min !== undefined && max !== undefined) {
          return value >= min && value <= max
        }
        if (min !== undefined) {
          return value >= min
        }
        if (max !== undefined) {
          return value <= max
        }
        return true
      },
      multiSelect: (row, columnId, filterValue) => {
        const value = row.getValue(columnId) as string
        const selected = filterValue as string[]
        return selected.includes(value)
      },
    },
  })

  // LocalStorage 저장/복원
  useGridPersistence(config.entity, table)

  return (
    <div className="space-y-4">
      {/* 도구 모음 */}
      <GridToolbar
        table={table}
        config={config}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />

      {/* 테이블 */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const gridColumn = config.columns.find((col) => col.id === header.id)
                    return (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="px-4 py-3 text-left text-sm font-medium"
                      >
                        <div className="space-y-2">
                          {/* 헤더 */}
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}

                          {/* 필터 */}
                          {config.features.filtering && gridColumn?.filterable && (
                            <ColumnFilter column={header.column} gridColumn={gridColumn} data={data} />
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                    데이터가 없습니다
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className="hover:bg-muted/50 cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      {config.features.pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            총 {table.getFilteredRowModel().rows.length}개 중{' '}
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length,
            )}
            개 표시
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>

            <span className="text-sm">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>

            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {[10, 20, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}개씩
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
