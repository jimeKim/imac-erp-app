# 아이템 관리 아키텍처 설계

> **작성일**: 2025-10-05  
> **목적**: 기본 CRUD vs 트리 구조 관리 분리

---

## 🎯 핵심 원칙: 2-Track 접근

### Track 1: 기본 CRUD (빠른 작업)

**대상 사용자**: Staff, Manager  
**시나리오**: 일상적인 상품 등록/수정, 간단한 재고 관리

### Track 2: 트리 구조 (복잡한 설계)

**대상 사용자**: Manager, Product Designer  
**시나리오**: Variant/BOM/채널 맵핑, 계층 구조 설계

---

## 📐 페이지 분리 구조

```
/items
├── /items-real               # 목록 (현재)
├── /items/create             # 빠른 등록 (Track 1) ✅
├── /items/:id                # 상세/수정 (Track 1)
└── /items/tree               # 트리 구조 관리 (Track 2) 🎯
    ├── /items/tree/:nodeId   # 트리 노드 상세
    └── /items/tree/design    # 디자인 모드
```

---

## 🔄 사용자 흐름

### 1️⃣ Track 1: 기본 등록 (현재 구현)

```
┌─────────────┐
│ 상품 목록   │ ← 상품 조회
└──────┬──────┘
       │
       ├──→ [+ 상품 등록] ──→ /items/create
       │                       ├─ SKU *
       │                       ├─ 상품명 *
       │                       ├─ 설명
       │                       ├─ 카테고리
       │                       ├─ 단위
       │                       ├─ 단가
       │                       └─ [저장] → 목록으로
       │
       └──→ [상품명 클릭] ──→ /items/:id
                               ├─ 기본 정보 수정
                               ├─ 재고 조회
                               └─ [고급 설정으로] → Track 2
```

**특징**:

- ✅ 단순한 폼 기반 입력
- ✅ 필수 필드만 (SKU, 상품명)
- ✅ 빠른 저장 (1~2분 내 완료)
- ✅ 모바일 친화적

---

### 2️⃣ Track 2: 트리 구조 (차기 구현)

```
┌─────────────┐
│ 트리 관리   │ ← 고급 메뉴
└──────┬──────┘
       │
       └──→ /items/tree
              ├─ 좌측: 계층 트리
              │   ├─ 카테고리
              │   ├─ 아이템
              │   ├─ Variants
              │   ├─ BOM
              │   └─ 채널 맵핑
              │
              └─ 우측: 상세 패널
                  ├─ [탭] 기본정보
                  ├─ [탭] 옵션/Variant
                  ├─ [탭] BOM 구성
                  ├─ [탭] 채널 맵핑
                  ├─ [탭] 가격/세금
                  └─ [탭] 감사 이력
```

**특징**:

- ✅ 복잡한 계층 구조
- ✅ 드래그&드롭
- ✅ 대용량 데이터 (가상 스크롤)
- ✅ 데스크톱 전용

---

## 🧱 데이터 모델 확장 (트리용)

### 현재 (Track 1)

```sql
items
├─ id (uuid, PK)
├─ sku (varchar, unique)
├─ name (varchar)
├─ description (text)
├─ category (varchar)
├─ uom (varchar)
├─ unit_cost (numeric)
└─ status (varchar)
```

### 확장 (Track 2)

```sql
-- 1) 카테고리 트리
item_categories
├─ id (uuid)
├─ parent_id (uuid, nullable)
├─ name (jsonb) -- {ko, en, zh}
├─ path (ltree) -- 계층 경로
└─ sort_order (int)

-- 2) Variant 옵션
item_variants
├─ id (uuid)
├─ item_id (uuid → items)
├─ variant_sku (varchar, unique)
├─ option_values (jsonb) -- {color: "RED", size: "M"}
├─ price_adjustment (numeric)
└─ barcode (varchar)

-- 3) BOM 구성
item_boms
├─ id (uuid)
├─ parent_item_id (uuid)
├─ component_item_id (uuid)
├─ quantity (numeric)
├─ scrap_rate (numeric)
└─ version (int)

-- 4) 채널 맵핑
item_channel_maps
├─ id (uuid)
├─ item_id (uuid)
├─ channel_id (varchar) -- POS, Online, Kiosk
├─ publish_state (varchar)
├─ price_rule (jsonb)
└─ stock_source (varchar)
```

