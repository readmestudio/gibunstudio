-- ============================================================
-- 워크북 대기신청 — 광고 유입(Attribution) 컬럼 추가
-- ============================================================
--
-- 목적:
--   · 메타 광고에서 /payment/self-workshop 으로 랜딩되는 트래픽이
--     "어떤 크리에이티브(광고)에서 들어와 대기신청까지 했는지"를
--     1st-party 데이터로 직접 집계하기 위함.
--   · 광고 URL 에 utm_* 파라미터를 달아 보내면, 클라이언트가 첫 진입 시
--     이 값을 보관했다가 대기신청 제출 시 함께 저장한다.
--
-- 비고:
--   · 기존 source 컬럼('waitlist_page')은 그대로 둔다 — 페이지 단위 유입 경로.
--   · utm_content 가 광고별 식별자(예: ad01 / anxiety_hook)로 핵심 분석 키.

ALTER TABLE workbook_waitlist
  ADD COLUMN IF NOT EXISTS utm_source text,    -- 유입 매체 (예: meta)
  ADD COLUMN IF NOT EXISTS utm_medium text,    -- 매체 유형 (예: paid_social)
  ADD COLUMN IF NOT EXISTS utm_campaign text,  -- 캠페인 (예: self_workshop_waitlist)
  ADD COLUMN IF NOT EXISTS utm_content text,   -- 광고/크리에이티브 식별자 (예: ad01) ← 핵심 분석 키
  ADD COLUMN IF NOT EXISTS utm_term text,      -- 키워드/세부 (선택)
  ADD COLUMN IF NOT EXISTS fbclid text,        -- 메타 클릭 ID (백업 추적용)
  ADD COLUMN IF NOT EXISTS landing_path text;  -- 최초 랜딩 경로 (예: /payment/self-workshop)

-- "광고별 대기신청 수" 집계를 빠르게.
CREATE INDEX IF NOT EXISTS idx_workbook_waitlist_utm_content
  ON workbook_waitlist (utm_content);
