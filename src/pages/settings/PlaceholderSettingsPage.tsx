import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Construction } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'

interface PlaceholderSettingsPageProps {
  categoryKey: string
  icon: ReactNode
}

/**
 * 설정 페이지 Placeholder
 * 향후 구현될 설정 페이지를 위한 템플릿
 */
export default function PlaceholderSettingsPage({ 
  categoryKey, 
  icon 
}: PlaceholderSettingsPageProps) {
  const { t } = useTranslation(['modules', 'common'])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/settings">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h1 className="text-2xl font-bold">
                {t(`modules:settings.categories.${categoryKey}.title`)}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t(`modules:settings.categories.${categoryKey}.description`)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-yellow-600" />
            {t('modules:settings.comingSoon')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('modules:settings.comingSoonDescription', {
              category: t(`modules:settings.categories.${categoryKey}.title`),
            })}
          </p>
          <div className="mt-4">
            <Link to="/settings">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common:back')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 예정된 기능 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('modules:settings.plannedFeatures')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>
                  {t(`modules:settings.categories.${categoryKey}.feature${i}`, {
                    defaultValue: `기능 ${i}`,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
