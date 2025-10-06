import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { mapErrorToMessage, extractTraceId } from './errorMapper'

/**
 * Axios 인스턴스 생성
 */
const apiClient = axios.create({
  // Nginx 리버스 프록시를 통한 상대 경로 사용 (운영 환경)
  // 개발 환경에서는 VITE_API_BASE_URL 환경변수 사용
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // JWT 쿠키 전송을 위해 필요
})

/**
 * 요청 인터셉터
 */
apiClient.interceptors.request.use(
  (config) => {
    // 요청 시작 시간 기록 (디버깅용)
    config.headers['X-Request-Start-Time'] = Date.now().toString()

    // Bearer 토큰 추가 (engine-core JWT 인증)
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

/**
 * 응답 인터셉터
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 요청 시간 계산 (디버깅용)
    const startTime = Number(response.config.headers['X-Request-Start-Time'])
    const duration = Date.now() - startTime

    if (import.meta.env.DEV) {
      console.log(
        `[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`,
      )
    }

    return response
  },
  async (error: AxiosError) => {
    // 에러 메시지 추출
    const errorMessage = mapErrorToMessage(error)
    const traceId = extractTraceId(error)

    // 개발 환경에서 상세 로그
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: errorMessage,
        traceId,
        data: error.response?.data,
      })
    }

    // 401 Unauthorized - 자동 로그아웃 또는 토큰 갱신
    if (error.response?.status === 401) {
      // 로그인 페이지가 아닌 경우만 처리
      if (!window.location.pathname.includes('/login')) {
        // 토큰 갱신 로직이 있다면 여기서 처리
        // const refreshed = await refreshToken()
        // if (refreshed) return apiClient.request(error.config!)

        // 로그아웃 처리 (AuthProvider에서 처리하도록 이벤트 발생)
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      }
    }

    // 에러 객체 강화
    const enhancedError = {
      ...error,
      userMessage: errorMessage,
      traceId,
    }

    return Promise.reject(enhancedError)
  },
)

/**
 * API 클라이언트 유틸리티 함수
 */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res) => res.data),
}

export default apiClient
