# DB 마이그레이션 실행 가이드

**마이그레이션:** 003_bom_constraints.sql  
**목적:** BOM 테이블 제약 조건 및 인덱스 추가  
**예상 시간:** 15분

---

## 🎯 마이그레이션 목표

### 추가할 제약 조건
1. **unique_parent_component** (UNIQUE)
   - 동일 부모-자식 조합 중복 방지
   - `(parent_item_id, component_item_id)` 유니크

2. **no_self_reference** (CHECK)
   - 자기 자신을 구성품으로 추가 방지
   - `parent_item_id != component_item_id`

3. **valid_quantity** (CHECK)
   - 수량 유효성 검증
   - `quantity > 0 AND quantity <= 9999`

### 추가할 인덱스
1. **idx_bom_parent** - 부모 ID 인덱스
2. **idx_bom_component** - 구성품 ID 인덱스
3. **idx_bom_parent_component** - 복합 인덱스
4. **idx_bom_sequence** - 정렬 인덱스

---

## 📋 사전 확인 (Pre-check)

### Step 1: Supabase 접속
```
1. 브라우저에서 https://supabase.com 접속
2. 로그인 (Google/GitHub 계정)
3. 프로젝트 목록에서 ERP 프로젝트 선택
4. 좌측 메뉴 → SQL Editor 클릭
```

### Step 2: 현재 테이블 확인
```sql
-- bom_components 테이블 존재 확인
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'bom_components';
```

**예상 결과:**
```
table_name      | table_type
----------------|------------
bom_components  | BASE TABLE
```

### Step 3: 현재 제약 확인
```sql
-- 기존 제약 조건 확인
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'bom_components'
AND table_schema = 'public';
```

**예상 결과:** (기본 제약만 존재)
```
constraint_name                | constraint_type
-------------------------------|----------------
bom_components_pkey            | PRIMARY KEY
```

---

## 🚀 마이그레이션 실행 (Main)

### Step 1: 마이그레이션 파일 복사

#### 로컬에서 파일 확인
```bash
cd /Users/kjimi/Documents/GitHub/imac-erp-app
cat backend/supabase/migrations/003_bom_constraints.sql
```

#### 전체 내용 복사
- 파일 전체 선택 (Cmd+A)
- 복사 (Cmd+C)

---

### Step 2: Supabase SQL Editor에서 실행

#### 2-1. 새 쿼리 생성
```
1. SQL Editor 화면에서 "New query" 버튼 클릭
2. 쿼리 이름: "003_bom_constraints"
3. 복사한 SQL 내용 붙여넣기 (Cmd+V)
```

#### 2-2. 실행 전 검증
- [ ] `ALTER TABLE` 구문 확인
- [ ] `CREATE INDEX IF NOT EXISTS` 구문 확인
- [ ] `CREATE OR REPLACE FUNCTION` 구문 확인
- [ ] 오타 없는지 확인

#### 2-3. 실행
```
1. 우측 하단 "Run" 버튼 클릭 (또는 Cmd+Enter)
2. 실행 진행 상황 확인
3. 완료까지 대기 (약 5-10초)
```

---

### Step 3: 실행 결과 확인

#### 3-1. 성공 메시지 확인
**예상 출력:**
```
NOTICE:  ✅ UNIQUE 제약 추가됨: unique_parent_component
NOTICE:  ✅ CHECK 제약 추가됨: no_self_reference
NOTICE:  ✅ CHECK 제약 추가됨: valid_quantity
NOTICE:  ✅ 인덱스 추가 완료
NOTICE:  ✅ 제약 확인 함수 생성 완료
NOTICE:  ✅ 인덱스 확인 함수 생성 완료
NOTICE:  
NOTICE:  ========================================
NOTICE:  마이그레이션 003 완료!
NOTICE:  ========================================
```

#### 3-2. 에러 발생 시
**에러 예시 1: 제약 이미 존재**
```
NOTICE:  ⚠️ UNIQUE 제약 이미 존재: unique_parent_component
```
**해결:** 정상 (멱등성 보장, 이미 실행된 경우)

**에러 예시 2: 테이블 없음**
```
ERROR:  relation "bom_components" does not exist
```
**해결:** 먼저 `002_bom_tables.sql` 실행 필요

**에러 예시 3: 권한 부족**
```
ERROR:  permission denied for table bom_components
```
**해결:** Supabase 프로젝트 Owner 계정으로 로그인

---

## ✅ 검증 (Validation)

### Step 1: 제약 조건 확인
```sql
SELECT * FROM check_bom_constraints();
```

**예상 결과:**
```
constraint_name           | constraint_type | status    | definition
--------------------------|-----------------|-----------|---------------------------
unique_parent_component   | UNIQUE          | VALID ✅  | UNIQUE (parent_item_id, component_item_id)
no_self_reference         | CHECK           | VALID ✅  | CHECK ((parent_item_id <> component_item_id))
valid_quantity            | CHECK           | VALID ✅  | CHECK (((quantity > 0) AND (quantity <= 9999)))
```

**검증 포인트:**
- [ ] 제약 3개 모두 표시
- [ ] status 컬럼 모두 "VALID ✅"
- [ ] constraint_type 정확함

---

### Step 2: 인덱스 확인
```sql
SELECT * FROM check_bom_indexes();
```

**예상 결과:**
```
index_name               | index_keys                                 | index_type | table_name
-------------------------|--------------------------------------------|-----------|-----------------
idx_bom_parent           | CREATE INDEX ... (parent_item_id)          | btree     | bom_components
idx_bom_component        | CREATE INDEX ... (component_item_id)       | btree     | bom_components
idx_bom_parent_component | CREATE INDEX ... (parent_item_id, ...)     | btree     | bom_components
idx_bom_sequence         | CREATE INDEX ... (parent_item_id, sequence)| btree     | bom_components
```

