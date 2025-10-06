-- =============================================
-- BOM Components 테이블 제약 조건 추가
-- 무결성 보장: 중복 방지, 수량 검증, 순환 참조 방지
-- 작성일: 2025-10-06
-- 작성자: Backend Team
-- =============================================

-- 1. 중복 구성품 방지 (UNIQUE 제약)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_parent_component'
    ) THEN
        ALTER TABLE public.bom_components
        ADD CONSTRAINT unique_parent_component 
        UNIQUE (parent_item_id, component_item_id);
        
        RAISE NOTICE '✅ UNIQUE 제약 추가됨: unique_parent_component';
    ELSE
        RAISE NOTICE '⚠️ UNIQUE 제약 이미 존재: unique_parent_component';
    END IF;
END $$;

-- 2. 직접 순환 참조 방지 (CHECK 제약)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'no_self_reference'
    ) THEN
        ALTER TABLE public.bom_components
        ADD CONSTRAINT no_self_reference 
        CHECK (parent_item_id != component_item_id);
        
        RAISE NOTICE '✅ CHECK 제약 추가됨: no_self_reference';
    ELSE
        RAISE NOTICE '⚠️ CHECK 제약 이미 존재: no_self_reference';
    END IF;
END $$;

-- 3. 수량 유효성 검사 (CHECK 제약)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_quantity'
    ) THEN
        ALTER TABLE public.bom_components
        ADD CONSTRAINT valid_quantity 
        CHECK (quantity > 0 AND quantity <= 9999);
        
        RAISE NOTICE '✅ CHECK 제약 추가됨: valid_quantity';
    ELSE
        RAISE NOTICE '⚠️ CHECK 제약 이미 존재: valid_quantity';
    END IF;
END $$;

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_bom_parent 
ON public.bom_components(parent_item_id);

CREATE INDEX IF NOT EXISTS idx_bom_component 
ON public.bom_components(component_item_id);

-- 복합 인덱스 (순환 참조 체크 성능 향상)
CREATE INDEX IF NOT EXISTS idx_bom_parent_component 
ON public.bom_components(parent_item_id, component_item_id);

-- sequence 인덱스 (정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_bom_sequence 
ON public.bom_components(parent_item_id, sequence);

RAISE NOTICE '✅ 인덱스 추가 완료';

-- 5. 제약 확인 함수
CREATE OR REPLACE FUNCTION check_bom_constraints()
RETURNS TABLE(
    constraint_name TEXT,
    constraint_type TEXT,
    status TEXT,
    definition TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.conname::TEXT as constraint_name,
        CASE 
            WHEN c.contype = 'u' THEN 'UNIQUE'
            WHEN c.contype = 'c' THEN 'CHECK'
            WHEN c.contype = 'f' THEN 'FOREIGN KEY'
            WHEN c.contype = 'p' THEN 'PRIMARY KEY'
            ELSE c.contype::TEXT
        END as constraint_type,
        CASE 
            WHEN c.convalidated THEN 'VALID ✅'
            ELSE 'INVALID ❌'
        END::TEXT as status,
        pg_get_constraintdef(c.oid)::TEXT as definition
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'bom_components'
    AND c.contype IN ('u', 'c', 'f', 'p')
    ORDER BY c.contype, c.conname;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ 제약 확인 함수 생성 완료';

-- 6. 인덱스 확인 함수
CREATE OR REPLACE FUNCTION check_bom_indexes()
RETURNS TABLE(
    index_name TEXT,
    index_keys TEXT,
    index_type TEXT,
    table_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.relname::TEXT as index_name,
        pg_get_indexdef(i.oid)::TEXT as index_keys,
        am.amname::TEXT as index_type,
        t.relname::TEXT as table_name
    FROM pg_index ix
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_am am ON i.relam = am.oid
    WHERE t.relname = 'bom_components'
    AND i.relname LIKE 'idx_bom%'
    ORDER BY i.relname;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ 인덱스 확인 함수 생성 완료';

-- 7. 실행 예시 및 확인
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '마이그레이션 003 완료!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 제약 확인: SELECT * FROM check_bom_constraints();';
    RAISE NOTICE '📋 인덱스 확인: SELECT * FROM check_bom_indexes();';
    RAISE NOTICE '';
END $$;

-- 실행 예시:
-- SELECT * FROM check_bom_constraints();
-- SELECT * FROM check_bom_indexes();

-- 롤백 예시 (필요시):
-- ALTER TABLE public.bom_components DROP CONSTRAINT IF EXISTS unique_parent_component;
-- ALTER TABLE public.bom_components DROP CONSTRAINT IF EXISTS no_self_reference;
-- ALTER TABLE public.bom_components DROP CONSTRAINT IF EXISTS valid_quantity;
-- DROP INDEX IF EXISTS idx_bom_parent;
-- DROP INDEX IF EXISTS idx_bom_component;
-- DROP INDEX IF EXISTS idx_bom_parent_component;
-- DROP INDEX IF EXISTS idx_bom_sequence;
-- DROP FUNCTION IF EXISTS check_bom_constraints();
-- DROP FUNCTION IF EXISTS check_bom_indexes();
