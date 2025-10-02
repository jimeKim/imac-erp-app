-- =====================================================
-- ERP App - Initial Database Schema
-- Migration: 001_initial_schema
-- Date: 2025-10-02
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. User Profiles (역할 관리)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT[] DEFAULT ARRAY['readonly']::TEXT[], -- readonly, staff, manager
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Items (상품 마스터)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  size TEXT,
  type TEXT CHECK (type IN ('single', 'assembled')) NOT NULL,
  
  -- 가격 정보
  purchase_price NUMERIC(12,2) DEFAULT 0,
  cost_price NUMERIC(12,2) DEFAULT 0,
  release_price NUMERIC(12,2) DEFAULT 0,
  selling_price NUMERIC(12,2) DEFAULT 0,
  discount_price NUMERIC(12,2) DEFAULT 0,
  
  -- 재고 정보
  current_stock INT DEFAULT 0,
  reserved_stock INT DEFAULT 0, -- 예약된 수량 (출고 승인 시)
  safety_stock INT DEFAULT 10,
  
  -- 메타 정보
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items 인덱스
CREATE INDEX idx_items_code ON public.items(item_code);
CREATE INDEX idx_items_stock ON public.items(current_stock);
CREATE INDEX idx_items_type ON public.items(type);
CREATE INDEX idx_items_active ON public.items(is_active);

-- Items 업데이트 트리거
CREATE OR REPLACE FUNCTION update_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION update_items_updated_at();

-- =====================================================
-- 3. Warehouses (창고 마스터)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 창고 추가
INSERT INTO public.warehouses (warehouse_code, name) VALUES
  ('WH-001', '본사 창고'),
  ('WH-002', '물류센터 A')
ON CONFLICT (warehouse_code) DO NOTHING;

-- =====================================================
-- 4. Suppliers (공급처 마스터)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. Customers (고객 마스터)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. Inbounds (입고 관리)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.inbounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inbound_code TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  warehouse_id UUID REFERENCES public.warehouses(id),
  requested_date DATE NOT NULL,
  received_date DATE,
  status TEXT CHECK (status IN ('draft', 'pending', 'approved', 'received', 'cancelled')) DEFAULT 'draft',
  total_amount NUMERIC(12,2) DEFAULT 0,
  note TEXT,
  
  -- 승인 정보
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inbound_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inbound_id UUID REFERENCES public.inbounds(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  note TEXT
);

-- Inbounds 인덱스
CREATE INDEX idx_inbounds_status ON public.inbounds(status);
CREATE INDEX idx_inbounds_date ON public.inbounds(requested_date);

-- =====================================================
-- 7. Outbounds (출고 관리)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.outbounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outbound_code TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  warehouse_id UUID REFERENCES public.warehouses(id),
  requested_date DATE NOT NULL,
  shipped_date DATE,
  committed_date DATE,
  status TEXT CHECK (status IN ('draft', 'pending', 'approved', 'committed', 'cancelled')) DEFAULT 'draft',
  total_amount NUMERIC(12,2) DEFAULT 0,
  note TEXT,
  
  -- 승인 정보
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  committed_by UUID REFERENCES auth.users(id),
  committed_at TIMESTAMPTZ,
  
  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.outbound_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outbound_id UUID REFERENCES public.outbounds(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  note TEXT
);

-- Outbounds 인덱스
CREATE INDEX idx_outbounds_status ON public.outbounds(status);
CREATE INDEX idx_outbounds_date ON public.outbounds(requested_date);
CREATE INDEX idx_outbounds_customer ON public.outbounds(customer_id);

-- =====================================================
-- 8. Stock Movements (재고 이동 이력)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES public.items(id),
  movement_type TEXT CHECK (movement_type IN ('inbound', 'outbound', 'adjustment')) NOT NULL,
  quantity INT NOT NULL, -- 양수: 입고, 음수: 출고
  reference_type TEXT, -- 'inbound', 'outbound'
  reference_id UUID,
  before_stock INT NOT NULL,
  after_stock INT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Movements 인덱스
CREATE INDEX idx_movements_item ON public.stock_movements(item_id, created_at DESC);
CREATE INDEX idx_movements_type ON public.stock_movements(movement_type);

-- =====================================================
-- 9. Stocks View (재고 현황 뷰)
-- =====================================================
CREATE OR REPLACE VIEW public.stocks AS
SELECT 
  i.id,
  i.item_code,
  i.name AS item_name,
  'WH-001' AS warehouse_id, -- 단일 창고 가정
  '본사 창고' AS warehouse_name,
  i.current_stock,
  i.reserved_stock,
  i.current_stock - i.reserved_stock AS available_stock,
  i.safety_stock,
  i.cost_price,
  CASE 
    WHEN i.current_stock < i.safety_stock THEN 'low'
    WHEN i.current_stock >= i.safety_stock * 2 THEN 'high'
    ELSE 'normal'
  END AS stock_level,
  i.updated_at AS last_updated_at
FROM public.items i
WHERE i.is_active = true;

-- =====================================================
-- 10. RLS (Row Level Security) 정책
-- =====================================================

-- Items RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active items"
  ON public.items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff can create items"
  ON public.items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND ('staff' = ANY(user_profiles.role) OR 'manager' = ANY(user_profiles.role))
    )
  );

CREATE POLICY "Managers can update items"
  ON public.items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND 'manager' = ANY(user_profiles.role)
    )
  );

-- Outbounds RLS
ALTER TABLE public.outbounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view outbounds"
  ON public.outbounds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND ('staff' = ANY(user_profiles.role) OR 'manager' = ANY(user_profiles.role))
    )
  );

