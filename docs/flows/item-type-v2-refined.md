# Item Type 분류 v2 (부품/모듈 분리)

> **개정일**: 2025-10-05  
> **변경 사항**: 부품(PT)과 모듈(MOD) 명확히 구분

---

## 🎯 핵심 개선 사항

### Before (v1)

```
CP (부품/모듈) - 모호함 ❌
```

### After (v2)

```
PT  (부품)   - 단일 구성품 ✅
MOD (모듈)   - 조립된 서브어셈블리 ✅
```

---

## 📊 최종 Item Type 정의

### 제조 계층 (Manufacturing Hierarchy)

| Code  | 한국어 | English        | 설명           | BOM | 판매 | 제조 |
| ----- | ------ | -------------- | -------------- | --- | ---- | ---- |
| `FG`  | 완제품 | Finished Goods | 최종 판매 제품 | ✅  | ✅   | ✅   |
| `SF`  | 반제품 | Semi-Finished  | 중간 조립품    | ✅  | ❌   | ✅   |
| `MOD` | 모듈   | Module         | 서브어셈블리   | ✅  | ❌   | ✅   |
| `PT`  | 부품   | Part           | 단일 구성품    | ❌  | ❌   | ❌   |
| `RM`  | 원자재 | Raw Material   | 가공 전 원료   | ❌  | ❌   | ❌   |

### 기타 (Others)

| Code  | 한국어 | English     | 설명             | BOM | 판매 | 제조 |
| ----- | ------ | ----------- | ---------------- | --- | ---- | ---- |
| `MR`  | 상품   | Merchandise | 구매 후 재판매   | ❌  | ✅   | ❌   |
| `CS`  | 소모품 | Consumable  | 생산/운영 소모품 | ❌  | ❌   | ❌   |
| `PKG` | 포장재 | Packaging   | 포장용 자재      | ❌  | ❌   | ❌   |

---

## 🌳 BOM 계층 예시

### LCD 모니터 제조

```
[FG] LCD 모니터 27인치 (완제품)
│
├─ [SF] 모니터 본체 (반제품)
│   │
│   ├─ [MOD] LCD 모듈 (조립 모듈)
│   │   ├─ [PT] 액정 패널
│   │   │   └─ [RM] 액정 원료
│   │   ├─ [PT] 백라이트 유닛
│   │   └─ [PT] 플렉시블 케이블
│   │
│   ├─ [MOD] 전원 모듈 (조립 모듈)
│   │   ├─ [PT] SMPS 회로 기판
│   │   ├─ [PT] 커패시터
│   │   └─ [PT] 변압기
│   │
│   └─ [PT] 금속 프레임 (단일 부품)
│
├─ [PT] 스탠드 (단일 부품)
│
└─ [PKG] 포장 박스 (포장재)

별도:
[MR] 무선 키보드 (재판매 상품)
[CS] 생산용 나사 (소모품)
```

---

## 🔍 상세 비교: 부품 vs 모듈

### PT (부품, Part)

**정의**: 더 이상 분해되지 않는 단일 구성품

**특징**:

- BOM 없음 (최하위 구성품)
- 구매품 또는 단순 가공품
- 직접 사용 (추가 조립 없음)

**예시**:

- 나사, 볼트, 너트
- 저항, 커패시터 (전자)
- 케이블, 커넥터
- 금속 프레임, 플라스틱 케이스
- 스티커, 라벨

**재고 관리**:

- 단순 재고 (수량 관리)
- 발주점/안전재고 기반
- Bin 위치 관리

---

### MOD (모듈, Module)

**정의**: 여러 부품이 조립된 서브어셈블리

**특징**:

- BOM 보유 (자체 구성품 목록)
- 별도 조립 공정 필요
- 완제품/반제품의 구성품

**예시**:

- 전원 모듈 (SMPS)
- LCD 모듈
- 카메라 모듈
- 통신 모듈 (WiFi, BT)
- 센서 모듈

**재고 관리**:

- 반제품처럼 관리
- MRP 계획 대상
- Work Order 발행 가능

---

## 📋 비즈니스 규칙

### 1) BOM 구성 규칙

```typescript
// 허용되는 BOM 구성
FG → [SF, MOD, PT, PKG]           ✅
SF → [MOD, PT]                     ✅
MOD → [PT, RM]                     ✅ (모듈은 부품/원자재만)
PT → 없음                          ✅ (최하위)
RM → 없음                          ✅ (최하위)

// 금지되는 BOM 구성
FG → [FG]                          ❌ (완제품에 완제품)
MOD → [MOD, SF]                    ❌ (모듈에 모듈 금지)
PT → [PT, RM]                      ❌ (부품은 BOM 불가)
```