**검증 포인트:**
- [ ] 인덱스 4개 모두 표시
- [ ] index_type 모두 "btree"
- [ ] table_name 모두 "bom_components"

---

### Step 3: 제약 동작 테스트

#### 테스트 1: 중복 방지 (unique_parent_component)
```sql
-- 테스트 데이터 삽입
INSERT INTO bom_components (parent_item_id, component_item_id, quantity)
VALUES ('test-parent-1', 'test-child-1', 1);

-- 동일 조합 재삽입 시도 (실패해야 정상)
INSERT INTO bom_components (parent_item_id, component_item_id, quantity)
VALUES ('test-parent-1', 'test-child-1', 1);
```

**예상 결과:**
```
ERROR:  duplicate key value violates unique constraint "unique_parent_component"
DETAIL:  Key (parent_item_id, component_item_id)=(test-parent-1, test-child-1) already exists.
```

**검증:**
- [ ] 두 번째 INSERT 실패
- [ ] 에러 메시지에 "unique_parent_component" 포함

#### 테스트 2: 자기 참조 방지 (no_self_reference)
```sql
-- 자기 자신 참조 시도 (실패해야 정상)
INSERT INTO bom_components (parent_item_id, component_item_id, quantity)
VALUES ('test-parent-2', 'test-parent-2', 1);
```

**예상 결과:**
```
ERROR:  new row for relation "bom_components" violates check constraint "no_self_reference"
DETAIL:  Failing row contains (test-parent-2, test-parent-2, 1, ...).
```

**검증:**
- [ ] INSERT 실패
- [ ] 에러 메시지에 "no_self_reference" 포함

#### 테스트 3: 수량 유효성 (valid_quantity)
```sql
-- 수량 0 시도 (실패해야 정상)
INSERT INTO bom_components (parent_item_id, component_item_id, quantity)
VALUES ('test-parent-3', 'test-child-3', 0);

-- 수량 10000 시도 (실패해야 정상)
INSERT INTO bom_components (parent_item_id, component_item_id, quantity)
VALUES ('test-parent-4', 'test-child-4', 10000);
```

**예상 결과:**
```
ERROR:  new row for relation "bom_components" violates check constraint "valid_quantity"
```

**검증:**
- [ ] 두 INSERT 모두 실패
- [ ] 에러 메시지에 "valid_quantity" 포함

#### 테스트 데이터 정리
```sql
-- 테스트 데이터 삭제
DELETE FROM bom_components WHERE parent_item_id LIKE 'test-%';
```

---

## 📊 성능 확인

### Step 1: 인덱스 크기 확인
```sql
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) AS index_size
FROM pg_indexes
WHERE tablename = 'bom_components'
AND indexname LIKE 'idx_bom%';
```

**예상 결과:**
```
indexname                | index_size
-------------------------|------------
idx_bom_parent           | 16 kB
idx_bom_component        | 16 kB
idx_bom_parent_component | 16 kB
idx_bom_sequence         | 16 kB
```

**검증:**
- [ ] 모든 인덱스 크기 < 1 MB (초기 단계)

---

### Step 2: 쿼리 실행 계획 확인
```sql
-- 부모 ID로 검색 (인덱스 사용 확인)
EXPLAIN ANALYZE
SELECT * FROM bom_components
WHERE parent_item_id = 'test-id';
```

**예상 결과:**
```
Index Scan using idx_bom_parent on bom_components
  (cost=0.00..8.27 rows=1 width=...)
  Index Cond: (parent_item_id = 'test-id'::text)
  Planning Time: 0.123 ms
  Execution Time: 0.045 ms
```

**검증:**
- [ ] "Index Scan using idx_bom_parent" 표시
- [ ] Execution Time < 1ms

---

## 🔄 롤백 (Rollback)

### 언제 롤백하나?
- [ ] 제약 추가 후 기존 데이터 위반 발견
- [ ] 성능 심각한 저하 발생
- [ ] 애플리케이션 오류 다발

### 롤백 SQL
```sql
-- 제약 조건 제거
ALTER TABLE public.bom_components 
  DROP CONSTRAINT IF EXISTS unique_parent_component;

ALTER TABLE public.bom_components 
  DROP CONSTRAINT IF EXISTS no_self_reference;

ALTER TABLE public.bom_components 
  DROP CONSTRAINT IF EXISTS valid_quantity;

-- 인덱스 제거
DROP INDEX IF EXISTS idx_bom_parent;
DROP INDEX IF EXISTS idx_bom_component;
DROP INDEX IF EXISTS idx_bom_parent_component;
DROP INDEX IF EXISTS idx_bom_sequence;

-- 함수 제거
DROP FUNCTION IF EXISTS check_bom_constraints();
DROP FUNCTION IF EXISTS check_bom_indexes();
```

---

## 📝 완료 보고

### 마이그레이션 결과
- **실행 일시:** _____________________
- **실행자:** _____________________
- **소요 시간:** _____________________

### 체크리스트
- [ ] 제약 3개 추가 완료
- [ ] 인덱스 4개 생성 완료
- [ ] 제약 동작 테스트 통과
- [ ] 성능 확인 완료
- [ ] 문서 업데이트 완료

### 이슈 및 대응
1. ___________________________________________________
2. ___________________________________________________

---

## 🔗 관련 문서

- [Go/No-Go 체크리스트](./go-no-go-checklist.md)
- [배포 전 체크리스트](./pre-deployment-checklist.md)
- [모니터링 대시보드](./monitoring-dashboard.md)

---

**작성일:** 2025-10-06  
**최종 수정:** 2025-10-06  
**담당자:** Database Team
