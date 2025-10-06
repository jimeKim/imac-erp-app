/**
 * Categories API
 * 카테고리 CRUD API 클라이언트
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/shared/services/apiClient'
import type {
  Category,
  CategoryCreate,
  CategoryUpdate,
  CategoriesResponse,
} from '@/shared/types/category'

// ============================================================================
// Query Keys
// ============================================================================

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters: { include_inactive?: boolean }) => [...categoryKeys.lists(), filters] as const,
  tree: (filters: { include_inactive?: boolean }) =>
    [...categoryKeys.all, 'tree', filters] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
}

// ============================================================================
// Queries
// ============================================================================

/**
 * 카테고리 목록 조회 (Flat)
 */
export const useCategoriesQuery = (includeInactive = false) => {
  return useQuery({
    queryKey: categoryKeys.list({ include_inactive: includeInactive }),
    queryFn: async (): Promise<CategoriesResponse> => {
      const response = await apiClient.get<CategoriesResponse>(
        `/api/v1/categories?include_inactive=${includeInactive}`,
      )
      return response.data
    },
  })
}

/**
 * 카테고리 트리 조회 (계층 구조)
 */
export const useCategoriesTreeQuery = (includeInactive = false) => {
  return useQuery({
    queryKey: categoryKeys.tree({ include_inactive: includeInactive }),
    queryFn: async (): Promise<Category[]> => {
      const response = await apiClient.get<Category[]>(
        `/api/v1/categories/tree?include_inactive=${includeInactive}`,
      )
      return response.data
    },
  })
}

/**
 * 카테고리 상세 조회
 */
export const useCategoryQuery = (id: string | undefined) => {
  return useQuery({
    queryKey: categoryKeys.detail(id!),
    queryFn: async (): Promise<Category> => {
      const response = await apiClient.get<Category>(`/api/v1/categories/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * 카테고리 생성
 */
export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CategoryCreate): Promise<Category> => {
      const response = await apiClient.post<Category>('/api/v1/categories', data)
      return response.data
    },
    onSuccess: () => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

/**
 * 카테고리 수정
 */
export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryUpdate }): Promise<Category> => {
      const response = await apiClient.patch<Category>(`/api/v1/categories/${id}`, data)
      return response.data
    },
    onSuccess: (data) => {
      // 목록 및 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(data.id) })
    },
  })
}

/**
 * 카테고리 삭제
 */
export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, force = false }: { id: string; force?: boolean }) => {
      await apiClient.delete(`/api/v1/categories/${id}?force=${force}`)
    },
    onSuccess: () => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

/**
 * 카테고리 활성화/비활성화 토글
 */
export const useToggleCategoryMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<Category> => {
      const response = await apiClient.post<Category>(`/api/v1/categories/${id}/toggle`)
      return response.data
    },
    onSuccess: (data) => {
      // 목록 및 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(data.id) })
    },
  })
}
