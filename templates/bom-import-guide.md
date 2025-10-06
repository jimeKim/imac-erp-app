# BOM Excel Import 템플릿 사용 가이드

**버전:** v1.0  
**작성일:** 2025-10-06

---

## 📋 템플릿 다운로드

### CSV 템플릿 (간단)

- **파일:** `bom-import-template.csv`
- **용도:** 간단한 BOM 데이터 입력
- **장점:** 텍스트 에디터로 편집 가능

### Excel 템플릿 (권장)

Excel 템플릿은 다음 방법으로 생성하세요:

1. **Excel/Google Sheets 열기**
2. **헤더 행 입력** (첫 번째 행):

   ```
   parent_code | child_code | quantity | unit | notes
   ```

3. **데이터 입력 예시**:

   ```
   FG-001 | MOD-LCD    | 1 | EA | LCD 모듈
   FG-001 | MOD-POWER  | 1 | EA | 전원 모듈 (SMPS)
   FG-001 | PT-STAND   | 1 | EA | 모니터 스탠드
   ```

4. **Excel 파일로 저장** (.xlsx)

---

## 📊 컬럼 설명

### 필수 컬럼 (❗ Required)

#### 1. parent_code (상위 상품 코드)

- **설명:** 구성품을 포함하는 상위 상품의 SKU 코드
- **형식:** 텍스트 (공백 없음)
- **예시:** `FG-001`, `MOD-LCD`, `SF-BATTERY`
- **규칙:**
  - 대소문자 무시 (`fg-001` = `FG-001`)
  - 시스템에 등록된 상품만 가능
  - 존재하지 않는 코드 → 에러

#### 2. child_code (하위 구성품 코드)

- **설명:** 추가할 구성품의 SKU 코드
- **형식:** 텍스트 (공백 없음)
- **예시:** `PT-PANEL`, `RM-STEEL`, `CS-SCREW`
- **규칙:**
  - 시스템에 등록된 상품만 가능
  - `parent_code`와 같을 수 없음 (순환 참조)
  - 이미 등록된 구성품 → 경고 (수량 업데이트 옵션)

#### 3. quantity (수량)

- **설명:** 구성품의 수량
- **형식:** 숫자 (양수, 소수점 4자리까지)
- **예시:** `1`, `2.5`, `0.125`
- **규칙:**
  - 최소값: 0보다 큼 (0.0001)
  - 최대값: 9999
  - 소수점: 최대 4자리
  - 음수 또는 0 → 에러

### 선택 컬럼 (📌 Optional)

#### 4. unit (단위)

- **설명:** 수량의 단위
- **형식:** 텍스트 (최대 10자)
- **기본값:** `EA` (개)
- **예시:** `EA`, `KG`, `M`, `L`, `SET`
- **규칙:**
  - 생략 시 `EA` 자동 설정
  - 대소문자 무시

#### 5. notes (메모)

- **설명:** 구성품에 대한 추가 설명
- **형식:** 텍스트 (최대 500자)
- **예시:** `27인치 IPS 패널`, `고강도 강철 사용`
- **규칙:**
  - 생략 가능
  - 500자 초과 → 에러

---

## ✅ 데이터 입력 규칙

### 1. 형식 검증 (Level 1)

다음 조건을 만족해야 합니다:

- [ ] 필수 컬럼 모두 입력 (`parent_code`, `child_code`, `quantity`)
- [ ] `quantity`는 0보다 크고 9999 이하
- [ ] `quantity`는 소수점 4자리 이하
- [ ] `parent_code`, `child_code`에 공백 없음

**결과:** 조건 미충족 시 → **즉시 에러**, 파일 수정 후 재업로드 필요

---

### 2. 데이터 검증 (Level 2)

다음 조건을 확인합니다:

- [ ] `parent_code`가 시스템에 존재하는 상품인지
- [ ] `child_code`가 시스템에 존재하는 상품인지
- [ ] 동일한 `parent_code + child_code` 조합이 중복되지 않는지
- [ ] 직접 순환 참조 없는지 (`parent_code` ≠ `child_code`)
- [ ] 간접 순환 참조 없는지 (A → B → C → A)

**결과:** 조건 미충족 시 → **경고**, 부분 성공 가능

---

### 3. 비즈니스 규칙 (Level 3)

다음 조건을 권장합니다:

- [ ] 동일 `parent_code`에 이미 등록된 `child_code`가 없는지
- [ ] `quantity`가 과도하게 크지 않은지 (> 1000)
- [ ] `unit`이 일반적인 단위인지 (`EA`, `KG`, `M` 등)

**결과:** 조건 미충족 시 → **경고**, 사용자 확인 후 진행

---

## 📝 입력 예시

### 예시 1: 간단한 완제품 BOM (LCD 모니터)

```csv
parent_code,child_code,quantity,unit,notes
FG-MONITOR-001,MOD-LCD,1,EA,LCD 모듈
FG-MONITOR-001,MOD-POWER,1,EA,전원 모듈
FG-MONITOR-001,PT-STAND,1,EA,모니터 스탠드
FG-MONITOR-001,PKG-BOX,1,EA,포장 박스
```

---

### 예시 2: 계층 구조 BOM (모듈 포함)

