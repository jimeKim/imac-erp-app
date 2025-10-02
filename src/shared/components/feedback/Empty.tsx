import { ReactNode } from 'react'
import { FileQuestion, Inbox, SearchX } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'

export interface EmptyProps {
  icon?: 'default' | 'search' | 'inbox'
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
  className?: string
}

const EMPTY_ICONS = {
  default: FileQuestion,
  search: SearchX,
  inbox: Inbox,
}

/**
 * Empty State 컴포넌트
 *
 * 데이터가 없을 때 표시하는 빈 상태 UI
 *
 * 사용법:
 * ```tsx
 * <Empty
 *   icon="search"
 *   title="No results found"
 *   description="Try adjusting your search or filter"
 *   action={{
 *     label: "Clear filters",
 *     onClick: () => clearFilters()
 *   }}
 * />
 * ```
 */
export function Empty({
  icon = 'default',
  title,
  description,
  action,
  children,
  className,
}: EmptyProps) {
  const Icon = EMPTY_ICONS[icon]

  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center p-8 text-center',
        className,
      )}
    >
      <div className="mb-4 rounded-full bg-muted p-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>

      <h3 className="mb-2 text-lg font-semibold">{title}</h3>

      {description && <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>}

      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}

      {children}
    </div>
  )
}
