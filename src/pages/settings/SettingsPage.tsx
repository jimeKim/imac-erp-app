import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Settings, 
  Package, 
  TruckIcon, 
  Truck, 
  Printer, 
  Users, 
  DollarSign,
  Cog,
  ChevronRight,
  Ruler
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'

interface SettingCategory {
  id: string
  icon: ReactNode
  path: string
  badge?: string
}

/**
 * 설정 메인 페이지
 * 모든 설정 카테고리로의 진입점
 */
export default function SettingsPage() {
  const { t } = useTranslation(['modules', 'common'])

  const settingCategories: SettingCategory[] = [
    {
      id: 'items',
      icon: <Package className="h-8 w-8 text-blue-600" />,
      path: '/settings/items',
    },
    {
      id: 'inbounds',
      icon: <Truck className="h-8 w-8 text-green-600" />,
      path: '/settings/inbounds',
    },
    {
      id: 'outbounds',
      icon: <TruckIcon className="h-8 w-8 text-orange-600" />,
      path: '/settings/outbounds',
    },
    {
      id: 'printers',
      icon: <Printer className="h-8 w-8 text-purple-600" />,
      path: '/settings/printers',
    },
    {
      id: 'permissions',
      icon: <Users className="h-8 w-8 text-red-600" />,
      path: '/settings/permissions',
    },
    {
      id: 'sales',
      icon: <DollarSign className="h-8 w-8 text-teal-600" />,
      path: '/settings/sales',
    },
    {
      id: 'units',
      icon: <Ruler className="h-8 w-8 text-indigo-600" />,
      path: '/settings/units',
    },
    {
      id: 'system',
      icon: <Cog className="h-8 w-8 text-gray-600" />,
      path: '/settings/system',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t('modules:settings.title')}</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('modules:settings.description')}
        </p>
      </div>

      {/* 설정 카테고리 그리드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingCategories.map((category) => (
          <Link
            key={category.id}
            to={category.path}
            className="group"
          >
            <Card className="transition-all hover:shadow-md hover:border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {category.icon}
                    <CardTitle className="text-lg">
                      {t(`modules:settings.categories.${category.id}.title`)}
                    </CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t(`modules:settings.categories.${category.id}.description`)}
                </p>
                {category.badge && (
                  <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {category.badge}
                  </span>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 빠른 링크 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('modules:settings.quickLinks')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/settings/items/types"
              className="rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              {t('modules:settings.categories.items.itemTypes')}
            </Link>
            <Link
              to="/settings/printers/barcode"
              className="rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              {t('modules:settings.categories.printers.barcode')}
            </Link>
            <Link
              to="/settings/permissions/roles"
              className="rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              {t('modules:settings.categories.permissions.roles')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
