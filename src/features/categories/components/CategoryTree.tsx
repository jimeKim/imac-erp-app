/**
 * CategoryTree Component
 * 카테고리 계층 구조를 트리 형태로 표시
 */
import { useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderOpen, Package } from 'lucide-react'
import type { Category } from '@/shared/types/category'
import { cn } from '@/shared/utils/cn'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'

interface CategoryTreeProps {
  categories: Category[]
  onSelectCategory?: (category: Category) => void
  selectedCategoryId?: string
}

export function CategoryTree({
  categories,
  onSelectCategory,
  selectedCategoryId,
}: CategoryTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const CategoryNode = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedNodes.has(category.id)
    const isSelected = selectedCategoryId === category.id

    return (
      <div className="space-y-1">
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border p-3 transition-colors',
            'cursor-pointer hover:bg-accent',
            isSelected && 'border-primary bg-primary/10',
            level > 0 && 'ml-6',
          )}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(category.id)
            }
            onSelectCategory?.(category)
          }}
        >
          {/* 확장/축소 아이콘 */}
          {hasChildren && (
            <button
              className="rounded p-0 hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(category.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}

          {/* 폴더 아이콘 */}
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-5 w-5 text-blue-600" />
            ) : (
              <Folder className="h-5 w-5 text-blue-600" />
            )
          ) : (
            <Package className="h-5 w-5 text-gray-400" />
          )}

          {/* 카테고리 정보 */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={cn('font-medium', isSelected && 'text-primary')}>
                {category.name}
              </span>
              <span className="text-sm text-muted-foreground">({category.item_count}개 상품)</span>
              {!category.is_active && (
                <span className="rounded bg-gray-200 px-2 py-0.5 text-xs">비활성</span>
              )}
            </div>
            {category.description && (
              <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
            )}
          </div>

          {/* 경로 표시 */}
          <span className="font-mono text-xs text-muted-foreground">{category.path}</span>
        </div>

        {/* 하위 카테고리 (재귀 렌더링) */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {category.children.map((child) => (
              <CategoryNode key={child.id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!categories || categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          등록된 카테고리가 없습니다.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>카테고리 계층 구조</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {categories.map((category) => (
          <CategoryNode key={category.id} category={category} level={0} />
        ))}
      </CardContent>
    </Card>
  )
}
