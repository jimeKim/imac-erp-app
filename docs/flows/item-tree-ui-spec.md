# 아이템 구성 트리 UI 설계 문서

> **Phase**: 2.0 (장기 로드맵)  
> **Status**: 기획 단계  
> **Dependencies**: 현재 Items/BOM/Variants 테이블 스키마 정의 필요

---

## 🎯 목적

하나의 UI에서 아이템(상품) ↔ 변형(Variants) ↔ 구성품(BOM) ↔ 번들/세트 ↔ 채널 맵핑을 계층적으로 관리

- 대용량에서도 지연로딩 + 가상 스크롤로 부드럽게 탐색
- RBAC, 감사, i18n을 기본 탑재

---

## 🧭 전체 레이아웃

```
[ 상단바 ]
┌──────────────────────────────────────────────────────────────┐
│  탐색: [검색] [필터: 상태/채널/카테고리]   보기: [트리|그리드]   액션: [+추가][병합][삭제]  │
└──────────────────────────────────────────────────────────────┘

[ 좌측: 트리 패널 ]            [ 우측: 디테일 패널 ]
┌───────────────────────┐   ┌─────────────────────────────────┐
│ Breadcrumb: 카테고리/… │   │ [탭] 기본정보 | 가격/세금 | 재고/단위 │
│ ─────────────────────  │   │       | 옵션/Variant | BOM | 채널맵핑 │
│  ▸ 카테고리            │   │       | 파일/이미지  | 감사/이력     │
│   ▸ 아이템A            │   └─────────────────────────────────┘
│     ▸ Variants         │   │ 선택된 노드의 속성 폼/표/그래프    │
│       ▸ A-RED-M        │   └─────────────────────────────────┘
│     ▸ BOM              │
│       ▸ 부품-모듈1     │
│   ▸ 아이템B            │
└───────────────────────┘
```

- **좌측 트리**: 계층 탐색/드래그&드롭/컨텍스트 메뉴
- **우측 디테일**: 선택 노드에 맞춘 탭형 속성 편집
- **상단바**: 전역 검색·필터, 일괄 작업(병합/이동/삭제)

---

## 🌳 트리 노드 타입(표준화)

| 타입            | 예시             | 목적/설명           | 주요 필드                     |
| --------------- | ---------------- | ------------------- | ----------------------------- |
| `category`      | 상의/아우터      | 분류 트리 루트~말단 | name, path, visibility        |
| `item`          | SKU-1234         | 마스터 상품         | sku, names{i18n}, status, uom |
| `variant_group` | 옵션군           | 색상/사이즈 등      | option_keys, rules            |
| `variant`       | SKU-1234-RED-M   | 변형(조합)          | variant_sku, barcode, price   |
| `bom`           | BOM 루트         | 조립식/세트 구성    | version, effective_from       |
| `bom_component` | 부품행           | 구성품, 수량/손실율 | component_id, qty, scrap_rate |
| `bundle`        | 번들/세트        | 묶음상품            | bundle_rules, pricing_mode    |
| `channel_map`   | POS/Online/Kiosk | 노출/가격/재고소스  | channel_id, publish_state     |

내부적으로 `node.type`으로 구분하고, 공통 식별자 `nodeId = type:id` 형식(예: `variant:8d1e…`)으로 충돌 방지.

---

## 🔁 핵심 상호작용(UX 패턴)

### 1. 지연 로딩(Lazy Load)

- 트리에서 ▸ 펼칠 때만 `/api/tree/{nodeId}/children` 호출
- 폴더형 노드(카테고리/BOM/옵션군)는 자식 수 미리보기 배지 표시

### 2. 가상 스크롤(Virtualized Tree)

- 1천~수만 노드도 스크롤 성능 유지

### 3. 드래그 & 드롭

- 카테고리 간 아이템 이동
- BOM 안에서 부품 재정렬/수량 드래그 변경
- 허용 규칙 매트릭스 적용(예: variant는 category로 직접 이동 금지)

### 4. 컨텍스트 메뉴(우클릭/… 아이콘)

- 노드별 액션: 추가/복제/비활성/보관/삭제/채널 연결/리비전 생성 등

### 5. 다중선택 + 일괄작업

- Shift/⌘ 다중 선택 → 채널 일괄 노출/가격 규칙 적용/태그 부여

### 6. 검색/필터

- 실시간 하이라이트(노드 자동 펼침)
- 필터: 상태(Draft/Published), 채널, 카테고리, 속성키

### 7. 브레드크럼 + 미니맵

- 현재 경로(카테고리→아이템→BOM) 노출
- 대규모 트리일 때 미니맵으로 빠른 점프

---

## 🔐 RBAC & 상태머신 연동

### 권한별 허용 액션

- **Staff**: 읽기/임시저장, BOM 수량 편집만
- **Manager**: 아이템/variant 추가·수정, 채널맵 편집
- **Admin**: BOM 구조 변경, 리비전/발행/보관

### 상태 전이

- 트리에서 배지로 표시: `Draft` / `InReview` / `Published` / `Archived`
- Published 상태에서 구조 필드 수정 시 "리비전 생성" 모달 유도

---

## 🧱 데이터 계약(API 요약)

### 1) 트리 루트/자식 로딩