---

## 🚦 라우팅 & 권한

### Track 1 라우트

```typescript
{
  path: '/items/create',
  permission: 'ITEMS_CREATE',       // Staff, Manager
  component: ItemCreatePage,
  description: '빠른 상품 등록'
},
{
  path: '/items/:id',
  permission: 'ITEMS_VIEW',
  component: ItemDetailPage,
  description: '상품 기본 정보 조회/수정'
}
```

### Track 2 라우트

```typescript
{
  path: '/items/tree',
  permission: 'ITEMS_TREE_VIEW',    // Manager only
  component: ItemTreePage,
  description: '트리 구조 관리 (읽기)'
},
{
  path: '/items/tree/:nodeId',
  permission: 'ITEMS_TREE_EDIT',    // Admin only
  component: ItemTreeDetailPage,
  description: 'BOM/Variant/채널 설정'
}
```

---

## 🎨 UI 구분

### Track 1: 심플 모드

```
┌────────────────────────────────┐
│  [←] 상품 등록                 │
│  ──────────────────────────────│
│  ┌──────────────────────────┐ │
│  │ 기본 정보                │ │
│  ├──────────────────────────┤ │
│  │ SKU 코드 *      [_____]  │ │
│  │ 상품명 *        [_____]  │ │
│  │ 설명           [_____]  │ │
│  │ 카테고리        [_____]  │ │
│  │ 단위     [EA▾]  │ │
│  │ 단가           [0.00]   │ │
│  │ 상태    [활성▾] │ │
│  └──────────────────────────┘ │
│  [취소] [저장]                 │
└────────────────────────────────┘
```

### Track 2: 트리 모드

```
┌─────────────────────────────────────────────────────┐
│  검색 [_____]  필터 [상태▾] [카테고리▾]  보기 [트리▾]  │
├──────────────┬──────────────────────────────────────┤
│ 트리         │ 노드 상세                            │
│ ─────────── │ ─────────────────────────────────────│
│ ▸ 카테고리   │ [탭] 기본 | 옵션 | BOM | 채널 | 이력 │
│  ▸ 전자기기  │ ┌─────────────────────────────────┐ │
│   ▸ LCD모니터│ │ SKU: MONITOR-27-001             │ │
│    ▾ Variants│ │ 상품명: LCD 모니터 27인치        │ │
│     • RED-M  │ │ ─────────────────────────────── │ │
│     • RED-L  │ │ [옵션 조합 생성]                │ │
│    ▸ BOM v1  │ │ - 색상: RED, BLUE, BLACK        │ │
│   ▸ 키보드   │ │ - 사이즈: M, L                  │ │
│              │ └─────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────┘
```

---

## 🔗 두 Track 간 전환

### Track 1 → Track 2

```typescript
// ItemDetailPage.tsx
<Button onClick={() => navigate(`/items/tree/${itemId}`)}>
  <GitBranch className="mr-2" />
  고급 설정 (BOM/Variant)
</Button>
```

### Track 2 → Track 1

```typescript
// ItemTreePage.tsx - 상단 바
<Button onClick={() => navigate(`/items/${selectedItemId}`)}>
  <Edit className="mr-2" />
  빠른 수정
</Button>
```

---

## 📋 구현 우선순위

### Phase 1: Track 1 완성 (현재 진행 중) ✅

- [x] ItemCreatePage - 기본 등록 폼
- [x] 라우팅 추가
- [x] i18n 키 추가
- [ ] API 연동 (POST /api/v1/items/)
- [ ] ItemDetailPage - 수정 폼

### Phase 2: Track 1 고도화 (1주)

- [ ] 유효성 검증 강화
- [ ] 파일 업로드 (이미지)
- [ ] 카테고리 드롭다운 (자동완성)
- [ ] 실시간 SKU 중복 체크

### Phase 3: Track 2 기본 (2~3주)

- [ ] ItemTreePage - 좌우 레이아웃
- [ ] 카테고리 트리 렌더링
- [ ] 지연 로딩
- [ ] 노드 선택 → 우측 패널

### Phase 4: Track 2 고급 (3~4주)

- [ ] Variant 생성/관리
- [ ] BOM 트리
- [ ] 드래그&드롭
- [ ] 채널 맵핑

