-- ====================================================================
-- 성취 중독 워크북 5섹션 / 11단계 재구조화 마이그레이션
-- 2026-04-25
--
-- 변경 요약:
--   - 8단계 평탄 구조 → 5섹션 / 11단계 (TEST → FIND_OUT → DESTROY → SOLUTION → SUMMARY)
--   - 옛 Step 4 (분석)와 옛 Step 5 (핵심신념) 순서 swap
--     · 새 Step 4 = 핵심 신념 찾기 (옛 Step 5)
--     · 새 Step 5 = 통합 패턴 분석 (옛 Step 4 + 6-Part 확장)
--   - 새 Step 6 = DESTROY · 1단계 (핵심 믿음 반박, 신규)
--   - 새 Step 7 = DESTROY · 2단계 (대안 자동사고 시뮬레이션, 신규)
--   - 새 Step 8 = SOLUTION · 1단계 (새 핵심 신념 찾기, 신규)
--   - 새 Step 9 = SOLUTION · 2단계 (대처 계획, 옛 Step 6)
--   - 새 Step 10 = SUMMARY · 1단계 (전문 리포트, 옛 Step 7 + DO/DON'T 강화)
--   - 새 Step 11 = SUMMARY · 2단계 (마무리 성찰, 옛 Step 8)
-- ====================================================================

BEGIN;

-- 1) 신규 컬럼: DESTROY · 1·2단계, SOLUTION · 1단계 데이터 + legacy 백업 컬럼
ALTER TABLE workshop_progress
  ADD COLUMN IF NOT EXISTS belief_destroy JSONB,
  ADD COLUMN IF NOT EXISTS alternative_thought_simulation JSONB,
  ADD COLUMN IF NOT EXISTS new_belief JSONB,
  ADD COLUMN IF NOT EXISTS mechanism_insights_legacy_v1 JSONB,
  ADD COLUMN IF NOT EXISTS summary_cards_legacy_v1 JSONB;

COMMENT ON COLUMN workshop_progress.belief_destroy IS
  'DESTROY · 1단계 데이터: triple_column / double_standard / evidence_review / cost_benefit';
COMMENT ON COLUMN workshop_progress.alternative_thought_simulation IS
  'DESTROY · 2단계 데이터: scenarios[].alternatives[] (대안 자동사고 → 예측 감정/행동)';
COMMENT ON COLUMN workshop_progress.new_belief IS
  'SOLUTION · 1단계 데이터: 같은 상황에 대한 새 핵심 신념';
COMMENT ON COLUMN workshop_progress.mechanism_insights_legacy_v1 IS
  '5-Part(옛) mechanism_insights 백업. 6-Part 재생성 후 안정화되면 DROP 가능';
COMMENT ON COLUMN workshop_progress.summary_cards_legacy_v1 IS
  '4-카드 배열(옛) summary_cards 백업. ProfessionalReport 재생성 후 DROP 가능';

-- 2) mechanism_insights: 5-Part 노드 스키마 → 6-Part로 변경되므로 무효화 후 재생성
--    legacy 컬럼에 백업 후 NULL 처리. 사용자가 새 Step 5 진입 시 자동 재생성됨.
UPDATE workshop_progress
SET mechanism_insights_legacy_v1 = mechanism_insights,
    mechanism_insights = NULL
WHERE mechanism_insights IS NOT NULL;

-- 3) summary_cards: 배열 → ProfessionalReport 객체로 스키마 변경되므로 무효화 후 재생성
UPDATE workshop_progress
SET summary_cards_legacy_v1 = summary_cards,
    summary_cards = NULL
WHERE summary_cards IS NOT NULL;

-- 4) in_progress 사용자의 current_step 매핑 (옛 1~8 → 새 1~10)
--    매핑 표:
--      옛 1 (진단)             → 새 1 (TEST 1)               그대로
--      옛 2 (진단 결과)        → 새 2 (TEST 2)               그대로
--      옛 3 (5-Part 실습)      → 새 3 (FIND_OUT 1)           그대로
--      옛 4 (분석)             → 새 3 (FIND_OUT 1로 회귀)    insights 비웠으므로 안전한 회귀
--      옛 5 (핵심신념)         → 새 4 (FIND_OUT 2)           swap
--      옛 6 (대처 계획)        → 새 6 (DESTROY 1로 진입)     신규 단계 강제 흐름
--      옛 7 (써머리)           → 새 6 (DESTROY 1로 회귀)     summary_cards 비웠으므로 재생성됨
--      옛 8 (마무리 성찰)      → 새 6 (DESTROY 1로 회귀)     completed가 아니면 신규 흐름 강제
WITH step_map AS (
  SELECT id,
    CASE
      WHEN current_step <= 3 THEN current_step
      WHEN current_step = 4 THEN 3
      WHEN current_step = 5 THEN 4
      WHEN current_step >= 6 THEN 6
      ELSE current_step
    END AS new_step
  FROM workshop_progress
  WHERE status = 'in_progress'
)
UPDATE workshop_progress p
SET current_step = sm.new_step
FROM step_map sm
WHERE p.id = sm.id;

-- 5) completed 사용자: 새 step 11(마무리 성찰)으로 강제. SUMMARY 1(step 10) 재진입 시
--    새 ProfessionalReport 형식으로 자동 재생성됨.
UPDATE workshop_progress
SET current_step = 11
WHERE status = 'completed';

COMMIT;

-- ====================================================================
-- 운영 노트:
--   * legacy 컬럼은 1~3개월 안정화 후 별도 PR로 DROP 권장
--   * 코드 deploy 직후 본 SQL 실행. 트랜잭션 감싸 있으니 실패 시 롤백.
--   * RLS 정책은 변경 없음 (기존 정책 그대로 적용됨)
-- ====================================================================
