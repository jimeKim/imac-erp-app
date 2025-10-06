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
-- 실제 운영에서는 이 부분을 제거하세요
INSERT INTO outbounds (outbound_no, status, memo) VALUES
    ('20251006-0001', 'DRAFT', '테스트 출고 문서 1'),
    ('20251006-0002', 'CONFIRMED', '테스트 출고 문서 2'),
    ('20251006-0003', 'POSTED', '테스트 출고 문서 3')
ON CONFLICT (outbound_no) DO NOTHING;

-- 마이그레이션 완료
COMMENT ON TABLE outbounds IS '출고 문서 테이블';
COMMENT ON TABLE outbound_items IS '출고 라인 아이템 테이블';
COMMENT ON TABLE flows IS '상태 전이 기록 테이블';
