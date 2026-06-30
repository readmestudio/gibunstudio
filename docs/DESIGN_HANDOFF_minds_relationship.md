# 핸드오프 — /minds 유료 전환: "내 마음 배역표 + 관계도" (₩9,900)

> 작성 2026-06-29. minds 무료 테스트의 페이월을 **워크북(₩49,000) 판매 → "5배역 배역표 + 관계도" 미니리포트(₩9,900) 판매**로 교체한다.

## 1. 왜 바꾸나
- 기존: 무료 minds 테스트 → 페이월 → **워크북 ₩49,000** 결제
- 문제: 무료 콘텐츠가 "리더·빌런·난봉꾼·관리자·추방자 5배역을 알아본다"고 약속하는데, 워크북은 무겁고 결이 다름
- 변경: **약속 그대로** — 5배역 배역표 + 그들의 관계도를 보여주는 **가벼운 개인화 해설 리포트**를 판다

## 2. 확정된 제품 스펙 (잠금)
| 항목 | 결정 |
|------|------|
| 가격 | **₩9,900** (충동구매가, 추후 ₩14,900~ 조정 여지) |
| 범위 | **5배역 전부**(리더·빌런·난봉꾼·관리자·추방자) 개별 심화 + 관계도 |
| 배역 데이터 | **유료에서 새 LLM 분석** — 답변을 다시 분석해 5슬롯 각각에 내 마음을 배정(약하면 "잠잠"으로 정직하게) |
| 헤드라인 | 가장 센 갈등쌍(예: 리더↔난봉꾼)을 메인 각본으로 깊게 |
| 차별점 | 워크북=직접 하는 10단계 실습 / 이 상품=**읽기만 하는 분석 리포트** |
| 전달 | 인앱 웹 리포트(모노톤). **이메일·알림톡 발송 안 함** — 유저가 결제 후 페이지에서 대기·열람. 빠른 표시 위해 결제 직후 배경 생성 |
| 운영자 링크 확인 | 따로 발송 안 하므로, 결제 슬랙 알림(`notifyMindsRelationshipPurchase`)에 **리포트 링크+고객 이메일**을 남김 → 문의 시 슬랙 검색으로 링크 회수 |
| 향후 알림톡 | 검수 완료 후 알림톡으로도 발송 예정. 링크 형식 = `{NEXT_PUBLIC_SITE_URL}/minds/relationship/{purchaseId}` |
| 로그인 | **비로그인** — minds 는 leadId(localStorage) 기반 익명 리드젠 |

## 3. 핵심 사실 (코드 조사 결과)
- 무료 `parts-map`는 답변에서 **최대 3개 마음(parts)** 만 뽑음 (`route.ts:203`). 5배역을 사람마다 점수화하지 **않음** → 유료는 새 분석 필요(위 결정).
- `ROLE_SLOTS` 5개가 이미 정의됨: `src/lib/minds/characters.ts:45` (key/label/blurb/affinity)
- 결제 인프라: `useWorkshopCheckout` → `POST /api/payment/workshop/create`(order_id 발급) → `window.AUTHNICE.requestPay` → `returnUrl /api/payment/nicepay/return` → **orderId prefix 분기**(HM-/WB-/CT-/MS-/MD-/CN-)
- 베낄 본보기: **상담(`CN-`)·Mind Spill(`MS-`) 분기** — 비로그인 허용, 금액 서버검증, 승인 후 리포트 페이지로 보내 LLM 자동 생성 (`return/route.ts:91, 127`)
- 이미 있는 자산: `MindsCheckoutModal.tsx` (리포트 위 in-place NicePay 모달, 현재 워크북에 연결) → 신상품으로 갈아끼움

