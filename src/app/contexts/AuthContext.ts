import { createContext } from 'react'
import { AuthState } from '@/shared/types/auth'
import { Permission } from '@/shared/constants/roles'
import type { LoginCredentials } from '@/shared/types/auth'

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
