import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  ChevronDown, 
  ChevronRight, 
  Package, 
  Cpu, 
  Box,
  Layers,
  PackageOpen,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'

/**
 * BOM 노드 타입
 */
interface BomNode {
  id: string
  sku: string
  name: string
  itemType: 'FG' | 'SF' | 'MOD' | 'PT' | 'RM' | 'PKG'
  quantity: number
  uom: string
  children?: BomNode[]
}

/**
 * 아이템 타입별 아이콘
 */
const ITEM_TYPE_ICONS = {
  FG: <Package className="h-4 w-4 text-green-600" />,
  SF: <Package className="h-4 w-4 text-blue-600" />,
  MOD: <Cpu className="h-4 w-4 text-indigo-600" />,
  PT: <Box className="h-4 w-4 text-purple-600" />,
  RM: <Layers className="h-4 w-4 text-gray-600" />,
  PKG: <PackageOpen className="h-4 w-4 text-yellow-600" />,
}

/**
 * 아이템 타입별 라벨 (i18n 사용)
 */
// Removed: Now using t('modules:items.bom.typeLabels.{type}')

/**
 * 데모 데이터: LCD 모니터 BOM
 */
const DEMO_BOM_DATA: BomNode = {
  id: '1',
  sku: 'MON-LCD-27',
  name: 'LCD 모니터 27인치',
  itemType: 'FG',
  quantity: 1,
  uom: 'EA',
  children: [
    {
      id: '2',
      sku: 'MOD-LCD-001',
      name: 'LCD 모듈',
      itemType: 'MOD',
      quantity: 1,
      uom: 'EA',
      children: [
        {
          id: '3',
          sku: 'PT-PANEL-27',
          name: '액정 패널 27인치',
          itemType: 'PT',
          quantity: 1,
          uom: 'EA',
        },
        {
          id: '4',
          sku: 'PT-BACKLIGHT',
          name: '백라이트 유닛',
          itemType: 'PT',
          quantity: 1,
          uom: 'EA',
        },
        {
          id: '5',
          sku: 'PT-CABLE-FPC',
          name: '플렉시블 케이블',
          itemType: 'PT',
          quantity: 2,
          uom: 'EA',
        },
      ],
    },
    {
      id: '6',
      sku: 'MOD-PWR-001',
      name: '전원 모듈 (SMPS)',
      itemType: 'MOD',
      quantity: 1,
      uom: 'EA',
      children: [
        {
          id: '7',
          sku: 'PT-PCB-SMPS',
          name: 'SMPS 회로 기판',
          itemType: 'PT',
          quantity: 1,
          uom: 'EA',
        },
        {
          id: '8',
          sku: 'PT-CAPACITOR',
          name: '전해 커패시터 1000uF',
          itemType: 'PT',
          quantity: 4,
          uom: 'EA',
        },
        {
          id: '9',
          sku: 'PT-TRANSFORMER',
          name: '변압기 120W',
          itemType: 'PT',
          quantity: 1,
          uom: 'EA',
        },
      ],
    },
    {
      id: '10',
      sku: 'PT-FRAME-METAL',
      name: '금속 프레임',
      itemType: 'PT',
      quantity: 1,
      uom: 'EA',
    },
    {
      id: '11',
      sku: 'PT-STAND',
      name: '스탠드 (조절형)',
      itemType: 'PT',
      quantity: 1,
      uom: 'EA',
    },
    {
      id: '12',
      sku: 'PKG-BOX-L',
      name: '포장 박스 (대형)',
      itemType: 'PKG',
      quantity: 1,
      uom: 'EA',
    },
  ],
}

/**
 * BOM 트리 노드 컴포넌트 (재귀)
 */
interface BomTreeNodeProps {
  node: BomNode
  level: number
  isRoot?: boolean
}

function BomTreeNode({ node, level, isRoot = false }: BomTreeNodeProps) {
  const { t } = useTranslation(['modules'])
  const [isExpanded, setIsExpanded] = useState(isRoot ? true : false)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      {/* 노드 */}
      <div
        className={`flex items-center gap-2 py-2 px-2 rounded-md hover:bg-accent transition-colors ${
          isRoot ? 'bg-primary/5 border border-primary/20' : ''
        }`}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        {/* 확장/축소 버튼 */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-accent rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* 아이콘 */}
        <div className="flex-shrink-0">{ITEM_TYPE_ICONS[node.itemType]}</div>

        {/* 상품 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isRoot ? 'text-primary' : ''}`}>
              {node.name}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {t(`modules:items.bom.typeLabels.${node.itemType}`)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            SKU: {node.sku}
          </div>
        </div>

        {/* 수량 */}
        <div className="text-sm text-muted-foreground">
          × {node.quantity} {node.uom}
        </div>

        {/* 액션 버튼 (루트가 아닌 경우만) */}
        {!isRoot && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Edit className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* 자식 노드 (재귀) */}
      {isExpanded && hasChildren && (
        <div className="border-l border-muted ml-3">
          {node.children!.map((child) => (
            <BomTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * BOM 트리 데모 컴포넌트
 */
export function BomTreeDemo() {
  const { t } = useTranslation(['modules'])
  
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('modules:items.bom.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('modules:items.bom.subtitle')}
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('modules:items.bom.addComponent')}
        </Button>
      </div>

      {/* 프로토타입 안내 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-blue-500 text-white p-1">
              <Package className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                {t('modules:items.bom.prototypeTitle')}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {t('modules:items.bom.prototypeDescription')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BOM 트리 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('modules:items.bom.hierarchyTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <BomTreeNode node={DEMO_BOM_DATA} level={0} isRoot />
          </div>
        </CardContent>
      </Card>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-xs text-muted-foreground">{t('modules:items.bom.totalComponents')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-xs text-muted-foreground">{t('modules:items.bom.hierarchyDepth')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">2</div>
              <div className="text-xs text-muted-foreground">{t('modules:items.bom.moduleCount')}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
