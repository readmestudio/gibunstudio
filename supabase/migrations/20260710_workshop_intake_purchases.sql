-- ============================================================
-- "내면 아이 찾기 워크샵" 결제 (₩99,000) → intake 사전진단 토큰 발급
-- ============================================================
--
-- 목적:
--   · 상담사 1:1 워크샵 결제 레코드. 리포트(₩19,900) 결제와 전혀 다른 상품이라
--     별도 테이블로 둔다 (minds_relationship_purchases 와 분리).
--   · 승인(confirmed) 시 intake_sessions 세션을 발급하고 그 id/token 을 여기에
--     기록해, 결제 → 사전진단 링크(알림톡 `/intake/{token}`) 흐름을 잇는다.
--
-- 로그인 필수 모델:
--   · 워크샵은 로그인 필수 직접 구매 — leadId 를 쓰지 않고 user_id 가 항상 있다.
--
-- NicePay 통합:
--   · orderId prefix = 'IW-' (Inner-child Workshop) — return 라우트가 이 prefix 로 분기.
--   · 금액은 서버 상수(WORKSHOP_PRICE, ₩99,000)로 검증한다(위변조 방지).

CREATE TABLE IF NOT EXISTS workshop_intake_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 구매자(Supabase auth 유저) — 로그인 필수 상품이라 항상 존재.
  user_id uuid REFERENCES auth.users(id) NOT NULL,

  -- 구매자 표시명 — intake 세션 display_name + 알림톡 #{고객명} 용.
  name text,
  -- 알림톡 수신용 국내 휴대폰 번호.
  phone text,
  email text,

  order_id text NOT NULL UNIQUE,   -- IW-{timestamp}-{rand}
  tid text,                        -- NicePay 거래번호 (승인 후 기록)

  amount integer NOT NULL DEFAULT 99000,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'refunded')),

  -- 승인 시 발급한 intake_sessions.id (FK 없는 느슨한 링크 — 세션 재발급 대비).
  intake_session_id uuid,
  -- 링크 조립용 토큰 비정규화 사본 (intake_sessions.token).
  intake_token text,

  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  refunded_at timestamptz
);

-- 자주 조회되는 패턴: 유저별 구매 조회, 상태별 어드민 조회, 승인 콜백의 order_id 조회.
CREATE INDEX IF NOT EXISTS idx_workshop_intake_purchases_user
  ON workshop_intake_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_workshop_intake_purchases_status
  ON workshop_intake_purchases(status);
CREATE INDEX IF NOT EXISTS idx_workshop_intake_purchases_order
  ON workshop_intake_purchases(order_id);

ALTER TABLE workshop_intake_purchases ENABLE ROW LEVEL SECURITY;

-- 정책 없음(의도적) → service role 클라이언트만 읽기/쓰기 가능.
-- 유저·관리자 접근은 전부 서버 라우트(createAdminClient)를 경유한다 (intake_sessions 와 동일).
