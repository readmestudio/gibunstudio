-- ============================================================
-- 워크북 대기신청 설문 개편 — 주관식 → 객관식 전환
-- ============================================================
--
-- 변경 사유:
--   · 주관식 비중이 높아 응답 부담이 큼 → 대부분 객관식(복수/단일 선택)으로 전환.
--   · 연락처(이름/이메일/전화번호)를 폼 상단에서 받도록 → phone 컬럼 추가, name 활용.
--
-- 전제: 테이블에 보존할 데이터가 없음(대기신청 초기). 기존 주관식 컬럼 값은 폐기.

-- 연락처 — 전화번호 추가.
ALTER TABLE workbook_waitlist ADD COLUMN IF NOT EXISTS phone text;

-- "알고 싶은 내용"을 복수 선택으로 받는 컬럼 추가.
ALTER TABLE workbook_waitlist
  ADD COLUMN IF NOT EXISTS goals text[] NOT NULL DEFAULT '{}'::text[];

-- 고민(concern): 단일 텍스트 → 복수 선택(text[]).
ALTER TABLE workbook_waitlist DROP COLUMN IF EXISTS concern;
ALTER TABLE workbook_waitlist
  ADD COLUMN concern text[] NOT NULL DEFAULT '{}'::text[];

-- 직업(job): 단일 텍스트 → 단일 선택값(여전히 text, 선택지 id 저장).
--   기존 자유입력 값은 폐기하고 컬럼은 그대로 두되 의미만 "선택지 id"로 재해석.

-- 상담 지속/중단 이유(counseling_reason): 단일 텍스트 → 복수 선택(text[]).
ALTER TABLE workbook_waitlist DROP COLUMN IF EXISTS counseling_reason;
ALTER TABLE workbook_waitlist
  ADD COLUMN counseling_reason text[] NOT NULL DEFAULT '{}'::text[];

-- inquiry(text): 유일하게 남기는 주관식 — "추가로 문의/알려주고 싶은 내용". 그대로 둠.
