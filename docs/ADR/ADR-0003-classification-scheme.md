# ADR-0003: 상품 분류 체계(Classification Scheme)를 설정 기반으로 도입

**Status:** Accepted  
**Date:** 2025-10-06  
**Deciders:** Development Team  
**Related:** ADR-0001 (Tech Stack)

---

## Context

### 현재 상황

- `item_type`이 하드코딩된 8가지 타입으로 고정
  - `FG` (완제품), `SF` (반제품), `MOD` (모듈), `PT` (부품), `RM` (원자재), `MR` (상품), `CS` (소모품), `PKG` (포장재)
- 고객(테넌트)마다 다른 용어/분류 체계 사용
  - 조립 업체: "반제품" 사용 안 함
  - 유통 업체: "번들" 타입 필요
  - 제조 업체: "사입 vs 생산" 구분 중요
- 현재 시스템은 "이 8가지로 쓰세요" 강요 → 유연성 부족

### 문제점

1. **용어 불일치**: 고객의 실제 업무 용어와 시스템 용어 차이
2. **경직성**: 새로운 분류 추가 시 코드 수정 필요
3. **국제화 제약**: 하드코딩된 라벨의 다국어 지원 어려움
4. **비즈니스 로직 혼재**: 타입별 동작(BOM 필수, 출고 로직)이 코드에 산재

---

## Decision

### 핵심 결정

**"라벨은 유연하게, 행동은 일관되게"** 원칙으로 **설정 기반 분류 체계(Classification Scheme)** 도입

### Phase 1: 단순형 스킴 고정 (지금 적용)

#### 1. 스킴 구조

```typescript
{
  id: 'simple',
  name: '단순형 (사입/조립/생산)',
  labels: [
    {
      code: 'PURCHASE',      // 내부 코드 (안정)
      name: {                // 라벨명 (유연)
        ko: '사입',
        en: 'Purchase',
        zh: '采购'
      },
      icon: '📦',
      behavior: {            // 행동 플래그 (로직 기준)
        requiresBOM: false,
        requiresRouting: false,
        isAssembly: false,
        isProduction: false,
        saleAllowed: true
      }
    },
    // ASSEMBLY, PRODUCTION ...
  ]
}
```

#### 2. 테넌트 설정

```sql
ALTER TABLE tenant_settings
ADD COLUMN classification_scheme VARCHAR(50) NOT NULL DEFAULT 'simple';
```

#### 3. 행동 플래그 정의

| Flag              | 의미                      | 적용 예     |
| ----------------- | ------------------------- | ----------- |
| `requiresBOM`     | BOM 필수                  | 조립, 생산  |
| `requiresRouting` | 공정/라우팅 필수          | 생산        |
| `isProduction`    | 생산지시/완제품입고 흐름  | 생산        |
| `isAssembly`      | 판매 시 하위부품 자동차감 | 조립        |
| `saleAllowed`     | 직접 판매 가능 여부       | 대부분 true |

---

## Rationale

### 선택 이유

1. **점진적 도입**
   - Phase 1: 설정 파일 기반 (DB 대변화 없음)
   - Phase 2: DB 기반 스킴 (필요 시)
   - Phase 3: 사용자 정의 (고객 요청 누적 시)

2. **관심사 분리**
   - **라벨**: 사용자가 보는 이름 (i18n 지원)
   - **코드**: 내부 식별자 (안정)
   - **행동**: 비즈니스 로직 (플래그)

3. **과도한 설계 회피**
   - 실제 ERP에서 분류 체계는 초기 설정 후 거의 변경 안 됨
   - 복잡한 매핑 마법사는 **실제 요구 발생 시** 구현

4. **성능 고려**
   - 플래그는 메모리 캐시 (FE/BE)
   - DB 조회 최소화

---

## Consequences

### 긍정적 영향 (✅)

1. **유연성 증가**
   - 고객별 용어 맞춤 가능
   - 새로운 분류 추가 용이

2. **국제화 개선**
   - 라벨명을 언어별로 관리

3. **코드 품질 향상**
   - 비즈니스 로직이 플래그 기반으로 통일
   - `if (type === 'FG')` → `if (flags.requiresBOM)`

4. **테스트 용이성**
   - 행동 플래그 단위 테스트 가능

### 부정적 영향 (⚠️)

1. **복잡도 증가**
   - 설정 파일 관리 필요
   - 플래그 의미를 개발자가 이해해야 함

2. **성능 오버헤드**
   - 스킴 로드 + 플래그 조회 (캐시로 완화)

3. **사용자 혼란 가능성**
   - "requiresBOM" 같은 기술 용어 노출 시 혼란
   - **완화**: UI는 업무 언어로 표현
     - ❌ "requiresBOM 플래그 활성화"
     - ✅ "제조 과정이 있나요? (부품 목록 필요)"

### 마이그레이션

#### Phase 1 (지금)

