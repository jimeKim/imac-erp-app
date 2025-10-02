import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
import { Permission } from '@/shared/constants/roles'

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermission?: Permission
  fallback?: ReactNode
}

/**
 * 인증이 필요한 라우트 보호
 */
export function ProtectedRoute({ children, requiredPermission, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth()

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // 미인증
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 권한 체크
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
