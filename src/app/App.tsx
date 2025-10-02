import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/routes'
import { QueryProvider } from '@/app/providers/QueryProvider'

/**
 * App 컴포넌트
 *
 * 전역 프로바이더와 라우터를 설정합니다.
 * - QueryProvider: TanStack Query (API 상태 관리)
 * - AuthProvider: 인증 상태 관리 (main.tsx에서 래핑)
 * - I18nextProvider: 다국어 지원 (main.tsx에서 래핑)
 * - RouterProvider: React Router
 */
export function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  )
}
