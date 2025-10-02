import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ko',
    debug: import.meta.env.DEV,

    // 네임스페이스
    ns: ['common', 'modules'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React already escapes
    },

    // 백엔드 설정
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // 지원 언어
    supportedLngs: ['ko', 'zh'],

    // 언어 감지 옵션
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

export default i18n
