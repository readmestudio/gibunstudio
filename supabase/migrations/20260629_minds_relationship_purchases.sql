-- ============================================================
-- /minds 유료 "내 마음 속 다섯 가지 배역과 그 관계" 리포트 결제 (₩9,900)
-- ============================================================
--
-- 목적:
--   · 무료 /minds 테스트(파이널 배역표/페이월)에서 전환한 유료 미니리포트의 결제·산출물.
--   · 결제 후 답변을 다시 분석해 5배역 배역표 + 관계도 + 방어기제 + 마음의 목소리 +
--     실천 처방을 생성한 RelationshipReport(JSON)를 report_json 에 1회 캐시한다.
--
-- 익명(비로그인) 모델:
--   · /minds 는 로그인 없이 진행하는 리드젠 흐름이라, 결제도 leadId(minds_leads) 기준.
--   · minds_leads 와 동일하게 RLS는 켜되 공개 정책을 두지 않는다 → API 라우트의
--     service role(admin) 클라이언트만 INSERT/UPDATE/SELECT 한다.
--   · user_id 는 로그인 상태에서 산 경우의 선택적 귀속용(보통 NULL).
--
-- NicePay 통합:
--   · orderId prefix = 'MR-' (Minds Relationship).
--   · 결제 생성: POST /api/payment/minds-relationship/create → MR-{ts}-{rand}, pending INSERT.
--   · 승인 콜백: /api/payment/nicepay/return (기존 라우트에 MR- 분기 추가) → confirmed.
--   · 금액은 서버 상수(₩9,900)로 검증한다(위변조 방지).

CREATE TABLE minds_relationship_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 어떤 무료 테스트(리드)의 답변으로 만든 리포트인지. 분석의 입력 키.
  lead_id uuid REFERENCES minds_leads(id) ON DELETE CASCADE NOT NULL,
  -- 로그인 상태에서 결제한 경우의 선택적 귀속(비로그인은 NULL).
  user_id uuid REFERENCES auth.users(id),

  amount integer NOT NULL CHECK (amount > 0),
  order_id text UNIQUE NOT NULL,   -- MR-{timestamp}-{rand}
  payment_key text,                -- NicePay tid (승인 후 기록)

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  paid_at timestamptz,

  -- 생성된 RelationshipReport(JSON). 결제 후 1회 생성해 캐시(재생성 방지).
  report_json jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 한 리드(=1인 1테스트)에 confirmed 결제는 단 하나 (멱등성 + 중복 결제 방지 + 1인 1회 정책).
CREATE UNIQUE INDEX uq_minds_relationship_lead_confirmed
  ON minds_relationship_purchases(lead_id)
  WHERE status = 'confirmed';

-- 자주 조회되는 패턴 (order_id 는 UNIQUE 제약으로 이미 인덱싱됨).
CREATE INDEX idx_minds_relationship_lead_status
  ON minds_relationship_purchases(lead_id, status);

-- RLS — 공개 정책 없음: anon/authenticated 직접 접근 불가. API 라우트의 admin 클라이언트만 우회.
ALTER TABLE minds_relationship_purchases ENABLE ROW LEVEL SECURITY;

-- updated_at 자동 갱신 (minds_leads 와 동일한 공유 함수 재사용).
CREATE TRIGGER trg_minds_relationship_purchases_touch
  BEFORE UPDATE ON minds_relationship_purchases
  FOR EACH ROW EXECUTE FUNCTION waitlist_touch_updated_at();
