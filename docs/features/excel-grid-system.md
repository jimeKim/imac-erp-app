# Excel-like Grid System

## 개요

ERP 시스템의 모든 리스트/목록 화면에 적용되는 Excel 스타일 그리드 시스템입니다.

## 핵심 철학

**"ERP의 모든 목록을 '읽기용 테이블'이 아니라 '엑셀형 셀 인터페이스'로 통합한다"**

- 셀(cell) 단위 포커스
- 인라인 편집 (Phase 2)
- 키보드 중심 인터랙션
- 공통 컴포넌트 재사용

## 구조

### 1. 핵심 컴포넌트

```typescript
src/components/grid/
├─ GridManager.tsx              // 메인 그리드 엔진
├─ ColumnFilterDropdown.tsx     // Excel 스타일 필터
├─ ColumnHeader.tsx             // 정렬 가능한 헤더
├─ ColumnFilter.tsx             // 필터 타입 라우터
├─ GridToolbar.tsx              // 검색/필터 툴바
├─ ColumnVisibilityDropdown.tsx // 컬럼 표시/숨김
├─ useGridPersistence.ts        // LocalStorage 상태 관리
└─ types.ts                     // 타입 정의
```

### 2. JSON 스키마 구조

```json
{
  "entity": "items",
  "apiEndpoint": "/api/v1/items",
  "features": {
    "columnVisibility": true,
    "sorting": true,
    "filtering": true,
    "pagination": true,
    "export": false
  },
  "columns": [
    {
      "id": "sku",
      "field": "sku",
      "label": "SKU 코드",
      "type": "link",
      "width": 140,
      "sortable": true,
      "filterable": true,
      "filterType": "text",
      "hideable": false,
      "visible": true,
      "pinned": "left"
    }
  ],
  "initialState": {
    "columnVisibility": {},
    "sorting": [],
    "pagination": { "pageSize": 20 }
  }
}
```

### 3. 컬럼 타입

#### Cell 타입 (`type`)

- `text`: 일반 텍스트
- `number`: 숫자 (통화 포맷 가능)
- `date`: 날짜
- `link`: 클릭 가능한 링크
- `badge`: 배지 스타일 (상태, 유형 등)
- `select`: 드롭다운

#### Filter 타입 (`filterType`)

- `text`: Excel 드롭다운 (체크박스 + 검색 + 정렬)
- `number`: 범위 필터 (최소~최대)
- `select`: Excel 드롭다운 (미리 정의된 옵션)
- `date`: 날짜 범위 (Phase 2)

## 새로운 그리드 추가 방법

### Step 1: JSON 스키마 생성

```bash
src/config/grids/stocks-grid.json
```

```json
{
  "entity": "stocks",
  "apiEndpoint": "/api/v1/stocks",
  "features": {
    "columnVisibility": true,
    "sorting": true,
    "filtering": true,
    "pagination": true
  },
  "columns": [
    {
      "id": "sku",
      "field": "sku",
      "label": "SKU 코드",
      "type": "link",
      "width": 140,
      "sortable": true,
      "filterable": true,
      "filterType": "text"
    },
    {
      "id": "quantity",
      "field": "quantity",
      "label": "재고수량",
      "type": "number",
      "width": 100,
      "sortable": true,
      "filterable": true,
      "filterType": "text"
    }
  ]
}
```

### Step 2: 페이지 컴포넌트 생성

```tsx
// src/pages/stocks/StocksPageGrid.tsx
import { GridManager, GridConfig } from '@/components/grid'
import stocksGridConfig from '@/config/grids/stocks-grid.json'
import { useStocksQuery } from '@/features/stocks/api/stocks.api'

const stocksConfig = stocksGridConfig as GridConfig

export default function StocksPageGrid() {
  const { data, isLoading, error } = useStocksQuery({
    page: 1,
    limit: 1000,
  })

  const stocks = data?.stocks || []

  if (isLoading) return <p>Loading...</p>
  if (error) return <ErrorDisplay message={error.message} />

  return (
    <div>
      <h1>재고 조회</h1>
      <GridManager<Stock>
        data={stocks}
        config={stocksConfig}
        onRowClick={(stock) => console.log('Row clicked:', stock)}
      />
    </div>
  )
}
```

### Step 3: 라우팅 추가

```tsx
// src/app/routes/index.tsx
const StocksPageGrid = lazy(() => import('@/pages/stocks/StocksPageGrid'))

// ...
{
  path: '/stocks-grid',
  element: (
    <ProtectedRoute>
      <MainLayout>
        <Suspense fallback={<LoadingFallback />}>
          <StocksPageGrid />
        </Suspense>
      </MainLayout>
    </ProtectedRoute>
  ),
}
```

