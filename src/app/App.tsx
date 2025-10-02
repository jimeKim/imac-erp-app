import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui'
import { useLanguage } from '@/shared/hooks/useLanguage'
import { Globe, Shield, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { mapErrorToMessage } from '@/shared/services/errorMapper'
import { ERROR_CODES } from '@/shared/constants/errorCodes'
import { PERMISSIONS, ROLE_LABELS } from '@/shared/constants/roles'
import { useState } from 'react'

function App() {
  const { t } = useTranslation()
  const { currentLanguage, changeLanguage, languages } = useLanguage()
  const [selectedError, setSelectedError] = useState<string | null>(null)

  // 에러 메시지 데모
  const demoErrors = [
    ERROR_CODES.AUTH_INVALID_CREDENTIALS,
    ERROR_CODES.VALIDATION_REQUIRED_FIELD,
    ERROR_CODES.RESOURCE_NOT_FOUND,
    ERROR_CODES.BUSINESS_INSUFFICIENT_STOCK,
    ERROR_CODES.SYSTEM_INTERNAL_ERROR,
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        {/* 헤더 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">{t('app.name')}</CardTitle>
                <CardDescription className="mt-2 text-base">
                  {t('app.title')} - Phase 0 완료 (50%)
                </CardDescription>
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
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 왼쪽: 진행 상황 */}
          <div className="space-y-6">
            {/* 완료된 Todo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  완료된 작업 (10/20)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>1-7: 프로젝트 기초 & UI/UX</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>8: Axios 클라이언트 & 에러 맵퍼</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>9: 인증 시스템 (AuthProvider, RBAC)</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>10: ESLint + Prettier + Husky</span>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="mb-2 flex justify-between text-xs text-gray-600">
                    <span>Progress</span>
                    <span>50%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full w-1/2 bg-gradient-to-r from-blue-500 to-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 기술 스택 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  기술 스택
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <div className="font-semibold text-blue-900">Frontend</div>
                    <div className="mt-1 space-y-0.5 text-xs text-blue-700">
                      <div>React 18 + TypeScript</div>
                      <div>Vite + Tailwind CSS</div>
                      <div>shadcn/ui</div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3">
                    <div className="font-semibold text-green-900">State</div>
                    <div className="mt-1 space-y-0.5 text-xs text-green-700">
                      <div>TanStack Query</div>
                      <div>Zustand</div>
                      <div>React Hook Form</div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-3">
                    <div className="font-semibold text-purple-900">API</div>
                    <div className="mt-1 space-y-0.5 text-xs text-purple-700">
                      <div>Axios (인터셉터)</div>
                      <div>JWT Auth (Cookie)</div>
                      <div>에러 매핑</div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-3">
                    <div className="font-semibold text-orange-900">Quality</div>
                    <div className="mt-1 space-y-0.5 text-xs text-orange-700">
                      <div>ESLint + Prettier</div>
                      <div>Husky Hooks</div>
                      <div>TypeScript Strict</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RBAC 시스템 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  RBAC 권한 시스템
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {(['readonly', 'staff', 'manager'] as const).map((role) => (
                    <div key={role} className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-2 font-semibold text-gray-900">
                        {ROLE_LABELS[role][currentLanguage]}
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div>
                          Items:{' '}
                          {PERMISSIONS.ITEMS_VIEW.includes(role) ? (
                            <span className="text-green-600">View</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}{' '}
                          {PERMISSIONS.ITEMS_CREATE.includes(role) ? (
                            <span className="text-blue-600">Create</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                        <div>
                          Outbounds:{' '}
                          {PERMISSIONS.OUTBOUNDS_CREATE.includes(role) ? (
                            <span className="text-blue-600">Create</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}{' '}
                          {PERMISSIONS.OUTBOUNDS_APPROVE.includes(role) ? (
                            <span className="text-purple-600">Approve</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 데모 */}
          <div className="space-y-6">
            {/* 에러 메시지 데모 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  에러 메시지 다국어 지원
                </CardTitle>
                <CardDescription>클릭하여 각 언어로 확인</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {demoErrors.map((errorCode) => (
                  <button
                    key={errorCode}
                    onClick={() => setSelectedError(errorCode)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedError === errorCode
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <div className="mb-1 font-mono text-xs text-gray-500">{errorCode}</div>
                    <div className="text-sm font-medium text-gray-900">
                      {mapErrorToMessage(new Error(errorCode))}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* UI 컴포넌트 */}
            <Card>
              <CardHeader>
                <CardTitle>UI 컴포넌트 데모</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 text-sm font-semibold">버튼 Variants</div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">Default</Button>
                    <Button size="sm" variant="secondary">
                      Secondary
                    </Button>
                    <Button size="sm" variant="outline">
                      Outline
                    </Button>
                    <Button size="sm" variant="ghost">
                      Ghost
                    </Button>
                    <Button size="sm" variant="destructive">
                      Destructive
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-sm font-semibold">
                    {t('common.common', { defaultValue: '공통 액션' })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline">
                      {t('common.save')}
                    </Button>
                    <Button size="sm" variant="outline">
                      {t('common.cancel')}
                    </Button>
                    <Button size="sm" variant="outline">
                      {t('common.edit')}
                    </Button>
                    <Button size="sm" variant="outline">
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-sm font-semibold">모듈 버튼</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="justify-start" size="sm">
                      📦 {t('modules:items.title')}
                    </Button>
                    <Button variant="outline" className="justify-start" size="sm">
                      📊 {t('modules:stocks.title')}
                    </Button>
                    <Button variant="outline" className="justify-start" size="sm">
                      📥 {t('modules:inbounds.title')}
                    </Button>
                    <Button variant="outline" className="justify-start" size="sm">
                      📤 {t('modules:outbounds.title')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 다음 단계 */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">다음 단계: Todo 11-15</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>11: Vitest + Playwright 테스트 환경</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>12: QueryProvider, MainLayout, AuthLayout</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>13: 라우팅 & RBAC 가드</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>14: Toast/Empty/Error 컴포넌트</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>15: .env & CORS 설정 확정</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 푸터 */}
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90">ERP System v0.1.0</div>
                <div className="mt-1 text-xs opacity-75">
                  React 18 + TypeScript + Vite + Tailwind CSS
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">50%</div>
                <div className="text-xs opacity-75">Phase 0 Complete</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App
