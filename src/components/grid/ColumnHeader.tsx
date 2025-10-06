import { Column } from '@tanstack/react-table'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { Button } from '@/shared/components/ui'

interface ColumnHeaderProps<T> {
  column: Column<T, unknown>
  title: string
}

/**
 * 정렬 가능한 컬럼 헤더
 */
export function ColumnHeader<T>({ column, title }: ColumnHeaderProps<T>) {
  if (!column.getCanSort()) {
    return <div className="text-sm font-medium">{title}</div>
  }

  const sortDirection = column.getIsSorted()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => column.toggleSorting(sortDirection === 'asc')}
      className="h-8 px-2 hover:bg-accent"
    >
      <span className="text-sm font-medium">{title}</span>
      {sortDirection === 'asc' ? (
        <ArrowUp className="ml-2 h-3 w-3" />
      ) : sortDirection === 'desc' ? (
        <ArrowDown className="ml-2 h-3 w-3" />
      ) : (
        <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
      )}
    </Button>
  )
}
