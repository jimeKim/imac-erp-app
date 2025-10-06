# 아이템 유형(Item Type) 분류 체계

> **작성일**: 2025-10-05  
> **목적**: 제조/유통 ERP를 위한 아이템 유형 정의

---

## 🎯 핵심 개념

### 왜 아이템 유형이 필요한가?

1. **BOM 계층 구조**: 완제품 → 반제품 → 부품 → 원자재
2. **제조 흐름**: 생산 가능 여부 (Make vs Buy)
3. **재고 정책**: 유형별 다른 안전재고/발주점
4. **채널 노출**: 완제품만 판매, 부품은 내부용
5. **원가 계산**: 재료비/노무비/제조간접비 적용 방식

---

## 📊 Item Type 정의

### 1️⃣ 기본 분류 (6가지)

| Type Code | 한국어    | English        | 설명             | BOM 가능      | 판매 가능 |
| --------- | --------- | -------------- | ---------------- | ------------- | --------- |
| `FG`      | 완제품    | Finished Goods | 최종 판매 제품   | ✅            | ✅        |
| `SF`      | 반제품    | Semi-Finished  | 중간 조립품      | ✅            | ❌        |
| `CP`      | 부품/모듈 | Component      | 조립용 부품      | ✅ (optional) | ❌        |
| `RM`      | 원자재    | Raw Material   | 가공 전 원료     | ❌            | ❌        |
| `CS`      | 소모품    | Consumable     | 생산/운영 소모품 | ❌            | ❌        |
| `MD`      | 상품      | Merchandise    | 구매 후 재판매   | ❌            | ✅        |

### 2️⃣ 확장 분류 (선택 사항)

| Type Code | 한국어 | English         | 설명                 |
| --------- | ------ | --------------- | -------------------- |
| `WIP`     | 재공품 | Work In Process | 생산 중인 품목       |
| `PKG`     | 포장재 | Packaging       | 포장용 자재          |
| `SVC`     | 서비스 | Service         | 판매 가능한 서비스   |
| `SET`     | 세트   | Bundle Set      | 묶음 상품 (BOM 없음) |

---

## 🌳 트리 구조에서의 활용

### 예시: LCD 모니터 제조

```
┌─ [FG] LCD 모니터 27인치 (완제품)
│  ├─ [SF] 모니터 본체 조립품 (반제품)
│  │  ├─ [CP] LCD 패널 27" (부품)
│  │  │  └─ [RM] 액정 원료 (원자재)
│  │  ├─ [CP] 백라이트 모듈 (부품)
│  │  └─ [CP] 회로 기판 (부품)
│  ├─ [CP] 스탠드 (부품)
│  └─ [PKG] 포장 박스 (포장재)
│
├─ [CS] 생산용 나사 (소모품)
└─ [MD] 수입 키보드 (상품 - 재판매)
```

### 트리 노드 표시 예시

```
▾ [FG] LCD 모니터 27인치
  ├─ 📦 BOM 구성 (4개 부품)
  ├─ 🎨 Variants (색상/사이즈)
  └─ 📍 채널: POS, 온라인

▾ [SF] 모니터 본체 조립품
  └─ 📦 BOM 구성 (3개 부품)

▸ [CP] LCD 패널 27"
  └─ 공급처: Samsung Display

▸ [RM] 액정 원료
  └─ 단위: KG, 안전재고: 500KG
```

---

## 🎨 UI/UX 적용

### Track 1: 기본 등록 (ItemCreatePage)

#### 유형 선택 필드 추가

```typescript
<div className="field">
  <label>상품 유형 *</label>
  <select name="itemType" required>
    <optgroup label="제조">
      <option value="FG">완제품 (Finished Goods)</option>
      <option value="SF">반제품 (Semi-Finished)</option>
      <option value="CP">부품/모듈 (Component)</option>
      <option value="RM">원자재 (Raw Material)</option>
    </optgroup>
    <optgroup label="기타">
      <option value="CS">소모품 (Consumable)</option>
      <option value="MD">상품 (Merchandise)</option>
      <option value="PKG">포장재 (Packaging)</option>
    </optgroup>
  </select>
  <p className="hint">
    💡 완제품: BOM 구성 가능, 판매 가능
    💡 원자재: BOM 없음, 구매만 가능
  </p>
</div>
```

#### 유형별 동적 필드 표시

```typescript
{formData.itemType === 'FG' && (
  <>
    <div>판매 채널 설정</div>
    <div>Variant 옵션 (색상/사이즈)</div>
  </>
)}

{['FG', 'SF', 'CP'].includes(formData.itemType) && (
  <div>BOM 구성 설정 (Track 2에서 상세 편집)</div>
)}

{formData.itemType === 'RM' && (
  <div>
    <label>공급처</label>
    <input name="supplier" />
    <label>발주 단위</label>
    <input name="orderUOM" />
  </div>
)}
```

---

## 🗄️ DB 스키마 확장

### items 테이블에 컬럼 추가

