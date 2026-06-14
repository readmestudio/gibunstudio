-- ============================================================
-- 워크북 대기신청 — "기타" 보기 직접 입력값 저장
-- ============================================================
--
-- 각 객관식의 "기타" 선택 시 사용자가 직접 적는 내용을, 질문별 컬럼을 늘리지 않고
-- 단일 jsonb 맵에 모아 저장한다.
--   예: { "concern": "...", "job": "...", "goals": "...", "workbooks": "...",
--        "counseling_reason": "..." }
ALTER TABLE workbook_waitlist
  ADD COLUMN IF NOT EXISTS etc_details jsonb NOT NULL DEFAULT '{}'::jsonb;
