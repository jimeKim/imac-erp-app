import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      gcTime: 1000 * 60 * 10, // 10분 (구 cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

interface QueryProviderProps {
  children: ReactNode
}

/**
 * TanStack Query 프로바이더
 *
 * 전역 Query Client 설정:
 * - staleTime: 데이터가 신선한 상태로 유지되는 시간 (5분)
 * - gcTime: 가비지 컬렉션 전 캐시 유지 시간 (10분)
 * - retry: 실패 시 재시도 횟수
 * - refetchOnWindowFocus: 창 포커스 시 자동 재조회 비활성화
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} position="bottom" />}
    </QueryClientProvider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { queryClient }
