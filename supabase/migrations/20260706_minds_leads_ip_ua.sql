-- ============================================================
-- minds_leads: 봇/어뷰징 판별용 IP · User-Agent 컬럼 추가
-- ============================================================
--
-- 배경:
--   광고 스파이크 유입이 실사용자인지 봇인지 판별할 때, 지금은 유입경로(utm/fbclid)
--   · 완주 여부 · 타이밍 간격 같은 "정황 증거"만 있어 100% 확신이 어렵다.
--   IP · User-Agent 를 남기면 (a) 한 IP에서 다수 리드 (b) 동일/비어있는 UA
--   (c) 데이터센터 대역 IP 같은 봇 신호를 직접 확인할 수 있다.
--
-- 개인정보 유의:
--   IP 는 개인정보에 해당할 수 있으므로 어뷰징 판별·보안 목적에 한해 보관한다.
--   운영정책상 보관기간(리드 1년)에 함께 종속되며, 별도 노출 UI는 만들지 않는다.
--   RLS 는 이미 켜져 있고 공개 정책이 없어 admin(service role)만 접근 가능하다.
--
-- 컬럼:
--   ip_address  — 클라이언트 IP. x-forwarded-for 첫 홉(getClientIp) 기준.
--                 IPv6 대응 위해 inet 대신 text 로 둔다(프록시 표기 다양성 흡수).
--   user_agent  — 브라우저 UA 문자열. 과도한 길이 방지로 저장측에서 절단.

ALTER TABLE minds_leads
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text;

-- 같은 IP에서 짧은 시간에 몰린 리드를 빠르게 집계하기 위한 인덱스.
CREATE INDEX IF NOT EXISTS idx_minds_leads_ip ON minds_leads(ip_address);
