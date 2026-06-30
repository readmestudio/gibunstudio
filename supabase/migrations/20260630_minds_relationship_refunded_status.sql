-- ============================================================
-- minds_relationship_purchases.status 에 'refunded' 허용 추가
-- ============================================================
--
-- 환불 라우트(/api/payment/nicepay/cancel)는 취소 성공 시 status 를 'refunded' 로
-- 업데이트한다. 원본 마이그레이션(20260629)의 CHECK 는 'pending/confirmed/cancelled'
-- 만 허용했으므로, 이미 적용된 DB 에서는 이 제약을 갱신해야 환불이 동작한다.
--
-- (신규 환경은 20260629 원본에 'refunded' 가 이미 포함돼 있어 이 마이그레이션이
--  같은 제약을 재생성할 뿐 — 안전하게 멱등.)

ALTER TABLE minds_relationship_purchases
  DROP CONSTRAINT IF EXISTS minds_relationship_purchases_status_check;

ALTER TABLE minds_relationship_purchases
  ADD CONSTRAINT minds_relationship_purchases_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded'));
