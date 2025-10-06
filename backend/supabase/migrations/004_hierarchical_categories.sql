-- =============================================================================
-- Migration: 004_hierarchical_categories
-- Description: 카테고리 계층 구조 추가
-- Date: 2025-10-06
-- =============================================================================

-- 1. categories 테이블에 계층 구조 컬럼 추가
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS path TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS sequence INTEGER DEFAULT 0;

-- 2. 인덱스 추가 (계층 조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_path ON categories(path);
CREATE INDEX IF NOT EXISTS idx_categories_sequence ON categories(sequence);

-- 3. 기존 카테고리를 루트 레벨로 설정
WITH ranked_categories AS (
    SELECT 
        id,
        name,
        ROW_NUMBER() OVER (ORDER BY name) as seq
    FROM categories
    WHERE parent_id IS NULL
)
UPDATE categories c
SET 
    level = 0, 
    path = '/' || c.name,
    sequence = rc.seq
FROM ranked_categories rc
WHERE c.id = rc.id;

-- 4. 계층 구조 검증 함수 (무한 루프 방지)
CREATE OR REPLACE FUNCTION check_category_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    v_depth INTEGER := 0;
    v_current_id UUID := NEW.parent_id;
    v_max_depth INTEGER := 10;
BEGIN
    -- 자기 자신을 부모로 설정하는 것 방지
    IF NEW.parent_id = NEW.id THEN
        RAISE EXCEPTION 'Category cannot be its own parent';
    END IF;
    
    -- 부모가 없으면 (루트 카테고리) OK
    IF NEW.parent_id IS NULL THEN
        NEW.level := 0;
        NEW.path := '/' || NEW.name;
        RETURN NEW;
    END IF;
    
    -- 부모 체인 검증 (순환 참조 방지)
    WHILE v_current_id IS NOT NULL AND v_depth < v_max_depth LOOP
        -- 순환 참조 체크
        IF v_current_id = NEW.id THEN
            RAISE EXCEPTION 'Circular reference detected in category hierarchy';
        END IF;
        
        -- 다음 부모로 이동
        SELECT parent_id INTO v_current_id 
        FROM categories 
        WHERE id = v_current_id;
        
        v_depth := v_depth + 1;
    END LOOP;
    
    -- 최대 깊이 체크
    IF v_depth >= v_max_depth THEN
        RAISE EXCEPTION 'Category hierarchy depth exceeds maximum (%) levels', v_max_depth;
    END IF;
    
    -- level과 path 자동 계산
    SELECT c.level + 1, c.path || '/' || NEW.name
    INTO NEW.level, NEW.path
    FROM categories c
    WHERE c.id = NEW.parent_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 트리거 생성 (INSERT/UPDATE 시 자동 검증)
DROP TRIGGER IF EXISTS trg_check_category_hierarchy ON categories;
CREATE TRIGGER trg_check_category_hierarchy
    BEFORE INSERT OR UPDATE OF parent_id, name
    ON categories
    FOR EACH ROW
    EXECUTE FUNCTION check_category_hierarchy();

-- 6. 하위 카테고리 경로 업데이트 함수
CREATE OR REPLACE FUNCTION update_category_paths()
RETURNS TRIGGER AS $$
BEGIN
    -- 카테고리 이름이나 부모가 변경되면 모든 하위 카테고리 경로 업데이트
    IF (TG_OP = 'UPDATE' AND (OLD.name != NEW.name OR OLD.parent_id IS DISTINCT FROM NEW.parent_id)) THEN
        WITH RECURSIVE category_tree AS (
            -- 변경된 카테고리의 직계 자식
            SELECT id, parent_id, name, level, path
            FROM categories
            WHERE parent_id = NEW.id
            
            UNION ALL
            
            -- 재귀적으로 모든 하위 카테고리
            SELECT c.id, c.parent_id, c.name, c.level, c.path
            FROM categories c
            INNER JOIN category_tree ct ON c.parent_id = ct.id
        )
        UPDATE categories c
        SET 
            level = p.level + 1,
            path = p.path || '/' || c.name
        FROM categories p, category_tree ct
        WHERE c.id = ct.id
          AND c.parent_id = p.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 경로 업데이트 트리거
DROP TRIGGER IF EXISTS trg_update_category_paths ON categories;
CREATE TRIGGER trg_update_category_paths
    AFTER UPDATE OF parent_id, name
    ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_category_paths();

-- 8. 검증 함수들
CREATE OR REPLACE FUNCTION get_category_ancestors(category_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    level INTEGER,
    path TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE ancestors AS (
        SELECT c.id, c.name, c.level, c.path, c.parent_id
        FROM categories c
        WHERE c.id = category_id
        
        UNION ALL
        
        SELECT c.id, c.name, c.level, c.path, c.parent_id
        FROM categories c
        INNER JOIN ancestors a ON c.id = a.parent_id
    )
    SELECT a.id, a.name, a.level, a.path
    FROM ancestors a
    ORDER BY a.level;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_category_descendants(category_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    level INTEGER,
    path TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE descendants AS (
        SELECT c.id, c.name, c.level, c.path, c.parent_id
        FROM categories c
        WHERE c.id = category_id
        
        UNION ALL
        
        SELECT c.id, c.name, c.level, c.path, c.parent_id
        FROM categories c
        INNER JOIN descendants d ON c.parent_id = d.id
    )
    SELECT d.id, d.name, d.level, d.path
    FROM descendants d
    WHERE d.id != category_id
    ORDER BY d.level, d.sequence;
END;
$$ LANGUAGE plpgsql;

-- 9. 계층 구조 유효성 검사
CREATE OR REPLACE FUNCTION validate_category_hierarchy()
RETURNS TABLE (
    category_id UUID,
    category_name VARCHAR(100),
    issue TEXT
) AS $$
BEGIN
    -- 순환 참조 체크
    RETURN QUERY
    WITH RECURSIVE check_loop AS (
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            ARRAY[c.id] as path_ids,
            0 as depth
        FROM categories c
        
        UNION ALL
        
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            cl.path_ids || c.id,
            cl.depth + 1
        FROM categories c
        INNER JOIN check_loop cl ON c.id = cl.parent_id
        WHERE NOT (c.id = ANY(cl.path_ids))
          AND cl.depth < 20
    )
    SELECT 
        cl.id,
        cl.name,
        'Circular reference or too deep: ' || cl.depth::TEXT
    FROM check_loop cl
    WHERE cl.depth >= 10;
    
    -- 고아 카테고리 체크 (부모가 삭제된 경우)
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        'Orphaned category: parent does not exist'
    FROM categories c
    WHERE c.parent_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM categories p WHERE p.id = c.parent_id);
END;
$$ LANGUAGE plpgsql;

-- 10. 마이그레이션 완료 확인 쿼리
DO $$
BEGIN
    RAISE NOTICE '✅ 계층형 카테고리 마이그레이션 완료';
    RAISE NOTICE '   - parent_id, level, path, sequence 컬럼 추가';
    RAISE NOTICE '   - 인덱스 4개 생성';
    RAISE NOTICE '   - 트리거 2개 생성 (계층 검증, 경로 업데이트)';
    RAISE NOTICE '   - 헬퍼 함수 3개 생성 (ancestors, descendants, validate)';
END $$;
