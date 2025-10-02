import { useContext } from 'react'
import { AuthContext } from '@/app/contexts/AuthContext'

/**
 * useAuth 훅
 * AuthProvider 컨텍스트에 접근
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
