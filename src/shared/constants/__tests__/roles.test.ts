import { describe, it, expect } from 'vitest'
import { hasPermission, PERMISSIONS } from '../roles'
import type { UserRole } from '@/shared/types/auth'

describe('RBAC System', () => {
  describe('hasPermission', () => {
    it('should allow readonly to view items', () => {
      const roles: UserRole[] = ['readonly']
      expect(hasPermission(roles, 'ITEMS_VIEW')).toBe(true)
    })

    it('should not allow readonly to create items', () => {
      const roles: UserRole[] = ['readonly']
      expect(hasPermission(roles, 'ITEMS_CREATE')).toBe(false)
    })

    it('should allow staff to create items', () => {
      const roles: UserRole[] = ['staff']
      expect(hasPermission(roles, 'ITEMS_CREATE')).toBe(true)
    })

    it('should allow manager to approve outbounds', () => {
      const roles: UserRole[] = ['manager']
      expect(hasPermission(roles, 'OUTBOUNDS_APPROVE')).toBe(true)
    })

    it('should not allow staff to approve outbounds', () => {
      const roles: UserRole[] = ['staff']
      expect(hasPermission(roles, 'OUTBOUNDS_APPROVE')).toBe(false)
    })

    it('should handle multiple roles', () => {
      const roles: UserRole[] = ['readonly', 'staff']
      expect(hasPermission(roles, 'ITEMS_CREATE')).toBe(true)
    })
  })

  describe('PERMISSIONS matrix', () => {
    it('should have correct permissions for ITEMS_VIEW', () => {
      expect(PERMISSIONS.ITEMS_VIEW).toContain('readonly')
      expect(PERMISSIONS.ITEMS_VIEW).toContain('staff')
      expect(PERMISSIONS.ITEMS_VIEW).toContain('manager')
    })

    it('should have correct permissions for OUTBOUNDS_APPROVE', () => {
      expect(PERMISSIONS.OUTBOUNDS_APPROVE).not.toContain('readonly')
      expect(PERMISSIONS.OUTBOUNDS_APPROVE).not.toContain('staff')
      expect(PERMISSIONS.OUTBOUNDS_APPROVE).toContain('manager')
    })
  })
})
