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
// const ItemsPage = lazy(() => import('@/pages/items/ItemsPage'))
// const ItemsPageReal = lazy(() => import('@/pages/items/ItemsPageReal'))
const ItemsPageRealGrid = lazy(() => import('@/pages/items/ItemsPageRealGrid'))
const ItemCreatePage = lazy(() => import('@/pages/items/ItemCreatePage'))
const ItemDetailPage = lazy(() => import('@/pages/items/ItemDetailPage'))

// Stocks
const StocksPage = lazy(() => import('@/pages/stocks/StocksPage'))
// const StocksPageReal = lazy(() => import('@/pages/stocks/StocksPageReal'))
const StocksPageGrid = lazy(() => import('@/pages/stocks/StocksPageGrid'))

// Inbounds
const InboundsPage = lazy(() => import('@/pages/inbounds/InboundsPage'))
const InboundsPageReal = lazy(() => import('@/pages/inbounds/InboundsPageReal'))
const InboundDetailPage = lazy(() => import('@/pages/inbounds/InboundDetailPage'))

// Outbounds
const OutboundsPage = lazy(() => import('@/pages/outbounds/OutboundsPage'))
const OutboundDetailPage = lazy(() => import('@/pages/outbounds/OutboundDetailPage'))
const OutboundCreatePage = lazy(() => import('@/pages/outbounds/OutboundCreatePage'))

// Settings
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const ItemSettingsPage = lazy(() => import('@/pages/settings/ItemSettingsPage'))
const ItemTypeSettingsPage = lazy(() => import('@/pages/settings/ItemTypeSettingsPage'))
const InboundSettingsPage = lazy(() => import('@/pages/settings/InboundSettingsPage'))
const OutboundSettingsPage = lazy(() => import('@/pages/settings/OutboundSettingsPage'))
const PrinterSettingsPage = lazy(() => import('@/pages/settings/PrinterSettingsPage'))
const PermissionSettingsPage = lazy(() => import('@/pages/settings/PermissionSettingsPage'))
const SalesSettingsPage = lazy(() => import('@/pages/settings/SalesSettingsPage'))
const UnitSettingsPage = lazy(() => import('@/pages/settings/UnitSettingsPage'))
const SystemSettingsPage = lazy(() => import('@/pages/settings/SystemSettingsPage'))

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
    element: <Navigate to="/items-real" replace />,
  },
  {
    path: '/items-real',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <ItemsPageRealGrid />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/items/create',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <ItemCreatePage />
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
    element: <Navigate to="/stocks-grid" replace />,
  },
  {
    path: '/stocks-grid',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <StocksPageGrid />
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
  // Settings Routes
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/items',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <ItemSettingsPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/items/types',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <ItemTypeSettingsPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  // Redirect old URL to new URL (backward compatibility)
  {
    path: '/settings/item-types',
    element: <Navigate to="/settings/items/types" replace />,
  },
  {
    path: '/settings/inbounds',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <InboundSettingsPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/outbounds',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <OutboundSettingsPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/printers',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <PrinterSettingsPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/permissions',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <PermissionSettingsPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/sales',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <SalesSettingsPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/units',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <UnitSettingsPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/system',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <SystemSettingsPage />
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
