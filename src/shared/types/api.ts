/**
 * API 공통 타입 정의
 */

export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  traceId?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiErrorResponse {
  error: ApiError
  timestamp: string
}
