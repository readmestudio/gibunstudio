-- ============================================================
-- Mind Spill 모델 전환 — 워크북(주간 단위) → 데일리 캘린더 엔트리
-- ============================================================
--
-- 변경 사유:
--   · 기존: 한 번에 25분짜리 워크북 1권을 완주. 작성 무료, 리포트(coach-note) 1권당 4,900원.
--   · 신규: 캘린더 뷰로 매일 가볍게 체크인. LLM 통합 리포트(mirror+strengths+coach)는 entry당 4,900원.
--
-- 결제 모델:
--   · 매일 작성(감정/BrainDump/좋았던 순간) = 무료, LLM 호출 없음.
--   · 결제 후 → mirror + strengths + coach 모두 자동 생성 → 한 페이지에 통합 표시.
--   · 결제 단위: entry 1건 = 4,900원, 같은 entry에 confirmed 결제는 단 하나(partial unique index).
--
-- 데이터 이관:
--   · 사용자 요청에 따라 기존 mind_spill_workbooks / mind_spill_report_purchases 전량 제거.
--   · mind_spill_subscriptions 는 보수적으로 유지 (drop 시 의존 객체가 없으므로 향후 cleanup).

-- ── 의존 객체 제거 ──
-- FK 때문에 report_purchases를 먼저 드롭.
DROP TABLE IF EXISTS mind_spill_report_purchases CASCADE;
DROP TABLE IF EXISTS mind_spill_workbooks CASCADE;

-- ============================================================
-- mind_spill_daily_entries — 매일 한 칸씩 작성하는 체크인 엔트리.
-- ============================================================

CREATE TABLE mind_spill_daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 캘린더의 "칸". 하루 한 엔트리만.
  entry_date date NOT NULL,

  -- ── 무료: 사용자가 직접 작성 ──
  -- 감정/수면/에너지 스캔 (이전 weekly_scan과 같은 구조 — 일자 단위로 의미 재해석).
  daily_scan jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- 머릿속을 쏟아낸 글타래.
  brain_dump jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- 그날의 좋았던 순간들.
  moments jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- ── 유료: 결제 후 LLM이 생성 ──
  -- (결제 전엔 모두 NULL — 사용자에게 "발견을 받아보세요" 미공개 상태.)
  mirror_report   jsonb,  -- 감정 군집 + 인지 왜곡 + 몸-생각 연결
  strengths_report jsonb, -- 모먼트별 actions/strengths + 종합 강점 3개
  coach_note      jsonb,  -- 상담사 톤의 한 통의 편지
  prescriptions   jsonb,  -- 다음에 해볼 수 있는 처방 1~3개

  -- 모든 LLM이 채워지면 true. 결제 후 LLM 트리거가 완료될 때 설정.
  report_generated_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- 캘린더의 본질 — 한 사용자, 한 날짜에 한 엔트리만.
  UNIQUE (user_id, entry_date)
);

CREATE INDEX idx_mind_spill_entries_user_date
  ON mind_spill_daily_entries(user_id, entry_date DESC);

ALTER TABLE mind_spill_daily_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries"
  ON mind_spill_daily_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries"
  ON mind_spill_daily_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries"
  ON mind_spill_daily_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries"
  ON mind_spill_daily_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_mind_spill_entries_touch
  BEFORE UPDATE ON mind_spill_daily_entries
  FOR EACH ROW EXECUTE FUNCTION mind_spill_touch_updated_at();

-- ============================================================
-- mind_spill_entry_purchases — entry별 LLM 통합 리포트 결제 기록.
-- ============================================================

CREATE TABLE mind_spill_entry_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_id uuid REFERENCES mind_spill_daily_entries(id) ON DELETE CASCADE NOT NULL,

  amount integer NOT NULL CHECK (amount > 0),
  order_id text UNIQUE NOT NULL,   -- MS-{timestamp}-{nanoid}
  payment_key text,                -- NicePay tid

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  paid_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 한 entry에 confirmed 결제는 단 하나 (중복 결제 방지).
CREATE UNIQUE INDEX uq_mind_spill_entry_purchase_confirmed
  ON mind_spill_entry_purchases(entry_id)
  WHERE status = 'confirmed';

CREATE INDEX idx_mind_spill_entry_purchases_user_status
  ON mind_spill_entry_purchases(user_id, status);
CREATE INDEX idx_mind_spill_entry_purchases_entry
  ON mind_spill_entry_purchases(entry_id, status);

ALTER TABLE mind_spill_entry_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entry purchases"
  ON mind_spill_entry_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entry purchases"
  ON mind_spill_entry_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_mind_spill_entry_purchases_touch
  BEFORE UPDATE ON mind_spill_entry_purchases
  FOR EACH ROW EXECUTE FUNCTION mind_spill_touch_updated_at();
