-- ============================================================
-- /minds 계정 귀속(account binding) — 리드·결제를 user_id 로 묶기 위한 인덱스
-- ============================================================
--
-- 배경:
--   · 기존 /minds 는 비로그인 리드젠이라 리포트의 "주인"이 브라우저 localStorage 의
--     leadId 였다. 이제 "무료 리포트 후 결제 직전 로그인"으로 전환하면서, 리드·결제를
--     실제 계정(user_id)에 묶는다 → 기기/브라우저가 달라도 로그인하면 내 리포트 전부 조회.
--
-- 이 마이그레이션이 하는 일(스키마 변경 없음 — user_id 컬럼은 두 테이블 모두 이미 존재):
--   1) minds_leads.user_id 조회 인덱스 — "내 리드 목록"(기기 무관 복원)용.
--   2) minds_leads.email 조회 인덱스 — 같은 이메일의 과거 익명 리드 자동 귀속(claim)용.
--   3) minds_relationship_purchases.user_id 조회 인덱스 — "내 유료 리포트 목록"용.
--
-- 모두 멱등(IF NOT EXISTS) — 재실행 안전.

-- 1) 로그인 사용자의 리드 목록 (user_id 로 묶인 무료 리포트 조회).
CREATE INDEX IF NOT EXISTS idx_minds_leads_user_id
  ON minds_leads(user_id)
  WHERE user_id IS NOT NULL;

-- 2) 같은 이메일의 과거 익명 리드 일괄 귀속 — claim 시 email = user.email 로 찾는다.
--    (email 은 INSERT 시 소문자로 정규화되어 저장되므로 단순 btree 로 충분.)
CREATE INDEX IF NOT EXISTS idx_minds_leads_email
  ON minds_leads(email)
  WHERE email IS NOT NULL;

-- 3) 로그인 사용자의 유료 리포트 목록 (user_id 로 묶인 결제 조회).
CREATE INDEX IF NOT EXISTS idx_minds_relationship_user_id
  ON minds_relationship_purchases(user_id)
  WHERE user_id IS NOT NULL;
