/**
 * ClassificationSettingsPage
 * 상품 분류 체계 설정 페이지 (읽기 전용)
 */
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Info, CheckCircle2, AlertCircle, ExternalLink, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/shared/components/ui'
import { useClassificationScheme } from '@/shared/hooks/useClassificationScheme'
import { cn } from '@/shared/utils/cn'

export default function ClassificationSettingsPage() {
  const { i18n } = useTranslation(['common', 'modules'])
  const { scheme } = useClassificationScheme()
  const locale = i18n.language || 'ko'

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold">상품 분류 체계</h1>
        <p className="mt-2 text-muted-foreground">
          현재 적용 중인 분류 체계와 각 라벨의 행동 규칙을 확인할 수 있습니다.
        </p>
      </div>

      {/* 현재 활성 스킴 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            현재 활성 스킴
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-semibold">{scheme.name[locale] || scheme.name.ko}</h3>
              <Badge variant="outline" className="text-xs">
                {scheme.id}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {scheme.description[locale] || scheme.description.ko}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4" />
              적용 범위
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• 상품 등록 시 필수 항목 제어 (BOM/공정)</li>
              <li>• 출고 시 구성품 차감 로직 판단</li>
              <li>• 생산지시 및 입고 플로우 결정</li>
              <li>• API 레벨 검증 (422 에러 코드 반환)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 라벨 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>분류 라벨 규칙</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">아이콘</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">라벨명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">설명</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">행동 플래그</th>
                </tr>
              </thead>
              <tbody>
                {scheme.labels.map((label) => (
                  <tr key={label.code} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 text-2xl">{label.icon}</td>
                    <td className="px-4 py-3 font-medium">{label.name[locale] || label.name.ko}</td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-muted px-2 py-1 text-xs">{label.code}</code>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {label.description[locale] || label.description.ko}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-center gap-1">
                        {label.behavior.requiresBOM && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            BOM 필수
                          </Badge>
                        )}
                        {label.behavior.requiresRouting && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            공정 필수
                          </Badge>
                        )}
                        {label.behavior.isProduction && (
                          <Badge variant="outline" className="text-xs">
                            생산
                          </Badge>
                        )}
                        {label.behavior.isAssembly && (
                          <Badge variant="outline" className="text-xs">
                            조립
                          </Badge>
                        )}
                        {label.behavior.saleAllowed && (
                          <Badge variant="outline" className="text-xs text-green-700">
                            판매가능
                          </Badge>
                        )}
                        {!label.behavior.requiresBOM &&
                          !label.behavior.requiresRouting &&
                          !label.behavior.isProduction &&
                          !label.behavior.isAssembly && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              제약 없음
                            </Badge>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <Link to="/items/create">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                상품 등록 페이지로 이동
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* FAQ/도움말 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            자주 묻는 질문 (FAQ)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {/* Q1 */}
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                Q. 왜 생산(PRODUCTION)은 BOM과 공정이 모두 필요한가요?
              </h4>
              <p className="text-sm text-muted-foreground">
                <strong>A.</strong> 생산 제품은 원자재와 반제품을 조합하여 새로운 완제품을 만드는
                과정입니다. BOM(자재명세서)은 어떤 구성품이 필요한지, 공정(Routing)은 어떤 작업
                단계를 거쳐야 하는지를 정의합니다. 이를 통해 생산 계획, 원가 계산, 작업 지시가
                가능해집니다.
              </p>
            </div>

            {/* Q2 */}
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                Q. 조립(ASSEMBLY)과 생산(PRODUCTION)의 차이는 무엇인가요?
              </h4>
              <p className="text-sm text-muted-foreground">
                <strong>A.</strong> 조립은 기존 부품을 결합하여 제품을 만드는 과정(공정 불필요)이고,
                생산은 원자재를 가공하고 변형하는 과정(공정 필요)입니다. 예: 모니터 조립(조립),
                키보드 PCB 제작(생산).
              </p>
            </div>

            {/* Q3 */}
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                Q. 사입(PURCHASE) 상품은 BOM이 없어도 되나요?
              </h4>
              <p className="text-sm text-muted-foreground">
                <strong>A.</strong> 네, 사입 상품은 외부에서 완제품 상태로 구매하는 품목이므로
                BOM이나 공정이 필요하지 않습니다. 단순히 입고, 재고 관리, 출고만 수행합니다.
              </p>
            </div>

            {/* Q4 */}
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                Q. 분류 체계를 나중에 변경할 수 있나요?
              </h4>
              <p className="text-sm text-muted-foreground">
                <strong>A.</strong> Phase 2에서 스킴 교체 마법사를 제공할 예정입니다. 현재는
                simple(단순) 스킴이 고정되어 있으며, extended(확장) 스킴으로의 마이그레이션은 데이터
                정합성 검증과 롤백 전략이 필요합니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 하단 정보 */}
      <div
        className={cn(
          'rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4',
          'dark:bg-blue-950/20',
        )}
      >
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">Phase 1: 읽기 전용 설정</p>
            <p className="mt-1 text-blue-700 dark:text-blue-300">
              현재 버전에서는 분류 체계를 확인만 할 수 있습니다. 스킴 변경 기능은 Phase 2에서 제공될
              예정입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
