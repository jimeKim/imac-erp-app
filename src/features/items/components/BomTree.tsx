import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Package,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Info,
  AlertCircle,
  Edit2,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import {
  useBomTreeQuery,
  useBomStatsQuery,
  useDeleteBomComponent,
} from '@/features/items/api/bom.api'
import { AddBomComponentModal } from './AddBomComponentModal'
import { EditBomComponentModal } from './EditBomComponentModal'
import { useAuth } from '@/shared/hooks/useAuth'
import { useToast } from '@/shared/hooks/useToast'
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
  const { toast } = useToast()
  const { data: bomData, isLoading, error } = useBomTreeQuery(itemId)
  const { data: stats } = useBomStatsQuery(itemId)
  const deleteBomComponent = useDeleteBomComponent()

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [editComponent, setEditComponent] = useState<{
    id: string
    name: string
    quantity: number
    unit: string
  } | null>(null)

  // 빌드 ID 확인 (캐시 문제 디버깅용)
  console.log('🔨 BomTree BUILD:', import.meta.env.VITE_BUILD_ID)

  // 권한 체크: BOM 구성품 추가/수정/삭제 가능 여부
  const canModifyComponent = user?.role && ['admin', 'manager', 'staff'].includes(user.role)

  // 구성품 삭제 핸들러
  const handleDeleteComponent = async (componentId: string, componentName: string) => {
    try {
      await deleteBomComponent.mutateAsync({
        id: componentId,
        parentItemId: itemId,
      })
      toast.success('구성품 삭제 완료', `"${componentName}" 구성품이 삭제되었습니다.`)
      setDeleteConfirm(null)
    } catch (_error) {
      toast.error('삭제 실패', '구성품 삭제에 실패했습니다.')
    }
  }

  // 구성품 추가 버튼 (단일 컴포넌트)
  const AddComponentButton = ({ size = 'default' }: { size?: 'default' | 'sm' }) => (
    <Button
      variant="outline"
      size={size}
      onClick={() => setIsAddModalOpen(true)}
      disabled={!canModifyComponent}
      title={!canModifyComponent ? '구성품 추가 권한이 없습니다' : ''}
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
    const isRootNode = level === 0

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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{node.name}</span>
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
                  <span>단가: ₩{node.unit_cost.toLocaleString()}</span>
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

          {/* 수정/삭제 버튼 (루트 노드 제외) */}
          {!isRootNode && canModifyComponent && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditComponent({
                    id: node.id,
                    name: node.name,
                    quantity: node.quantity,
                    unit: node.unit,
                  })
                }}
                title="구성품 수정"
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirm({ id: node.id, name: node.name })}
                title="구성품 삭제"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
          <div className="text-center text-muted-foreground">{t('common:common.loading')}...</div>
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
          <div className="space-y-4 text-center">
            <Info className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">{t('modules:items.bom.noBom')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
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
            <div className="mt-6 flex justify-end gap-6 border-t pt-4 text-sm text-muted-foreground">
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

      {/* 삭제 확인 다이얼로그 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                구성품 삭제
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                <span className="font-semibold">{deleteConfirm.name}</span> 구성품을
                삭제하시겠습니까?
              </p>
              <p className="mb-6 text-sm text-muted-foreground">
                이 작업은 되돌릴 수 없습니다. 하위 구성품은 삭제되지 않습니다.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleteBomComponent.isPending}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteComponent(deleteConfirm.id, deleteConfirm.name)}
                  disabled={deleteBomComponent.isPending}
                >
                  {deleteBomComponent.isPending ? '삭제 중...' : '삭제'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 구성품 수정 모달 */}
      {editComponent && (
        <EditBomComponentModal
          isOpen={!!editComponent}
          onClose={() => setEditComponent(null)}
          componentId={editComponent.id}
          componentName={editComponent.name}
          parentItemId={itemId}
          initialQuantity={editComponent.quantity}
          initialUnit={editComponent.unit}
        />
      )}
    </div>
  )
}