## 완료! 3단계로 새 그리드 추가 가능

## 주요 기능

### 1. Excel 스타일 필터

#### 특징

- ✅ 체크박스 다중 선택
- ✅ 검색 기능
- ✅ 오름차순/내림차순 정렬
- ✅ 전체 선택/해제
- ✅ 선택 개수 표시
- ✅ 자동 타입 감지 (숫자/문자열)

#### 정렬 로직

```typescript
// 숫자 자동 감지
const allNumbers = values.every((v) => !isNaN(Number(v)))

if (allNumbers) {
  // 숫자 정렬: 0 → 100 → 1000
  values.sort((a, b) => Number(a) - Number(b))
} else {
  // 문자열 정렬: 가나다 → ABC
  values.sort((a, b) => a.localeCompare(b, 'ko-KR'))
}
```

### 2. 컬럼 표시/숨김

사용자가 원하는 컬럼만 표시하고 설정은 `localStorage`에 저장

### 3. 정렬

- 단일 컬럼 정렬 (오름차순 ↑ / 내림차순 ↓ / 해제)
- 헤더 클릭으로 토글

### 4. 전역 검색

모든 컬럼을 대상으로 검색 가능

### 5. 페이지네이션

- 10 / 20 / 50 / 100 개씩 표시
- 페이지 이동

### 6. 상태 저장

`localStorage`에 다음 상태 자동 저장:

- 컬럼 가시성
- 정렬 상태
- 페이지 크기
- 필터 상태

키 형식: `grid-state-v1-{entityName}`

## Phase 2 로드맵

### 인라인 편집

- 셀 더블클릭 → 편집 모드
- Enter: 저장, ESC: 취소
- Tab: 다음 셀로 이동

### 키보드 네비게이션

- ↑↓←→: 셀 이동
- Ctrl+S: 행 저장
- Ctrl+F: 검색창 포커스

### 다중 선택

- Shift + 클릭: 범위 선택
- Ctrl + 클릭: 개별 선택
- 일괄 수정/삭제

### Excel 내보내기

- SheetJS 기반
- 필터링된 데이터만 내보내기
- 컬럼 순서 유지

### URL 동기화

- 필터/정렬 상태를 URL 쿼리에 저장
- 링크 공유 가능

## 성능 최적화

### 현재 (Phase 1)

- 클라이언트 사이드 필터링/정렬
- 최대 1000개 행 권장

### Phase 3 (대량 데이터)

- 서버 사이드 페이지네이션
- 가상 스크롤링 (react-virtual)
- 무한 스크롤
- 10,000+ 행 지원

## 확장 가능성

### 1. 다른 모듈 적용

- ✅ Items (상품 관리)
- 🟡 Stocks (재고 조회)
- 🟡 Inbounds (입고 관리)
- 🟡 Outbounds (출고 관리)
- 🟡 Customers (고객 관리)
- 🟡 Suppliers (공급업체 관리)

### 2. 커스텀 셀 렌더러

```tsx
// 커스텀 셀 타입 추가
case 'custom-status':
  return <CustomStatusCell value={getValue()} />
```

### 3. 액션 컬럼

```json
{
  "id": "actions",
  "label": "작업",
  "type": "actions",
  "width": 100,
  "actions": ["edit", "delete", "view"]
}
```

## 일관성 유지

### 네이밍 규칙

- Grid 설정: `{entity}-grid.json`
- Page 컴포넌트: `{Entity}PageGrid.tsx`
- API Hook: `use{Entity}Query`

### 스타일 가이드

- Tailwind 기반
- 일관된 간격 (p-2, gap-2)
- 일관된 색상 (primary, muted-foreground)

### 타입 안정성

```typescript
// 타입 캐스팅 필수
const config = configJson as GridConfig
```

## 문제 해결

### Q1: 필터가 작동하지 않음

**A**: `filterType`과 `filterFn` 매칭 확인

- `text` → `multiSelect`
- `select` → `multiSelect`
- `number` → `numberRange`

### Q2: 정렬이 이상함

**A**: 숫자 타입 확인

- 문자열 "100"보다 "20"이 크게 정렬됨
- DB에서 숫자 타입으로 반환되는지 확인

### Q3: 상태가 저장 안됨

**A**: `entityName` 확인

- GridConfig의 `entity` 필드가 고유한지 확인
- localStorage 키 충돌 확인

## 마무리

이 시스템은 **JSON 스키마 하나만 작성**하면 Excel 수준의 강력한 그리드를 5분 만에 추가할 수 있습니다.

**일관성 있는 UX → 학습 비용 ↓ → 개발 속도 ↑**
