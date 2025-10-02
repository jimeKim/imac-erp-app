/**
 * 인증 관련 타입 정의
 */

export type UserRole = 'readonly' | 'staff' | 'manager'

export interface User {
  id: string
  email: string
  fullName: string
  roles: UserRole[]
  tenantId?: string
  createdAt: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: User
  message?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
