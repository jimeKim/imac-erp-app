/**
 * 단위 설정 관련 타입 정의
 */

export type CurrencyUnit = 'KRW' | 'USD' | 'CNY' | 'JPY' | 'EUR' | 'GBP'
export type DistanceUnit = 'M' | 'CM' | 'MM' | 'KM' | 'FT' | 'IN' | 'YD' | 'MILE'
export type WeightUnit = 'KG' | 'G' | 'MG' | 'T' | 'LB' | 'OZ'
export type VolumeUnit = 'L' | 'ML' | 'M3' | 'CM3' | 'GAL' | 'QT' | 'PT' | 'FLOZ'
export type TemperatureUnit = 'C' | 'F' | 'K'

export interface UnitSettings {
  currency: CurrencyUnit
  distance: DistanceUnit
  weight: WeightUnit
  volume: VolumeUnit
  temperature: TemperatureUnit
}

export const DEFAULT_UNIT_SETTINGS: UnitSettings = {
  currency: 'KRW',
  distance: 'M',
  weight: 'KG',
  volume: 'L',
  temperature: 'C',
}

export interface CurrencyOption {
  value: CurrencyUnit
  label: string
  symbol: string
}

export interface UnitOption {
  value: string
  label: string
  symbol: string
}