### 2) 제조 프로세스

| Type | Work Order | 조립 공정 | 원가 계산                    |
| ---- | ---------- | --------- | ---------------------------- |
| FG   | 필수       | 필수      | 재료비 + 노무비 + 제조간접비 |
| SF   | 필수       | 필수      | 재료비 + 노무비              |
| MOD  | 필수       | 필수      | 재료비 + 조립비              |
| PT   | 불가       | 불가      | 구매 단가                    |
| RM   | 불가       | 불가      | 구매 단가                    |

### 3) 재고 정책

```typescript
const INVENTORY_POLICY = {
  FG: { method: 'MRP', safety_stock: false, batch: 'order' },
  SF: { method: 'MRP', safety_stock: true, batch: 'lot' },
  MOD: { method: 'MRP', safety_stock: true, batch: 'lot' },
  PT: { method: 'MIN_MAX', safety_stock: true, batch: 'standard' },
  RM: { method: 'EOQ', safety_stock: true, batch: 'bulk' },
  MR: { method: 'MIN_MAX', safety_stock: true, batch: 'order' },
  CS: { method: 'PERIODIC', safety_stock: false, batch: 'as_needed' },
}
```

---

## 🗄️ DB 마이그레이션

### 003_refine_item_types.sql

```sql
-- 1) 기존 CP 데이터 마이그레이션
-- 규칙: has_bom = true → MOD, false → PT
UPDATE items
SET item_type = CASE
  WHEN item_type = 'CP' AND has_bom = true THEN 'MOD'
  WHEN item_type = 'CP' AND has_bom = false THEN 'PT'
  ELSE item_type
END
WHERE item_type = 'CP';

-- 2) MD → MR 변경
UPDATE items
SET item_type = 'MR'
WHERE item_type = 'MD';

-- 3) item_type_configs 업데이트
DELETE FROM item_type_configs WHERE type_code IN ('CP', 'MD');

INSERT INTO item_type_configs (type_code, name_ko, name_en, name_zh, can_have_bom, can_be_sold, can_be_manufactured, tree_icon, tree_badge_color, sort_order) VALUES
('MOD', '모듈', 'Module', '模块', true, false, true, 'cpu', 'indigo', 3),
('PT', '부품', 'Part', '零件', false, false, false, 'package-2', 'purple', 4),
('MR', '상품', 'Merchandise', '商品', false, true, false, 'shopping-bag', 'teal', 8)
ON CONFLICT (type_code) DO NOTHING;

-- 4) 제약 조건 업데이트
ALTER TABLE items
DROP CONSTRAINT IF EXISTS check_item_type;

ALTER TABLE items
ADD CONSTRAINT check_item_type
  CHECK (item_type IN ('FG', 'SF', 'MOD', 'PT', 'RM', 'MR', 'CS', 'PKG', 'WIP', 'SVC', 'SET'));

-- 5) 인덱스 재생성
REINDEX INDEX idx_items_type;
```

---

## 🎨 UI 업데이트

### ItemCreatePage.tsx

```typescript
<select name="item_type">
  <optgroup label="제조 계층">
    <option value="FG">완제품 (Finished Goods)</option>
    <option value="SF">반제품 (Semi-Finished)</option>
    <option value="MOD">모듈 (Module) - 서브어셈블리</option>
    <option value="PT">부품 (Part) - 단일 구성품</option>
    <option value="RM">원자재 (Raw Material)</option>
  </optgroup>
  <optgroup label="기타">
    <option value="MR">상품 (Merchandise)</option>
    <option value="CS">소모품 (Consumable)</option>
    <option value="PKG">포장재 (Packaging)</option>
  </optgroup>
</select>

<p className="hint">
  {formData.item_type === 'MOD' &&
    '💡 모듈: 여러 부품이 조립된 서브어셈블리 (BOM 구성 가능)'}
  {formData.item_type === 'PT' &&
    '💡 부품: 단일 구성품, 더 이상 분해 불가 (BOM 없음)'}
</p>
```

### 트리 아이콘

