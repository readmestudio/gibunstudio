-- ============================================================
-- 테스트 이탈 리뷰 (성취중독 · minds 공통)
-- ============================================================
--
-- 목적:
--   · 무료 테스트를 끝내고 페이월(결제 화면)을 본 방문자가, 결제하지 않고
--     이탈하려는 순간 뜨는 팝업에서 남긴 "후기"를 모은다.
--   · 매달 추첨으로 스타벅스 쿠폰을 보내야 하므로 연락처(이메일/휴대폰)도 함께 받는다.
--   · 성취중독·minds 두 테스트를 한 테이블에 담고 test_type 으로 구분한다(어드민에서 필터).
--
-- 접근 정책:
--   · 비로그인 방문자가 작성하므로 anon INSERT 만 허용한다(아래 정책).
--   · 읽기/수정/삭제 정책은 두지 않아, 어드민 화면의 service role 클라이언트만
--     조회할 수 있다. (minds_leads 와 동일한 패턴)

CREATE TABLE IF NOT EXISTS test_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 어느 테스트의 후기인가 — 'achievement'(성취중독) | 'minds'(마음 헬스체크)
  test_type text NOT NULL,

  -- 별점 1~5 (필수)
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  -- 후기 본문 (필수)
  content text NOT NULL,
  -- 추첨 당첨 연락용 (이메일 또는 휴대폰). 추첨 대상이 되려면 필요하므로 사실상 필수.
  contact text,

  -- minds 는 비로그인이라도 leadId(minds_leads.id)로 "누구"인지 이을 수 있다.
  -- 성취중독은 식별자가 없어 NULL 로 남는다.
  lead_id uuid,
  -- 로그인 사용자가 작성했다면(드물게) 신원 연결.
  user_id uuid,

  -- 운영 메타 — 어떤 환경에서 작성했는지 가볍게 남긴다.
  user_agent text,
  landing_path text,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- 어드민은 테스트별로 최신순 조회한다 → (test_type, created_at) 복합 인덱스.
CREATE INDEX idx_test_reviews_type_created ON test_reviews (test_type, created_at DESC);

ALTER TABLE test_reviews ENABLE ROW LEVEL SECURITY;

-- 비로그인 방문자(anon)도 후기를 남길 수 있어야 한다 → INSERT 만 공개.
-- (SELECT/UPDATE/DELETE 정책 없음 → service role 만 우회 가능)
CREATE POLICY "anon_can_insert_test_reviews"
  ON test_reviews FOR INSERT
  WITH CHECK (true);
