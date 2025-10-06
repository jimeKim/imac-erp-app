/**
 * CategorySelect Component
 * 계층형 카테고리 선택 드롭다운 (들여쓰기)
 */
import { useCategoriesTreeQuery } from '@/features/categories/api/categories.api'
import type { Category } from '@/shared/types/category'

interface CategorySelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  includeInactive?: boolean
}

export function CategorySelect({
  value,
  onChange,
  disabled = false,
  placeholder = '-- 카테고리 선택 --',
  includeInactive = false,
}: CategorySelectProps) {
  const { data: categories = [], isLoading } = useCategoriesTreeQuery(includeInactive)

  // 트리를 평탄화하면서 들여쓰기 레벨 유지
  const flattenCategories = (cats: Category[], level = 0): Array<Category & { level: number }> => {
    return cats.flatMap((cat) => [
      { ...cat, level },
      ...flattenCategories(cat.children || [], level + 1),
    ])
  }

  const flatCategories = flattenCategories(categories)

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isLoading}
      className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">{isLoading ? '로딩 중...' : placeholder}</option>
      {flatCategories.map((cat) => (
        <option key={cat.id} value={cat.id} disabled={!cat.is_active}>
          {'\u00A0'.repeat(cat.level * 4)}
          {cat.name} ({cat.item_count}개)
          {!cat.is_active && ' [비활성]'}
        </option>
      ))}
    </select>
  )
}