```typescript
const ITEM_TYPE_ICONS = {
  FG:  <PackageCheck className="text-green-600" />,
  SF:  <Package className="text-blue-600" />,
  MOD: <Cpu className="text-indigo-600" />,         // 새로운 아이콘
  PT:  <Package2 className="text-purple-600" />,    // 새로운 아이콘
  RM:  <Layers className="text-gray-600" />,
  MR:  <ShoppingBag className="text-teal-600" />,
  CS:  <Recycle className="text-orange-600" />,
  PKG: <PackageOpen className="text-yellow-600" />,
}
```

---

## 🌍 i18n 업데이트

### modules.json

```json
{
  "items": {
    "itemType": "상품 유형",
    "types": {
      "FG": "완제품 (Finished Goods)",
      "SF": "반제품 (Semi-Finished)",
      "MOD": "모듈 (Module)",
      "PT": "부품 (Part)",
      "RM": "원자재 (Raw Material)",
      "MR": "상품 (Merchandise)",
      "CS": "소모품 (Consumable)",
      "PKG": "포장재 (Packaging)"
    },
    "typeDescriptions": {
      "FG": "최종 판매 제품 (BOM 구성 가능, 판매 가능)",
      "SF": "중간 조립 제품 (BOM 구성 가능)",
      "MOD": "여러 부품이 조립된 서브어셈블리 (BOM 구성 가능)",
      "PT": "단일 구성품, 더 이상 분해 불가 (BOM 없음)",
      "RM": "가공 전 원자재 (구매만 가능)",
      "MR": "구매 후 재판매 상품 (BOM 없음)",
      "CS": "생산/운영 소모품",
      "PKG": "포장용 자재"
    }
  }
}
```

---

## 🔄 마이그레이션 플랜

### Phase 1: DB 스키마 업데이트

```bash
# 기존 CP → MOD/PT 분리
# 기존 MD → MR 변경
```

### Phase 2: 프론트엔드 업데이트

```bash
# ItemCreatePage 드롭다운 수정
# i18n 키 업데이트
# 아이콘 추가 (Cpu, Package2)
```

### Phase 3: 기존 데이터 검토

```sql
-- CP 데이터 확인
SELECT sku, name, has_bom
FROM items
WHERE item_type = 'CP';

-- BOM 있으면 MOD, 없으면 PT로 분류
```

---

## 💡 실무 가이드

### 언제 MOD를 사용하나?

- ✅ 별도 조립 공정이 필요한 경우
- ✅ 여러 부품을 결합하는 경우
- ✅ 독립적인 테스트/검증이 필요한 경우
- ✅ Work Order를 발행해야 하는 경우

**예시**:

- 전원 모듈 (SMPS 회로 기판 + 커패시터 + 변압기)
- LCD 모듈 (패널 + 백라이트 + 케이블)
- 카메라 모듈 (센서 + 렌즈 + 하우징)

### 언제 PT를 사용하나?

- ✅ 단일 구성품
- ✅ 그대로 사용 (조립 불필요)
- ✅ 구매 후 검수만 하는 경우
- ✅ 최하위 구성품

**예시**:

- 나사, 볼트, 와셔
- 저항, 커패시터 (개별)
- 케이블, 커넥터
- 금속/플라스틱 단일 부품

---

## 📊 마이그레이션 영향 분석

### 기존 데이터

```
CP (부품/모듈): 500개
MD (상품): 50개
```

### 변경 후

```
MOD (모듈): ~100개 (BOM 있는 CP)
PT (부품): ~400개 (BOM 없는 CP)
MR (상품): 50개 (기존 MD)
```

### API 변경

```
POST /api/v1/items/
{
  "item_type": "MOD",  // CP 대신
  "has_bom": true
}
```

---

## 🎯 결론

### 왜 분리가 필요한가?

1. **명확한 계층 구조**

   ```
   FG → SF → MOD → PT → RM
   완제품 → 반제품 → 모듈 → 부품 → 원자재
   ```

2. **비즈니스 로직 단순화**
   - MOD: BOM 필수, Work Order 발행
   - PT: BOM 불가, 단순 재고 관리

3. **재고 정책 차별화**
   - MOD: MRP 계획 대상
   - PT: Min/Max 재주문점 관리

4. **원가 계산 정확성**
   - MOD: 재료비 + 조립비
   - PT: 구매 단가만

### 다음 작업

1. DB 마이그레이션 실행
2. 프론트엔드 업데이트
3. 기존 CP 데이터 분류 (MOD vs PT)

---

**이 변경은 제조업 ERP의 표준 관행과 일치합니다!** ✅
