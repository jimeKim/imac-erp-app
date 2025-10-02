import { ReactNode } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { useLanguage } from '@/shared/hooks/useLanguage'
import { Button } from '@/shared/components/ui'
import { Menu, LogOut, User } from 'lucide-react'

interface MainLayoutProps {
  children: ReactNode
}

/**
 * 메인 레이아웃
 *
 * 인증된 사용자를 위한 레이아웃으로:
 * - 상단 네비게이션 바 (로고, 사용자 정보, 로그아웃)
 * - 사이드바 (모바일에서는 토글)
 * - 메인 콘텐츠 영역
 * - 하단 푸터
 */
export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth()
  const { currentLanguage, changeLanguage, languages } = useLanguage()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* 좌측: 로고 + 메뉴 버튼 */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">ERP System</h1>
            </div>
          </div>

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
                    {user.roles[0]}
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

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1">
        {/* 사이드바 (향후 구현) */}
        {/* <aside className="hidden w-64 border-r bg-background md:block">
          <nav className="space-y-2 p-4">
            <Button variant="ghost" className="w-full justify-start">
              Dashboard
            </Button>
          </nav>
        </aside> */}

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
