-- Mind Spill — 워크북에 상담사 강점 코멘트(줄글) 저장 필드 추가.
-- LLM(Gemini)이 모든 모먼트를 종합해 작성하는 narrative.

ALTER TABLE mind_spill_workbooks
  ADD COLUMN IF NOT EXISTS strengths_report jsonb;
