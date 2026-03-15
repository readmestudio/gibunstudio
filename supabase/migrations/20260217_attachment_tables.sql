-- 연애 애착 검사 답변
CREATE TABLE attachment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  answers jsonb NOT NULL,
  scores jsonb NOT NULL,       -- { anxiety, avoidance, style }
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attachment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own" ON attachment_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own" ON attachment_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 연애 애착 AI 리포트
CREATE TABLE attachment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES attachment_submissions(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  report jsonb NOT NULL,
  payment_status text DEFAULT 'pending',
  payment_amount integer DEFAULT 9900,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attachment_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own" ON attachment_reports FOR SELECT USING (auth.uid() = user_id);
