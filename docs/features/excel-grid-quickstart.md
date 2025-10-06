# Excel Grid System - 퀵 스타트

## 5분 만에 새 그리드 추가하기

### Step 1: JSON 스키마 생성 (2분)

```bash
src/config/grids/your-entity-grid.json
```

```json
{
  "entity": "your_entity",
  "apiEndpoint": "/api/v1/your-entity",
  "features": {
    "columnVisibility": true,
    "sorting": true,
    "filtering": true,
    "pagination": true
  },
  "columns": [
    {
      "id": "id",
      "field": "id",
      "label": "ID",
      "type": "link",
      "width": 100,
      "sortable": true,
      "filterable": true,
      "filterType": "text"
    }
  ]
}
```

### Step 2: 페이지 컴포넌트 생성 (2분)

```tsx
// src/pages/your-entity/YourEntityPageGrid.tsx
import { GridManager, GridConfig } from '@/components/grid'
import gridConfig from '@/config/grids/your-entity-grid.json'
import { useYourEntityQuery } from '@/features/your-entity/api/your-entity.api'

const config = gridConfig as GridConfig

export default function YourEntityPageGrid() {
  const { data, isLoading, error } = useYourEntityQuery({ limit: 1000 })

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <h1>Your Entity List</h1>
      <GridManager
        data={data?.items || []}
        config={config}
        onRowClick={(item) => console.log(item)}
      />
    </div>
  )
}
```

### Step 3: 라우팅 추가 (1분)

```tsx
// src/app/routes/index.tsx

// 1. Lazy import 추가
const YourEntityPageGrid = lazy(() => import('@/pages/your-entity/YourEntityPageGrid'))

// 2. 라우트 추가
{
  path: '/your-entity',
  element: (
    <ProtectedRoute>
      <MainLayout>
        <Suspense fallback={<LoadingFallback />}>
          <YourEntityPageGrid />
        </Suspense>
      </MainLayout>
    </ProtectedRoute>
  ),
}
```

## 완료! 🎉

이제 `/your-entity` 경로로 가면:

- ✅ Excel 스타일 필터
- ✅ 정렬
- ✅ 컬럼 표시/숨김
- ✅ 페이지네이션
- ✅ 전역 검색

모든 기능이 자동으로 작동합니다!

## 컬럼 타입 치트시트

### Cell 타입

```json
"type": "text"    // 일반 텍스트
"type": "number"  // 숫자 (₩ 포맷)
"type": "link"    // 클릭 가능한 링크
"type": "badge"   // 배지 (상태, 유형)
"type": "date"    // 날짜
```

### Filter 타입

```json
"filterType": "text"    // Excel 드롭다운 (자동 정렬)
"filterType": "select"  // Excel 드롭다운 (미리 정의된 옵션)
"filterType": "number"  // 숫자 범위 (최소~최대)
```

## 고급 설정

### 1. 링크 컬럼 (상세 페이지로 이동)

```json
{
  "id": "sku",
  "type": "link",
  "pinned": "left"
}
```

### 2. 배지 컬럼 (상태 표시)

```json
{
  "id": "status",
  "type": "badge",
  "filterType": "select",
  "filterOptions": [
    { "value": "active", "label": "활성" },
    { "value": "inactive", "label": "비활성" }
  ]
}
```

### 3. 컬럼 고정

```json
{
  "pinned": "left"   // 왼쪽 고정
  "pinned": "right"  // 오른쪽 고정
}
```

### 4. 기본 숨김

```json
{
  "visible": false  // 기본적으로 숨김 (사용자가 표시 가능)
  "hideable": false // 영구 표시 (숨김 불가)
}
```

### 5. 초기 정렬

```json
"initialState": {
  "sorting": [
    { "id": "created_at", "desc": true }
  ]
}
```

## 실전 예시

### Items (상품 관리)

- 위치: `/items-real` → `ItemsPageRealGrid`
- 설정: `src/config/grids/items-grid.json`
- 특징: SKU 링크, 상품 유형 배지, 택가 필터

### Stocks (재고 조회)

- 위치: `/stocks-real` → `StocksPageGrid`
- 설정: `src/config/grids/stocks-grid.json`
- 특징: 재고수량 필터, 창고별 정렬

## 문제 해결

### Q: "Cannot find module" 에러

```bash
# TypeScript가 JSON을 모듈로 인식하지 못함
# tsconfig.json에 이미 설정되어 있음
"resolveJsonModule": true
```

### Q: 필터가 작동하지 않음

```typescript
// 타입 캐스팅 필수
const config = gridConfigJson as GridConfig
```

### Q: API 응답 형식이 다름

```typescript
// GridManager는 배열만 필요
<GridManager data={response.data.items || []} />
```

## 다음 단계

### Phase 2 기능

- 인라인 편집
- 다중 선택
- Excel 내보내기
- URL 동기화

### 확장

- 커스텀 셀 렌더러
- 액션 컬럼
- 일괄 작업

## 참고 문서

- 상세 가이드: `docs/features/excel-grid-system.md`
- 타입 정의: `src/components/grid/types.ts`
- 예시 설정: `src/config/grids/items-grid.json`
