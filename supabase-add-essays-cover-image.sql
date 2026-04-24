-- essays 테이블에 cover_image 컬럼 추가
--
-- 큰 썸네일 이미지 (카드 상단 + 상세 페이지 헤더) 를 위한 컬럼.
-- 기존 illustration 컬럼은 작은 SVG 아이콘 전용이라 의도가 다름 → 별도 컬럼 신설.
-- 값은 public 폴더 기준 절대 경로 (예: /essays/joy-sorrow-beautiful-mind.png) 를 저장.

ALTER TABLE essays
  ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- 첫 번째 에세이에 방금 추가된 썸네일 이미지 연결
UPDATE essays
  SET cover_image = '/essays/joy-sorrow-beautiful-mind.png'
  WHERE slug = 'joy-sorrow-beautiful-mind';
