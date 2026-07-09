-- ============================================================
-- minds_leads 연락처(전화번호) 컬럼
-- ============================================================
--
-- 배경: 유료 리포트를 나중에 다시 찾을 때, 비로그인/익명 리드를 분별할 단서가
-- 사실상 연락처(휴대폰)뿐이다. 전화번호는 결제 모달에서 이미 필수로 받지만
-- 지금은 결제 레코드(minds_relationship_purchases.phone)에만 저장돼, 리드 자체로는
-- 연락처를 알 수 없다. 그래서 리드에도 연락처 컬럼을 두어 어드민이 연락처로
-- 리포트를 검색/식별할 수 있게 한다.
--
-- 채우는 시점: 결제 생성 라우트(/api/payment/minds-relationship/create)가
-- 결제 모달에서 받은 phone 을 결제 레코드와 함께 이 컬럼에도 기록한다.
-- 무료 퍼널은 연락처를 받지 않으므로(익명 리드) 비로그인 무료 리드는 NULL 로 남는다.

ALTER TABLE minds_leads
  ADD COLUMN IF NOT EXISTS phone text;

-- 검색용 인덱스 — 연락처로 리드를 조회한다(부분일치는 ilike 로 처리, 정확일치 대비).
CREATE INDEX IF NOT EXISTS idx_minds_leads_phone ON minds_leads (phone);

-- 백필 — 이미 결제한 리드는 결제 레코드에 phone 이 있으니 리드로 끌어와 즉시 검색 가능하게 한다.
-- 리드당 결제는 1건 정책이라 중복 걱정은 없지만, 안전하게 phone 이 있는 레코드만 대상으로 한다.
UPDATE minds_leads ml
SET phone = p.phone
FROM minds_relationship_purchases p
WHERE p.lead_id = ml.id
  AND p.phone IS NOT NULL
  AND p.phone <> ''
  AND ml.phone IS NULL;