```csv
parent_code,child_code,quantity,unit,notes
FG-MONITOR-001,MOD-LCD,1,EA,LCD 모듈
FG-MONITOR-001,MOD-POWER,1,EA,전원 모듈
MOD-LCD,PT-PANEL,1,EA,액정 패널 27인치
MOD-LCD,PT-BACKLIGHT,1,EA,백라이트 유닛
MOD-LCD,PT-CONTROLLER,1,EA,LCD 컨트롤러
MOD-POWER,PT-ACDC,1,EA,AC/DC 컨버터
MOD-POWER,PT-CABLE,1,EA,전원 케이블
MOD-POWER,PT-CONNECTOR,2,EA,전원 커넥터 (2개 필요)
```

---

### 예시 3: 소수점 수량 (원자재)

```csv
parent_code,child_code,quantity,unit,notes
SF-BATTERY,RM-LITHIUM,0.125,KG,리튬 0.125kg
SF-BATTERY,RM-ELECTROLYTE,0.05,L,전해질 50ml
SF-BATTERY,PT-CASE,1,EA,배터리 케이스
```

---

## 🚨 흔한 에러 및 해결 방법

### 에러 1: "구성품 PT-XXX를 찾을 수 없습니다"

**원인:** `child_code`가 시스템에 등록되지 않음  
**해결:**

1. 상품 관리 → 상품 등록 메뉴에서 해당 상품 먼저 등록
2. SKU 코드 오타 확인 (대소문자는 무관)
3. 등록 후 다시 Import 시도

---

### 에러 2: "순환 참조가 발생합니다"

**원인:** A → B → C → A 같은 순환 구조  
**해결:**

1. BOM 구조 재설계 (순환이 없도록)
2. 해당 행 제거 또는 수정
3. 예시:

   ```
   잘못된 구조:
   A → B
   B → C
   C → A ❌ (순환!)

   올바른 구조:
   A → B
   A → C
   B → D ✅
   ```

---

### 에러 3: "이미 등록된 구성품입니다"

**원인:** 동일한 `parent_code + child_code` 조합이 이미 시스템에 존재  
**해결 옵션:**

1. **Skip (건너뛰기):** 기존 데이터 유지
2. **Update (업데이트):** 수량을 새 값으로 덮어쓰기
3. **Cancel (취소):** Import 중단

---

### 에러 4: "수량은 0보다 크고 9999 이하여야 합니다"

**원인:** `quantity` 값이 범위를 벗어남  
**해결:**

- `0` 또는 음수 → `0.01` 이상으로 수정
- `10000` 이상 → `9999` 이하로 수정
- 단위 변경 고려 (예: `10000 EA` → `10 KG`)

---

## 📊 Import 프로세스

### 단계 1: 파일 업로드

1. "Excel Import" 버튼 클릭
2. 파일 선택 또는 Drag & Drop
3. 허용 형식: `.xlsx`, `.xls`
4. 최대 크기: 10MB, 1,000 rows

---

### 단계 2: 미리보기

1. 총 행 수 확인
2. 유효/에러 행 요약
3. 상위 10행 미리보기
4. 에러 행 빨간색 하이라이트

---

### 단계 3: 검증

1. 형식 검증 (Level 1)
2. 데이터 검증 (Level 2)
3. 비즈니스 규칙 (Level 3)
4. 검증 결과 리포트 표시

---

### 단계 4: 확정

1. 성공/실패/경고 건수 확인
2. 에러 리포트 다운로드 (선택)
3. "확정" 버튼 클릭
4. 유효한 행만 시스템에 반영

---

## 💡 팁 및 모범 사례

### 1. 단계별 Import

**대량 데이터 입력 시:**

1. 상위 항목 먼저 Import (FG, SF)
2. 중간 모듈 Import (MOD)
3. 하위 부품 Import (PT, RM)

**장점:** 순환 참조 에러 최소화

---

### 2. 에러 리포트 활용

**Import 실패 시:**

1. "에러 리포트 다운로드" 클릭
2. Excel에서 열기
3. `status` 컬럼에서 `error` 행만 필터링
4. `reason` 컬럼에서 에러 원인 확인
5. 수정 후 재업로드

---

### 3. 템플릿 재사용

**자주 사용하는 BOM 구조:**

1. 템플릿에 데이터 입력 후 저장
2. 다음 Import 시 템플릿 복사 후 수정
3. 버전 관리 (예: `bom_template_v1.xlsx`)

---

### 4. 검증 전 확인사항

**Import 전 체크리스트:**

- [ ] 모든 상품이 시스템에 등록되어 있는지
- [ ] SKU 코드 오타 없는지
- [ ] 수량 단위가 일관성 있는지
- [ ] 순환 참조 가능성 검토
- [ ] 백업 완료 (중요한 경우)

---

## 🔗 관련 문서

- [Phase 3 Excel Import PRD](../docs/features/phase3-excel-import-prd.md)
- [BOM 구조 설명](../docs/flows/item-type-classification.md)
- [상품 유형 가이드](../docs/features/item-type-settings.md)

---

## 📞 문의

**기술 지원:** dev-team@example.com  
**사용 문의:** support@example.com

---

**문서 버전:** v1.0  
**최종 수정:** 2025-10-06  
**담당자:** Product Team
