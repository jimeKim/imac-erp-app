import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui'
import { Package, Truck, TruckIcon, BarChart3 } from 'lucide-react'

/**
 * 대시보드 페이지
 *
 * 주요 지표 및 최근 활동 표시
 */
export default function DashboardPage() {
  const { t } = useTranslation()

  const stats = [
    {
      title: t('modules.items.title'),
      value: '1,234',
      description: 'Total items in inventory',
      icon: Package,
      color: 'text-blue-500',
    },
    {
      title: t('modules.stocks.title'),
      value: '₩45.6M',
      description: 'Total stock value',
      icon: BarChart3,
      color: 'text-green-500',
    },
    {
      title: t('modules.inbounds.title'),
      value: '28',
      description: 'Pending inbounds',
      icon: Truck,
      color: 'text-purple-500',
    },
    {
      title: t('modules.outbounds.title'),
      value: '42',
      description: 'Pending outbounds',
      icon: TruckIcon,
      color: 'text-orange-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('common.dashboard')}</h1>
        <p className="text-muted-foreground">Overview of your business operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription className="text-xs">{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed will be implemented in Phase 1
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Quick action shortcuts will be implemented in Phase 1
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
