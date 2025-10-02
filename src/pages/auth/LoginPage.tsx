import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui'
import { useTranslation } from 'react-i18next'

/**
 * 로그인 페이지
 *
 * TODO:
 * - React Hook Form + Zod 검증 추가
 * - 에러 토스트 표시
 */
export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login({ email, password_hash: password })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('common.login')}</CardTitle>
        <CardDescription>Enter your credentials to access the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Loading...' : t('common.login')}
          </Button>
        </form>

        {/* 개발 환경에서 테스트용 버튼 */}
        {import.meta.env.DEV && (
          <div className="mt-4 space-y-2 border-t pt-4">
            <p className="text-xs text-muted-foreground">Development Only - Mock Login</p>
            <div className="grid gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('readonly@example.com')
                  setPassword('password')
                }}
              >
                Fill Readonly User
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('staff@example.com')
                  setPassword('password')
                }}
              >
                Fill Staff User
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('manager@example.com')
                  setPassword('password')
                }}
              >
                Fill Manager User
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
