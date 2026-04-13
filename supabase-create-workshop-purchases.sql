-- workshop_purchases 테이블 생성
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS public.workshop_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  workshop_type TEXT NOT NULL DEFAULT 'achievement-addiction',
  amount INTEGER NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  payment_key TEXT,        -- NicePay tid
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | confirmed | cancelled
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.workshop_purchases ENABLE ROW LEVEL SECURITY;

-- 본인 결제만 조회 가능
CREATE POLICY "Users can view own workshop purchases"
  ON public.workshop_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 결제만 생성 가능
CREATE POLICY "Users can create own workshop purchases"
  ON public.workshop_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 서비스 역할로 업데이트 (승인/취소 처리용)
CREATE POLICY "Service role can update workshop purchases"
  ON public.workshop_purchases
  FOR UPDATE
  USING (true);
