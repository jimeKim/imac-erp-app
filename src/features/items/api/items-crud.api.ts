/**
 * Items CRUD API
 * Phase 1: Classification Scheme 통합
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/shared/services/apiClient'

// ============================================================================
// Types
// ============================================================================

export interface ItemFormData {
  sku: string
  name: string
  description?: string
  category_id?: string
  item_type: string
  uom: string
  unit_cost?: string | number
  status: string
}

export interface Item extends ItemFormData {
  id: string
  created_at: string
  updated_at: string
}

export interface CreateItemResponse {
  id: string
  sku: string
  name: string
  item_type: string
  created_at: string
  updated_at: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// ============================================================================
// API Functions
// ============================================================================

async function createItem(data: ItemFormData): Promise<Item> {
  const response = await apiClient.post<Item>('/api/v1/items', {
    sku: data.sku,
    name: data.name,
    description: data.description || null,
    category_id: data.category_id || null,
    item_type: data.item_type,
    uom: data.uom,
    unit_cost: data.unit_cost ? parseFloat(String(data.unit_cost)) : null,
    status: data.status,
  })

  return response.data
}

// ============================================================================
// React Query Hooks
// ============================================================================

export const useCreateItemMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      // Invalidate items list cache
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
    onError: (error: unknown) => {
      // Error handled by caller
      console.error('[Items API] Create failed:', error)
    },
  })
}
