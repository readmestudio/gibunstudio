-- workshop_purchases 마이그레이션: 장바구니 통합결제 지원
-- cart_order_id 컬럼을 추가하고, 통합결제 건은 order_id NULL 허용.
-- Supabase SQL Editor에서 실행하세요 (supabase-create-cart-orders.sql 적용 후)

-- 1) cart_order_id FK 컬럼 추가
ALTER TABLE public.workshop_purchases
  ADD COLUMN IF NOT EXISTS cart_order_id UUID
    REFERENCES public.cart_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workshop_purchases_cart_order
  ON public.workshop_purchases(cart_order_id);

-- 2) order_id를 NULL 허용으로 변경 (통합결제 건은 order_id 대신 cart_order_id로 추적)
ALTER TABLE public.workshop_purchases
  ALTER COLUMN order_id DROP NOT NULL;

-- 3) UNIQUE 제약은 유지되나 NULL은 UNIQUE 충돌 대상이 아니므로 그대로 OK.
--    (Postgres는 NULL을 서로 다른 값으로 취급)

-- 4) 동일 user_id + workshop_type confirmed 건이 둘 생기지 않도록 보조 UNIQUE 인덱스 권장
CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_purchases_user_type_confirmed
  ON public.workshop_purchases(user_id, workshop_type)
  WHERE status = 'confirmed';
