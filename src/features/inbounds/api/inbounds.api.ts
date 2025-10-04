// src/features/inbounds/api/inbounds.api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/shared/services/apiClient'

// engine-core 응답 타입
interface InboundsResponse {
  inbounds: Inbound[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

interface Inbound {
  id: string
  item_id: string
  quantity: number // Supabase 실제 컬럼명
  unit_cost?: number
  total_cost?: number
  supplier?: string
  reference_no?: string
  received_date?: string
  status: string // 'pending' | 'received' | 'cancelled'
  notes?: string
  created_by?: string
  approved_by?: string
  created_at: string
  updated_at: string

  // 조인된 상품 정보
  item_sku?: string
  item_name?: string
}

interface InboundCreateData {
  item_id: string
  quantity: number
  unit_cost?: number
  supplier?: string
  reference_no?: string
  received_date?: string
  notes?: string
}

// Inbounds 목록 조회
export const useInboundsQuery = (filters?: {
  page?: number
  limit?: number
  item_id?: string
  status?: string
}) => {
  return useQuery({
    queryKey: ['inbounds', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.item_id) params.append('item_id', filters.item_id)
      if (filters?.status) params.append('status', filters.status)

      const response = await apiClient.get<InboundsResponse>('/api/v1/inbounds/', { params })
      return response.data
    },
    staleTime: 30_000, // 30초
  })
}

// Inbound 상세 조회
export const useInboundDetailQuery = (id: string) => {
  return useQuery({
    queryKey: ['inbounds', id],
    queryFn: async () => {
      const response = await apiClient.get<Inbound>(`/api/v1/inbounds/${id}/`)
      return response.data
    },
    enabled: !!id,
  })
}

// Inbound 생성
export const useCreateInboundMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: InboundCreateData) => {
      const response = await apiClient.post<Inbound>('/api/v1/inbounds/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbounds'] })
    },
  })
}

// Inbound 승인
export const useApproveInboundMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, approved_by }: { id: string; approved_by: string }) => {
      const response = await apiClient.post<Inbound>(`/api/v1/inbounds/${id}/approve`, {
        approved_by,
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inbounds'] })
      queryClient.invalidateQueries({ queryKey: ['inbounds', variables.id] })
    },
  })
}

// Inbound 삭제
export const useDeleteInboundMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/inbounds/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbounds'] })
    },
  })
}