```sql
ALTER TABLE items
ADD COLUMN item_type VARCHAR(10) NOT NULL DEFAULT 'FG',
ADD COLUMN is_manufactured BOOLEAN DEFAULT false,  -- 생산 가능 여부
ADD COLUMN is_purchased BOOLEAN DEFAULT true,      -- 구매 가능 여부
ADD COLUMN is_sellable BOOLEAN DEFAULT false,      -- 판매 가능 여부
ADD COLUMN has_bom BOOLEAN DEFAULT false,           -- BOM 구성 여부
ADD COLUMN has_variants BOOLEAN DEFAULT false;      -- Variant 존재 여부

-- 제약 조건
ALTER TABLE items
ADD CONSTRAINT check_item_type
  CHECK (item_type IN ('FG', 'SF', 'CP', 'RM', 'CS', 'MD', 'PKG', 'WIP', 'SVC', 'SET'));

-- 인덱스
CREATE INDEX idx_items_type ON items(item_type);
CREATE INDEX idx_items_sellable ON items(is_sellable) WHERE is_sellable = true;
```

### item_type_configs 테이블 (유형별 설정)

```sql
CREATE TABLE item_type_configs (
  type_code VARCHAR(10) PRIMARY KEY,
  name_ko VARCHAR(50) NOT NULL,
  name_en VARCHAR(50) NOT NULL,
  name_zh VARCHAR(50),

  -- 기능 플래그
  can_have_bom BOOLEAN DEFAULT false,
  can_be_sold BOOLEAN DEFAULT false,
  can_be_manufactured BOOLEAN DEFAULT false,
  can_be_purchased BOOLEAN DEFAULT true,

  -- 트리 표시
  tree_icon VARCHAR(20),              -- lucide-react 아이콘명
  tree_badge_color VARCHAR(20),       -- 배지 색상
  sort_order INTEGER,

  -- 기본값
  default_uom VARCHAR(10),
  default_category VARCHAR(50),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 데이터 삽입
INSERT INTO item_type_configs (type_code, name_ko, name_en, can_have_bom, can_be_sold, can_be_manufactured, tree_icon, tree_badge_color, sort_order) VALUES
('FG', '완제품', 'Finished Goods', true, true, true, 'package-check', 'green', 1),
('SF', '반제품', 'Semi-Finished', true, false, true, 'package', 'blue', 2),
('CP', '부품/모듈', 'Component', true, false, false, 'box', 'purple', 3),
('RM', '원자재', 'Raw Material', false, false, false, 'layers', 'gray', 4),
('CS', '소모품', 'Consumable', false, false, false, 'recycle', 'orange', 5),
('MD', '상품', 'Merchandise', false, true, false, 'shopping-bag', 'teal', 6),
('PKG', '포장재', 'Packaging', false, false, false, 'package-open', 'yellow', 7);
```

---

## 🔄 비즈니스 로직

### 1) BOM 생성 규칙

```typescript
// backend/app/services/bom_service.py
def can_create_bom(item: Item) -> bool:
    """BOM 생성 가능 여부 체크"""
    type_config = get_type_config(item.item_type)

    if not type_config.can_have_bom:
        raise BusinessError(f"{item.item_type}는 BOM을 가질 수 없습니다")

    # 순환 참조 방지
    if would_create_cycle(item.id, component_ids):
        raise BusinessError("BOM 순환 참조가 발생합니다")

    return True

def validate_bom_component(parent: Item, component: Item) -> bool:
    """BOM 구성품 유효성 검증"""
    # 완제품에는 완제품을 넣을 수 없음
    if parent.item_type == 'FG' and component.item_type == 'FG':
        raise BusinessError("완제품에 완제품을 구성품으로 추가할 수 없습니다")

    # 원자재는 최하위
    if parent.item_type == 'RM':
        raise BusinessError("원자재는 BOM을 가질 수 없습니다")

    return True
```

### 2) 채널 노출 규칙

```typescript
// frontend/src/features/items/utils/channelRules.ts
export function canExposeToChannel(item: Item, channel: Channel): boolean {
  const config = ITEM_TYPE_CONFIGS[item.item_type]

  if (!config.can_be_sold) {
    return false // 판매 불가 유형
  }

  if (channel === 'POS' && item.item_type === 'MD') {
    return true // 상품은 POS 노출 가능
  }

  if (channel === 'Online' && item.item_type === 'FG') {
    return item.has_variants // 완제품 + Variant 필수
  }

  return false
}
```

### 3) 재고 정책

```typescript
// backend/app/services/inventory_service.py
def get_reorder_policy(item: Item) -> ReorderPolicy:
    """유형별 재주문 정책"""
    policies = {
        'FG': ReorderPolicy(method='MRP', lead_time=7),      # 생산 계획
        'SF': ReorderPolicy(method='MRP', lead_time=3),
        'CP': ReorderPolicy(method='MIN_MAX', min=100),       # 최소/최대
        'RM': ReorderPolicy(method='EOQ', reorder_point=500), # 경제적 주문량
        'CS': ReorderPolicy(method='PERIODIC', period=30),    # 정기 발주
        'MD': ReorderPolicy(method='MIN_MAX', min=50),
    }
    return policies.get(item.item_type, ReorderPolicy())
```

---

