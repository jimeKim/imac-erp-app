import { useState, useEffect } from 'react'

const DEFAULT_ENABLED_TYPES = ['FG', 'SF', 'MOD', 'PT', 'RM', 'MR']

/**
 * 상품 유형 설정 관리 훅
 * LocalStorage에서 활성화된 item_type 목록을 가져옴
 */
export function useItemTypeSettings() {
  const [enabledTypes, setEnabledTypes] = useState<string[]>(DEFAULT_ENABLED_TYPES)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('enabled_item_types')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEnabledTypes(parsed)
        }
      }
    } catch (error) {
      console.error('Failed to load enabled_item_types:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const isTypeEnabled = (typeCode: string): boolean => {
    return enabledTypes.includes(typeCode)
  }

  const filterEnabledTypes = (types: string[]): string[] => {
    return types.filter((type) => enabledTypes.includes(type))
  }

  return {
    enabledTypes,
    isLoading,
    isTypeEnabled,
    filterEnabledTypes,
  }
}
