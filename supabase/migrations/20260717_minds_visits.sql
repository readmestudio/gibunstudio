-- ============================================================
-- 광고 유입 방문 기록(minds_visits) — 랜딩 도착 시점에 남기는 첫 흔적
-- ============================================================
--
-- 배경:
--   지금까지 유입 정보(utm_*·fbclid)는 sessionStorage 에만 담겼다가, 사용자가
--   테스트를 끝내고 "리드"가 생기는 순간에야 minds_leads 로 들어갔다. 즉
--   **들어왔다가 그냥 나간 사람은 DB 에 아무 흔적이 없다.**
--   그런데 이 퍼널의 실제 병목은 바로 그 구간이다(시작→페이월 90% 이탈).
--   이탈자를 못 세면 "광고 세트별로 몇 명이 왔는가"라는 분모 자체가 없어서
--   전환율을 계산할 수 없다.
--
--   메타 광고 관리자도 클릭·랜딩뷰를 세지만, 그 숫자는 메타 안에만 있어서
--   우리 DB 의 리드·결제와 조인할 수 없다. 게다가 이 계정은 "건강/웰빙" 분류로
--   전환 최적화가 막혀 있어(=메타 신호를 신뢰할 수 없음) 자체 측정이 더 중요하다.
--
-- 그래서 랜딩 도착 즉시 1행을 남긴다. 이 표의 행 수 = 광고 세트별 분모.
--
-- 개인정보:
--   minds_leads 와 동일 정책. IP 는 봇 판별·어뷰징 목적에 한해 text 로 보관하고
--   (IPv6·프록시 표기 흡수), 이메일 등 식별정보는 애초에 받지 않는다.
--   RLS 를 켜되 공개 정책을 두지 않아 admin(service role)만 접근한다.
--
-- 볼륨 주의:
--   리드와 달리 이 표는 방문마다 쌓여 훨씬 빨리 증가한다. 그래서
--   · 클라이언트가 sessionStorage 로 세션당 1회만 쏘고
--   · API 라우트에 rate limit 을 걸며
--   · **유입 파라미터가 하나라도 있을 때만**(=광고 유입) 기록한다.
--     자연 유입·크롤러까지 전부 적재하면 비용만 늘고 분모가 오염된다.

CREATE TABLE IF NOT EXISTS minds_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 어느 퍼널에 도착했나. minds_leads.test_type 과 같은 슬러그 체계를 쓰되,
  -- 언어가 다르면 성과도 다르므로 영어 퍼널은 따로 센다.
  --   'inner_child_en' | 'saju_en' | 'inner_child' | 'minds' …
  test_type text NOT NULL,

  -- 광고 유입(attribution) — minds_leads 와 동일한 컬럼 구성으로 맞춰
  -- 두 표를 utm_content(광고 세트) 기준으로 그대로 조인할 수 있게 한다.
  utm_source text,
  utm_medium text,
  utm_campaign text,   -- 캠페인 = 나라 (us, kr …)
  utm_content text,    -- 광고 세트 = 지역 (los_angeles …)
  utm_term text,       -- 광고 = 소재 (set3_debut_date …)
  fbclid text,
  landing_path text,
  referrer text,

  -- 봇 판별
  ip_address text,
  user_agent text,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- 기간별 집계(최근 N일 유입)
CREATE INDEX IF NOT EXISTS idx_minds_visits_created ON minds_visits(created_at DESC);
-- 퍼널별 필터 → 그 안에서 광고 세트별 집계
CREATE INDEX IF NOT EXISTS idx_minds_visits_test_type ON minds_visits(test_type, created_at DESC);
-- 광고 세트(지역)별 분모 집계
CREATE INDEX IF NOT EXISTS idx_minds_visits_utm_content ON minds_visits(utm_content);
-- 한 IP 에서 몰린 방문(봇) 확인
CREATE INDEX IF NOT EXISTS idx_minds_visits_ip ON minds_visits(ip_address, created_at DESC);

ALTER TABLE minds_visits ENABLE ROW LEVEL SECURITY;
-- 공개 정책 없음: anon/authenticated 는 접근 불가. API 라우트의 admin 클라이언트만 우회.
