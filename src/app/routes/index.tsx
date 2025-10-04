import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/shared/components/auth/ProtectedRoute'
import { MainLayout } from '@/app/layouts/MainLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'

// Pages (lazy loading)
import { lazy, Suspense } from 'react'

// Auth Pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))

// Dashboard
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))

// Items
const ItemsPage = lazy(() => import('@/pages/items/ItemsPage'))
const ItemsPageReal = lazy(() => import('@/pages/items/ItemsPageReal'))
const ItemDetailPage = lazy(() => import('@/pages/items/ItemDetailPage'))

// Stocks
const StocksPage = lazy(() => import('@/pages/stocks/StocksPage'))
const StocksPageReal = lazy(() => import('@/pages/stocks/StocksPageReal'))

// Inbounds
const InboundsPage = lazy(() => import('@/pages/inbounds/InboundsPage'))
const InboundsPageReal = lazy(() => import('@/pages/inbounds/InboundsPageReal'))
const InboundDetailPage = lazy(() => import('@/pages/inbounds/InboundDetailPage'))

// Outbounds
const OutboundsPage = lazy(() => import('@/pages/outbounds/OutboundsPage'))
const OutboundDetailPage = lazy(() => import('@/pages/outbounds/OutboundDetailPage'))
const OutboundCreatePage = lazy(() => import('@/pages/outbounds/OutboundCreatePage'))

// Error Pages
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'))
const UnauthorizedPage = lazy(() => import('@/pages/errors/UnauthorizedPage'))

/**
 * 로딩 폴백 컴포넌트
 */
// eslint-disable-next-line react-refresh/only-export-components
function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

/**
 * 라우터 설정
 *
 * 구조:
 * - / : 루트 (대시보드로 리다이렉트)
 * - /login : 로그인
 * - /dashboard : 대시보드 (인증 필요)
 * - /items : 재고 목록 (ITEMS_VIEW 권한)
 * - /stocks : 재고 현황 (STOCKS_VIEW 권한)
 * - /inbounds : 입고 목록 (INBOUNDS_VIEW 권한)
 * - /outbounds : 출고 목록 (OUTBOUNDS_VIEW 권한)
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AuthLayout>
          <LoginPage />
        </AuthLayout>
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <DashboardPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/items',
    element: (
      <ProtectedRoute requiredPermission="ITEMS_VIEW">
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <ItemsPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/items-real',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <ItemsPageReal />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/items/:id',
    element: (
      <ProtectedRoute requiredPermission="ITEMS_VIEW">
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <ItemDetailPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/stocks',
    element: (
      <ProtectedRoute requiredPermission="STOCKS_VIEW">
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <StocksPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/stocks-real',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <StocksPageReal />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/inbounds',
    element: (
      <ProtectedRoute requiredPermission="INBOUNDS_VIEW">
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <InboundsPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/inbounds-real',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <InboundsPageReal />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/inbounds/:id',
    element: (
      <ProtectedRoute requiredPermission="INBOUNDS_VIEW">
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <InboundDetailPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/outbounds',
    element: (
      <ProtectedRoute requiredPermission="OUTBOUNDS_VIEW">
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <OutboundsPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/outbounds/create',
    element: (
      <ProtectedRoute requiredPermission="OUTBOUNDS_CREATE">
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <OutboundCreatePage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/outbounds/:id',
    element: (
      <ProtectedRoute requiredPermission="OUTBOUNDS_VIEW">
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <OutboundDetailPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/unauthorized',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <UnauthorizedPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
])
