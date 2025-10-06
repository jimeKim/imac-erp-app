-- Migration: 002_add_item_types
-- Description: Add item_type classification system
-- Date: 2025-10-05

BEGIN;

-- 1) Add item_type column to items table
ALTER TABLE items
ADD COLUMN IF NOT EXISTS item_type VARCHAR(10) NOT NULL DEFAULT 'FG',
ADD COLUMN IF NOT EXISTS is_manufactured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_purchased BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_sellable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS has_bom BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- 2) Add constraint for valid item types
ALTER TABLE items
ADD CONSTRAINT check_item_type 
  CHECK (item_type IN ('FG', 'SF', 'CP', 'RM', 'CS', 'MD', 'PKG', 'WIP', 'SVC', 'SET'));

-- 3) Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type);
CREATE INDEX IF NOT EXISTS idx_items_sellable ON items(is_sellable) WHERE is_sellable = true;
CREATE INDEX IF NOT EXISTS idx_items_manufactured ON items(is_manufactured) WHERE is_manufactured = true;
CREATE INDEX IF NOT EXISTS idx_items_has_bom ON items(has_bom) WHERE has_bom = true;

-- 4) Create item_type_configs table for type metadata
CREATE TABLE IF NOT EXISTS item_type_configs (
  type_code VARCHAR(10) PRIMARY KEY,
  name_ko VARCHAR(50) NOT NULL,
  name_en VARCHAR(50) NOT NULL,
  name_zh VARCHAR(50),
  
  -- Feature flags
  can_have_bom BOOLEAN DEFAULT false,
  can_be_sold BOOLEAN DEFAULT false,
  can_be_manufactured BOOLEAN DEFAULT false,
  can_be_purchased BOOLEAN DEFAULT true,
  
  -- Tree display
  tree_icon VARCHAR(20),
  tree_badge_color VARCHAR(20),
  sort_order INTEGER,
  
  -- Defaults
  default_uom VARCHAR(10),
  default_category VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) Insert default item type configurations
INSERT INTO item_type_configs (type_code, name_ko, name_en, name_zh, can_have_bom, can_be_sold, can_be_manufactured, tree_icon, tree_badge_color, sort_order) VALUES
('FG', '완제품', 'Finished Goods', '成品', true, true, true, 'package-check', 'green', 1),
('SF', '반제품', 'Semi-Finished', '半成品', true, false, true, 'package', 'blue', 2),
('CP', '부품/모듈', 'Component', '部件', true, false, false, 'box', 'purple', 3),
('RM', '원자재', 'Raw Material', '原材料', false, false, false, 'layers', 'gray', 4),
('CS', '소모품', 'Consumable', '消耗品', false, false, false, 'recycle', 'orange', 5),
('MD', '상품', 'Merchandise', '商品', false, true, false, 'shopping-bag', 'teal', 6),
('PKG', '포장재', 'Packaging', '包装材料', false, false, false, 'package-open', 'yellow', 7)
ON CONFLICT (type_code) DO NOTHING;

-- 6) Update existing items (if any)
-- Set default values based on status
UPDATE items 
SET 
  item_type = 'FG',
  is_sellable = true,
  is_manufactured = true,
  has_bom = false
WHERE item_type IS NULL OR item_type = '';

-- 7) Add comment for documentation
COMMENT ON COLUMN items.item_type IS 'Item classification: FG, SF, CP, RM, CS, MD, PKG';
COMMENT ON COLUMN items.is_manufactured IS 'Can this item be manufactured (vs purchased)';
COMMENT ON COLUMN items.is_sellable IS 'Can this item be sold to customers';
COMMENT ON COLUMN items.has_bom IS 'Does this item have a Bill of Materials';
COMMENT ON COLUMN items.has_variants IS 'Does this item have variants (color, size, etc.)';

COMMIT;
