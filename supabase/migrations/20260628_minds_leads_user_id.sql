-- ============================================================
-- 무료 /minds 리드에 로그인 사용자 신원(user_id) 추가
-- ============================================================
--
-- 목적:
--   · /minds 카카오 진입을 placeholder 가 아닌 실제 Supabase OAuth(provider:"kakao")
--     로 교체하면서, 리드를 만든 "로그인 사용자"의 신원을 함께 기록한다.
--   · 기존엔 channel/email 만 있었고 email 채널은 비로그인이라 신원이 익명이었다.
--     카카오 채널은 실제 로그인이므로 auth.users.id 를 남겨 후속 결제/워크북과
--     같은 신원으로 이어붙일 수 있게 한다.
--
-- 비고:
--   · email 채널(비로그인)은 user_id 가 NULL 이다 — 기존 흐름 영향 없음.
--   · auth.users 를 가리키지만 FK 는 걸지 않는다. minds_leads 는 service role 전용
--     (RLS 공개 정책 없음)이라, /api/minds/lead 라우트의 admin 클라이언트가 서버 세션
--     에서 확인한 user.id 만 채운다(논리적 참조, 느슨한 결합).

ALTER TABLE public.minds_leads
  ADD COLUMN IF NOT EXISTS user_id UUID;

COMMENT ON COLUMN public.minds_leads.user_id IS
  '리드를 만든 로그인 사용자(auth.users.id). 카카오 OAuth 채널일 때만 채워진다(논리적 참조, FK 없음). email 채널은 NULL.';

-- 같은 사용자의 리드를 빠르게 찾기 위한 인덱스(부분 인덱스 — user_id 있는 행만).
CREATE INDEX IF NOT EXISTS idx_minds_leads_user_id
  ON public.minds_leads(user_id)
  WHERE user_id IS NOT NULL;
