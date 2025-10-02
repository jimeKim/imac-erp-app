import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

/**
 * 지원 언어 목록
 * 새로운 언어 추가 시:
 * 1. SUPPORTED_LANGUAGES에 언어 코드 추가
 * 2. public/locales/{lang}/*.json 파일 생성
 * 3. src/shared/hooks/useLanguage.ts의 languages 배열 업데이트
 */
export const SUPPORTED_LANGUAGES = ['ko', 'zh', 'en'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en', // 기본 언어 (국제 표준)
    debug: import.meta.env.DEV,

    // 네임스페이스 - errors 추가
    ns: ['common', 'modules', 'errors'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React already escapes
    },

    // 백엔드 설정 (HTTP로 JSON 파일 로드)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'no-cache',
      },
    },

    // 지원 언어
    supportedLngs: [...SUPPORTED_LANGUAGES],

    // 언어 감지 옵션
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    // 로딩 실패 시 재시도
    load: 'languageOnly', // 'en-US' -> 'en'
  })

export default i18n
