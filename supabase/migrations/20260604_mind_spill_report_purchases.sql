-- Mind Spill 리포트 결제 (워크북당 1회)
--
-- 모델 변경:
--   · 셀프 체크인(워크북 작성)은 모든 사용자에게 무료.
--   · 리포트(Mirror/Strengths/Coach Note) 열람은 워크북당 4,900원 결제 필요.
--   · 결제 단위: 워크북 1권 = 1결제. 같은 워크북에 confirmed 결제는 단 하나.
--
-- 기존 mind_spill_subscriptions 사용자(grandfathering):
--   · 활성 사용권을 가진 사용자는 결제 없이 리포트 열람 가능.
--   · 새 사용자에게는 더 이상 사용권을 발급하지 않음 (이 마이그레이션과 무관, 코드 변경으로 처리).
--
-- NicePay 통합:
--   · orderId prefix = 'MS-' (Mind Spill).
--   · 승인 콜백: /api/payment/nicepay/return (기존 라우트에 분기 추가).

CREATE TABLE mind_spill_report_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  workbook_id uuid REFERENCES mind_spill_workbooks(id) ON DELETE CASCADE NOT NULL,

  amount integer NOT NULL CHECK (amount > 0),
  order_id text UNIQUE NOT NULL,   -- MS-{timestamp}-{nanoid}
  payment_key text,                -- NicePay tid (승인 후 기록)

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  paid_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 한 워크북에 confirmed 결제는 단 하나만 존재 (멱등성 + 중복 결제 방지).
CREATE UNIQUE INDEX uq_mind_spill_report_workbook_confirmed
  ON mind_spill_report_purchases(workbook_id)
  WHERE status = 'confirmed';

-- 자주 조회되는 패턴.
CREATE INDEX idx_mind_spill_report_user_status
  ON mind_spill_report_purchases(user_id, status);
CREATE INDEX idx_mind_spill_report_workbook
  ON mind_spill_report_purchases(workbook_id, status);

-- RLS — 본인 결제 기록만 조회/생성 가능. 승인(UPDATE)은 admin client.
ALTER TABLE mind_spill_report_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own report purchases"
  ON mind_spill_report_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own report purchases"
  ON mind_spill_report_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- updated_at 자동 갱신 (mind_spill_touch_updated_at 함수 재사용).
CREATE TRIGGER trg_mind_spill_report_purchases_touch
  BEFORE UPDATE ON mind_spill_report_purchases
  FOR EACH ROW EXECUTE FUNCTION mind_spill_touch_updated_at();

-- ============================================================
-- 무료 워크북 작성 지원 — subscription_id를 nullable로.
-- ============================================================
-- 무료 사용자는 mind_spill_subscriptions 없이도 워크북을 작성할 수 있어야 한다.
-- 기존 사용권 사용자(grandfathering)는 계속 subscription_id를 채우고, 새 무료 사용자는 NULL.

ALTER TABLE mind_spill_workbooks
  ALTER COLUMN subscription_id DROP NOT NULL;
