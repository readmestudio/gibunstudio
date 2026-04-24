-- essays 에 뉴스레터 발송 예약 컬럼 추가
--
-- newsletter_send_at 가 NULL 이면 자동 발송 대상에서 제외됩니다.
-- 값이 있으면 해당 날짜 이후 첫 목요일 09:00 KST(= 매주 목요일 00:00 UTC) 크론에서
-- 가장 오래된 것부터 1회 자동 발송.
-- 공개 일자 예약은 기존 published_at (DATE) 을 그대로 사용하므로 스키마 변경 없음.

ALTER TABLE essays
  ADD COLUMN IF NOT EXISTS newsletter_send_at DATE;

-- 참고: 중복 발송 방지는 이미 newsletter_sends_dedupe_idx (essay_slug, sent_on)
-- unique index 가 담당하므로 추가 인덱스 불필요.
