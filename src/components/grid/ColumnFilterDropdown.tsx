import { useState, useEffect, useRef, useMemo } from 'react'
import { Column } from '@tanstack/react-table'
import { Filter, Search, Check, ArrowUpAZ, ArrowDownAZ } from 'lucide-react'
import { Button } from '@/shared/components/ui'

type SortOrder = 'asc' | 'desc'

interface ColumnFilterDropdownProps<T> {
  column: Column<T, unknown>
  data: T[]
  columnId: string
}

/**
 * Excel 스타일 드롭다운 필터 (체크박스 리스트)
 */
export function ColumnFilterDropdown<T>({
  column,
  data,
  columnId,
}: ColumnFilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 현재 필터 값 (선택된 값들의 배열)
  const filterValue = (column.getFilterValue() as string[]) || []

  // 컬럼의 고유 값 추출 및 정렬
  const uniqueValues = useMemo(() => {
    const values = new Set<string>()
    data.forEach((row) => {
      const value = (row as any)[columnId]
      if (value !== null && value !== undefined && value !== '') {
        values.add(String(value))
      }
    })
    
    const valuesArray = Array.from(values)
    
    // 숫자인지 확인 (모든 값이 숫자로 변환 가능한지)
    const allNumbers = valuesArray.every((v) => !isNaN(Number(v)))
    
    // 정렬
    if (allNumbers) {
      // 숫자 정렬
      return valuesArray.sort((a, b) => {
        const numA = Number(a)
        const numB = Number(b)
        return sortOrder === 'asc' ? numA - numB : numB - numA
      })
    } else {
      // 문자열 정렬
      return valuesArray.sort((a, b) => {
        const comparison = a.localeCompare(b, 'ko-KR')
        return sortOrder === 'asc' ? comparison : -comparison
      })
    }
  }, [data, columnId, sortOrder])

  // 검색어로 필터링된 값들
  const filteredValues = useMemo(() => {
    if (!searchTerm) return uniqueValues
    return uniqueValues.filter((value) =>
      value.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [uniqueValues, searchTerm])

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 개별 값 토글
  const toggleValue = (value: string) => {
    const newFilterValue = filterValue.includes(value)
      ? filterValue.filter((v) => v !== value)
      : [...filterValue, value]

    column.setFilterValue(newFilterValue.length === uniqueValues.length ? undefined : newFilterValue)
  }

  // 전체 선택/해제
  const toggleAll = () => {
    if (filterValue.length === 0) {
      // 전체 해제 상태 → 전체 선택
      column.setFilterValue(undefined)
    } else {
      // 일부 또는 전체 선택 상태 → 전체 해제
      column.setFilterValue([])
    }
  }

  // 선택된 개수
  const selectedCount =
    filterValue.length === 0 ? uniqueValues.length : filterValue.length

  // 전체 선택 여부
  const isAllSelected = filterValue.length === 0 || filterValue.length === uniqueValues.length

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* 필터 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-7 w-7 p-0 ${
          filterValue.length > 0 && filterValue.length < uniqueValues.length
            ? 'text-primary'
            : 'text-muted-foreground'
        }`}
      >
        <Filter className="h-3.5 w-3.5" />
      </Button>

      {/* 드롭다운 팝업 */}
      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-64 rounded-md border bg-popover shadow-lg">
          {/* 검색창 */}
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-full rounded border border-input bg-background pl-8 pr-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* 정렬 버튼 */}
          <div className="border-b p-2 flex gap-1">
            <Button
              variant={sortOrder === 'asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('asc')}
              className="h-7 flex-1 text-xs"
            >
              <ArrowUpAZ className="mr-1 h-3.5 w-3.5" />
              오름차순
            </Button>
            <Button
              variant={sortOrder === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('desc')}
              className="h-7 flex-1 text-xs"
            >
              <ArrowDownAZ className="mr-1 h-3.5 w-3.5" />
              내림차순
            </Button>
          </div>

          {/* 전체 선택/해제 */}
          <div className="border-b">
            <button
              onClick={toggleAll}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            >
              <div className="flex h-4 w-4 items-center justify-center rounded border border-primary">
                {isAllSelected && <Check className="h-3 w-3 text-primary" />}
              </div>
              <span className="flex-1 text-left font-medium">
                전체 선택 ({selectedCount}/{uniqueValues.length})
              </span>
            </button>
          </div>

          {/* 값 리스트 */}
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredValues.length === 0 ? (
              <div className="px-3 py-2 text-center text-sm text-muted-foreground">
                검색 결과 없음
              </div>
            ) : (
              filteredValues.map((value) => {
                const isSelected = filterValue.length === 0 || filterValue.includes(value)
                return (
                  <button
                    key={value}
                    onClick={() => toggleValue(value)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <div className="flex h-4 w-4 items-center justify-center rounded border border-input">
                      {isSelected && <Check className="h-3 w-3 text-primary" />}
                    </div>
                    <span className="flex-1 truncate text-left">{value}</span>
                  </button>
                )
              })
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="border-t p-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false)
                setSearchTerm('')
              }}
              className="h-7"
            >
              닫기
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
