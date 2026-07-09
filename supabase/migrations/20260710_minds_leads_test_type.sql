-- ============================================================
-- minds_leads 테스트 종류(test_type) 컬럼
-- ============================================================
--
-- 배경: 무료 리드는 퍼널이 여럿이어도 모두 한 테이블(minds_leads)에 쌓인다.
-- 지금까지는 channel 컬럼('anon'/'inner_child'/'email'/'kakao') 하나로 겸용 구분해
-- 왔는데, channel 은 본래 "연락처 전달수단(email/kakao)"을 뜻하는 값이라
-- 퍼널 종류와 의미가 섞여 있었다. 앞으로 테스트가 계속 늘면(/minds, /inner-child,
-- 그 다음…) 이 겸용 구분이 금방 꼬인다.
--
-- 그래서 "어느 테스트에서 온 리드인가"를 뜻하는 전용 컬럼 test_type 을 둔다.
-- channel 은 전달수단 본래 의미로 되돌린다.
--   · test_type='minds'        — 다섯 배역(마음 배역) 퍼널
--   · test_type='inner_child'  — 내면 아이 찾기 퍼널
-- 새 테스트가 생기면 이 값에 슬러그를 하나 더 추가하면 된다(스키마 변경 불필요).

ALTER TABLE minds_leads
  ADD COLUMN IF NOT EXISTS test_type text NOT NULL DEFAULT 'minds';

-- 통합 어드민에서 테스트별로 필터링한다 → 인덱스.
CREATE INDEX IF NOT EXISTS idx_minds_leads_test_type ON minds_leads (test_type);

-- 백필 — 이미 쌓인 리드는 channel 로만 퍼널을 알 수 있으므로 그 값으로 test_type 을 채운다.
-- inner_child 채널만 내면 아이 퍼널이고, 나머지(anon/email/kakao)는 모두 minds 퍼널이다.
UPDATE minds_leads
SET test_type = 'inner_child'
WHERE channel = 'inner_child'
  AND test_type <> 'inner_child';
