-- 핵심 신념 검사 답변 저장
CREATE TABLE core_belief_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  answers jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE core_belief_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
  ON core_belief_submissions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON core_belief_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 핵심 신념 AI 분석 리포트
CREATE TABLE core_belief_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES core_belief_submissions(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  report jsonb NOT NULL,
  payment_status text DEFAULT 'pending',
  payment_amount integer DEFAULT 19900,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE core_belief_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON core_belief_reports FOR SELECT USING (auth.uid() = user_id);
