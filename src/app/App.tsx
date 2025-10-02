import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui'
import { useLanguage } from '@/shared/hooks/useLanguage'
import { Globe } from 'lucide-react'

function App() {
  const { t } = useTranslation()
  const { currentLanguage, changeLanguage, languages } = useLanguage()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">{t('app.name')}</CardTitle>
              <CardDescription className="mt-2">{t('app.title')}</CardDescription>
            </div>
            <div className="flex gap-2">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={currentLanguage === lang.code ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => changeLanguage(lang.code)}
                  className="gap-1.5"
                >
                  <span className="text-base">{lang.flag}</span>
                  <Globe className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{lang.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg bg-blue-50 p-6">
            <h3 className="mb-3 text-lg font-semibold text-blue-900">
              Phase 0: 프로젝트 세팅 완료 ✨
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Git 저장소 초기화</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>폴더 구조 생성</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>TypeScript Strict</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Vite + React 부트스트랩</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Tailwind + shadcn/ui</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>i18next (한/중/영)</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">{t('common.common', { defaultValue: '공통 기능' })}</h4>
            <div className="flex flex-wrap gap-2">
              <Button>{t('common.save')}</Button>
              <Button variant="outline">{t('common.cancel')}</Button>
              <Button variant="destructive">{t('common.delete')}</Button>
              <Button variant="secondary">{t('common.edit')}</Button>
              <Button variant="ghost">{t('common.search')}</Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">{t('common.common', { defaultValue: '모듈 메뉴' })}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Button variant="outline" className="justify-start">
                📦 {t('modules:items.title')}
              </Button>
              <Button variant="outline" className="justify-start">
                📊 {t('modules:stocks.title')}
              </Button>
              <Button variant="outline" className="justify-start">
                📥 {t('modules:inbounds.title')}
              </Button>
              <Button variant="outline" className="justify-start">
                📤 {t('modules:outbounds.title')}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold">
              {currentLanguage === 'ko' && '다음 단계: Todo 8-10'}
              {currentLanguage === 'zh' && '下一步: Todo 8-10'}
              {currentLanguage === 'en' && 'Next Steps: Todo 8-10'}
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>
                {currentLanguage === 'ko' && 'Axios 클라이언트 & 에러 맵퍼'}
                {currentLanguage === 'zh' && 'Axios 客户端 & 错误映射'}
                {currentLanguage === 'en' && 'Axios Client & Error Mapper'}
              </li>
              <li>
                {currentLanguage === 'ko' && '인증 컨텍스트 (AuthProvider)'}
                {currentLanguage === 'zh' && '认证上下文 (AuthProvider)'}
                {currentLanguage === 'en' && 'Auth Context (AuthProvider)'}
              </li>
              <li>
                {currentLanguage === 'ko' && '테스트 환경 구축'}
                {currentLanguage === 'zh' && '测试环境搭建'}
                {currentLanguage === 'en' && 'Testing Environment Setup'}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
