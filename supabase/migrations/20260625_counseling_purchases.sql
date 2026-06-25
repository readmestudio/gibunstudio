-- ============================================================
-- 상담 결제 내역 (counseling_purchases)
-- ============================================================
--
-- 목적:
--   · /payment/counseling/[type] 에서 NicePay 로 결제(캡처)된 상담 건을 기록한다.
--   · 현재 상담 운영은 결제 후 카카오/대시보드로 수동 예약이므로, 결제 자체의
--     원장(ledger)만 남긴다. (예약·일정은 별도)
--
-- 기록 시점:
--   · /api/payment/nicepay/return 의 CN- 분기에서 NicePay 최종 승인(approve)이
--     성공한 직후, service role(admin) 클라이언트로 INSERT(upsert) 한다.
--   · 따라서 "결제 성공" 건만 들어온다(pending/실패는 기록하지 않음). order_id 는
--     클라이언트에서 발급(CN-{typeId}-{ts}-{rand})하며 멱등성을 위해 UNIQUE.
--
-- 비고:
--   · 상담은 비로그인도 결제 가능 → user_id 는 NULL 허용(로그인 시에만 채움).
--   · 금액 위변조는 서버에서 COUNSELING_TYPES 정가와 대조해 막는다(라우트 책임).

-- updated_at 자동 갱신 트리거 함수 (없으면 생성 — 다른 마이그레이션과 공유 가능).
CREATE OR REPLACE FUNCTION waitlist_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS counseling_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- NicePay 주문번호 (CN-{typeId}-{timestamp}-{rand}) — 멱등성 위해 UNIQUE
  order_id text NOT NULL UNIQUE,

  -- 상담 유형 (COUNSELING_TYPES id: personal, report-interpret, relationship 등)
  counseling_type text NOT NULL,
  -- 결제 시점 상담명 스냅샷 (표시·정산용)
  title text,
  -- 결제 금액(원)
  amount integer NOT NULL,

  -- 결제 상태: 성공만 기록하므로 기본 'confirmed'
  status text NOT NULL DEFAULT 'confirmed',

  -- 결제자 (로그인 시에만; 익명 결제는 NULL)
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- NicePay 거래 식별자(tid)
  payment_key text,
  paid_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_counseling_purchases_created ON counseling_purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_counseling_purchases_user ON counseling_purchases(user_id);

ALTER TABLE counseling_purchases ENABLE ROW LEVEL SECURITY;

-- 본인 결제 내역만 조회 가능(로그인 사용자). INSERT/UPDATE 는 정책 없음 →
-- API 라우트의 admin(service role) 클라이언트만 기록한다.
DROP POLICY IF EXISTS "본인 상담 결제 조회" ON counseling_purchases;
CREATE POLICY "본인 상담 결제 조회"
  ON counseling_purchases FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_counseling_purchases_touch ON counseling_purchases;
CREATE TRIGGER trg_counseling_purchases_touch
  BEFORE UPDATE ON counseling_purchases
  FOR EACH ROW EXECUTE FUNCTION waitlist_touch_updated_at();
