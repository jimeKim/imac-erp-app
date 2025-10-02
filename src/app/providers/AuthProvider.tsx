import { useState, useEffect, ReactNode } from 'react'
import { User, LoginCredentials, AuthState } from '@/shared/types/auth'
import { api } from '@/shared/services/apiClient'
import { Permission, hasPermission } from '@/shared/constants/roles'
import { AuthContext } from '@/app/contexts/AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  /**
   * 로그인
   */
  const login = async (creds: LoginCredentials) => {
    try {
      const response = await api.post<{ user: User }>('/api/v1/auth/login', creds)

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
      throw err
    }
  }

  /**
   * 로그아웃
   */
  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }

  /**
   * 인증 상태 확인
   */
  const checkAuth = async () => {
    try {
      const response = await api.get<{ user: User }>('/api/v1/auth/me')

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }

  /**
   * 권한 체크
   */
  const checkPermission = (perm: Permission): boolean => {
    if (!state.user) return false
    return hasPermission(state.user.roles, perm)
  }

  /**
   * 401 에러 처리 (apiClient에서 발생시킴)
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  /**
   * 초기 인증 상태 확인
   */
  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        checkAuth,
        hasPermission: checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
