-- ============================================================
-- Mind Spill Freemium 모델 전환
-- ============================================================
--
-- 비즈니스 모델 변경:
--   · 매일 Mirror Report = 무료 (entry당 LLM 1회, 멱등성 보장)
--   · 3일치 누적 종합 리포트 = ₩4,900 결제 (Strengths + Coach Note + Patterns)
--
-- 데이터 모델 변경:
--   · entry에 워크북 활동 필드 추가 (classification / released / actions)
--   · entry에 mirror_generated_at 추가 (Mirror 트리거 멱등성)
--   · period_reports / period_purchases 신규 (3일치 종합 단위)
--   · 기존 entry_purchases는 유지 (deprecated, Phase 3 cleanup 예정)

-- ─────────────────────────────────────────────────────
-- (1) DailyEntry에 워크북 활동 필드 + Mirror 멱등성
-- ─────────────────────────────────────────────────────

ALTER TABLE mind_spill_daily_entries
  ADD COLUMN classification jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN released text[] NOT NULL DEFAULT '{}',
  ADD COLUMN actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN mirror_generated_at timestamptz;

-- ─────────────────────────────────────────────────────
-- (2) Period Reports — 3일치 종합 리포트
-- ─────────────────────────────────────────────────────

CREATE TABLE mind_spill_period_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 묶인 entry id 배열 (3개 이상). 캘린더 표시·LLM 입력에 사용.
  entry_ids uuid[] NOT NULL CHECK (array_length(entry_ids, 1) >= 3),

  -- 캐싱된 기간 라벨용 (entry_ids에서 도출 가능하지만 쿼리 단순화).
  period_start date NOT NULL,
  period_end date NOT NULL,

  -- LLM 결과 (결제 + 트리거 완료 후 채워짐).
  coach_note jsonb,
  strengths_report jsonb,
  prescriptions jsonb,
  patterns jsonb,              -- 3일간 발견된 반복 패턴

  -- 모든 LLM이 채워진 시점.
  generated_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_period_reports_user
  ON mind_spill_period_reports(user_id, period_end DESC);

ALTER TABLE mind_spill_period_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own period reports"
  ON mind_spill_period_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own period reports"
  ON mind_spill_period_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_period_reports_touch
  BEFORE UPDATE ON mind_spill_period_reports
  FOR EACH ROW EXECUTE FUNCTION mind_spill_touch_updated_at();

-- ─────────────────────────────────────────────────────
-- (3) Period Purchases — period_report와 1:1 결제 기록
-- ─────────────────────────────────────────────────────

CREATE TABLE mind_spill_period_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_report_id uuid REFERENCES mind_spill_period_reports(id) ON DELETE CASCADE NOT NULL,

  amount integer NOT NULL CHECK (amount > 0),
  order_id text UNIQUE NOT NULL,   -- MS-{timestamp}-{nanoid}
  payment_key text,                -- NicePay tid

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  paid_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 한 period_report에 confirmed 결제는 단 하나 (중복 결제 방지).
CREATE UNIQUE INDEX uq_period_purchase_confirmed
  ON mind_spill_period_purchases(period_report_id)
  WHERE status = 'confirmed';

CREATE INDEX idx_period_purchases_user_status
  ON mind_spill_period_purchases(user_id, status);

ALTER TABLE mind_spill_period_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own period purchases"
  ON mind_spill_period_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own period purchases"
  ON mind_spill_period_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_period_purchases_touch
  BEFORE UPDATE ON mind_spill_period_purchases
  FOR EACH ROW EXECUTE FUNCTION mind_spill_touch_updated_at();
