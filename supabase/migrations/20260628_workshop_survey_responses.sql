-- ============================================================
-- 셀프 워크북 맞춤 제작 설문 응답 (workshop_survey_responses)
-- ============================================================
--
-- 목적:
--   · 워크북 결제(workshop_purchases.status='confirmed') 후, 회원이 자신의
--     이름/연락처/나이/직업/고민(객관식)/해결받고 싶은 부분(주관식)을 제출하면 보관한다.
--   · 심리 상담사·명상 디렉터가 이 응답을 보고 워크북을 맞춤 제작 → 카카오톡으로 링크 전달.
--
-- 접근 정책:
--   · 저장(INSERT/UPDATE)은 API 라우트의 service role(admin) 클라이언트로 수행(RLS 우회).
--   · 조회는 두 경로:
--       - 본인 회원: SELECT 정책으로 자신의 행만 읽음(제출 여부 분기에 사용).
--       - 운영자: 관리자 대시보드에서 admin 클라이언트로 전체 조회(RLS 우회).
-- ============================================================

-- updated_at 자동 갱신 트리거 함수(다른 마이그레이션과 공유, 멱등하게 재정의).
CREATE OR REPLACE FUNCTION waitlist_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS workshop_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL,
  purchase_id uuid,                          -- workshop_purchases.id (있으면 연결)
  workshop_type text NOT NULL DEFAULT 'achievement-addiction',

  -- 응답 내용
  name text NOT NULL,                        -- 이름
  phone text NOT NULL,                       -- 연락처
  age text,                                  -- 나이
  job text,                                  -- 직업
  concern text,                              -- 고민(객관식) — 한글 라벨로 저장(기타는 직접입력값)
  goal text,                                 -- 워크북으로 해결받고 싶은 부분(주관식)

  -- 운영 상태(제작 진행 추적용)
  status text NOT NULL DEFAULT 'submitted',  -- submitted | making | delivered

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- 회원·워크북당 1건만(재제출 시 upsert로 갱신)
  UNIQUE (user_id, workshop_type)
);

CREATE INDEX IF NOT EXISTS idx_workshop_survey_created
  ON workshop_survey_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workshop_survey_user
  ON workshop_survey_responses(user_id);

ALTER TABLE workshop_survey_responses ENABLE ROW LEVEL SECURITY;

-- 본인 회원은 자신의 응답만 조회 가능(제출 여부 분기용). 쓰기 정책은 없음 → admin만 우회.
DROP POLICY IF EXISTS "본인 설문 응답 조회" ON workshop_survey_responses;
CREATE POLICY "본인 설문 응답 조회"
  ON workshop_survey_responses
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP TRIGGER IF EXISTS trg_workshop_survey_touch ON workshop_survey_responses;
CREATE TRIGGER trg_workshop_survey_touch
  BEFORE UPDATE ON workshop_survey_responses
  FOR EACH ROW EXECUTE FUNCTION waitlist_touch_updated_at();
