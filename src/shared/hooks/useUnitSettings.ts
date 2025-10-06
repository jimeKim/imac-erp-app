import { useState, useEffect } from 'react'
import { UnitSettings, DEFAULT_UNIT_SETTINGS } from '@/shared/types/units'

const STORAGE_KEY = 'erp-unit-settings'

/**
 * 단위 설정 관리 훅
 * LocalStorage에 단위 설정을 저장하고 불러옵니다.
 */
export function useUnitSettings() {
  const [units, setUnits] = useState<UnitSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load unit settings:', error)
    }
    return DEFAULT_UNIT_SETTINGS
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(units))
    } catch (error) {
      console.error('Failed to save unit settings:', error)
    }
  }, [units])

  const updateUnit = <K extends keyof UnitSettings>(
    category: K,
    value: UnitSettings[K],
  ) => {
    setUnits((prev) => ({
      ...prev,
      [category]: value,
    }))
  }

  const resetToDefaults = () => {
    setUnits(DEFAULT_UNIT_SETTINGS)
  }

  return {
    units,
    updateUnit,
    resetToDefaults,
  }
}
