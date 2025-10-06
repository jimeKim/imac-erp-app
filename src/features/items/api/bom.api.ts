import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/shared/services/apiClient'
import type {
  BomTreeResponse,
  BomComponent,
  BomCreateInput,
  BomUpdateInput,
  BomStats,
} from '@/shared/types/bom'

/**
 * 상품의 BOM 트리 조회
 */
export const useBomTreeQuery = (itemId: string, enabled = true) => {
  return useQuery({
    queryKey: ['bom', 'tree', itemId],
    queryFn: async () => {
      const response = await apiClient.get<BomTreeResponse>(`/api/v1/items/${itemId}/bom/tree`)
      return response.data
    },
    enabled: !!itemId && enabled,
    staleTime: 30_000, // 30초
  })
}

/**
 * 상품의 BOM 구성품 목록 조회 (플랫)
 */
export const useBomComponentsQuery = (itemId: string) => {
  return useQuery({
    queryKey: ['bom', 'components', itemId],
    queryFn: async () => {
      const response = await apiClient.get<{ components: BomComponent[] }>(
        `/api/v1/items/${itemId}/bom/components`,
      )
      return response.data.components
    },
    enabled: !!itemId,
    staleTime: 30_000,
  })
}

/**
 * BOM 통계 조회
 */
export const useBomStatsQuery = (itemId: string) => {
  return useQuery({
    queryKey: ['bom', 'stats', itemId],
    queryFn: async () => {
      const response = await apiClient.get<BomStats>(`/api/v1/items/${itemId}/bom/stats`)
      return response.data
    },
    enabled: !!itemId,
    staleTime: 30_000,
  })
}

/**
 * BOM 구성품 추가
 */
export const useAddBomComponent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: BomCreateInput) => {
      const response = await apiClient.post<{ success: boolean; data: BomComponent }>(
        `/api/v1/items/${input.parent_item_id}/bom/components`,
        {
          component_item_id: input.component_item_id,
          quantity: input.quantity,
          unit: input.unit || 'EA',
          notes: input.notes,
        },
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      // 해당 상품의 BOM 데이터 무효화
      queryClient.invalidateQueries({ queryKey: ['bom', 'tree', variables.parent_item_id] })
      queryClient.invalidateQueries({ queryKey: ['bom', 'components', variables.parent_item_id] })
      queryClient.invalidateQueries({ queryKey: ['bom', 'stats', variables.parent_item_id] })
    },
  })
}

/**
 * BOM 구성품 수정
 */
export const useUpdateBomComponent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      parentItemId,
      data,
    }: {
      id: string
      parentItemId: string
      data: BomUpdateInput
    }) => {
      const response = await apiClient.patch<BomComponent>(
        `/api/v1/items/${parentItemId}/bom/components/${id}`,
        data,
      )
      return { ...response.data, parentItemId }
    },
    onSuccess: (data) => {
      // 해당 상품의 BOM 데이터 무효화
      queryClient.invalidateQueries({ queryKey: ['bom', 'tree', data.parentItemId] })
      queryClient.invalidateQueries({ queryKey: ['bom', 'components', data.parentItemId] })
      queryClient.invalidateQueries({ queryKey: ['bom', 'stats', data.parentItemId] })
    },
  })
}

/**
 * BOM 구성품 삭제
 */
export const useDeleteBomComponent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, parentItemId }: { id: string; parentItemId: string }) => {
      await apiClient.delete(`/api/v1/items/${parentItemId}/bom/components/${id}`)
      return { id, parentItemId }
    },
    onSuccess: (data) => {
      // 해당 상품의 BOM 데이터 무효화
      queryClient.invalidateQueries({ queryKey: ['bom', 'tree', data.parentItemId] })
      queryClient.invalidateQueries({ queryKey: ['bom', 'components', data.parentItemId] })
      queryClient.invalidateQueries({ queryKey: ['bom', 'stats', data.parentItemId] })
    },
  })
}
