import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/shared/services/apiClient'

/**
 * engine-core Items API 타입 정의
 */

export interface Item {
  id: string
  sku: string
  name: string
  description?: string
  category?: string
  item_type?: string
  uom: string
  unit_cost: number | null
  status?: string
  created_at: string
  updated_at: string
  // Backward compatibility
  cost?: number | null
}

export interface ItemsResponse {
  items: Item[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface ItemsQueryParams {
  page?: number
  limit?: number
  search?: string
  sku?: string
}

/**
 * Items 목록 조회
 */
export const useItemsQuery = (params?: ItemsQueryParams) => {
  return useQuery({
    queryKey: ['items', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()

      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.sku) queryParams.append('sku', params.sku)

      const response = await apiClient.get<ItemsResponse>('/api/v1/items/', {
        params: queryParams,
      })

      return response.data
    },
    staleTime: 30_000, // 30초
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Item 상세 조회
 */
export const useItemQuery = (id: string) => {
  return useQuery({
    queryKey: ['items', id],
    queryFn: async () => {
      const response = await apiClient.get<Item>(`/api/v1/items/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

/**
 * Item 생성 (admin/staff 권한 필요)
 */
export const useCreateItemMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Item, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await apiClient.post<Item>('/api/v1/items/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

/**
 * Item 수정 (admin 권한 필요)
 */
export const useUpdateItemMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Item> }) => {
      const response = await apiClient.put<Item>(`/api/v1/items/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['items', variables.id] })
    },
  })
}

/**
 * Item 삭제 (admin 권한 필요)
 */
export const useDeleteItemMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/items/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
