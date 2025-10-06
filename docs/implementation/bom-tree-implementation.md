# BOM 트리 구조 구현 계획

> **작성일**: 2025-10-05  
> **우선순위**: 높음 (Phase 1)

---

## 🎯 목표

상품 상세 페이지에 **BOM (Bill of Materials) 트리 구조**를 추가하여 제조 계층을 관리합니다.

---

## 📊 화면 설계

### 상품 상세 페이지 탭 구조

```
/items/:id

┌─────────────────────────────────────────────┐
│ LCD 모니터 27인치 (FG)                       │
├─────────────────────────────────────────────┤
│ [기본 정보] [BOM 구조] [재고] [이력]         │
├─────────────────────────────────────────────┤
│                                              │
│ BOM 구조:                                    │
│                                              │
│ 📦 LCD 모니터 27인치 (FG)                    │
│  ├─ 🔧 LCD 모듈 (MOD) × 1                   │
│  │  ├─ 📄 액정 패널 (PT) × 1                │
│  │  └─ 💡 백라이트 유닛 (PT) × 1            │
│  ├─ 🔧 전원 모듈 (MOD) × 1                  │
│  │  ├─ 📄 SMPS 회로 기판 (PT) × 1           │
│  │  └─ ⚡ 변압기 (PT) × 1                   │
│  ├─ 📄 금속 프레임 (PT) × 1                 │
│  └─ 📦 포장 박스 (PKG) × 1                  │
│                                              │
│  [+ 구성품 추가]                             │
└─────────────────────────────────────────────┘
```

---

## 🗄️ 데이터 모델

### Supabase 테이블

```sql
-- BOM (Bill of Materials) 테이블
CREATE TABLE bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 부모 상품
  parent_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,

  -- 자식 상품 (구성품)
  child_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,

  -- 수량
  quantity DECIMAL(10, 4) NOT NULL DEFAULT 1,

  -- 단위
  uom VARCHAR(10),

  -- 순서 (트리 표시용)
  sort_order INTEGER DEFAULT 0,

  -- 메타데이터
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약 조건
  CONSTRAINT unique_bom_pair UNIQUE (parent_item_id, child_item_id),
  CONSTRAINT no_self_reference CHECK (parent_item_id != child_item_id)
);

-- 인덱스
CREATE INDEX idx_bom_parent ON bom_items(parent_item_id);
CREATE INDEX idx_bom_child ON bom_items(child_item_id);

-- 순환 참조 방지 함수 (추후 구현)
-- CREATE OR REPLACE FUNCTION prevent_circular_bom()
```

---

## 🎨 UI 컴포넌트

### 1) BomTreeView (트리 뷰)

```typescript
// src/features/items/components/BomTreeView.tsx

interface BomNode {
  id: string
  item_id: string
  sku: string
  name: string
  item_type: string
  quantity: number
  uom: string
  children: BomNode[]
}

interface BomTreeViewProps {
  parentItemId: string
}

export function BomTreeView({ parentItemId }: BomTreeViewProps) {
  const { data: bomTree, isLoading } = useBomTreeQuery(parentItemId)

  return (
    <div className="space-y-2">
      <BomTreeNode node={bomTree} level={0} />
    </div>
  )
}
```

### 2) BomTreeNode (재귀 노드)

```typescript
interface BomTreeNodeProps {
  node: BomNode
  level: number
}

function BomTreeNode({ node, level }: BomTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div style={{ paddingLeft: `${level * 24}px` }}>
      <div className="flex items-center gap-2 py-2 hover:bg-accent rounded-md">
        {/* 확장/축소 버튼 */}
        {node.children.length > 0 && (
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronDown /> : <ChevronRight />}
          </button>
        )}

        {/* 아이콘 */}
        <ItemTypeIcon type={node.item_type} />

        {/* 상품명 */}
        <span className="font-medium">{node.name}</span>

        {/* 수량 */}
        <span className="text-sm text-muted-foreground">
          × {node.quantity} {node.uom}
        </span>

        {/* 액션 버튼 */}
        <div className="ml-auto flex gap-1">
          <Button size="icon" variant="ghost">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost">
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 자식 노드 */}
      {isExpanded && node.children.map((child) => (
        <BomTreeNode key={child.id} node={child} level={level + 1} />
      ))}
    </div>
  )
}
```

### 3) AddBomItemDialog (구성품 추가)

