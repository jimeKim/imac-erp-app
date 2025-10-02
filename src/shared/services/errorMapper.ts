import { AxiosError } from 'axios'
import i18n from './i18n'
import { ERROR_CODES, ErrorCode } from '@/shared/constants/errorCodes'
import { ApiErrorResponse } from '@/shared/types/api'

/**
 * Axios 에러를 사용자 친화적인 메시지로 변환
 */
export function mapErrorToMessage(error: unknown): string {
  // Axios 에러인 경우
  if (error instanceof AxiosError) {
    // 네트워크 에러
    if (!error.response) {
      return i18n.t('errors:NETWORK_ERROR', { ns: 'errors' })
    }

    const status = error.response.status
    const errorData = error.response.data as ApiErrorResponse | undefined

    // 백엔드에서 정의한 에러 코드가 있는 경우
    if (errorData?.error?.code) {
      const errorCode = errorData.error.code as ErrorCode
      const translationKey = `errors:${errorCode}`
      const translated = i18n.t(translationKey, { ns: 'errors' })

      // 번역이 있으면 반환, 없으면 백엔드 메시지
      return translated !== translationKey ? translated : errorData.error.message
    }

    // HTTP 상태 코드 기반 에러 처리
    switch (status) {
      case 400:
        return i18n.t('errors:VALIDATION_FAILED', { ns: 'errors' })
      case 401:
        return i18n.t('errors:AUTH_UNAUTHORIZED', { ns: 'errors' })
      case 403:
        return i18n.t('errors:AUTH_FORBIDDEN', { ns: 'errors' })
      case 404:
        return i18n.t('errors:RESOURCE_NOT_FOUND', { ns: 'errors' })
      case 409:
        return i18n.t('errors:RESOURCE_CONFLICT', { ns: 'errors' })
      case 500:
        return i18n.t('errors:SYSTEM_INTERNAL_ERROR', { ns: 'errors' })
      case 503:
        return i18n.t('errors:SYSTEM_SERVICE_UNAVAILABLE', { ns: 'errors' })
      default:
        return i18n.t('errors:UNKNOWN_ERROR', { ns: 'errors' })
    }
  }

  // 일반 에러
  if (error instanceof Error) {
    return error.message
  }

  // 알 수 없는 에러
  return i18n.t('errors:UNKNOWN_ERROR', { ns: 'errors' })
}

/**
 * 에러 코드 추출
 */
export function extractErrorCode(error: unknown): ErrorCode {
  if (error instanceof AxiosError) {
    const errorData = error.response?.data as ApiErrorResponse | undefined
    if (errorData?.error?.code) {
      return errorData.error.code as ErrorCode
    }
  }
  return ERROR_CODES.UNKNOWN_ERROR
}

/**
 * Trace ID 추출 (로깅용)
 */
export function extractTraceId(error: unknown): string | undefined {
  if (error instanceof AxiosError) {
    const errorData = error.response?.data as ApiErrorResponse | undefined
    return errorData?.error?.traceId
  }
  return undefined
}
