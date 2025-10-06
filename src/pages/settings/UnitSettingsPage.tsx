import { Settings, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared/components/ui'
import { useUnitSettings } from '@/shared/hooks/useUnitSettings'
import { useToast } from '@/shared/hooks/useToast'
import type {
  CurrencyUnit,
  DistanceUnit,
  WeightUnit,
  VolumeUnit,
  TemperatureUnit,
} from '@/shared/types/units'

/**
 * 단위 설정 페이지
 * 화폐, 거리, 무게, 부피, 온도 단위 설정
 */
export default function UnitSettingsPage() {
  const { t } = useTranslation(['common'])
  const { units, updateUnit, resetToDefaults } = useUnitSettings()
  const { toast } = useToast()

  const handleSave = () => {
    toast.success(t('common:units.saved'))
  }

  const handleReset = () => {
    resetToDefaults()
    toast.success(t('common:units.saved'))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('common:units.title')}</h1>
            <p className="text-muted-foreground">{t('common:units.description')}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleReset}>
          {t('common:units.resetToDefaults')}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 화폐 단위 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('common:units.currency')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(['KRW', 'USD', 'CNY', 'JPY', 'EUR', 'GBP'] as CurrencyUnit[]).map((currency) => (
              <button
                key={currency}
                onClick={() => {
                  updateUnit('currency', currency)
                  handleSave()
                }}
                className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                  units.currency === currency
                    ? 'border-primary bg-primary/10'
                    : 'border-input'
                }`}
              >
                <span className="text-sm font-medium">
                  {t(`common:units.currencies.${currency}`)}
                </span>
                {units.currency === currency && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* 거리 단위 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('common:units.distance')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(['M', 'CM', 'MM', 'KM', 'FT', 'IN', 'YD', 'MILE'] as DistanceUnit[]).map(
              (distance) => (
                <button
                  key={distance}
                  onClick={() => {
                    updateUnit('distance', distance)
                    handleSave()
                  }}
                  className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                    units.distance === distance
                      ? 'border-primary bg-primary/10'
                      : 'border-input'
                  }`}
                >
                  <span className="text-sm font-medium">
                    {t(`common:units.distances.${distance}`)}
                  </span>
                  {units.distance === distance && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </button>
              ),
            )}
          </CardContent>
        </Card>

        {/* 무게 단위 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('common:units.weight')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(['KG', 'G', 'MG', 'T', 'LB', 'OZ'] as WeightUnit[]).map((weight) => (
              <button
                key={weight}
                onClick={() => {
                  updateUnit('weight', weight)
                  handleSave()
                }}
                className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                  units.weight === weight ? 'border-primary bg-primary/10' : 'border-input'
                }`}
              >
                <span className="text-sm font-medium">
                  {t(`common:units.weights.${weight}`)}
                </span>
                {units.weight === weight && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* 부피 단위 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('common:units.volume')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(['L', 'ML', 'M3', 'CM3', 'GAL', 'QT', 'PT', 'FLOZ'] as VolumeUnit[]).map(
              (volume) => (
                <button
                  key={volume}
                  onClick={() => {
                    updateUnit('volume', volume)
                    handleSave()
                  }}
                  className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                    units.volume === volume
                      ? 'border-primary bg-primary/10'
                      : 'border-input'
                  }`}
                >
                  <span className="text-sm font-medium">
                    {t(`common:units.volumes.${volume}`)}
                  </span>
                  {units.volume === volume && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </button>
              ),
            )}
          </CardContent>
        </Card>

        {/* 온도 단위 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('common:units.temperature')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-3">
              {(['C', 'F', 'K'] as TemperatureUnit[]).map((temperature) => (
                <button
                  key={temperature}
                  onClick={() => {
                    updateUnit('temperature', temperature)
                    handleSave()
                  }}
                  className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                    units.temperature === temperature
                      ? 'border-primary bg-primary/10'
                      : 'border-input'
                  }`}
                >
                  <span className="text-sm font-medium">
                    {t(`common:units.temperatures.${temperature}`)}
                  </span>
                  {units.temperature === temperature && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
