/**
 * CategorySettingsPage
 * 카테고리 관리 설정 페이지
 */
import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Power, PowerOff, AlertCircle, List, Network } from 'lucide-react'
import {
  useCategoriesQuery,
  useCategoriesTreeQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useToggleCategoryMutation,
} from '@/features/categories/api/categories.api'
import { Button, Card } from '@/shared/components/ui'
import { useToast } from '@/shared/hooks/useToast'
import { CategoryTree } from '@/features/categories/components/CategoryTree'
import type { Category, CategoryCreate, CategoryUpdate } from '@/shared/types/category'

type ViewMode = 'table' | 'tree'

export default function CategorySettingsPage() {
  const { toast } = useToast()

  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  // Queries & Mutations
  const { data: categoriesData, isLoading } = useCategoriesQuery(includeInactive)
  const { data: treeData, isLoading: isTreeLoading } = useCategoriesTreeQuery(includeInactive)
  const createMutation = useCreateCategoryMutation()
  const updateMutation = useUpdateCategoryMutation()
  const deleteMutation = useDeleteCategoryMutation()
  const toggleMutation = useToggleCategoryMutation()

  const categories = categoriesData?.data || []
  const categoryTree = treeData || []

  // Handlers
  const handleToggleActive = async (category: Category) => {
    try {
      await toggleMutation.mutateAsync(category.id)
      toast.success(
        '상태 변경 완료',
        `"${category.name}" 카테고리가 ${category.is_active ? '비활성화' : '활성화'}되었습니다.`,
      )
    } catch (_error) {
      toast.error('상태 변경 실패', '카테고리 상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async (force = false) => {
    if (!deletingCategory) return

    try {
      await deleteMutation.mutateAsync({ id: deletingCategory.id, force })
      toast.success('삭제 완료', `"${deletingCategory.name}" 카테고리가 삭제되었습니다.`)
      setDeletingCategory(null)
    } catch (error: any) {
      if (error?.response?.status === 409 && !force) {
        // 상품이 있는 경우
        toast.error(
          '삭제 불가',
          `이 카테고리에 ${deletingCategory.item_count}개의 상품이 있습니다. 강제 삭제하시겠습니까?`,
        )
      } else {
        toast.error('삭제 실패', '카테고리 삭제에 실패했습니다.')
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">카테고리 관리</h1>
          <p className="text-sm text-muted-foreground">
            상품 카테고리를 추가, 수정, 삭제할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={viewMode === 'tree' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tree')}
              className="h-8"
            >
              <Network className="mr-2 h-4 w-4" />
              트리
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8"
            >
              <List className="mr-2 h-4 w-4" />
              목록
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="h-4 w-4"
            />
            비활성 포함
          </label>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            카테고리 추가
          </Button>
        </div>
      </div>

      {/* Tree View */}
      {viewMode === 'tree' ? (
        isTreeLoading ? (
          <Card>
            <div className="p-8 text-center">로딩 중...</div>
          </Card>
        ) : (
          <CategoryTree
            categories={categoryTree}
            onSelectCategory={(cat) => setEditingCategory(cat)}
          />
        )
      ) : (
        /* Table View */
        <Card>
          {isLoading ? (
            <div className="p-8 text-center">로딩 중...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">카테고리가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">이름</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">설명</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">상품 수</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">상태</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className={`border-b hover:bg-muted/30 ${
                        !category.is_active ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">{category.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {category.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">{category.item_count}</td>
                      <td className="px-4 py-3 text-center">
                        {category.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                            <Power className="h-3 w-3" />
                            활성
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            <PowerOff className="h-3 w-3" />
                            비활성
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(category)}
                            disabled={toggleMutation.isPending}
                            className="h-8 w-8 p-0"
                          >
                            {category.is_active ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCategory(category)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingCategory(category)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingCategory) && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowAddModal(false)
            setEditingCategory(null)
          }}
          onSubmit={async (data) => {
            try {
              if (editingCategory) {
                await updateMutation.mutateAsync({
                  id: editingCategory.id,
                  data,
                })
                toast.success('수정 완료', '카테고리가 수정되었습니다.')
              } else {
                await createMutation.mutateAsync(data as CategoryCreate)
                toast.success('추가 완료', '카테고리가 추가되었습니다.')
              }
              setShowAddModal(false)
              setEditingCategory(null)
            } catch (error: any) {
              if (error?.response?.status === 409) {
                toast.error('이름 중복', '이미 존재하는 카테고리 이름입니다.')
              } else {
                toast.error('저장 실패', '카테고리 저장에 실패했습니다.')
              }
            }
          }}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deletingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeletingCategory(null)}
        >
          <Card className="mx-4 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-destructive">
                <AlertCircle className="h-5 w-5" />
                카테고리 삭제
              </h2>
              <p className="mb-2">
                <span className="font-medium">{deletingCategory.name}</span> 카테고리를
                삭제하시겠습니까?
              </p>
              {deletingCategory.item_count > 0 && (
                <p className="mb-4 text-sm text-muted-foreground">
                  ⚠️ 이 카테고리에 {deletingCategory.item_count}개의 상품이 있습니다. 삭제하면 해당
                  상품들의 카테고리가 제거됩니다.
                </p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeletingCategory(null)}
                  disabled={deleteMutation.isPending}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(deletingCategory.item_count > 0)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? '삭제 중...' : '삭제'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Category Modal Component
// ============================================================================

interface CategoryModalProps {
  category: Category | null
  onClose: () => void
  onSubmit: (data: CategoryCreate | CategoryUpdate) => Promise<void>
}

function CategoryModal({ category, onClose, onSubmit }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || '')
  const [description, setDescription] = useState(category?.description || '')
  const [parentId, setParentId] = useState(category?.parent_id || '')
  const [isActive, setIsActive] = useState(category?.is_active ?? true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: categoriesData } = useCategoriesQuery(false)
  const allCategories = categoriesData?.data || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        parent_id: parentId || null,
        is_active: isActive,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <Card className="mx-4 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="mb-4 text-xl font-semibold">
            {category ? '카테고리 수정' : '카테고리 추가'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                이름 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="w-full rounded-md border px-3 py-2"
                placeholder="전자제품"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">부모 카테고리</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
                disabled={category ? category.id === parentId : false}
              >
                <option value="">-- 루트 카테고리 (최상위) --</option>
                {allCategories
                  .filter((c) => !category || c.id !== category.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {'\u00A0'.repeat(c.level * 4)}
                      {c.name} ({c.path})
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                부모 카테고리를 선택하지 않으면 최상위 카테고리로 생성됩니다.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border px-3 py-2"
                placeholder="Electronics & Computer Parts"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">활성화</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
