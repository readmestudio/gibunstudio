-- 오픈 알림 신청 테이블
-- 비로그인 사용자가 ProgramCards / PricingTable / husband-match 상세 등에서
-- "알림 신청" 모달을 통해 이름·휴대폰 번호를 남기면 여기 들어옵니다.
-- 운영자는 service_role 로 program_type 별 조회 → 카카오/SMS 발송에 사용.

CREATE TABLE IF NOT EXISTS public.open_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  program_type TEXT NOT NULL DEFAULT '7day',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 운영 조회 패턴: 특정 program_type 의 최신 신청자 목록
CREATE INDEX IF NOT EXISTS open_notifications_program_type_created_at_idx
  ON public.open_notifications (program_type, created_at DESC);

-- RLS: 익명 INSERT 만 허용. SELECT / UPDATE / DELETE 는 service_role 만 (RLS 우회).
ALTER TABLE public.open_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_can_insert_open_notifications" ON public.open_notifications;
CREATE POLICY "anon_can_insert_open_notifications"
  ON public.open_notifications
  FOR INSERT
  WITH CHECK (true);
