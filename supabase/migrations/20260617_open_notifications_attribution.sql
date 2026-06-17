-- ============================================================
-- 알림신청(open_notifications) — 광고 유입(Attribution) 컬럼 추가
-- ============================================================
--
-- 목적:
--   · /payment/self-workshop 랜딩의 주력 CTA 인 "알림신청"이
--     어떤 크리에이티브(광고)에서 들어와 등록됐는지 집계하기 위함.
--   · 대기신청(workbook_waitlist)과 동일한 utm_* 컬럼 세트.
--
-- 비고:
--   · INSERT 는 anon/authenticated 본인 RLS 정책으로 이뤄지며, 컬럼을
--     제한하지 않으므로 utm_* 추가 저장에 정책 변경이 필요 없다.

ALTER TABLE public.open_notifications
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS landing_path text;

CREATE INDEX IF NOT EXISTS idx_open_notifications_utm_content
  ON public.open_notifications (utm_content);