## 🎨 Track 2: 트리 UI에서 표현

### 노드별 아이콘 & 배지

```typescript
// ItemTreeNode.tsx
const ITEM_TYPE_ICONS = {
  FG: <PackageCheck className="text-green-600" />,
  SF: <Package className="text-blue-600" />,
  CP: <Box className="text-purple-600" />,
  RM: <Layers className="text-gray-600" />,
  CS: <Recycle className="text-orange-600" />,
  MD: <ShoppingBag className="text-teal-600" />,
  PKG: <PackageOpen className="text-yellow-600" />,
}

function ItemTreeNode({ item }) {
  return (
    <div className="tree-node">
      {ITEM_TYPE_ICONS[item.item_type]}
      <span className="item-name">{item.name}</span>
      <Badge color={getTypeBadgeColor(item.item_type)}>
        {item.item_type}
      </Badge>

      {item.has_bom && (
        <Badge variant="outline">
          BOM ({item.bom_component_count})
        </Badge>
      )}

      {item.has_variants && (
        <Badge variant="outline">
          Variants ({item.variant_count})
        </Badge>
      )}
    </div>
  )
}
```

### 필터링

```typescript
// ItemTreeFilter.tsx
<Select name="itemTypeFilter" multiple>
  <option value="FG">완제품만</option>
  <option value="SF,CP">반제품+부품</option>
  <option value="RM">원자재만</option>
  <option value="sellable">판매 가능 품목</option>
  <option value="with_bom">BOM 있는 품목</option>
</Select>
```

---

## 📋 구현 우선순위

### Phase 1: 기본 유형 추가 (즉시)

```sql
-- Migration: 001_add_item_types.sql
ALTER TABLE items
ADD COLUMN item_type VARCHAR(10) NOT NULL DEFAULT 'FG',
ADD COLUMN is_sellable BOOLEAN DEFAULT true,
ADD COLUMN has_bom BOOLEAN DEFAULT false;

-- 기존 데이터 마이그레이션
UPDATE items SET item_type = 'FG', is_sellable = true WHERE status = 'active';
```

```typescript
// ItemCreatePage.tsx 수정
<div className="field">
  <label>{t('items.itemType')} *</label>
  <select
    name="itemType"
    value={formData.itemType}
    onChange={handleChange}
    required
  >
    <option value="FG">{t('items.types.FG')}</option>
    <option value="SF">{t('items.types.SF')}</option>
    <option value="CP">{t('items.types.CP')}</option>
    <option value="RM">{t('items.types.RM')}</option>
    <option value="CS">{t('items.types.CS')}</option>
    <option value="MD">{t('items.types.MD')}</option>
  </select>
</div>
```

### Phase 2: 유형별 로직 (1주)

- [ ] BOM 생성 시 유형 검증
- [ ] 채널 노출 규칙 적용
- [ ] 유형별 아이콘/배지 표시

### Phase 3: 고급 기능 (2주)

- [ ] 유형별 기본 설정 (item_type_configs)
- [ ] 트리 필터링
- [ ] 유형 전환 (마이그레이션 지원)

---

## 🌍 i18n 키 추가

### modules.json

```json
{
  "items": {
    "itemType": "상품 유형",
    "types": {
      "FG": "완제품",
      "SF": "반제품",
      "CP": "부품/모듈",
      "RM": "원자재",
      "CS": "소모품",
      "MD": "상품",
      "PKG": "포장재"
    },
    "typeDescriptions": {
      "FG": "최종 판매되는 완성품 (BOM 구성 가능)",
      "SF": "중간 조립 단계 제품 (BOM 구성 가능)",
      "CP": "완제품/반제품에 들어가는 부품",
      "RM": "가공되지 않은 원자재",
      "CS": "생산/운영 과정에서 소비되는 품목",
      "MD": "구매 후 재판매하는 완제품 (BOM 없음)"
    }
  }
}
```

---

## 🎯 핵심 요약

### 왜 중요한가?

1. **트리 계층 구조의 기반**
   - 완제품 → 반제품 → 부품 → 원자재 순서
   - BOM 유효성 검증 (순환 참조 방지)

2. **비즈니스 로직 분리**
   - 완제품: 판매 가능, BOM 필수
   - 원자재: 구매만, BOM 불가
   - 상품: 판매 가능, BOM 없음

3. **UI/UX 차별화**
   - 유형별 다른 아이콘/색상
   - 동적 폼 필드 (유형에 따라)
   - 필터링/정렬

4. **재고/원가 관리**
   - 유형별 다른 재주문 정책
   - 원가 계산 방식 차이
   - 안전재고 기준

### 다음 작업

**즉시**:

1. Migration 실행 (item_type 컬럼 추가)
2. ItemCreatePage에 유형 선택 추가
3. i18n 키 추가

**단기**:

1. 유형별 아이콘 표시
2. BOM 생성 시 유형 검증
3. API에 item_type 필드 반영

---

**결론**: 상품 유형은 ERP의 **데이터 모델 기반**이며, 트리 구조 설계의 **필수 전제 조건**입니다. 지금 추가하는 것이 최선입니다! 🎯
