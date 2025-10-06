-- ==========================================
-- BOM (Bill of Materials) 테이블 생성
-- ==========================================

-- BOM 구성품 테이블
CREATE TABLE IF NOT EXISTS bom_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 부모 상품 (완제품, 반제품, 모듈 등)
  parent_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  
  -- 구성품 상품 (모듈, 부품, 원자재 등)
  component_item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  
  -- 수량 및 단위
  quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(10) NOT NULL,
  
  -- 순서 (화면 표시 순서)
  sequence INT DEFAULT 0,
  
  -- 비고
  notes TEXT,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- 제약 조건: 같은 부모에 같은 구성품을 중복으로 추가할 수 없음
  UNIQUE(parent_item_id, component_item_id)
);

-- 인덱스 생성
CREATE INDEX idx_bom_parent ON bom_components(parent_item_id);
CREATE INDEX idx_bom_component ON bom_components(component_item_id);
CREATE INDEX idx_bom_sequence ON bom_components(parent_item_id, sequence);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_bom_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bom_updated_at
  BEFORE UPDATE ON bom_components
  FOR EACH ROW
  EXECUTE FUNCTION update_bom_updated_at();

-- RLS (Row Level Security) 활성화
ALTER TABLE bom_components ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 인증된 사용자는 조회 가능
CREATE POLICY "Anyone can view BOM"
  ON bom_components
  FOR SELECT
  USING (true);

-- RLS 정책: 인증된 사용자는 생성/수정/삭제 가능
CREATE POLICY "Authenticated users can manage BOM"
  ON bom_components
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- BOM 뷰 (조인된 데이터)
-- ==========================================

CREATE OR REPLACE VIEW bom_components_view AS
SELECT 
  bc.id,
  bc.parent_item_id,
  bc.component_item_id,
  bc.quantity,
  bc.unit,
  bc.sequence,
  bc.notes,
  bc.created_at,
  bc.updated_at,
  
  -- 부모 상품 정보
  p_item.sku AS parent_sku,
  p_item.name AS parent_name,
  p_item.item_type AS parent_type,
  
  -- 구성품 상품 정보
  c_item.sku AS component_sku,
  c_item.name AS component_name,
  c_item.item_type AS component_type,
  c_item.uom AS component_uom,
  c_item.unit_cost AS component_unit_cost,
  
  -- 총 비용 계산
  (bc.quantity * COALESCE(c_item.unit_cost, 0)) AS total_cost
FROM bom_components bc
LEFT JOIN items p_item ON bc.parent_item_id = p_item.id
LEFT JOIN items c_item ON bc.component_item_id = c_item.id
ORDER BY bc.parent_item_id, bc.sequence, bc.created_at;

-- ==========================================
-- 샘플 데이터 입력 함수
-- ==========================================

CREATE OR REPLACE FUNCTION insert_sample_bom_data()
RETURNS void AS $$
DECLARE
  v_monitor_id UUID;
  v_lcd_module_id UUID;
  v_power_module_id UUID;
  v_lcd_panel_id UUID;
  v_backlight_id UUID;
  v_controller_id UUID;
  v_ac_dc_id UUID;
  v_power_cable_id UUID;
  v_power_connector_id UUID;
  v_stand_id UUID;
  v_package_id UUID;
