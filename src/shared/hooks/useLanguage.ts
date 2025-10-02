import { useTranslation } from 'react-i18next'
import { SupportedLanguage } from '@/shared/services/i18n'

/**
 * 언어 메타데이터
 * 새로운 언어 추가 시 이 배열에 추가하세요
 */
const LANGUAGE_METADATA: Array<{ code: SupportedLanguage; label: string; flag: string }> = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
]

export function useLanguage() {
  const { i18n } = useTranslation()

  const changeLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang)
  }

  const currentLanguage = i18n.language as SupportedLanguage

  return {
    currentLanguage,
    changeLanguage,
    languages: LANGUAGE_METADATA,
    isLanguageSupported: (lang: string): lang is SupportedLanguage => {
      return LANGUAGE_METADATA.some((l) => l.code === lang)
    },
  }
}

export type { SupportedLanguage }
