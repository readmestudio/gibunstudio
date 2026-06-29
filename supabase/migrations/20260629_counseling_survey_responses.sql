-- ============================================================
-- 상담 사전 설문 응답 (counseling_survey_responses)
-- ============================================================
--
-- 목적:
--   · 상담 결제(counseling_purchases.status='confirmed') 후, 구매자가 이름/연락처/
--     나이/직업/고민(객관식)/상담으로 해결받고 싶은 부분(주관식)을 제출하면 보관한다.
--   · 운영자가 이 응답을 보고 가장 잘 맞는 심리 상담사를 배정 → 카카오톡으로 연락.
--   · 워크북 설문(workshop_survey_responses)과 같은 역할이되, 상담은 비로그인 결제가
--     가능하므로 회원(user_id) 대신 결제 주문번호(order_id)를 기준으로 묶는다.
--
-- 접근 정책:
--   · 저장(INSERT/UPDATE)은 API 라우트의 service role(admin) 클라이언트로 수행(RLS 우회).
--   · 조회도 admin(서버 컴포넌트/관리자)에서 수행한다(비로그인 결제 대응).
-- ============================================================

-- updated_at 자동 갱신 트리거 함수(다른 마이그레이션과 공유, 멱등하게 재정의).
CREATE OR REPLACE FUNCTION waitlist_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS counseling_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 결제 주문번호 (CN-{typeId}-{ts}-{rand}) — 결제 1건당 설문 1건. 멱등성 위해 UNIQUE.
  order_id text NOT NULL UNIQUE,
  -- 상담 유형 스냅샷 (COUNSELING_TYPES id: trial, package-8, report-interpret 등)
  counseling_type text,
  -- 결제자 (로그인 시에만 채움; 익명 결제는 NULL)
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 응답 내용
  name text NOT NULL,                        -- 이름
  phone text NOT NULL,                       -- 연락처
  age text,                                  -- 나이
  job text,                                  -- 직업
  concern text,                              -- 고민(객관식) — 한글 라벨로 저장(기타는 직접입력값)
  goal text,                                 -- 상담으로 해결받고 싶은 부분(주관식)

  -- 운영 상태(상담사 배정 추적용)
  status text NOT NULL DEFAULT 'submitted',  -- submitted | assigned | contacted

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_counseling_survey_created
  ON counseling_survey_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_counseling_survey_user
  ON counseling_survey_responses(user_id);

ALTER TABLE counseling_survey_responses ENABLE ROW LEVEL SECURITY;

-- 본인 회원은 자신의 응답만 조회 가능(로그인 결제 건). 비로그인 건 조회/쓰기는 admin만.
DROP POLICY IF EXISTS "본인 상담 설문 응답 조회" ON counseling_survey_responses;
CREATE POLICY "본인 상담 설문 응답 조회"
  ON counseling_survey_responses
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP TRIGGER IF EXISTS trg_counseling_survey_touch ON counseling_survey_responses;
CREATE TRIGGER trg_counseling_survey_touch
  BEFORE UPDATE ON counseling_survey_responses
  FOR EACH ROW EXECUTE FUNCTION waitlist_touch_updated_at();
