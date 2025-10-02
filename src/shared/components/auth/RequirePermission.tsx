import { ReactNode } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { Permission } from '@/shared/constants/roles'

interface RequirePermissionProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

/**
 * 특정 권한이 있을 때만 자식 컴포넌트 렌더링
 * 주로 버튼, 메뉴 등의 UI 요소 제어에 사용
 */
export function RequirePermission({ permission, children, fallback }: RequirePermissionProps) {
  const { hasPermission } = useAuth()

  if (!hasPermission(permission)) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}
