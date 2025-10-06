import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Package,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Trash2,
  Info,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import { useBomTreeQuery, useBomStatsQuery } from '@/features/items/api/bom.api'
import { AddBomComponentModal } from './AddBomComponentModal'
import { useAuth } from '@/shared/hooks/useAuth'
import type { BomTreeNode } from '@/shared/types/bom'
import type { ItemType } from '@/shared/types/item'

interface BomTreeProps {
  itemId: string
}

/**
 * 상품별 BOM 트리 컴포넌트 (실제 데이터 기반)
 */
export function BomTree({ itemId }: BomTreeProps) {
  const { t } = useTranslation(['modules'])
  const { user } = useAuth()
  const { data: bomData, isLoading, error } = useBomTreeQuery(itemId)
  const { data: stats } = useBomStatsQuery(itemId)

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // 빌드 ID 확인 (캐시 문제 디버깅용)
  console.log('🔨 BomTree BUILD:', import.meta.env.VITE_BUILD_ID)

  // 권한 체크: BOM 구성품 추가 가능 여부
  const canAddComponent = user?.role && ['admin', 'manager', 'staff'].includes(user.role)

  // 구성품 추가 버튼 (단일 컴포넌트)
  const AddComponentButton = ({ size = 'default' }: { size?: 'default' | 'sm' }) => (
    <Button
      variant="outline"
      size={size}
      onClick={() => setIsAddModalOpen(true)}
      disabled={!canAddComponent}
      title={!canAddComponent ? '구성품 추가 권한이 없습니다' : ''}
    >
      <PlusCircle className="mr-2 h-4 w-4" />
      {t('modules:items.bom.addComponent')}
    </Button>
  )

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const getTypeIcon = (type: ItemType) => {
    const iconClass = 'h-4 w-4'
    switch (type) {
      case 'FG':
        return <Package className={cn(iconClass, 'text-blue-600')} />
      case 'SF':
        return <Package className={cn(iconClass, 'text-purple-600')} />
      case 'MOD':
        return <Package className={cn(iconClass, 'text-green-600')} />
      case 'PT':
        return <Package className={cn(iconClass, 'text-orange-600')} />
      case 'RM':
        return <Package className={cn(iconClass, 'text-gray-600')} />
      default:
        return <Package className={iconClass} />
    }
  }

  const getTypeLabel = (type: ItemType) => {
    return t(`modules:items.bom.typeLabels.${type}`)
  }

  const BomNode = ({ node, level = 0 }: { node: BomTreeNode; level?: number }) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)

    return (
      <div className="space-y-1">
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent',
            level > 0 && 'ml-6',
          )}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* 펼침/접힘 버튼 */}
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.id)}
              className="flex-shrink-0 rounded p-1 hover:bg-accent"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* 아이템 아이콘 */}
          {getTypeIcon(node.type)}

          {/* 아이템 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{node.name}</span>
              <Badge variant="outline" className="text-xs">
                {getTypeLabel(node.type)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{node.sku}</span>
              <span>•</span>
              <span>
                {t('modules:items.bom.quantity')}: {node.quantity} {node.unit}
              </span>
              {node.unit_cost && (
                <>
                  <span>•</span>
                  <span>
                    단가: ₩{node.unit_cost.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 총 비용 */}
          {node.total_cost && (
            <div className="text-right">
              <div className="text-sm font-medium">₩{node.total_cost.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">총 비용</div>
            </div>
          )}
        </div>

        {/* 자식 노드 */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children!.map((child) => (
              <BomNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            {t('common:common.loading')}...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{t('common:common.error')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!bomData?.has_bom || !bomData.tree.children || bomData.tree.children.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <Info className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">{t('modules:items.bom.noBom')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('modules:items.bom.noBomDescription')}
              </p>
            </div>
            <AddComponentButton />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('modules:items.bom.subtitle')}</CardTitle>
          <AddComponentButton size="sm" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <BomNode node={bomData.tree} level={0} />
          </div>

          {/* 통계 정보 */}
          {stats && (
            <div className="mt-6 pt-4 border-t flex justify-end gap-6 text-sm text-muted-foreground">
              <span>
                {t('modules:items.bom.totalComponents')}: {stats.total_components}개
              </span>
              <span>
                {t('modules:items.bom.hierarchyDepth')}: {stats.max_depth}개
              </span>
              {stats.total_cost > 0 && (
                <span className="font-medium text-foreground">
                  총 원가: ₩{stats.total_cost.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 구성품 추가 모달 */}
      <AddBomComponentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        parentItemId={itemId}
        parentItemName={bomData.tree.name}
      />
    </div>
  )
}
