-- ============================================================
-- 워크북 결제·진행에 minds 리드 연결 키(minds_lead_id) 추가
-- ============================================================
--
-- 목적:
--   · 무료 /minds 테스트에서 만든 "배역"(minds_leads.parts_map)을, 워크북 결제
--     이후에도 이어서 보여주기 위한 연결 키를 심는다.
--   · minds 는 비로그인(minds_leads.id), 워크북은 로그인(auth.users.id) 기반이라
--     두 신원 체계를 잇는 다리가 없었다. 결제 시점에 클라이언트가 보존한 leadId 를
--     결제 레코드에 실어, 결제 승인 시 진행(workshop_progress)으로 복사한다.
--
-- 흐름:
--   1) 결제 생성     → workshop_purchases.minds_lead_id 저장 (있을 때만)
--   2) 결제 승인     → workshop_progress.minds_lead_id 로 복사
--   3) 워크북 단계   → minds_leads.parts_map 을 JOIN 으로 조회해 배역 복원
--
-- 비고:
--   · minds_leads.id(UUID) 를 가리키지만, FK 는 걸지 않는다. minds_leads 는
--     service role 전용(RLS 공개 정책 없음)이고, 워크북 결제 생성은 사용자 클라이언트로
--     이뤄지므로 FK 검증/권한 결합을 피해 느슨하게 연결한다(논리적 참조).
--   · minds 경유가 아니면 NULL — 기존 결제 흐름에 영향 없음.

ALTER TABLE public.workshop_purchases
  ADD COLUMN IF NOT EXISTS minds_lead_id UUID;

ALTER TABLE public.workshop_progress
  ADD COLUMN IF NOT EXISTS minds_lead_id UUID;

COMMENT ON COLUMN public.workshop_purchases.minds_lead_id IS
  '무료 /minds 리드(minds_leads.id) 연결 키. minds 경유 결제일 때만 채워진다(논리적 참조, FK 없음).';
COMMENT ON COLUMN public.workshop_progress.minds_lead_id IS
  '무료 /minds 리드(minds_leads.id) 연결 키. 결제 승인 시 workshop_purchases 에서 복사된다.';

-- 워크북 단계에서 user_id 로 진행을 찾은 뒤 minds 배역을 조회하므로 별도 인덱스는 불필요.
-- (parts_map 조회는 minds_leads PK(id) 단건 lookup)
