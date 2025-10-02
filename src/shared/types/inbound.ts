/**
 * Inbound 관련 타입 정의
 */

export interface InboundLine {
  id: string
  itemId: string
  itemCode: string
  itemName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  note?: string
}

export interface Inbound {
  id: string
  inboundCode: string
  supplierId: string
  supplierName: string
  warehouseId: string
  warehouseName: string
  requestedDate: string
  receivedDate?: string
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled'
  totalAmount: number
  lines: InboundLine[]
  note?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface InboundListParams {
  page?: number
  pageSize?: number
  search?: string
  supplierId?: string
  warehouseId?: string
  status?: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled' | 'all'
  dateFrom?: string
  dateTo?: string
  sortBy?: 'inboundCode' | 'requestedDate' | 'createdAt' | 'totalAmount'
  sortOrder?: 'asc' | 'desc'
}

export interface InboundListResponse {
  inbounds: Inbound[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface InboundCreateInput {
  supplierId: string
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

export interface InboundUpdateInput extends Partial<InboundCreateInput> {
  status?: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled'
  receivedDate?: string
}
