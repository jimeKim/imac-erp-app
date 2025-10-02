/**
 * 역할 기반 접근 제어(RBAC) 상수
 */

import { UserRole } from '@/shared/types/auth'

export const ROLES = {
  READONLY: 'readonly' as const,
  STAFF: 'staff' as const,
  MANAGER: 'manager' as const,
}

/**
 * 역할별 권한 매트릭스
 */
export const PERMISSIONS = {
  // Items (상품)
  ITEMS_VIEW: [ROLES.READONLY, ROLES.STAFF, ROLES.MANAGER],
  ITEMS_CREATE: [ROLES.STAFF, ROLES.MANAGER],
  ITEMS_EDIT: [ROLES.STAFF, ROLES.MANAGER],
  ITEMS_DELETE: [ROLES.MANAGER],

  // Stocks (재고)
  STOCKS_VIEW: [ROLES.READONLY, ROLES.STAFF, ROLES.MANAGER],
  STOCKS_ADJUST: [ROLES.STAFF, ROLES.MANAGER],

  // Inbounds (입고)
  INBOUNDS_VIEW: [ROLES.READONLY, ROLES.STAFF, ROLES.MANAGER],
  INBOUNDS_CREATE: [ROLES.STAFF, ROLES.MANAGER],
  INBOUNDS_SUBMIT: [ROLES.STAFF, ROLES.MANAGER],
  INBOUNDS_APPROVE: [ROLES.MANAGER],
  INBOUNDS_COMMIT: [ROLES.MANAGER],

  // Outbounds (출고)
  OUTBOUNDS_VIEW: [ROLES.READONLY, ROLES.STAFF, ROLES.MANAGER],
  OUTBOUNDS_CREATE: [ROLES.STAFF, ROLES.MANAGER],
  OUTBOUNDS_SUBMIT: [ROLES.STAFF, ROLES.MANAGER],
  OUTBOUNDS_APPROVE: [ROLES.MANAGER],
  OUTBOUNDS_COMMIT: [ROLES.MANAGER],
} as const

export type Permission = keyof typeof PERMISSIONS

/**
 * 권한 체크 헬퍼
 */
export function hasPermission(userRoles: UserRole[], permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission]
  return userRoles.some((role) => allowedRoles.includes(role))
}

/**
 * 역할 표시명
 */
export const ROLE_LABELS: Record<UserRole, { ko: string; zh: string; en: string }> = {
  readonly: {
    ko: '읽기 전용',
    zh: '只读',
    en: 'Read Only',
  },
  staff: {
    ko: '직원',
    zh: '员工',
    en: 'Staff',
  },
  manager: {
    ko: '관리자',
    zh: '管理员',
    en: 'Manager',
  },
}
