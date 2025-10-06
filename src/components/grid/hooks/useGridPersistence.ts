import { useEffect } from 'react'
import type { Table } from '@tanstack/react-table'

const STORAGE_VERSION = 'v1'

interface GridPersistedState {
  columnVisibility: Record<string, boolean>
  sorting: Array<{ id: string; desc: boolean }>
  pageSize: number
}

/**
 * Grid 상태를 LocalStorage에 저장/복원
 */
export function useGridPersistence<T>(entityName: string, table: Table<T>) {
  const storageKey = `grid-state-${STORAGE_VERSION}-${entityName}`

  // 초기 로드 시 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const state: GridPersistedState = JSON.parse(saved)

        // 컬럼 표시/숨김 복원
        if (state.columnVisibility) {
          table.setColumnVisibility(state.columnVisibility)
        }

        // 정렬 복원
        if (state.sorting) {
          table.setSorting(state.sorting)
        }

        // 페이지 크기 복원
        if (state.pageSize) {
          table.setPageSize(state.pageSize)
        }
      }
    } catch (error) {
      console.error('Failed to restore grid state:', error)
      // 손상된 데이터는 삭제
      localStorage.removeItem(storageKey)
    }
  }, [storageKey, table])

  // 상태 변경 시 자동 저장
  useEffect(() => {
    try {
      const state: GridPersistedState = {
        columnVisibility: table.getState().columnVisibility,
        sorting: table.getState().sorting,
        pageSize: table.getState().pagination.pageSize,
      }

      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save grid state:', error)
    }
  }, [
    storageKey,
    table.getState().columnVisibility,
    table.getState().sorting,
    table.getState().pagination.pageSize,
  ])
}