## 4. 빌드 순서
1. ✅ **[엔진]** `src/lib/minds/relationship-report.ts` — 출력 타입(데이터 계약) + 5배역 배역표/관계도/방어기제/마음의목소리TOP5/실천처방/비유요약 LLM 프롬프트 + `generateRelationshipReport()`. *샘플 검증 완료(tmp/sample-relationship.*)*
2. ✅ **[DB]** 마이그레이션 `supabase/migrations/20260629_minds_relationship_purchases.sql` (lead_id FK, order_id MR- unique, amount, status, report_json, payment_key, paid_at; lead당 confirmed 1건 유니크; RLS admin-only) — ⚠️ **Supabase 수동 적용 필요**
3. ✅ **[결제 생성]** `POST /api/payment/minds-relationship/create` — body {leadId}, 서버가 amount=9900 고정, pending insert, `MR-{ts}-{rand}` order_id 반환. 멱등성(confirmed면 already_purchased). 가격 단일출처 `src/lib/minds/relationship-constants.ts`
4. ✅ **[결제 승인]** `return/route.ts`에 **`MR-` 분기 추가**(기존 분기 무수정) → admin조회 → 금액검증(DB·NicePay·서버상수 3중) → approve(캡처) → pending→confirmed → `/minds/relationship/{id}` redirect + 슬랙알림. 실패 시 `/minds?error=`
5. ✅ **[분석 라우트]** `POST /api/minds/relationship` — body {purchaseId}, confirmed 게이트 → report_json 있으면 캐시반환 / 없으면 minds_leads 답변으로 생성(2회 재시도, 폴백 없음) → report_json 캐시. rate limit ai(5/분)
6. ✅ **[화면]** `/minds/relationship/[id]` — 서버페이지(캐시 즉시렌더) + `MindsRelationshipView`(생성/로딩/에러 + 본문). 최초 진입 시 생성라우트 호출(~50초 진행화면), 캐시 있으면 즉시. 디자인은 quiet-editorial M 토큰(무료 minds와 동일 모노톤). 섹션: 표지+비유 / 5배역 / 방어기제 / 목소리TOP5 / 갈등 / 관계도 / 처방 / 편지
7. ✅ **[퍼널 재배선 — 워크북 판매 장들을 ₩9,900 콘텐츠 판매로 전환]** (완료: 새 훅 `useMindsRelationshipCheckout`, `MindsCheckoutModal` 신상품화 + `MindsFreeReport`에 배선, `MindsOutroCards` CTA/가격/카피 교체) minds 무료 테스트가 *파이널 배역표(페이월)*에 도달한 뒤 **지금 ₩49,000 워크북을 파는 모든 장**을 신상품 결제로 바꾼다. 대상(`MindsFreeReport.tsx` + `MindsOutroCards.tsx` + `MindsCheckoutModal.tsx`):
   - `openCheckout()` 의 `router.push("/payment/start")`(워크북/상담 통합 결제) → 신상품 결제 모달 오픈으로 교체
   - `MindsPricingCard`(페이월) · `MindsWhyCard` · `MindsBenefitCard` · `MindsActiveStageCard`(당신의 무대·잠긴 배역표) 의 **워크북 카피·가격(₩49,000)** → "다섯 배역 + 관계 해설 리포트 ₩9,900"
   - `MindsCheckoutModal` 의 `useWorkshopCheckout`(워크북·로그인 필수) → 비로그인용 새 훅 `useMindsRelationshipCheckout`(create 라우트 호출), `INCLUDES`/가격/제목 모두 신상품으로
   - 결제 완료 → 워크북 "생성 중" 화면이 아니라 **신규 리포트 페이지**로 이동
8. ✅ **[카피 동기화]** `test-catalog.ts` 가격/FAQ → 신상품, `기분스튜디오_README.md` 신상품 행 추가, 운영자 슬랙(notify ③/⑤')·track·docstring 문구 정리
9. ✅ **[환불]** `cancel` 라우트 `REFUNDABLE_TYPES` 에 `minds_relationship` 추가 + status CHECK 에 `'refunded'` 허용(마이그레이션 20260630, ⚠️ **수동 적용**). REFUND_HOWTO.md 갱신

## 5. 리스크
- **이중 가격 출처**(코드 vs products 테이블) — ₩9,900 한 곳만 고치면 불일치
- **결제 후 생성 실패** — 돈은 받았는데 리포트 실패 → 2회 재시도 + 실패 시 환불(`cancel` route에 `minds_relationship` 타입 추가)
- **dev 샌드박스** — 실결제 캡처는 prod(3100)에서만 확인 가능
- **마이그레이션 수동 적용** — Supabase에서 직접
