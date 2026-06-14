-- ============================================================
-- 워크북 대기신청 — 구매 의향(워크북 단독 vs 워크북+심리상담)
-- ============================================================
--
-- 값: 'workbook_only' | 'workbook_counseling' | 'undecided' (constants.ts와 동기화)
-- 가격 기준: 기분스튜디오_README.md (워크북 ₩49,000 / 워크북+상담 ₩129,000)
ALTER TABLE workbook_waitlist ADD COLUMN IF NOT EXISTS purchase_type text;
