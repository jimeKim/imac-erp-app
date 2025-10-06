import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Package, Settings2 } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'

/**
 * 상품 설정 페이지
 */
export default function ItemSettingsPage() {
  const { t } = useTranslation(['modules', 'common'])

  const itemSettings = [
    {
      id: 'types',
      path: '/settings/items/types',
      icon: <Settings2 className="h-5 w-5" />,
    },
    {
      id: 'categories',
      path: '/settings/items/categories',
      icon: <Package className="h-5 w-5" />,
    },
  ]

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
          <div>
            <h1 className="text-2xl font-bold">
              {t('modules:settings.categories.items.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('modules:settings.categories.items.description')}
            </p>
          </div>
        </div>
      </div>

      {/* 설정 항목 */}
      <div className="grid gap-4 md:grid-cols-2">
        {itemSettings.map((setting) => (
          <Link key={setting.id} to={setting.path}>
            <Card className="transition-all hover:shadow-md hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {setting.icon}
                  <CardTitle className="text-base">
                    {t(`modules:settings.categories.items.${setting.id}`)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t(`modules:settings.categories.items.${setting.id}Description`)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
