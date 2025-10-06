import { useState, useRef, useEffect } from 'react'
import { Table } from '@tanstack/react-table'
import { Columns, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui'

interface ColumnVisibilityDropdownProps<T> {
  table: Table<T>
}

/**
 * 컬럼 표시/숨김 드롭다운
 */
export function ColumnVisibilityDropdown<T>({ table }: ColumnVisibilityDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const hideableColumns = table.getAllColumns().filter((column) => column.getCanHide())

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9"
      >
        <Columns className="mr-2 h-4 w-4" />
        컬럼 표시
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          <div className="px-2 py-1.5 text-sm font-semibold">컬럼 표시 설정</div>
          <div className="h-px bg-border my-1" />
          <div className="max-h-80 overflow-y-auto">
            {hideableColumns.map((column) => {
              const isVisible = column.getIsVisible()
              return (
                <button
                  key={column.id}
                  onClick={() => column.toggleVisibility(!isVisible)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                    {isVisible && <Check className="h-3 w-3" />}
                  </div>
                  <span className="flex-1 text-left">
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
