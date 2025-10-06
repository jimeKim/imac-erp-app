import { Column } from '@tanstack/react-table'
import { GridColumn } from './types'
import { ColumnFilterDropdown } from './ColumnFilterDropdown'

interface ColumnFilterProps<T> {
  column: Column<T, unknown>
  gridColumn: GridColumn
  data: T[]
}

/**
 * 컬럼별 필터 컴포넌트
 */
export function ColumnFilter<T>({ column, gridColumn, data }: ColumnFilterProps<T>) {
  if (!gridColumn.filterable) {
    return null
  }

  switch (gridColumn.filterType) {
    case 'text':
    case 'select':
      // Excel 스타일 드롭다운 필터로 통일
      return <ColumnFilterDropdown column={column} data={data} columnId={gridColumn.field} />
    case 'number':
      return <NumberRangeFilter column={column} />
    default:
      return null
  }
}

// 텍스트 필터 (미사용 - ColumnFilterDropdown으로 대체)
// 향후 참고용으로 유지
// function _TextFilter<T>({ column }: { column: Column<T, unknown> }) {
//   return (
//     <input
//       value={(column.getFilterValue() ?? '') as string}
//       onChange={(e) => column.setFilterValue(e.target.value || undefined)}
//       placeholder="검색..."
//       className="h-7 w-full rounded border border-input bg-background px-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
//     />
//   )
// }

/**
 * 숫자 범위 필터
 */
function NumberRangeFilter<T>({ column }: { column: Column<T, unknown> }) {
  const filterValue = column.getFilterValue() as [number | undefined, number | undefined] | undefined
  const [min, max] = filterValue || [undefined, undefined]

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={min ?? ''}
        onChange={(e) => {
          const value = e.target.value ? Number(e.target.value) : undefined
          column.setFilterValue([value, max])
        }}
        placeholder="최소"
        className="h-7 w-16 rounded border border-input bg-background px-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <span className="text-xs text-muted-foreground">~</span>
      <input
        type="number"
        value={max ?? ''}
        onChange={(e) => {
          const value = e.target.value ? Number(e.target.value) : undefined
          column.setFilterValue([min, value])
        }}
        placeholder="최대"
        className="h-7 w-16 rounded border border-input bg-background px-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
  )
}

// 선택형 필터 (다중 선택) (미사용 - ColumnFilterDropdown으로 대체)
// 향후 참고용으로 유지
// function _SelectFilter<T>({
//   column,
//   options,
// }: {
//   column: Column<T, unknown>
//   options: Array<{ value: string; label: string }>
// }) {
//   const filterValue = (column.getFilterValue() ?? []) as string[]
//
//   return (
//     <div className="space-y-1 p-1">
//       {options.map((option) => (
//         <label key={option.value} className="flex items-center gap-2 text-xs hover:bg-accent rounded px-1 py-0.5 cursor-pointer">
//           <input
//             type="checkbox"
//             checked={filterValue.includes(option.value)}
//             onChange={(e) => {
//               const newValue = e.target.checked
//                 ? [...filterValue, option.value]
//                 : filterValue.filter((v) => v !== option.value)
//               column.setFilterValue(newValue.length ? newValue : undefined)
//             }}
//             className="h-3 w-3 rounded border-input"
//           />
//           <span className="flex-1">{option.label}</span>
//         </label>
//       ))}
//     </div>
//   )
// }
