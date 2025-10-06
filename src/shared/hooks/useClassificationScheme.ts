/**
 * useClassificationScheme Hook
 * 상품 분류 체계 관리 훅
 *
 * Phase 1: LocalStorage 기반 (tenant_id 없이)
 * Phase 2: API 기반 (tenant_settings에서 조회)
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type BehaviorFlags,
  type ClassificationLabel,
  getScheme,
  getBehaviorFlags,
  getAvailableLabels,
  getLabelName,
  requiresBOM as checkRequiresBOM,
  requiresRouting as checkRequiresRouting,
} from '@/shared/config/classification-schemes'

interface UseClassificationSchemeOptions {
  schemeId?: string // Phase 1: 기본값 'simple', Phase 2: tenant_settings에서 조회
}

/**
 * 분류 체계 훅
 *
 * @example
 * ```tsx
 * const { scheme, labels, requiresBOM, requiresRouting } = useClassificationScheme()
 *
 * // 드롭다운 옵션
 * <select>
 *   {labels.map(label => (
 *     <option key={label.code} value={label.code}>
 *       {label.icon} {label.name}
 *     </option>
 *   ))}
 * </select>
 *
 * // 필수 항목 검증
 * if (requiresBOM('ASSEMBLY')) {
 *   // BOM 필수 입력 요구
 * }
 * ```
 */
export function useClassificationScheme(options: UseClassificationSchemeOptions = {}) {
  const { i18n } = useTranslation()
  const locale = i18n.language || 'ko'

  // Phase 1: LocalStorage에서 스킴 ID 조회 (기본값: 'simple')
  // Phase 2: API에서 tenant_settings.classification_scheme 조회
  const schemeId = useMemo(() => {
    if (options.schemeId) return options.schemeId

    // Phase 1: LocalStorage 체크
    const stored = localStorage.getItem('classification_scheme')
    return stored || 'simple'
  }, [options.schemeId])

  // 스킴 로드
  const scheme = useMemo(() => getScheme(schemeId), [schemeId])

  // 라벨 목록 (i18n 적용)
  const labels = useMemo(() => getAvailableLabels(schemeId, locale), [schemeId, locale])

  // 라벨 맵 (빠른 조회용)
  const labelMap = useMemo(() => {
    const map = new Map<string, ClassificationLabel>()
    scheme.labels.forEach((label) => {
      map.set(label.code, label)
    })
    return map
  }, [scheme.labels])

  /**
   * 라벨 조회
   */
  const getLabelByCode = (code: string): ClassificationLabel | undefined => {
    return labelMap.get(code)
  }

  /**
   * 라벨 이름 조회 (i18n)
   */
  const getLabelNameByCode = (code: string): string => {
    return getLabelName(schemeId, code, locale)
  }

  /**
   * 행동 플래그 조회
   */
  const getFlags = (code: string): BehaviorFlags | undefined => {
    return getBehaviorFlags(schemeId, code)
  }

  /**
   * BOM 필수 여부
   */
  const requiresBOM = (code: string): boolean => {
    return checkRequiresBOM(schemeId, code)
  }

  /**
   * 공정/라우팅 필수 여부
   */
  const requiresRouting = (code: string): boolean => {
    return checkRequiresRouting(schemeId, code)
  }

  /**
   * 생산 타입 여부
   */
  const isProduction = (code: string): boolean => {
    const flags = getFlags(code)
    return flags?.isProduction ?? false
  }

  /**
   * 조립 타입 여부
   */
  const isAssembly = (code: string): boolean => {
    const flags = getFlags(code)
    return flags?.isAssembly ?? false
  }

  /**
   * 판매 가능 여부
   */
  const canSell = (code: string): boolean => {
    const flags = getFlags(code)
    return flags?.saleAllowed ?? true
  }

  /**
   * 스킴 변경 (Phase 1: LocalStorage 저장)
   */
  const setScheme = (newSchemeId: string) => {
    localStorage.setItem('classification_scheme', newSchemeId)
    // Phase 2: API 호출로 변경
    // await updateTenantSettings({ classification_scheme: newSchemeId })
    window.location.reload() // 스킴 변경 시 전체 새로고침 (캐시 초기화)
  }

  return {
    // 스킴 정보
    scheme,
    schemeId,
    setScheme,

    // 라벨 목록
    labels,
    getLabelByCode,
    getLabelNameByCode,

    // 행동 플래그
    getFlags,
    requiresBOM,
    requiresRouting,
    isProduction,
    isAssembly,
    canSell,
  }
}

/**
 * 분류 라벨 선택 컴포넌트용 훅
 *
 * @example
 * ```tsx
 * const { labels, selected, onChange } = useClassificationLabelSelect({
 *   value: formData.classificationCode,
 *   onChange: (code) => setFormData({ ...formData, classificationCode: code })
 * })
 * ```
 */
export function useClassificationLabelSelect(props: {
  value: string
  onChange: (code: string) => void
  schemeId?: string
}) {
  const { labels, getLabelByCode } = useClassificationScheme({
    schemeId: props.schemeId,
  })

  const selected = getLabelByCode(props.value)

  return {
    labels,
    selected,
    value: props.value,
    onChange: props.onChange,
  }
}
