-- 성취 중독 워크북: workshop_progress 테이블
-- Supabase SQL Editor에서 실행

-- program_type ENUM에 'self-workshop' 추가
-- (이미 존재하면 에러 무시)
DO $$
BEGIN
  ALTER TYPE program_type ADD VALUE IF NOT EXISTS 'self-workshop';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 워크북 진행 상태 테이블
CREATE TABLE IF NOT EXISTS public.workshop_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID,  -- purchases 테이블 연결 (결제 검증용)
  workshop_type TEXT NOT NULL DEFAULT 'achievement-addiction',

  current_step INT NOT NULL DEFAULT 1,  -- 1~9
  status TEXT NOT NULL DEFAULT 'in_progress',  -- in_progress | completed

  -- Step 2: 진단 응답 (20문항 리커트 5점)
  diagnosis_answers JSONB,
  -- 구조: { "1": 3, "2": 5, ... "20": 4 }

  -- Step 2→3: 진단 점수 (자동 계산)
  diagnosis_scores JSONB,
  -- 구조: {
  --   "total": 67,
  --   "level": 3,
  --   "dimensions": {
  --     "conditional_self_worth": 18,
  --     "compulsive_striving": 16,
  --     "fear_of_failure": 19,
  --     "emotional_avoidance": 14
  --   }
  -- }

  -- Step 4: 나의 메커니즘 분석 (유저 작성)
  mechanism_analysis JSONB,
  -- 구조: {
  --   "my_core_belief": "...",
  --   "my_triggers": "...",
  --   "my_automatic_thoughts": "...",
  --   "my_emotions_body": { "text": "...", "emotions": ["불안", "죄책감"] },
  --   "my_behaviors": "...",
  --   "my_cycle_insight": "..."
  -- }

  -- Step 5: Gemini 교차검증 분석 카드 (LLM 생성)
  mechanism_insights JSONB,
  -- 구조: [
  --   { "card_type": "pattern_summary", "title": "...", "content": "..." },
  --   { "card_type": "cross_validation", "title": "...", "content": "..." },
  --   { "card_type": "hidden_pattern", "title": "...", "content": "..." },
  --   { "card_type": "key_question", "title": "...", "content": "..." }
  -- ]

  -- Step 7: 대처 계획 (유저 작성)
  coping_plan JSONB,
  -- 구조: {
  --   "cognitive_restructuring": { "original_thought", "cognitive_error_type", "evidence_for", "evidence_against", "alternative_thought", "belief_rating" },
  --   "behavioral_experiment": { "experiment_situation", "prediction", "prediction_belief", "coping_plan" },
  --   "self_compassion": { "self_compassion_letter", "rest_permission", "boundary_setting" }
  -- }

  -- Step 8: Gemini 통합 써머리 (LLM 생성)
  summary_cards JSONB,

  -- Step 9: 느낀 점 (유저 작성)
  reflections JSONB,
  -- 구조: { "new_insight": "...", "action_plan": "...", "self_message": "..." }

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_workshop_progress_user_id
  ON workshop_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_workshop_progress_purchase_id
  ON workshop_progress(purchase_id);

-- RLS 정책
ALTER TABLE workshop_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own workshop progress"
  ON workshop_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workshop progress"
  ON workshop_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workshop progress"
  ON workshop_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_workshop_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workshop_progress_updated_at
  BEFORE UPDATE ON workshop_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_workshop_updated_at();
