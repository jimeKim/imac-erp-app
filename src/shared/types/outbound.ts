/**
 * Outbound 관련 타입 정의
 */

export interface OutboundLine {
  id: string
  itemId: string
  itemCode: string
  itemName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  note?: string
}

export interface Outbound {
  id: string
  outboundCode: string
  customerId: string
  customerName: string
  warehouseId: string
  warehouseName: string
  requestedDate: string
  shippedDate?: string
  committedDate?: string
  status: 'draft' | 'pending' | 'approved' | 'committed' | 'cancelled'
  totalAmount: number
  lines: OutboundLine[]
  note?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface OutboundListParams {
  page?: number
  pageSize?: number
  search?: string
  customerId?: string
  warehouseId?: string
  status?: 'draft' | 'pending' | 'approved' | 'committed' | 'cancelled' | 'all'
  dateFrom?: string
  dateTo?: string
  sortBy?: 'outboundCode' | 'requestedDate' | 'createdAt' | 'totalAmount'
  sortOrder?: 'asc' | 'desc'
}

export interface OutboundListResponse {
  outbounds: Outbound[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface OutboundCreateInput {
  customerId: string
  warehouseId: string
  requestedDate: string
  lines: {
    itemId: string
    quantity: number
    unitPrice: number
    note?: string
  }[]
  note?: string
}

export interface OutboundUpdateInput extends Partial<OutboundCreateInput> {
  status?: 'draft' | 'pending' | 'approved' | 'committed' | 'cancelled'
  shippedDate?: string
  committedDate?: string
}
