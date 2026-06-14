-- ============================================================
-- 마음챙김 워크북 대기신청(Waitlist) 설문
-- ============================================================
--
-- 목적:
--   · 출시 예정 워크북(불안/성취중독/자기비판/완벽주의/관계 패턴)에 대한
--     사전 대기 수요를 모으고, 타겟 오디언스의 니즈를 파악한다.
--   · 로그인 없이 누구나 신청 가능(가입 장벽 제거) → API 라우트에서
--     service role(admin) 클라이언트로 INSERT 한다. RLS는 켜되 공개 정책은
--     두지 않아, anon/authenticated 가 직접 읽거나 쓸 수 없게 막는다.
--
-- 비고:
--   · email + workbooks(최소 1개)만 필수. 나머지는 응답률을 위해 선택 입력.
--   · 같은 이메일이 여러 번 신청할 수 있음(워크북별 추가 신청 가능) → email UNIQUE 아님.

-- updated_at 자동 갱신 트리거 함수 (이 마이그레이션 단독으로 동작하도록 자체 정의).
CREATE OR REPLACE FUNCTION waitlist_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE workbook_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 연락처 (필수)
  email text NOT NULL,
  name text,                       -- 호칭/이름 (선택)

  -- 어떤 워크북 대기신청인지 (최소 1개). 복수 선택 가능.
  -- 값: 'anxiety' | 'achievement_addiction' | 'self_criticism'
  --     | 'perfectionism' | 'relationship_pattern' (constants.ts와 동기화)
  workbooks text[] NOT NULL DEFAULT '{}'::text[],

  -- 타겟 오디언스 / 니즈 파악용 설문 (모두 선택 입력)
  concern text,                    -- 지금 가장 마음 쓰이는 고민
  job text,                        -- 직업/하는 일
  counseling_experience text,      -- 'yes' | 'no' — 심리상담 받아본 경험
  counseling_reason text,          -- 꾸준히 받은 이유 / 안 받거나 그만둔 이유 (주관식)
  desired_start text,              -- 'asap' | 'within_1m' | 'within_3m' | 'undecided'
  inquiry text,                    -- 워크북·상담을 통해 알고 싶은 내용 (주관식)

  -- 운영 메타
  source text,                     -- 유입 경로 식별용 (예: 'waitlist_page')
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workbook_waitlist_created ON workbook_waitlist(created_at DESC);
-- 배열 컬럼은 GIN 인덱스로 "특정 워크북 신청자 조회"를 빠르게.
CREATE INDEX idx_workbook_waitlist_workbooks ON workbook_waitlist USING GIN (workbooks);

ALTER TABLE workbook_waitlist ENABLE ROW LEVEL SECURITY;
-- 공개 정책 없음: anon/authenticated 는 접근 불가. API 라우트의 admin 클라이언트만 우회.

CREATE TRIGGER trg_workbook_waitlist_touch
  BEFORE UPDATE ON workbook_waitlist
  FOR EACH ROW EXECUTE FUNCTION waitlist_touch_updated_at();