CREATE POLICY "Staff can create outbounds"
  ON public.outbounds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND ('staff' = ANY(user_profiles.role) OR 'manager' = ANY(user_profiles.role))
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Staff can update their own draft outbounds"
  ON public.outbounds FOR UPDATE
  USING (
    created_by = auth.uid() AND status = 'draft'
  );

CREATE POLICY "Managers can approve/commit outbounds"
  ON public.outbounds FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND 'manager' = ANY(user_profiles.role)
    )
  );

-- =====================================================
-- 11. Functions (비즈니스 로직)
-- =====================================================

-- Outbound 승인 함수
CREATE OR REPLACE FUNCTION approve_outbound(outbound_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- 1. 상태 확인
  IF NOT EXISTS (
    SELECT 1 FROM public.outbounds
    WHERE id = outbound_id_param AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Outbound not found or not in pending status';
  END IF;

  -- 2. 재고 예약 (reserved_stock 증가)
  UPDATE public.items i
  SET reserved_stock = reserved_stock + ol.quantity
  FROM public.outbound_lines ol
  WHERE ol.outbound_id = outbound_id_param
    AND i.id = ol.item_id;

  -- 3. Outbound 상태 업데이트
  UPDATE public.outbounds
  SET 
    status = 'approved',
    approved_by = auth.uid(),
    approved_at = NOW()
  WHERE id = outbound_id_param;

  SELECT json_build_object('success', true, 'message', 'Outbound approved') INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Outbound 커밋 함수 (재고 차감)
CREATE OR REPLACE FUNCTION commit_outbound(outbound_id_param UUID)
RETURNS JSON AS $$
DECLARE
  line RECORD;
  result JSON;
BEGIN
  -- 1. 상태 확인
  IF NOT EXISTS (
    SELECT 1 FROM public.outbounds
    WHERE id = outbound_id_param AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Outbound not found or not in approved status';
  END IF;

  -- 2. 재고 차감 및 이동 이력 생성
  FOR line IN
    SELECT ol.item_id, ol.quantity, i.current_stock
    FROM public.outbound_lines ol
    JOIN public.items i ON i.id = ol.item_id
    WHERE ol.outbound_id = outbound_id_param
  LOOP
    -- 재고 확인
    IF line.current_stock < line.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for item %', line.item_id;
    END IF;

    -- 재고 차감
    UPDATE public.items
    SET 
      current_stock = current_stock - line.quantity,
      reserved_stock = reserved_stock - line.quantity
    WHERE id = line.item_id;

    -- 이동 이력 생성
    INSERT INTO public.stock_movements (
      item_id, movement_type, quantity, reference_type, reference_id,
      before_stock, after_stock, created_by
    ) VALUES (
      line.item_id, 'outbound', -line.quantity, 'outbound', outbound_id_param,
      line.current_stock, line.current_stock - line.quantity, auth.uid()
    );
  END LOOP;

  -- 3. Outbound 상태 업데이트
  UPDATE public.outbounds
  SET 
    status = 'committed',
    committed_by = auth.uid(),
    committed_at = NOW(),
    committed_date = CURRENT_DATE
  WHERE id = outbound_id_param;

  SELECT json_build_object('success', true, 'message', 'Outbound committed, stock updated') INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. Seed Data (초기 데이터)
-- =====================================================

-- Mock Items
INSERT INTO public.items (item_code, name, color, size, type, purchase_price, cost_price, release_price, selling_price, discount_price, current_stock, safety_stock) VALUES
  ('ITEM-001', '노트북 거치대 (화이트)', '화이트', 'M', 'single', 15000, 18000, 25000, 29000, 27000, 150, 50),
  ('ITEM-002', '무선 마우스 (블랙)', '블랙', 'S', 'single', 12000, 14000, 20000, 23000, 23000, 85, 100),
  ('ITEM-003', '기계식 키보드 RGB (화이트)', '화이트', 'L', 'single', 45000, 50000, 75000, 89000, 79000, 32, 20),
  ('ITEM-004', '모니터 암 (싱글)', '블랙', NULL, 'single', 35000, 40000, 60000, 69000, 69000, 45, 30),
  ('ITEM-005', '책상 정리 세트 (베이지)', '베이지', NULL, 'assembled', 25000, 30000, 45000, 52000, 48000, 120, 40)
ON CONFLICT (item_code) DO NOTHING;

-- Mock Suppliers
INSERT INTO public.suppliers (supplier_code, name, contact_person, phone, email) VALUES
  ('SUP-001', '(주)테크서플라이', '김철수', '02-1234-5678', 'contact@techsupply.com'),
  ('SUP-002', '글로벌전자', '이영희', '02-9876-5432', 'sales@globalelec.com')
ON CONFLICT (supplier_code) DO NOTHING;

-- Mock Customers
INSERT INTO public.customers (customer_code, name, contact_person, phone, email) VALUES
  ('CUST-001', '(주)테크솔루션', '박민수', '02-1111-2222', 'order@techsol.com'),
  ('CUST-002', '글로벌마켓', '최지현', '02-3333-4444', 'purchase@globalmarket.com')
ON CONFLICT (customer_code) DO NOTHING;

COMMENT ON TABLE public.items IS '상품 마스터 테이블';
COMMENT ON TABLE public.outbounds IS '출고 관리 테이블 (draft → pending → approved → committed)';
COMMENT ON FUNCTION approve_outbound IS 'Outbound 승인 및 재고 예약';
COMMENT ON FUNCTION commit_outbound IS 'Outbound 커밋 및 실제 재고 차감';

