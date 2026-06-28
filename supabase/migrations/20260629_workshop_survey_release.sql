-- ============================================================
-- 워크북 "맞춤 전달" 컬럼 (workshop_survey_responses)
-- ============================================================
--
-- 목적:
--   · 결제·설문을 마친 회원에게는, 운영자(상담사·명상 디렉터)가 현재 워크북을
--     토대로 살짝 변형한 "유저별 맞춤 워크북"을 외부 링크로 전달한다.
--   · 관리자 화면에서 회원별 워크북 링크(workbook_url)를 저장하면 released_at 에
--     시각이 찍히고, 그때부터 그 회원만 전달 안내 페이지에서 "워크북 열기"가 보인다.
--   · 알림톡 링크는 모두 동일(…/dashboard/self-workshop/generating)하지만,
--     서버가 로그인한 본인의 workbook_url 을 찾아 보여주므로 사람마다 결과가 다르다.
--
--   workbook_url NULL = 미전달(제작 중) / 값 있음 = 전달 완료(열람 가능).
--
-- 멱등: 컬럼이 없을 때만 추가(이미 적용된 DB에서도 안전).
-- ============================================================

ALTER TABLE workshop_survey_responses
  ADD COLUMN IF NOT EXISTS released_at timestamptz;

ALTER TABLE workshop_survey_responses
  ADD COLUMN IF NOT EXISTS workbook_url text;