```http
GET /api/tree?root=category:root&types=[category,item]
GET /api/tree/{nodeId}/children?types=[variant,variant_group,bom]
```

**응답 예시**:

```json
{
  "nodeId": "item:2b3e",
  "children": [
    {
      "nodeId": "variant_group:aa11",
      "type": "variant_group",
      "name": "옵션군",
      "hasChildren": true
    },
    { "nodeId": "bom:bb22", "type": "bom", "name": "BOM v1", "hasChildren": true }
  ],
  "paging": { "hasMore": false }
}
```

### 2) 노드 상세

```http
GET /api/nodes/{nodeId}          # 우측 패널 탭용 상세(스키마 by type)
PATCH /api/nodes/{nodeId}        # 부분 업데이트(권한/상태 체크)
```

### 3) DnD/구조 변경

```http
POST /api/tree/move              # { "source":"item:2b3e", "target":"category:tops" }
POST /api/bom/reorder            # { "bomId":"bom:bb22", "order":[...] }
POST /api/bom/add / remove / updateQty
```

### 4) 검증·발행

```http
POST /api/items/{id}/validate
POST /api/items/{id}/submit
POST /api/items/{id}/publish
```

**백엔드**: Supabase SDK로만 테이블 접근(직접 SQL 금지). 응답은 노드 공통 메타 + 타입별 payload를 준수.

---

## 🧩 우측 디테일 패널(탭 구성)

1. **기본정보**: sku, 이름(i18n), 카테고리, 태그
2. **가격/세금**: list/sale, currency, tax_class
3. **재고/단위**: uom, 안전재고, 시리얼/로트
4. **옵션/Variant**: 옵션키 정의, 조합 생성/개별 가격·바코드
5. **BOM**: 버전, 유효기간, 부품표(행 추가/삭제/수량/스크랩율), 대체부품
6. **채널 맵핑**: 채널별 노출 on/off, 가격 규칙, 재고 소스
7. **파일/이미지**: 미디어 업로드/라벨 템플릿
8. **감사/이력**: 변경 diff, 전이 로그

---

## ⚙️ 검증/비즈니스 규칙(발췌)

- `variant_sku` 전역 고유성, 조합 중복 금지
- BOM 순환 참조 금지(아이템↔부품 그래프 검증)
- 채널 노출 on 시 대표 이미지 필수
- Published 상태 구조 변경 시 리비전 분기 생성

---

## 🚀 성능/안정성 전략

- **노드 캐시(5~15s)**: 동일 노드 반복 조회 최소화
- **서버 페이징**: 자식이 많은 노드는 무한스크롤
- **트리 스냅샷**: 대량 이동/삭제 전 "스냅샷" 저장 후 롤백 가능
- **낙관적 UI + 서버 재검증**: DnD 후 서버 확정 응답으로 최종 정렬

---

## ♿ 접근성 & 국제화

- 키보드 탐색(↑↓/←→/Space/Enter), ARIA 트리 롤
- i18n: 노드 라벨·속성의 언어별 표시/편집, 미입력 언어는 fallback(ko)

---

## 📊 연동 시나리오(흐름 엔진/키오스크)

- BOM 변경 → `flows`에 "구성 변경 이벤트" 게시(차후 확장)
- 채널 맵핑에서 Kiosk 슬롯 미리보기(8×5): variant 매핑 상태 히트맵으로 표시
- 아이템/variant 발행 시 채널별 카탈로그 캐시 재생성 트리거

---

## 🧪 DoD 체크(요약)

- 1만+ 노드 환경에서 트리 스크롤 60fps 유지
- BOM 순환 참조 검출 100%
- DnD 권한·금지 케이스 정확
- Published 편집 시 리비전 강제
- 검색·필터 조합 시 200ms 내 결과 반영

---

## 📅 구현 로드맵

### Phase 1: 기본 트리 구조 (1~2주)

- [ ] 카테고리 트리 렌더링
- [ ] 지연 로딩(Lazy Load) 구현
- [ ] 기본 검색/필터

### Phase 2: 아이템/Variant 관리 (2~3주)

- [ ] 아이템 CRUD
- [ ] Variant 그룹/조합 생성
- [ ] 우측 디테일 패널 (기본정보, 가격)

### Phase 3: BOM 관리 (2~3주)

- [ ] BOM 트리 구조
- [ ] 부품 추가/삭제/수량 관리
- [ ] 순환 참조 검증

### Phase 4: 채널 맵핑 (1~2주)

- [ ] 채널별 노출 설정
- [ ] 가격 규칙
- [ ] Kiosk 슬롯 미리보기

### Phase 5: 성능 최적화 (1주)

- [ ] 가상 스크롤
- [ ] 캐싱 전략
- [ ] 대용량 데이터 테스트

### Phase 6: 드래그&드롭 + 일괄작업 (1~2주)

- [ ] 드래그&드롭 구현
- [ ] 다중 선택
- [ ] 일괄 작업

---

## 🔗 관련 문서

- [ADR-0001: Tech Stack](/docs/ADR/ADR-0001-tech-stack.md)
- [Architecture](/ARCHITECTURE.md)
- [Outbound MVP Flow](/docs/flows/outbound-mvp.md)

---

**최종 업데이트**: 2025-10-05  
**작성자**: Product Planning Team  
**승인**: Pending
