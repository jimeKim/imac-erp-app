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
  // Note: table.getState() 반환 객체는 매 렌더링마다 새로 생성되므로
  // dependency array에 직접 추가하면 무한 루프가 발생합니다.
  // 따라서 값의 변경을 감지하기 위해 JSON.stringify를 사용합니다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      const currentState = table.getState()
      const state: GridPersistedState = {
        columnVisibility: currentState.columnVisibility,
        sorting: currentState.sorting,
        pageSize: currentState.pagination.pageSize,
      }

      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save grid state:', error)
    }
  }, [
    storageKey,
    JSON.stringify(table.getState().columnVisibility),
    JSON.stringify(table.getState().sorting),
    table.getState().pagination.pageSize,
  ])
}
