-- ============================================================
-- 무료 리드젠 "내 마음 속에 사는 마음들"(/minds) 리드 + 분석 결과
-- ============================================================
--
-- 목적:
--   · 광고로 유입된 방문자가 /minds 무료 테스트를 진행하며 남긴 연락처(리드)와,
--     축약 대화 5문항 답변 + LLM이 생성한 마음 지도(parts_map)를 보관한다.
--   · 로그인 없이 누구나 진행 가능(가입 장벽 제거) → API 라우트에서
--     service role(admin) 클라이언트로 INSERT/UPDATE 한다. RLS는 켜되 공개 정책은
--     두지 않아 anon/authenticated 가 직접 읽거나 쓸 수 없게 막는다.
--
-- 흐름:
--   1) 연락처 입력 시점     → INSERT (channel, email, 유입정보) → id 반환
--   2) 대화 완료·분석 시점  → 같은 id 행에 answers · parts_map UPDATE
--   이렇게 두 단계로 나눠, 대화 도중 이탈해도 연락처는 남는다.
--
-- 비고:
--   · 같은 이메일이 여러 번 진행할 수 있음(재테스트) → email UNIQUE 아님.
--   · email 은 kakao 채널 골격에서 빈 값일 수 있어 NOT NULL 아님.

-- updated_at 자동 갱신 트리거 함수 (없으면 생성 — 다른 마이그레이션과 공유 가능).
CREATE OR REPLACE FUNCTION waitlist_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE minds_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 연락처
  channel text NOT NULL DEFAULT 'email',  -- 'email' | 'kakao'
  email text,                             -- email 채널 입력값 (kakao 골격은 NULL 가능)

  -- 무료 대화 5문항 답변 [{ id, question, answer }] (분석 완료 시 채움)
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- LLM이 생성한 마음 지도(PartsMap). 분석 성공/폴백 모두 저장.
  parts_map jsonb,

  -- 운영 메타 + 광고 유입(attribution)
  source text DEFAULT 'minds',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  landing_path text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_minds_leads_created ON minds_leads(created_at DESC);
CREATE INDEX idx_minds_leads_email ON minds_leads(email);

ALTER TABLE minds_leads ENABLE ROW LEVEL SECURITY;
-- 공개 정책 없음: anon/authenticated 는 접근 불가. API 라우트의 admin 클라이언트만 우회.

CREATE TRIGGER trg_minds_leads_touch
  BEFORE UPDATE ON minds_leads
  FOR EACH ROW EXECUTE FUNCTION waitlist_touch_updated_at();

-- ============================================================
-- 무료 /minds LLM 분석 호출의 전역 일일 카운터 (비용 상한선)
-- ============================================================
--
-- 무료 깔때기라 호출이 무제한으로 늘면 비용이 폭주할 수 있다. 하루 단위로 LLM
-- 분석 호출 수를 세고, 한도(MINDS_LLM_DAILY_LIMIT)에 도달하면 API 라우트가
-- LLM을 부르지 않고 결정론적 폴백으로 결과를 돌려준다 → 일일 비용 천장 고정.
--
-- day 는 UTC current_date 기준의 롤링 일자다(서버 타임존). 분 단위 정확도가
-- 필요한 게 아니라 "하루 상한"이 목적이므로 충분.

CREATE TABLE minds_llm_usage (
  day date PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE minds_llm_usage ENABLE ROW LEVEL SECURITY;
-- 공개 정책 없음: admin(service role)만 접근.

-- 오늘 카운트를 원자적으로 1 올리고 올린 값을 반환한다. 한도(p_limit)에 이미
-- 도달했으면 더 올리지 않고 현재값(= 한도)을 반환한다. 호출 측은 반환값이
-- p_limit 을 초과하면 LLM 을 건너뛴다.
CREATE OR REPLACE FUNCTION minds_llm_bump(p_limit integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO minds_llm_usage (day, count)
    VALUES (current_date, 1)
  ON CONFLICT (day) DO UPDATE
    SET count = minds_llm_usage.count + 1,
        updated_at = now()
    WHERE minds_llm_usage.count < p_limit
  RETURNING count INTO v_count;

  -- 한도 도달로 UPDATE 가 스킵되면 RETURNING 이 비어 v_count 가 NULL → 현재값 조회.
  IF v_count IS NULL THEN
    SELECT count INTO v_count FROM minds_llm_usage WHERE day = current_date;
  END IF;

  RETURN v_count;
END;
$$;
