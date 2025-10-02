import { useTranslation } from 'react-i18next'

export type Language = 'ko' | 'zh'

export function useLanguage() {
  const { i18n } = useTranslation()

  const changeLanguage = (lang: Language) => {
    i18n.changeLanguage(lang)
  }

  const currentLanguage = i18n.language as Language

  return {
    currentLanguage,
    changeLanguage,
    languages: [
      { code: 'ko' as const, label: '한국어' },
      { code: 'zh' as const, label: '中文' },
    ],
  }
}
