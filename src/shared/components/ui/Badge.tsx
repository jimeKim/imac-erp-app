import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
}

/**
 * Badge 컴포넌트
 * 작은 상태 표시나 라벨에 사용
 */
export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-primary text-primary-foreground': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground':
            variant === 'outline',
          'bg-destructive text-destructive-foreground': variant === 'destructive',
        },
        className,
      )}
      {...props}
    />
  )
}
