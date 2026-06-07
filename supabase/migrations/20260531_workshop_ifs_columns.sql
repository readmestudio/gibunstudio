-- =============================================================
-- 성취 중독 워크북 — IFS 모델 기반 재설계 (2026-05-31)
--
-- 신규 컬럼 (Step 3·4·6·7·8 산출물 저장):
--   parts_discovery     : Step 3 PART 찾기 — IFS 활동지2 기반 대화 + 발견된 마음들
--   schema_assessment   : Step 4 18 도식 판별 — 5 도식 도메인 반응형 대화 + 도식 점수
--   parts_integration   : Step 6·7·8 — 관리자 발견·긍정 의도·역할 통찰·건강한 활용법
--
-- 기존 컬럼(mechanism_analysis, core_belief_excavation 등)은 legacy로 보존.
-- =============================================================

BEGIN;

ALTER TABLE workshop_progress
  ADD COLUMN IF NOT EXISTS parts_discovery JSONB,
  ADD COLUMN IF NOT EXISTS schema_assessment JSONB,
  ADD COLUMN IF NOT EXISTS parts_integration JSONB;

COMMENT ON COLUMN workshop_progress.parts_discovery IS
  'Step 3 (PART 찾기): IFS 활동지2 흐름의 부분 발견 대화 transcript + 발견된 마음들(parts) 목록';

COMMENT ON COLUMN workshop_progress.schema_assessment IS
  'Step 4 (18 도식 판별): 5 도식 도메인 반응형 대화 transcript + 18 도식 평균 점수 + 상위 2~3개 도식 해석';

COMMENT ON COLUMN workshop_progress.parts_integration IS
  'Step 6·7·8: 관리자 발견(6) + 긍정적 의도(7) + 역할 통찰·도움 안 된 상황·도움 된 순간·건강한 활용법(8) 누적 데이터';

COMMIT;
