-- ============================================================
-- 퍼널 이벤트 기록 (funnel_events)
-- ============================================================
--
-- 목적:
--   · 브라우저에서만 일어나는 깔때기 이벤트(테스트 시작 / 페이월 도달 / 결제 클릭)는
--     지금까지 운영자 슬랙으로 "중계"만 되고 어디에도 저장되지 않았다.
--     → 슬랙 메시지가 유일한 기록이라 집계가 불가능했고, 운영자가 채널을 눈으로
--       세거나 캡쳐를 떠서 공유하는 것 외엔 방법이 없었다.
--   · 이 테이블은 그 이벤트들의 '기록' 책임만 진다. 슬랙 발송은 종전대로 별도로 돈다.
--     (알림 = 실시간 인지용 / 이 테이블 = 집계용. 둘은 목적이 다르므로 분리 유지.)
--
-- 어떤 라우트가 쓰는가:
--   · /api/minds/track          → funnel: 'minds' | 'inner_child'
--   · /api/workshop/track       → funnel: 'workshop'
--   · /api/inner-child/en/track → funnel: 'inner_child_en'
--
-- lead_id 에 FK를 걸지 않는 이유:
--   토큰 없이 호출 가능한 공개 엔드포인트라 존재하지 않는 UUID가 들어올 수 있다.
--   FK를 걸면 그런 요청에서 INSERT가 통째로 실패해 '이벤트를 잃는' 결과가 되는데,
--   이 테이블의 존재 이유가 정확히 그 손실을 막는 것이다.
--   → 집계 테이블은 참조 무결성보다 '무조건 남는다'를 우선한다.
--     실제 리드와의 결합은 조회 시점에 minds_leads 와 조인해서 판단한다.

CREATE TABLE IF NOT EXISTS public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 어느 퍼널에서 발생했나. 라우트가 화이트리스트로 검증한 값만 들어온다.
  funnel text NOT NULL
    CHECK (funnel IN ('minds', 'inner_child', 'inner_child_en', 'workshop')),

  -- 어떤 단계인가. 라우트가 화이트리스트로 검증한 값만 들어온다.
  --   test_start      — 테스트 시작(첫 문항 응답 등 '진짜 시작' 신호)
  --   reached_paywall — 잠금 목차/페이월 도달
  --   checkout_click  — 결제 모달 오픈(KR 유료 리포트)
  --   buy_attempt     — 결제수단 버튼 클릭(워크북)
  --   request_click   — 리포트 요청 클릭(EN, 결제 없는 퍼널의 최종 전 단계)
  event text NOT NULL
    CHECK (event IN ('test_start', 'reached_paywall', 'checkout_click',
                     'buy_attempt', 'request_click')),

  -- 익명 퍼널의 리드 식별자(minds_leads.id). 비로그인/미발급 시점이면 NULL.
  -- FK 미설정 — 위 주석 참조.
  lead_id uuid,

  -- workshop 퍼널의 출처 라벨(예: '성취중독 테스트'). 라우트가 키→라벨로 변환해 넣는다.
  source text,
  -- workshop buy_attempt 의 결제수단(kakaopay 등). 그 외 이벤트에선 NULL.
  method text,

  -- 이 이벤트가 슬랙으로도 발송됐는지. /minds 뮤트 가드(variant !== 'inner_child')에
  -- 걸려 발송되지 않은 이벤트도 여기엔 남으므로, 슬랙 기준 집계와 대조할 때 필요하다.
  -- false 인 행 = '슬랙엔 없지만 실제로 일어난' 이벤트.
  notified boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- 주 조회 패턴: "이 퍼널의 이 단계가 기간 내 몇 건인가"
CREATE INDEX IF NOT EXISTS funnel_events_funnel_event_created_at_idx
  ON public.funnel_events (funnel, event, created_at DESC);

-- 보조: 기간 전체 스캔(일자별 추이)
CREATE INDEX IF NOT EXISTS funnel_events_created_at_idx
  ON public.funnel_events (created_at DESC);

-- 보조: 특정 리드의 퍼널 여정 추적
CREATE INDEX IF NOT EXISTS funnel_events_lead_id_idx
  ON public.funnel_events (lead_id)
  WHERE lead_id IS NOT NULL;

-- RLS: 정책을 두지 않는다 → service_role(API 라우트의 admin 클라이언트)만 접근 가능.
-- open_notifications 와 달리 익명 INSERT 를 열지 않는 이유: 이 테이블은 라우트가
-- rate limit + 화이트리스트 검증을 통과시킨 뒤에만 쓰므로, 클라이언트가 직접 쓸 이유가 없다.
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