```typescript
interface AddBomItemDialogProps {
  parentItemId: string
  onSuccess: () => void
}

export function AddBomItemDialog({ parentItemId, onSuccess }: AddBomItemDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState(1)

  const handleSubmit = async () => {
    await addBomItem({
      parent_item_id: parentItemId,
      child_item_id: selectedItemId,
      quantity,
    })
    onSuccess()
  }

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>구성품 추가</DialogTitle>
        </DialogHeader>

        {/* 상품 선택 */}
        <ItemSearchCombobox
          value={selectedItemId}
          onChange={setSelectedItemId}
          filter={(item) => item.item_type !== 'FG'} // 완제품은 제외
        />

        {/* 수량 입력 */}
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />

        <DialogFooter>
          <Button onClick={handleSubmit}>추가</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🔄 API 구현

### Backend (FastAPI + Supabase)

```python
# /opt/erp-backend/app/main.py

@app.get("/api/v1/items/{item_id}/bom")
async def get_item_bom_tree(item_id: str):
    """
    Get BOM tree for an item
    Recursive query to build hierarchy
    """
    def build_tree(parent_id: str, visited: set = None) -> list:
        if visited is None:
            visited = set()

        # 순환 참조 방지
        if parent_id in visited:
            return []
        visited.add(parent_id)

        # BOM 조회
        result = supabase.table("bom_items")\
            .select("*, child_item:items!child_item_id(*)")\
            .eq("parent_item_id", parent_id)\
            .order("sort_order")\
            .execute()

        nodes = []
        for bom in result.data:
            node = {
                "id": bom["id"],
                "item_id": bom["child_item_id"],
                "sku": bom["child_item"]["sku"],
                "name": bom["child_item"]["name"],
                "item_type": bom["child_item"]["item_type"],
                "quantity": bom["quantity"],
                "uom": bom["uom"] or bom["child_item"]["uom"],
                "children": build_tree(bom["child_item_id"], visited)
            }
            nodes.append(node)

        return nodes

    tree = build_tree(item_id)
    return {"data": tree}


@app.post("/api/v1/items/{item_id}/bom")
async def add_bom_item(item_id: str, request: dict):
    """
    Add a component to BOM
    """
    try:
        result = supabase.table("bom_items").insert({
            "parent_item_id": item_id,
            "child_item_id": request["child_item_id"],
            "quantity": request["quantity"],
            "uom": request.get("uom"),
        }).execute()

        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/v1/items/{item_id}/bom/{bom_id}")
async def remove_bom_item(item_id: str, bom_id: str):
    """
    Remove a component from BOM
    """
    result = supabase.table("bom_items")\
        .delete()\
        .eq("id", bom_id)\
        .eq("parent_item_id", item_id)\
        .execute()

    return {"data": result.data}
```

---

## 🧪 테스트 시나리오

### 1) BOM 생성

```
1. LCD 모니터 (FG) 생성
2. 상세 페이지 → [BOM 구조] 탭
3. [+ 구성품 추가] 클릭
4. "LCD 모듈 (MOD)" 선택, 수량 1
5. 저장
6. 트리에 표시 확인
```

### 2) 계층 구조 확인

```
1. LCD 모듈 (MOD) 선택
2. [+ 구성품 추가] 클릭
3. "액정 패널 (PT)" 선택, 수량 1
4. 저장
5. 트리 계층 확인:
   LCD 모니터
   └─ LCD 모듈
      └─ 액정 패널
```

### 3) 순환 참조 방지

```
1. LCD 모듈에 "LCD 모니터" 추가 시도
2. 에러: "순환 참조는 허용되지 않습니다"
```

---

## 📅 구현 일정

### Week 1: DB & API

- [ ] `bom_items` 테이블 생성
- [ ] API 엔드포인트 구현 (`GET`, `POST`, `DELETE`)
- [ ] 순환 참조 검증

### Week 2: Frontend 컴포넌트

- [ ] `BomTreeView` 컴포넌트
- [ ] `BomTreeNode` 재귀 렌더링
- [ ] `AddBomItemDialog` 구성품 추가

### Week 3: 상세 페이지 통합

- [ ] `ItemDetailPage`에 탭 추가
- [ ] BOM 탭 연결
- [ ] 테스트 데이터 생성

### Week 4: 고도화

- [ ] Drag & Drop 정렬
- [ ] Export (Excel, PDF)
- [ ] BOM 버전 관리

---

## 🎯 성공 기준

✅ **최소 기능 (MVP)**

- 상품 상세에서 BOM 트리 조회
- 구성품 추가/삭제
- 2단계 계층 구조

✅ **필수 기능**

- 무제한 계층 (재귀)
- 순환 참조 방지
- 수량/단위 관리

✅ **선택 기능**

- Drag & Drop
- Export
- BOM 비용 계산

---

## 💡 참고 자료

- `docs/flows/item-tree-ui-spec.md`: 전체 트리 구조 설계
- `docs/flows/item-management-architecture.md`: 2-Track 접근
- `docs/flows/item-type-v2-refined.md`: 상품 유형 분류

---

**다음 단계**: Supabase 마이그레이션 실행 → API 구현 → 프론트엔드 컴포넌트