---

## 🎯 권한 매트릭스

| 기능                   | Staff | Manager | Admin |
| ---------------------- | ----- | ------- | ----- |
| **Track 1: 기본 등록** |       |         |       |
| 상품 조회              | ✅    | ✅      | ✅    |
| 상품 등록              | ✅    | ✅      | ✅    |
| 상품 수정              | ✅    | ✅      | ✅    |
| 상품 삭제              | ❌    | ✅      | ✅    |
| **Track 2: 트리 구조** |       |         |       |
| 트리 조회              | ❌    | ✅      | ✅    |
| Variant 생성           | ❌    | ✅      | ✅    |
| BOM 수정               | ❌    | ❌      | ✅    |
| 채널 맵핑              | ❌    | ✅      | ✅    |
| 리비전 생성/발행       | ❌    | ❌      | ✅    |

---

## 💡 UX 가이드

### 언제 Track 1을 사용하나요?

- 신규 상품을 빠르게 등록할 때
- 기본 정보(SKU, 이름, 가격)만 수정할 때
- 모바일이나 태블릿에서 작업할 때
- 단순 재고 아이템 (변형 없음)

### 언제 Track 2를 사용하나요?

- 옵션이 있는 상품 (색상, 사이즈 조합)
- 조립/세트 상품 (BOM 필요)
- 다채널 판매 (POS, 온라인, 키오스크)
- 제품 계층 설계 (카테고리 트리)

---

## 🚀 Next Steps

### 즉시 (현재)

1. **Track 1 완성**
   - [ ] POST API 구현: `/api/v1/items/` (백엔드)
   - [ ] API 연동 (ItemCreatePage)
   - [ ] ItemDetailPage 수정 폼
   - [ ] 테스트 데이터 생성

### 단기 (1~2주)

2. **Track 1 고도화**
   - [ ] 이미지 업로드
   - [ ] 카테고리 자동완성
   - [ ] SKU 중복 체크
   - [ ] 일괄 등록 (CSV)

### 중기 (1~2개월)

3. **Track 2 설계 시작**
   - [ ] DB 스키마 확장 (variants, boms, categories, channel_maps)
   - [ ] ItemTreePage 골격
   - [ ] 트리 컴포넌트 선정 (react-arborist vs rc-tree)
   - [ ] API 엔드포인트 설계

---

## 📊 기술 스택 (Track 2)

### 트리 라이브러리 후보

1. **react-arborist** (권장)
   - 가상 스크롤 내장
   - 드래그&드롭 지원
   - TypeScript 완전 지원

2. **rc-tree**
   - Ant Design 기반
   - 안정적이지만 무거움

3. **@tanstack/react-virtual + 커스텀**
   - 최대 유연성
   - 개발 시간 증가

### 상태 관리

- **Zustand** (현재 사용 중)
  - 트리 상태: 펼침/선택/필터
  - 캐시: 노드 데이터

---

## ✅ 마이그레이션 플랜

### 1단계: 현재 items 테이블 유지

- Track 1만 사용
- 기존 데이터 안전

### 2단계: 확장 테이블 추가

- `item_categories`, `item_variants`, `item_boms` 생성
- Track 1과 병행 운영

### 3단계: Track 2 오픈

- Manager 이상만 접근
- Track 1에서 "고급 설정" 버튼으로 전환

### 4단계: 통합

- Track 2에서 기본 등록도 가능하도록
- 사용자 선호도에 따라 선택

---

## 🎯 결론

**현재 (Track 1)**: ✅ 완료  
→ 간단한 상품 등록/수정 가능

**다음 (Track 2)**: 🎯 기획 완료  
→ 복잡한 트리 구조는 별도 페이지로 분리

**분리 이유**:

1. **UX 복잡도**: 단순 작업과 복잡한 설계를 한 화면에서 처리하면 혼란
2. **성능**: 트리는 무거운 컴포넌트, 기본 폼은 가벼워야 함
3. **권한 분리**: Staff는 Track 1만, Manager 이상은 Track 2 접근
4. **점진적 개선**: MVP는 Track 1만으로 충분, Track 2는 필요 시 확장

---

**다음 작업**: Track 1 API 연동 완료 → Track 2 스키마 설계 시작
