-- =============================================================================
-- Migration: 003_add_categories
-- Description: 상품 카테고리 기능 추가
-- Date: 2025-10-06
-- =============================================================================

-- 1. categories 테이블 생성
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. items 테이블에 category_id 추가
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- 3. 인덱스 추가 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active) WHERE is_active = true;

-- 4. 기본 카테고리 데이터 삽입
INSERT INTO categories (name, description) VALUES
    ('전자제품', 'Electronics & Computer Parts'),
    ('가구', 'Furniture & Fixtures'),
    ('의류', 'Clothing & Apparel'),
    ('식품', 'Food & Beverages'),
    ('원자재', 'Raw Materials'),
    ('포장재', 'Packaging Materials'),
    ('소모품', 'Consumables & Supplies'),
    ('기타', 'Other Items')
ON CONFLICT (name) DO NOTHING;

-- 5. 기존 상품에 기본 카테고리 할당 (item_type 기반)
-- 전자제품: 모니터, LCD 관련 상품
UPDATE items 
SET category_id = (SELECT id FROM categories WHERE name = '전자제품')
WHERE (name ILIKE '%LCD%' OR name ILIKE '%모니터%' OR name ILIKE '%monitor%' 
       OR name ILIKE '%panel%' OR name ILIKE '%controller%' OR name ILIKE '%display%'
       OR name ILIKE '%laptop%' OR name ILIKE '%tablet%' OR name ILIKE '%phone%')
  AND category_id IS NULL;

-- 포장재: 포장 관련 상품
UPDATE items 
SET category_id = (SELECT id FROM categories WHERE name = '포장재')
WHERE (name ILIKE '%포장%' OR name ILIKE '%박스%' OR name ILIKE '%box%' 
       OR name ILIKE '%foam%' OR name ILIKE '%packaging%')
  AND category_id IS NULL;

-- 소모품: 케이블, 나사, 테이프 등
UPDATE items 
SET category_id = (SELECT id FROM categories WHERE name = '소모품')
WHERE (name ILIKE '%케이블%' OR name ILIKE '%cable%' OR name ILIKE '%screw%' 
       OR name ILIKE '%나사%' OR name ILIKE '%tape%' OR name ILIKE '%테이프%'
       OR name ILIKE '%thermal%' OR name ILIKE '%adhesive%')
  AND category_id IS NULL;

-- 원자재: 플라스틱, 금속 등
UPDATE items 
SET category_id = (SELECT id FROM categories WHERE name = '원자재')
WHERE (name ILIKE '%plastic%' OR name ILIKE '%플라스틱%' OR name ILIKE '%metal%' 
       OR name ILIKE '%금속%' OR name ILIKE '%프레임%' OR name ILIKE '%frame%')
  AND category_id IS NULL;

-- 나머지는 기타로 분류
UPDATE items 
SET category_id = (SELECT id FROM categories WHERE name = '기타')
WHERE category_id IS NULL;

-- 6. updated_at 트리거 생성 (categories)
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- 7. 검증 함수
CREATE OR REPLACE FUNCTION check_categories_setup()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- 카테고리 개수 확인
    RETURN QUERY
    SELECT 
        'Categories Count'::TEXT,
        CASE WHEN COUNT(*) >= 5 THEN '✅ VALID' ELSE '⚠️ WARNING' END,
        'Total categories: ' || COUNT(*)::TEXT
    FROM categories;
    
    -- 활성 카테고리 확인
    RETURN QUERY
    SELECT 
        'Active Categories'::TEXT,
        CASE WHEN COUNT(*) >= 5 THEN '✅ VALID' ELSE '⚠️ WARNING' END,
        'Active categories: ' || COUNT(*)::TEXT
    FROM categories WHERE is_active = true;
    
    -- 카테고리 할당된 상품 확인
    RETURN QUERY
    SELECT 
        'Categorized Items'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN '✅ VALID' ELSE '❌ ERROR' END,
        'Items with category: ' || COUNT(*)::TEXT || ' / ' || 
        (SELECT COUNT(*) FROM items)::TEXT
    FROM items WHERE category_id IS NOT NULL;
    
    -- 카테고리 없는 상품 확인
    RETURN QUERY
    SELECT 
        'Uncategorized Items'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN '✅ VALID' ELSE '⚠️ WARNING' END,
        'Items without category: ' || COUNT(*)::TEXT
    FROM items WHERE category_id IS NULL;
    
    -- 인덱스 확인
    RETURN QUERY
    SELECT 
        'Indexes'::TEXT,
        CASE WHEN COUNT(*) >= 3 THEN '✅ VALID' ELSE '❌ ERROR' END,
        'Category indexes created: ' || COUNT(*)::TEXT
    FROM pg_indexes 
    WHERE tablename IN ('categories', 'items') 
      AND indexname LIKE '%categor%';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 실행 후 검증
-- =============================================================================
-- SELECT * FROM check_categories_setup();
-- SELECT name, description, is_active FROM categories ORDER BY name;
-- SELECT COUNT(*), c.name FROM items i JOIN categories c ON i.category_id = c.id GROUP BY c.name ORDER BY count DESC;
