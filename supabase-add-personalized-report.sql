-- Step 3 진입 시 보여줄 개인화 줄글 리포트 캐시 컬럼
-- Gemini로 최초 생성 후 workshop_progress에 저장, 이후 재방문 시 그대로 사용

ALTER TABLE workshop_progress
  ADD COLUMN IF NOT EXISTS personalized_report TEXT;
