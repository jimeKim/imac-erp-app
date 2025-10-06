# 🗄️ Supabase 마이그레이션 가이드

**작성일**: 2025-10-06  
**소요 시간**: 5분  
**대상**: Outbounds 테이블 생성

---

## 📋 마이그레이션 내용

이 마이그레이션은 다음을 생성합니다:

1. **outbounds** 테이블 - 출고 문서
2. **outbound_items** 테이블 - 출고 라인 아이템
3. **flows** 테이블 - 상태 전이 기록
4. 인덱스 (6개)
5. 트리거 (updated_at 자동 업데이트)
6. RLS 정책
7. 샘플 데이터 (3개 문서)

---

## 🚀 실행 방법

### Step 1: Supabase Dashboard 접속

1. 브라우저에서 접속:

   ```
   https://supabase.com/dashboard
   ```

2. 프로젝트 선택:
   ```
   Project: qijwwiijpkqzmlamdtmd
   ```

### Step 2: SQL Editor 열기

1. 좌측 메뉴에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭

### Step 3: SQL 복사 붙여넣기

아래 SQL을 복사하여 SQL Editor에 붙여넣기:

```sql
-- =====================================================
-- Outbounds 테이블 마이그레이션
-- 작성일: 2025-10-06
-- 설명: 출고 관리 시스템 테이블 생성
-- =====================================================

-- 1. outbounds 테이블 (출고 문서)
CREATE TABLE IF NOT EXISTS outbounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outbound_no TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    store_id UUID NULL,
    customer_id UUID NULL,
    memo TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 상태 제약조건
    CONSTRAINT outbounds_status_check
        CHECK (status IN ('DRAFT', 'CONFIRMED', 'POSTED', 'CANCELED'))
);

-- 2. outbound_items 테이블 (출고 라인)
CREATE TABLE IF NOT EXISTS outbound_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outbound_id UUID NOT NULL REFERENCES outbounds(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    qty NUMERIC(18, 4) NOT NULL CHECK (qty > 0),
    unit_price NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. flows 테이블 (상태 전이 기록) - 없다면 생성
CREATE TABLE IF NOT EXISTS flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    from_status TEXT NULL,
    to_status TEXT NOT NULL,
    actor TEXT NULL,
    payload JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_outbounds_status ON outbounds(status);
CREATE INDEX IF NOT EXISTS idx_outbounds_outbound_no ON outbounds(outbound_no);
CREATE INDEX IF NOT EXISTS idx_outbounds_created_at ON outbounds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outbound_items_outbound_id ON outbound_items(outbound_id);
CREATE INDEX IF NOT EXISTS idx_outbound_items_item_id ON outbound_items(item_id);
CREATE INDEX IF NOT EXISTS idx_flows_entity ON flows(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_flows_created_at ON flows(created_at DESC);

-- 5. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_outbounds_updated_at
    BEFORE UPDATE ON outbounds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outbound_items_updated_at
    BEFORE UPDATE ON outbound_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS (Row Level Security) 활성화
ALTER TABLE outbounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 (인증된 사용자만 접근)
CREATE POLICY "Allow authenticated users to read outbounds"
    ON outbounds FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read outbound_items"
    ON outbound_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read flows"
    ON flows FOR SELECT
    TO authenticated
    USING (true);

-- 8. 샘플 데이터 (개발/테스트용)
INSERT INTO outbounds (outbound_no, status, memo) VALUES
    ('20251006-0001', 'DRAFT', '테스트 출고 문서 1'),
    ('20251006-0002', 'CONFIRMED', '테스트 출고 문서 2'),
    ('20251006-0003', 'POSTED', '테스트 출고 문서 3')
ON CONFLICT (outbound_no) DO NOTHING;

-- 마이그레이션 완료
COMMENT ON TABLE outbounds IS '출고 문서 테이블';
COMMENT ON TABLE outbound_items IS '출고 라인 아이템 테이블';
COMMENT ON TABLE flows IS '상태 전이 기록 테이블';
```

### Step 4: 실행

1. **RUN** 버튼 클릭 (또는 `Cmd/Ctrl + Enter`)
2. 실행 완료 대기 (약 5초)

### Step 5: 검증

```sql
-- 테이블 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('outbounds', 'outbound_items', 'flows');

-- 샘플 데이터 확인
SELECT * FROM outbounds;
```

---

## ✅ 성공 확인

실행 후 다음이 표시되어야 합니다:

```
Success. No rows returned
```

또는

```
Rows affected: 3
```

---

## 🔍 테이블 구조 확인

### outbounds 테이블

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'outbounds'
ORDER BY ordinal_position;
```

**기대 결과**:

- id (uuid)
- outbound_no (text)
- status (text)
- store_id (uuid)
- customer_id (uuid)
- memo (text)
- created_at (timestamptz)
- updated_at (timestamptz)

### outbound_items 테이블

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'outbound_items'
ORDER BY ordinal_position;
```

**기대 결과**:

- id (uuid)
- outbound_id (uuid)
- item_id (uuid)
- qty (numeric)
- unit_price (numeric)
- created_at (timestamptz)
- updated_at (timestamptz)

### flows 테이블

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'flows'
ORDER BY ordinal_position;
```

---

## 🧪 API 테스트

마이그레이션 완료 후 API 테스트:

```bash
# 1. Outbounds 목록 조회
curl http://139.59.110.55/api/v1/outbounds/ | jq .

# 기대 결과: 샘플 데이터 3개 반환
# {
#   "data": [
#     {"outbound_no": "20251006-0003", "status": "POSTED", ...},
#     {"outbound_no": "20251006-0002", "status": "CONFIRMED", ...},
#     {"outbound_no": "20251006-0001", "status": "DRAFT", ...}
#   ],
#   "total": 3,
#   "page": 1,
#   "size": 20
# }
```

---

## 🐛 트러블슈팅

### 에러: "relation already exists"

**원인**: 테이블이 이미 존재함  
**해결**: `CREATE TABLE IF NOT EXISTS`를 사용했으므로 무시 가능

### 에러: "duplicate key value violates unique constraint"

**원인**: 샘플 데이터가 이미 존재함  
**해결**: `ON CONFLICT DO NOTHING`을 사용했으므로 무시 가능

### 에러: "permission denied"

**원인**: Service Role Key가 아닌 Anon Key 사용  
**해결**: Supabase Dashboard에서 실행 (자동으로 올바른 권한 사용)

---

## 🗑️ 롤백 (필요시)

마이그레이션을 되돌리려면:

```sql
-- 주의: 모든 데이터가 삭제됩니다!
DROP TABLE IF EXISTS outbound_items CASCADE;
DROP TABLE IF EXISTS outbounds CASCADE;
DROP TABLE IF EXISTS flows CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

---

## 📝 다음 단계

마이그레이션 완료 후:

1. ✅ API 테스트 실행
2. ✅ 프론트엔드에서 Outbounds 페이지 확인
3. ✅ 샘플 데이터로 워크플로우 테스트

---

**작성**: 2025-10-06  
**Status**: 🟢 Ready to Execute
