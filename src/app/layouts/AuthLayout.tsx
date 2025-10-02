import { ReactNode } from 'react'
import { useLanguage } from '@/shared/hooks/useLanguage'
import { Button } from '@/shared/components/ui'

interface AuthLayoutProps {
  children: ReactNode
}

/**
 * 인증 레이아웃
 *
 * 로그인/회원가입 페이지를 위한 레이아웃으로:
 * - 중앙 정렬 카드 형태
 * - 언어 선택기 (우측 상단)
 * - 브랜드 로고 및 설명
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const { currentLanguage, changeLanguage, languages } = useLanguage()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      {/* 언어 선택기 (우측 상단) */}
      <div className="absolute right-4 top-4 flex gap-1">
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

      {/* 메인 컨텐츠 (로그인 폼 등) */}
      <div className="w-full max-w-md">
        {/* 브랜드 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">ERP System</h1>
          <p className="text-muted-foreground">Enterprise Resource Planning</p>
        </div>

        {/* 자식 컴포넌트 (로그인 폼, 회원가입 폼 등) */}
        {children}

        {/* 푸터 */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>v0.1.0 - React 18 + TypeScript + Vite</p>
        </div>
      </div>
    </div>
  )
}
