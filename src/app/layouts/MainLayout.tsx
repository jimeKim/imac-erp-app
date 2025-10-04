import { ReactNode, useState } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { useLanguage } from '@/shared/hooks/useLanguage'
import { Button } from '@/shared/components/ui'
import {
  LogOut,
  User,
  Package,
  TruckIcon,
  Truck,
  Search,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  List,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

interface MainLayoutProps {
  children: ReactNode
}

/**
 * 메인 레이아웃
 *
 * 인증된 사용자를 위한 레이아웃으로:
 * - 상단 네비게이션 바 (로고, 메뉴, 사용자 정보, 로그아웃)
 * - 메인 콘텐츠 영역
 * - 하단 푸터
 */
export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth()
  const { currentLanguage, changeLanguage, languages } = useLanguage()
  const location = useLocation()
  const [isItemsExpanded, setIsItemsExpanded] = useState(true)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const isActive = (path: string) => location.pathname === path
  const isItemsActive = isActive('/items-real') || isActive('/items/create')

  return (
    <div className="flex min-h-screen flex-col">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* 좌측: 로고 */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <h1 className="text-xl font-bold">ERP System</h1>
          </Link>

          {/* 우측: 언어 선택 + 사용자 메뉴 */}
          <div className="flex items-center gap-2">
            {/* 언어 선택 */}
            <div className="flex gap-1">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={currentLanguage === lang.code ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => changeLanguage(lang.code)}
                  className="gap-1"
                >
                  <span>{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.label}</span>
                </Button>
              ))}
            </div>

            {/* 사용자 정보 */}
            {user && (
              <>
                <div className="ml-2 hidden items-center gap-2 border-l pl-4 md:flex">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{user.fullName || user.email}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {user.role}
                  </span>
                </div>

                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 (좌측 사이드바 + 콘텐츠) */}
      <div className="flex flex-1">
        {/* 좌측 사이드바 */}
        <aside className="w-64 border-r bg-white">
          <nav className="space-y-1 p-4">
            {/* 상품 관리 (확장 가능) */}
            <div>
              <button
                onClick={() => setIsItemsExpanded(!isItemsExpanded)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isItemsActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  상품 관리
                </div>
                {isItemsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* 하위 메뉴 */}
              {isItemsExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                  <Link
                    to="/items/create"
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive('/items/create')
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <PlusCircle className="h-4 w-4" />
                    상품 등록
                  </Link>
                  <Link
                    to="/items-real"
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive('/items-real')
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    상품 조회
                  </Link>
                </div>
              )}
            </div>

            {/* 입고 관리 */}
            <Link
              to="/inbounds-real"
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/inbounds-real')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Truck className="h-4 w-4" />
              입고 관리
            </Link>

            {/* 출고 관리 */}
            <Link
              to="/outbounds"
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/outbounds')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <TruckIcon className="h-4 w-4" />
              출고 관리
            </Link>

            {/* 조회 */}
            <Link
              to="/stocks-real"
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/stocks-real')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Search className="h-4 w-4" />
              조회 (재고)
            </Link>
          </nav>
        </aside>

        {/* 메인 영역 */}
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="container mx-auto p-4 md:p-8">{children}</div>
        </main>
      </div>

      {/* 하단 푸터 */}
      <footer className="border-t bg-background py-4">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          ERP System v0.1.0 - React 18 + TypeScript + Vite
        </div>
      </footer>
    </div>
  )
}
