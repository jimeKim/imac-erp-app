/**
 * Grid 타입 정의
 */

export type CellType = 'text' | 'number' | 'select' | 'date' | 'badge' | 'link'
export type FilterType = 'text' | 'number' | 'select' | 'dateRange'

export interface GridColumn {
  id: string
  field: string
  label: string
  type: CellType
  width?: number
  sortable?: boolean
  filterable?: boolean
  filterType?: FilterType
  filterOptions?: Array<{ value: string; label: string }>
  hideable?: boolean
  visible?: boolean
  pinned?: 'left' | 'right'
}

export interface GridConfig {
  entity: string
  apiEndpoint: string
  features: {
    columnVisibility: boolean
    sorting: boolean
    filtering: boolean
    pagination: boolean
    export: boolean
  }
  columns: GridColumn[]
  initialState?: {
    columnVisibility?: Record<string, boolean>
    sorting?: Array<{ id: string; desc: boolean }>
    pagination?: {
      pageSize: number
    }
  }
}

export interface GridState {
  columnVisibility: Record<string, boolean>
  sorting: Array<{ id: string; desc: boolean }>
  columnFilters: Array<{ id: string; value: any }>
  pagination: {
    pageIndex: number
    pageSize: number
  }
}