- **마이그레이션 불필요**
- 기존 `item_type` 데이터는 그대로 유지
- `classification_scheme` 기본값 `'simple'`
- 기존 타입 → 새 스킴 매핑:
  - `FG`, `SF` → `PRODUCTION`
  - `MOD`, `PT` → `ASSEMBLY`
  - `RM`, `MR`, `CS`, `PKG` → `PURCHASE`

#### Phase 2 이후

- 스킴 교체 시 매핑 마법사 제공
- Dry-run 프리뷰 → 영향도 확인 → 트랜잭션 적용
- 30일 롤백 지원

---

## Alternatives Considered

### 대안 1: 전면 사용자 정의 스킴 (DB 기반)

**장점**: 완전한 유연성  
**단점**:

- 과도한 복잡도
- 고객이 오설정 시 운영 혼란
- 실제 요구 빈도 낮음

**결정**: Phase 2 이후로 보류

### 대안 2: 기존 하드코딩 유지

**장점**: 단순함  
**단점**:

- 유연성 부족
- 다국어 지원 어려움
- 고객 요구 대응 불가

**결정**: 채택 안 함

### 대안 3: 라벨만 설정, 행동은 하드코딩

**장점**: 구현 간단  
**단점**:

- 라벨-행동 불일치 가능성
- 새로운 행동 추가 시 코드 수정 필요

**결정**: 채택 안 함 (행동 플래그 함께 관리)

---

## Implementation Plan

### Phase 1: 단순형 스킴 고정 (오늘 적용)

#### Backend

1. **설정 파일 생성**: `app/config/classification_schemes.py`
2. **테넌트 설정 컬럼 추가**:
   ```sql
   ALTER TABLE tenant_settings
   ADD COLUMN classification_scheme VARCHAR(50) NOT NULL DEFAULT 'simple';
   ```
3. **검증 로직 추가**:
   - `requiresBOM=true` → BOM 미연결 시 에러
   - `requiresRouting=true` → 공정 누락 시 에러
4. **API 응답에 스킴 정보 포함**

#### Frontend

1. **설정 파일 생성**: `src/shared/config/classification-schemes.ts`
2. **훅 구현**: `useClassificationScheme()`
3. **상품 등록/조회 UI 수정**:
   - 드롭다운: 활성 스킴 라벨
   - 필수 항목: 플래그 기반 동적 제어
4. **설정 페이지 추가**: "설정 → 분류 체계"

#### E2E 테스트

1. ✅ PURCHASE 저장/출고 정상
2. ✅ ASSEMBLY 저장 시 BOM 필수 검증
3. ✅ PRODUCTION 저장 시 공정 필수 검증
4. ✅ 통계/필터가 라벨 기준으로 일관 노출

### Phase 2: 스킴 교체 마법사 (필요 시)

- 트리거: 고객 5건 이상 "맞춤 라벨" 요청
- 구현: 매핑 마법사, Dry-run, 롤백

### Phase 3: 사용자 정의 스킴 (필요 시)

- 트리거: 특정 업종에서 표준 스킴으로 불충분
- 구현: 시스템 플래그 템플릿 기반 라벨 생성

---

## Definition of Done (DoD)

### 필수 조건

- [ ] ADR 문서 작성 완료
- [ ] Backend 설정 파일 생성 및 테스트
- [ ] Frontend 설정 파일 생성 및 훅 구현
- [ ] 상품 등록/조회 페이지에 통합
- [ ] E2E 테스트 4건 통과
- [ ] 운영 지표 수집 시작
  - 저장 실패 사유 분포
  - 분류별 출고 이벤트 수
  - 평균 저장/출고 p95 < 500ms

### 수용 기준 (AC)

- [ ] 테넌트별 활성 스킴을 읽어 상품 등록/조회/출고가 플래그대로 동작
- [ ] BOM/공정 필수 검증이 폼 저장·API 모두에서 일관 적용
- [ ] 기존 데이터/화면에 마이그레이션 필요 없음
- [ ] 대시보드/리포트가 라벨 기준으로 즉시 필터 가능

---

## Monitoring

### 주요 지표

1. **저장 실패율**
   - BOM 누락으로 인한 실패 (ASSEMBLY/PRODUCTION)
   - 공정 누락으로 인한 실패 (PRODUCTION)

2. **성능**
   - 상품 등록 평균 응답 시간
   - 상품 조회 p95 응답 시간

3. **사용 패턴**
   - 분류별 상품 수 분포
   - 분류별 출고 이벤트 빈도

### 알림 임계값

- 저장 실패율 > 5% → 검증 로직 재검토
- p95 응답 시간 > 500ms → 캐시 최적화

---

## References

- [ERP Item Classification Best Practices](https://example.com)
- SAP Material Type Configuration
- Oracle Item Class Setup Guide
- ADR-0001: Tech Stack
- Phase 1 Implementation Checklist

---

## Changelog

- **2025-10-06**: Initial version (Phase 1)
- **TBD**: Phase 2 update (스킴 교체)
- **TBD**: Phase 3 update (사용자 정의)
