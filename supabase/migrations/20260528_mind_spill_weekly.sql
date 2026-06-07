-- Mind Spill 워크북 본체 (단일 워크북 모델).
-- 한 사용자 안에서 volume_no(1~quota_total)로 고유. 시안의 "Vol. 01" 표기와 일치.

CREATE TABLE mind_spill_workbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  subscription_id uuid REFERENCES mind_spill_subscriptions(id) NOT NULL,

  -- 시안의 "Vol. 01", "No. 014" 표기에 대응. 사용자별로 1부터 증가.
  volume_no int NOT NULL CHECK (volume_no >= 1),

  -- 사용자가 표기하는 "이 워크북이 다루는 주" (선택). YYYY-MM-DD 월요일.
  -- 한 주에 종속되지 않으므로 nullable.
  week_label date,

  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  current_step int NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 3),

  -- Part 1 — 비우기
  weekly_scan jsonb NOT NULL DEFAULT '{}'::jsonb,    -- WeeklyScan
  brain_dump  jsonb NOT NULL DEFAULT '{}'::jsonb,    -- { recurring, discomfort, todos } 각 BDItem[]
  mirror_report jsonb,                               -- LLM (Mirror Report) — nullable

  -- Part 2 — 채우기
  classification jsonb NOT NULL DEFAULT '{}'::jsonb, -- { controllable, influenceable, uncontrollable }: bd_id[]
  released       text[] NOT NULL DEFAULT '{}',      -- 내려놓은 bd_id 목록
  actions        jsonb NOT NULL DEFAULT '[]'::jsonb, -- Action[] (GROW 필드)
  moments        jsonb NOT NULL DEFAULT '[]'::jsonb, -- Moment[] (강점/모먼트 카드)

  -- Closing — LLM
  coach_note    jsonb,    -- nullable
  prescriptions jsonb,    -- nullable

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,

  UNIQUE (user_id, volume_no)
);

CREATE INDEX idx_mind_spill_wb_user ON mind_spill_workbooks(user_id, volume_no DESC);
CREATE INDEX idx_mind_spill_wb_sub ON mind_spill_workbooks(subscription_id);

ALTER TABLE mind_spill_workbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own workbooks"
  ON mind_spill_workbooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workbooks"
  ON mind_spill_workbooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workbooks"
  ON mind_spill_workbooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workbooks"
  ON mind_spill_workbooks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_mind_spill_wb_touch
  BEFORE UPDATE ON mind_spill_workbooks
  FOR EACH ROW EXECUTE FUNCTION mind_spill_touch_updated_at();
