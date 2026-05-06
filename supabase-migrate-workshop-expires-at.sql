-- ====================================================================
-- workshop_purchases 만료 시점(expires_at) 컬럼 추가
-- 2026-05-03
--
-- 배경:
--   FAQ에 "결제 후 90일 무제한 재작성" 정책이 명시되어 있으나
--   코드/DB에는 만료를 강제하는 장치가 없어 영구 LLM 사용이 가능했음.
--
-- 변경:
--   workshop_purchases.expires_at = COALESCE(paid_at, created_at) + 90 days
--   (paid_at이 NULL인 pending 건은 created_at 기준으로 보수적으로 계산)
--
-- 구현 메모:
--   GENERATED ALWAYS AS ... STORED 는 IMMUTABLE 표현식만 허용한다.
--   `TIMESTAMPTZ + INTERVAL` 은 timezone 영향을 받아 STABLE 로 분류되므로
--   GENERATED 컬럼에서 42P17 (generation expression is not immutable) 발생.
--   대신 BEFORE INSERT/UPDATE 트리거로 값을 채워 동일한 효과를 낸다.
--
-- 동작:
--   - paid_at 또는 created_at 이 변경될 때마다 expires_at 자동 재계산.
--   - INSERT 시점에도 자동 채워짐.
--   - 기존 행은 본 마이그레이션 끝부분의 UPDATE 로 백필.
-- ====================================================================

BEGIN;

-- 1) expires_at 컬럼 추가 (NULL 허용 — 트리거가 채움)
ALTER TABLE public.workshop_purchases
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.workshop_purchases.expires_at IS
  '워크북 이용 만료 시각 — COALESCE(paid_at, created_at) + 90일. 트리거로 자동 갱신.';

-- 2) 트리거 함수: paid_at 또는 created_at 기준으로 expires_at 계산
CREATE OR REPLACE FUNCTION public.set_workshop_purchases_expires_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.expires_at := COALESCE(NEW.paid_at, NEW.created_at) + INTERVAL '90 days';
  RETURN NEW;
END;
$$;

-- 3) 트리거 부착 (멱등성 위해 DROP 후 CREATE)
DROP TRIGGER IF EXISTS workshop_purchases_set_expires_at
  ON public.workshop_purchases;

CREATE TRIGGER workshop_purchases_set_expires_at
  BEFORE INSERT OR UPDATE OF paid_at, created_at
  ON public.workshop_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_workshop_purchases_expires_at();

-- 4) 기존 행 백필 (트리거는 INSERT/UPDATE 시점에만 발동하므로 한 번만 채워줌)
UPDATE public.workshop_purchases
SET expires_at = COALESCE(paid_at, created_at) + INTERVAL '90 days'
WHERE expires_at IS NULL;

-- 5) 만료 검사용 인덱스 (확정된 결제 중에서 만료 여부를 빠르게 거름)
CREATE INDEX IF NOT EXISTS idx_workshop_purchases_user_expires
  ON public.workshop_purchases(user_id, expires_at)
  WHERE status = 'confirmed';

COMMIT;

-- ====================================================================
-- 운영 노트:
--   * 본 SQL은 Supabase SQL Editor에서 직접 실행할 것.
--   * 코드 배포(api-guard) 직전 또는 직후 실행. 트랜잭션으로 감싸 있어 실패 시 롤백.
--   * 기존 confirmed 건들은 paid_at 또는 created_at 기준으로 즉시 expires_at 산출.
--     paid_at이 90일 이전인 사용자들은 즉시 만료 → 운영자 검수 필요할 수 있음.
--   * 운영자 본인 검수 계정은 src/lib/self-workshop/test-users.ts 화이트리스트로 우회됨.
-- ====================================================================
