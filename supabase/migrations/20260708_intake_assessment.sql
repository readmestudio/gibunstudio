-- ============================================================
-- 내면 아이 상담 진단 세션 (intake_sessions)
-- ============================================================
--
-- 목적:
--   · "내면 아이 찾기 워크샵"(1:1 세션) 결제자에게 발급하는 사전 진단 링크의
--     세션·응답·채점 결과를 단일 테이블(jsonb)로 기록한다.
--   · 결과는 유저에게 비노출 — 상담사 리포트 생성 전용.
--
-- 접근 규칙:
--   · RLS enable + public/authenticated 정책 없음 → service role(admin)만 접근.
--   · 유저 검사 페이지·submit 도 서버 API 경유 (예측 불가 token 이 곧 인증).
--   · 1회 제출: status='completed' 후 submit 거부. 재발급은 새 token + status='issued'.

-- updated_at 자동 갱신 트리거 함수 (다른 마이그레이션과 공유 — 없으면 생성).
CREATE OR REPLACE FUNCTION waitlist_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS intake_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 검사 링크용 토큰 (예측 불가 랜덤: base64url 24바이트)
  token text NOT NULL UNIQUE,

  -- 응답자 표시명/닉네임
  display_name text NOT NULL,
  -- 상담사 메모
  memo text,
  -- 세션 예정일
  session_date date,

  -- 세션 상태: 'issued' | 'in_progress' | 'completed' | 'expired'
  status text NOT NULL DEFAULT 'issued',

  -- 원응답: { partA, partB, partC, timings: { a_started_at, a_submitted_at, submitted_at } }
  responses jsonb,
  -- 채점 산출물: ScoreResult (완료 시)
  result jsonb,

  -- 위기 신호 플래그 (SCT 자·타해 키워드 매칭 시)
  crisis_flag boolean NOT NULL DEFAULT false,
  -- 응답 품질 플래그: 'straight_lining_suspected' | NULL
  quality_flag text,

  completed_at timestamptz,
  -- 상담사 알림 메일 발송 여부
  email_sent boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intake_sessions_created ON intake_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intake_sessions_status ON intake_sessions(status);

ALTER TABLE intake_sessions ENABLE ROW LEVEL SECURITY;

-- 정책 없음(의도적) → service role 클라이언트만 읽기/쓰기 가능.
-- 유저·관리자 접근은 전부 서버 라우트(createAdminClient)를 경유한다.

DROP TRIGGER IF EXISTS trg_intake_sessions_touch ON intake_sessions;
CREATE TRIGGER trg_intake_sessions_touch
  BEFORE UPDATE ON intake_sessions
  FOR EACH ROW EXECUTE FUNCTION waitlist_touch_updated_at();
