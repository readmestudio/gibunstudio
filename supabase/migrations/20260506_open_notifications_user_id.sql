-- 알림 신청을 "로그인 후 자동 등록" 흐름까지 확장.
-- 기존: 익명 사용자가 name + phone 입력 → INSERT.
-- 추가: 카카오 로그인 사용자는 user_id 만으로 자동 등록 (이름/전화 입력 X).
--
-- 변경 사항:
-- 1) user_id 컬럼 추가 (auth.users 참조, nullable)
-- 2) name / phone 을 nullable 로 완화 (로그인 자동 등록 시 비어 있을 수 있음)
-- 3) (user_id, program_type) 부분 UNIQUE — 중복 신청 방지 + idempotent INSERT 가능
-- 4) RLS: 본인 user_id 로 INSERT 허용 + 본인 신청 SELECT 허용

ALTER TABLE public.open_notifications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.open_notifications
  ALTER COLUMN name DROP NOT NULL;

ALTER TABLE public.open_notifications
  ALTER COLUMN phone DROP NOT NULL;

-- 같은 사용자가 같은 프로그램에 중복 신청 못 하도록.
-- user_id 가 NULL 인 익명 신청은 영향 없음.
CREATE UNIQUE INDEX IF NOT EXISTS open_notifications_user_program_unique
  ON public.open_notifications (user_id, program_type)
  WHERE user_id IS NOT NULL;

-- 본인 신청 여부 조회용
CREATE INDEX IF NOT EXISTS open_notifications_user_id_idx
  ON public.open_notifications (user_id)
  WHERE user_id IS NOT NULL;

-- 인증된 본인은 자기 user_id 로만 INSERT 가능
DROP POLICY IF EXISTS "auth_can_insert_own_open_notifications" ON public.open_notifications;
CREATE POLICY "auth_can_insert_own_open_notifications"
  ON public.open_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 본인 신청 내역 조회 (버튼 라벨을 "신청 완료" 로 표시하기 위함)
DROP POLICY IF EXISTS "auth_can_read_own_open_notifications" ON public.open_notifications;
CREATE POLICY "auth_can_read_own_open_notifications"
  ON public.open_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
