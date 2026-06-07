-- Mind Spill 워크북 (단일 워크북 × 10회 사용권 · 6개월 유효)
-- 모델:
--   · 결제 1회로 6개월(180일) 동안 워크북 10권 작성 가능.
--   · 워크북 1권 = Cover → 비우기 → 채우기 → Closing Report (Coach's Note + Prescription).
--   · 한 권 = 사용권 1회 차감.

-- ============ 구독 (사용권) ============
CREATE TABLE mind_spill_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,

  purchase_id uuid,   -- NicePay 결제 연결 (선택). 테스트 유저는 NULL.

  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,    -- started_at + 180일

  -- 워크북 작성권 (10회 / 6개월)
  quota_total int NOT NULL DEFAULT 10 CHECK (quota_total >= 0),
  quota_used  int NOT NULL DEFAULT 0  CHECK (quota_used >= 0),

  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT mind_spill_subs_quota_bounded
    CHECK (quota_used <= quota_total)
);

CREATE INDEX idx_mind_spill_subs_user ON mind_spill_subscriptions(user_id, status);

ALTER TABLE mind_spill_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subs"
  ON mind_spill_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subs"
  ON mind_spill_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION mind_spill_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mind_spill_subs_touch
  BEFORE UPDATE ON mind_spill_subscriptions
  FOR EACH ROW EXECUTE FUNCTION mind_spill_touch_updated_at();
