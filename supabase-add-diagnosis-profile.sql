-- Step 3 상단에 보여줄 "진단 결과 기반 캐릭터 프로필" JSON 캐시 컬럼
-- personalize-report API가 diagnosis_scores만으로 생성 후 이 컬럼에 저장
--
-- 스키마 (DiagnosisProfile — src/lib/self-workshop/diagnosis-profile.ts):
-- {
--   "character_line": "'뒤처짐'에 쫓기는 경주자",
--   "character_description": "...2~3문장...",
--   "life_impact": {
--     "work": "...", "relationship": "...", "rest": "...", "body": "..."
--   }
-- }
--
-- 기존 personalized_report(TEXT) 컬럼은 DROP 하지 않음 (과거 유저 데이터 보존).
-- 신규 write는 이 diagnosis_profile JSONB로만 수행.

ALTER TABLE workshop_progress
  ADD COLUMN IF NOT EXISTS diagnosis_profile JSONB;
