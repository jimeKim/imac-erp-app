import { useState, useEffect, ReactNode } from 'react'
import { User, LoginCredentials, AuthState } from '@/shared/types/auth'
import { api } from '@/shared/services/apiClient'
import { Permission, hasPermission } from '@/shared/constants/roles'
import { AuthContext } from '@/app/contexts/AuthContext'
import apiClient from '@/shared/services/apiClient'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  /**
   * 로그인 (engine-core OAuth2 형식)
   */
  const login = async (creds: LoginCredentials) => {
    try {
      // engine-core는 username/password 형식 사용
      const formData = new URLSearchParams()
      formData.append('username', creds.email) // email을 username으로 사용
      formData.append('password', creds.password_hash) // password_hash를 password로 사용

      const response = await apiClient.post<{
        access_token: string
        token_type: string
        role: string
        user_id: string
      }>('/api/v1/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      // 토큰 저장
      localStorage.setItem('access_token', response.data.access_token)

      // User 객체 생성
      const user: User = {
        id: response.data.user_id,
        email: response.data.user_id, // username을 email로 사용
        role: response.data.role,
      }

      localStorage.setItem('user', JSON.stringify(user))

      setState({
        user,
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
      // 로컬스토리지 클리어
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')

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
    // engine-core는 단일 'role' 필드 사용
    return hasPermission(state.user.role, perm)
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