BEGIN
  -- 상품 ID 조회 (SKU 기반)
  SELECT id INTO v_monitor_id FROM items WHERE sku = 'SKU-001' LIMIT 1;
  
  -- 샘플 상품이 없으면 생성
  IF v_monitor_id IS NULL THEN
    -- LCD 모니터 (완제품)
    INSERT INTO items (sku, name, description, category, item_type, uom, unit_cost, status)
    VALUES ('SKU-001', 'LCD 모니터 27인치', '고해상도 비즈니스 모니터', 'Electronics', 'FG', 'EA', 250000, 'active')
    RETURNING id INTO v_monitor_id;
    
    -- LCD 모듈
    INSERT INTO items (sku, name, description, category, item_type, uom, unit_cost, status)
    VALUES ('SKU-MOD-001', 'LCD 모듈', 'LCD 디스플레이 모듈', 'Electronics', 'MOD', 'EA', 180000, 'active')
    RETURNING id INTO v_lcd_module_id;
    
    -- 전원 모듈
    INSERT INTO items (sku, name, description, category, item_type, uom, unit_cost, status)
    VALUES ('SKU-MOD-002', '전원 모듈 (SMPS)', 'SMPS 전원 공급 장치', 'Electronics', 'MOD', 'EA', 35000, 'active')
    RETURNING id INTO v_power_module_id;
    
    -- LCD 패널
    INSERT INTO items (sku, name, description, category, item_type, uom, unit_cost, status)
    VALUES ('SKU-PT-001', '액정 패널 27인치', '27인치 TFT-LCD 패널', 'Electronics', 'PT', 'EA', 150000, 'active')
    RETURNING id INTO v_lcd_panel_id;
    
    -- 백라이트
    INSERT INTO items (sku, name, description, category, item_type, uom, unit_cost, status)
    VALUES ('SKU-PT-002', '백라이트 유닛', 'LED 백라이트 어셈블리', 'Electronics', 'PT', 'EA', 50000, 'active')
    RETURNING id INTO v_backlight_id;
    
    -- 컨트롤러
    INSERT INTO items (sku, name, description, category, item_type, uom, unit_cost, status)
    VALUES ('SKU-PT-003', 'LCD 컨트롤러', '디스플레이 컨트롤 보드', 'Electronics', 'PT', 'EA', 30000, 'active')
    RETURNING id INTO v_controller_id;
    
    -- AC/DC 컨버터
    INSERT INTO items (sku, name, description, category, item_type, uom, unit_cost, status)
    VALUES ('SKU-PT-004', 'AC/DC 컨버터', '전원 변환 회로', 'Electronics', 'PT', 'EA', 25000, 'active')
    RETURNING id INTO v_ac_dc_id;
    
    -- 전원 케이블
    INSERT INTO items (sku, name, description, category, item_type, uom, unit_cost, status)
    VALUES ('SKU-PT-005', '전원 케이블', '220V 전원 케이블', 'Electronics', 'PT', 'EA', 5000, 'active')
    RETURNING id INTO v_power_cable_id;
    
    -- 전원 커넥터
    INSERT INTO items (sku, name, description, category, item_type, uom, unit_cost, status)
    VALUES ('SKU-PT-006', '전원 커넥터', 'DC 전원 커넥터', 'Electronics', 'PT', 'EA', 2000, 'active')
    RETURNING id INTO v_power_connector_id;
    
    -- 스탠드
    INSERT INTO items (sku, name, description, category, item_type, uom, unit_cost, status)
    VALUES ('SKU-PT-007', '모니터 스탠드', '높이 조절 가능 스탠드', 'Accessories', 'PT', 'EA', 15000, 'active')
    RETURNING id INTO v_stand_id;
    
    -- 포장재
    INSERT INTO items (sku, name, description, category, item_type, uom, unit_cost, status)
    VALUES ('SKU-PKG-001', '포장 박스', '27인치 모니터용 박스', 'Packaging', 'PKG', 'EA', 5000, 'active')
    RETURNING id INTO v_package_id;
  ELSE
    -- 기존 상품 ID 조회
    SELECT id INTO v_lcd_module_id FROM items WHERE sku = 'SKU-MOD-001' LIMIT 1;
    SELECT id INTO v_power_module_id FROM items WHERE sku = 'SKU-MOD-002' LIMIT 1;
    SELECT id INTO v_lcd_panel_id FROM items WHERE sku = 'SKU-PT-001' LIMIT 1;
    SELECT id INTO v_backlight_id FROM items WHERE sku = 'SKU-PT-002' LIMIT 1;
    SELECT id INTO v_controller_id FROM items WHERE sku = 'SKU-PT-003' LIMIT 1;
    SELECT id INTO v_ac_dc_id FROM items WHERE sku = 'SKU-PT-004' LIMIT 1;
    SELECT id INTO v_power_cable_id FROM items WHERE sku = 'SKU-PT-005' LIMIT 1;
    SELECT id INTO v_power_connector_id FROM items WHERE sku = 'SKU-PT-006' LIMIT 1;
    SELECT id INTO v_stand_id FROM items WHERE sku = 'SKU-PT-007' LIMIT 1;
    SELECT id INTO v_package_id FROM items WHERE sku = 'SKU-PKG-001' LIMIT 1;
  END IF;
  
  -- BOM 데이터 입력 (중복 체크 후)
  
  -- 1단계: LCD 모니터 → LCD 모듈
  INSERT INTO bom_components (parent_item_id, component_item_id, quantity, unit, sequence)
  VALUES (v_monitor_id, v_lcd_module_id, 1, 'EA', 1)
  ON CONFLICT (parent_item_id, component_item_id) DO NOTHING;
  
  -- 1단계: LCD 모니터 → 전원 모듈
  INSERT INTO bom_components (parent_item_id, component_item_id, quantity, unit, sequence)
  VALUES (v_monitor_id, v_power_module_id, 1, 'EA', 2)
  ON CONFLICT (parent_item_id, component_item_id) DO NOTHING;
  
  -- 1단계: LCD 모니터 → 스탠드
  INSERT INTO bom_components (parent_item_id, component_item_id, quantity, unit, sequence)
  VALUES (v_monitor_id, v_stand_id, 1, 'EA', 3)
  ON CONFLICT (parent_item_id, component_item_id) DO NOTHING;
  
  -- 1단계: LCD 모니터 → 포장재
  INSERT INTO bom_components (parent_item_id, component_item_id, quantity, unit, sequence)
  VALUES (v_monitor_id, v_package_id, 1, 'EA', 4)
  ON CONFLICT (parent_item_id, component_item_id) DO NOTHING;
  
  -- 2단계: LCD 모듈 → 액정 패널
  INSERT INTO bom_components (parent_item_id, component_item_id, quantity, unit, sequence)
  VALUES (v_lcd_module_id, v_lcd_panel_id, 1, 'EA', 1)
  ON CONFLICT (parent_item_id, component_item_id) DO NOTHING;
  
  -- 2단계: LCD 모듈 → 백라이트
  INSERT INTO bom_components (parent_item_id, component_item_id, quantity, unit, sequence)
  VALUES (v_lcd_module_id, v_backlight_id, 1, 'EA', 2)
  ON CONFLICT (parent_item_id, component_item_id) DO NOTHING;
  
  -- 2단계: LCD 모듈 → 컨트롤러
  INSERT INTO bom_components (parent_item_id, component_item_id, quantity, unit, sequence)
  VALUES (v_lcd_module_id, v_controller_id, 1, 'EA', 3)
  ON CONFLICT (parent_item_id, component_item_id) DO NOTHING;
  
  -- 2단계: 전원 모듈 → AC/DC 컨버터
  INSERT INTO bom_components (parent_item_id, component_item_id, quantity, unit, sequence)
  VALUES (v_power_module_id, v_ac_dc_id, 1, 'EA', 1)
  ON CONFLICT (parent_item_id, component_item_id) DO NOTHING;
  
  -- 2단계: 전원 모듈 → 전원 케이블
  INSERT INTO bom_components (parent_item_id, component_item_id, quantity, unit, sequence)
  VALUES (v_power_module_id, v_power_cable_id, 1, 'EA', 2)
  ON CONFLICT (parent_item_id, component_item_id) DO NOTHING;
  
  -- 2단계: 전원 모듈 → 전원 커넥터 (2개)
  INSERT INTO bom_components (parent_item_id, component_item_id, quantity, unit, sequence)
  VALUES (v_power_module_id, v_power_connector_id, 2, 'EA', 3)
  ON CONFLICT (parent_item_id, component_item_id) DO NOTHING;
  
  RAISE NOTICE 'Sample BOM data inserted successfully!';
END;
$$ LANGUAGE plpgsql;

-- 샘플 데이터 입력 실행
SELECT insert_sample_bom_data();

-- ==========================================
-- 완료 메시지
-- ==========================================
SELECT 'BOM tables and sample data created successfully!' AS message;
