# 환불(결제 취소) 호출 방법

코치가 직접 환불을 처리하는 방법 메모. NicePay 카드 결제를 코드로 자동 취소한다.

- 엔드포인트: `POST /api/payment/nicepay/cancel`
- 구현: `src/app/api/payment/nicepay/cancel/route.ts`
- 권한: **코치 계정만** (`COACH_EMAILS` 환경변수에 등록된 이메일)

---

## 환불 정책 (먼저 확인)

| 상품 | 환불 가능 조건 |
|------|---------------|
| 공통 | 서베이/진단 **시작 전** 전액 환불 / 시작 후 불가 |
| 접수 채널 | 카카오톡 `gibunstudio` (언더바 없음) |

> ⚠️ 실제 NicePay 취소는 **prod(라이브) 모드**에서만 실제로 환불된다. dev/샌드박스 결제는 캡처 자체가 안 돼 환불 대상이 없다.

---

## 1단계 — 환불할 결제의 `paymentId`(행 id) 찾기

Supabase 대시보드(Table Editor 또는 SQL)에서 해당 테이블을 검색해 `id`를 복사한다.

| 상품 | 테이블 | `type` 값 |
|------|--------|-----------|
| 남편상 분석 | `husband_match_payments` | `husband_match` (생략 가능) |
| 상담 | `counseling_purchases` | `counseling` |
| 워크북 | `workshop_purchases` | `workshop` |
| 관계 해설 리포트(/minds) | `minds_relationship_purchases` | `minds_relationship` |

```sql
-- 예: 최근 상담 결제 찾기
select id, order_id, title, amount, status, paid_at
from counseling_purchases
where status = 'confirmed'
order by paid_at desc;
```

---

## 2단계 — 코치 계정으로 로그인한 브라우저에서 호출

이 API는 **로그인 세션(쿠키)으로 코치 권한을 확인**한다. 가장 쉬운 방법은 코치 계정으로
`gibunstudio.com` 에 로그인한 상태에서 **개발자도구(F12) → Console** 에 아래를 붙여넣는 것.
(쿠키가 자동 동봉되어 curl 보다 편하다.)

```js
await fetch("/api/payment/nicepay/cancel", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "counseling",          // husband_match | counseling | workshop | minds_relationship
    paymentId: "여기에-복사한-id",
    reason: "고객 요청 환불",     // NicePay 에 남는 취소 사유
  }),
}).then(r => r.json()).then(console.log);
```

---

## 3단계 — 응답 확인

- 성공: `{ success: true, message: "상담 환불이 완료되었습니다" }`
  → DB 의 `status` 가 `refunded` 로 변경됨
- 실패 예시:
  | 메시지 | 원인 |
  |--------|------|
  | `확인된 결제만 취소할 수 있습니다` | status 가 `confirmed` 가 아님 |
  | `이미 환불된 결제입니다` | 중복 환불 방지 |
  | `무통장입금 건은 수동으로 환불해주세요` | 남편상 무통장 결제 (수동 처리) |
  | `코치 권한이 필요합니다` | 로그인 계정이 `COACH_EMAILS` 에 없음 |
  | `결제 TID를 찾을 수 없습니다` | payment_key(tid) 누락 — 승인 안 된 건 |

---

## 비고

- 환불은 결제 `status` 를 `refunded` 로만 바꾼다. 워크북 진행(`workshop_progress`)
  차단·상담 예약 취소 같은 부수 정리는 아직 자동화돼 있지 않으니 필요 시 수동 처리.
- 환불 대상 확장: `route.ts` 의 `REFUNDABLE_TYPES` 매핑에 테이블을 한 줄 추가하면 된다
  (모든 결제 테이블이 `id`/`payment_key`/`order_id`/`status` 컬럼을 공유).
