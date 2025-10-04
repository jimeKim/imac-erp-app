/**
 * 인증 관련 타입 정의
 */

export type UserRole = 'readonly' | 'staff' | 'manager'

export interface User {
  id: string
  email: string
  fullName?: string
  role: string // engine-core는 단일 role 사용
  tenantId?: string
  createdAt?: string
}

export interface LoginCredentials {
  email: string
  password_hash: string // engine-core 형식
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
