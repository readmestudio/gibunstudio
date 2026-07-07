# /inner-child 퍼널 통합 플랜 — /minds 셸 최대 재사용, 병렬 배치

> 요구사항(파운더 확정): `/inner-child` 는 **별도 페이지/링크**이되, 경험은 `/minds` 와
> **테스트 문항 · 리포트 내용 두 가지만 다르고 나머지는 동일**해야 한다.
>  - 첫 화면("테스트 시작하기")은 `/minds` 현행 랜딩과 **동일** (같은 컴포넌트 그대로).
>  - 결제 시점 로그인 화면 동일. 결제수단(NicePay 네이버페이·카카오페이) 동일, 무오류.
>  - `/minds` 는 **무회귀** — 기존 퍼널 그대로 작동.
>  - **문항 수 축소 금지** — 스크리닝 8 + 공통 1 + 드릴다운 6~9 + 지킴이 3 + **SCT 5 전부 유지**
>    (UX 개선 플랜의 "SCT 5→3" 레버는 이 플랜에서 채택하지 않음).
>
> ⚠️ `docs/INNER-CHILD-PIVOT-PLAN.md` §0 의 "/minds in-place 교체" 결정은 이 플랜으로
> **대체(superseded)** 된다 — /minds 는 그대로 두고 /inner-child 를 병렬 신설한다.
> 그 외 재사용 목록·데이터 모델·LLM 호출 설계는 유효하며 이 문서가 이어받는다.

---

## 0. 아키텍처 결정 요약

| 쟁점 | 결정 | 근거 |
|---|---|---|
| 플로우 오케스트레이션 | **(b) 신규 `InnerChildFlow`** 가 공유 조각(`MindsLanding`·`MindsAnalyzing`·`MindsCheckoutModal`·`MindsAuthGate`)을 조립 | §1 참조. `MindsFlow` 는 0줄 수정 → /minds 회귀 위험 0 |
| 구매 구분 | **orderId prefix `IC-`** (신규 컬럼 없음). 테이블은 `minds_relationship_purchases` 공용 | §4 참조. 코드베이스가 이미 prefix 분기(HM/WB/CT/MS/MD/CN/MR) 관례 — 8번째로 IC 추가 |
| 리드 구분 | `minds_leads.channel = "inner_child"` (channel 은 CHECK 제약 없는 text — **마이그레이션 0개**) | §3 참조. 분석 전에도 리드 단위 판별 가능 → my-reports/자동복원 오염 방지 |
| DB 마이그레이션 | **0개** | answers/parts_map/report_json 전부 기존 jsonb 재사용 |
| 파라미터화 방식 | 공용 조각에 **`funnel` 설정 객체 prop(기본값 = 현행 /minds 동작)** 주입 | 기본값이 곧 현행 — prop 을 안 주면 /minds 는 바이트 단위로 지금과 동일 |
| 유료 리포트 경로 | `/inner-child/full/[id]` | "relationship" 은 다섯배역 상품명 — 내면아이 상품과 무관 |
| 가격 | ₩9,900 — `MINDS_RELATIONSHIP_PRICE` 상수 그대로 공유 | 결제창·서버검증·UI 3곳 단일 출처 유지 (가격 분기 시점에만 상수 분리) |

---

## 1. 플로우 오케스트레이션 — (a) variant prop vs (b) 신규 Flow

**(b) 신규 `InnerChildFlow` 채택.**

- (a) `MindsFlow` 에 `variant` prop 을 넣으면: 저장키·분석 엔드포인트·복원 리다이렉트·
  클라이언트 폴백(`buildClientFallback` 은 `MindAnswer[]`→`PartsMap` 전용)·픽셀 이벤트명까지
  **최소 6곳에 조건 분기**가 들어간다. /minds 는 현재 실매출 나는 프로덕션 핫패스 —
  분기 하나가 잘못 기본값을 타면 곧장 /minds 회귀다. 게다가 두 퍼널은 분석 입력 타입 자체가
  다르다(`MindAnswer[]` vs `ScoreInput`) — 억지로 합치면 타입이 `unknown` 으로 물러진다.
- (b) `InnerChildFlow` 는 ~150줄짜리 얇은 상태머신을 하나 더 두는 대신, **MindsFlow 를
  1줄도 건드리지 않는다.** 중복되는 것은 phase 전환 골격뿐이고, 진짜 자산(랜딩·로딩·결제모달·
  인증게이트·NicePay 훅·API 인프라)은 전부 import 재사용이다. 트레이드오프는
  "골격 150줄 중복" vs "/minds 핫패스 무접촉" — 후자가 명백히 싸다.
- 랜딩은 **`MindsLanding` 을 그대로 import** — prop 도 카피도 건드리지 않는다(요구사항:
  첫 화면 완전 동일). `MindsAnalyzing` 도 무prop 컴포넌트라 그대로 재사용.

### 신규: `src/lib/minds/funnel-config.ts` (클라이언트 안전 — 서버 의존성 금지)

두 퍼널이 갈라지는 지점을 **설정 객체 1개**로 응집한다. 공용 조각들은 이 객체 하나만 받는다.

```ts
export interface MindsFunnelConfig {
  variant: "minds" | "inner_child";
  leadStorageKey: string;      // localStorage 키
  freeReportBase: string;      // "/minds/r" | "/inner-child/r"
  paidReportBase: string;      // "/minds/relationship" | "/inner-child/full"
  product: "relationship" | "inner_child"; // create 라우트 payload → orderId prefix 결정
  goodsName: string;           // NicePay 결제창 상품명
  checkoutCopy: { title: string; lead: string; includes: string[] };
}

export const MINDS_FUNNEL: MindsFunnelConfig = { /* 현행 /minds 값 전부 — 기본값 */ };
export const INNER_CHILD_FUNNEL: MindsFunnelConfig = {
  variant: "inner_child",
  leadStorageKey: "inner_child_lead_id",   // /minds 의 "minds_lead_id" 와 분리 — 교차복원 방지
  freeReportBase: "/inner-child/r",
  paidReportBase: "/inner-child/full",
  product: "inner_child",
  goodsName: "내면 아이 심층 리포트",
  checkoutCopy: { /* 내면아이 상품 설명 — 잠금 목차 4약속과 톤 일치 */ },
};
```

- `MINDS_FUNNEL` 의 값은 현재 하드코딩된 문자열을 **그대로 옮겨 담기만** 한다
  (`MINDS_LEAD_STORAGE_KEY`, `/minds/r`, `/minds/relationship`, `MINDS_RELATIONSHIP_GOODS_NAME`,
  현행 모달 카피). 이동만 있고 변경은 없다.

### 신규: `src/app/inner-child/page.tsx`

`/minds/page.tsx` 와 동형 — `<InnerChildFlow/>` 렌더 + `robots: noindex`(minds 와 동일 정책).

### 신규: `src/components/minds/inner-child/InnerChildFlow.tsx`

`MindsFlow` 를 본뜬 상태머신. phase: `landing → test → analyzing → report`.

- **landing**: `<MindsLanding onStart={...}/>` — /minds 와 동일 화면. onStart 에서:
  - `trackMetaCustom("StartTest", { content_name: "inner_child" })` +
    `trackMetaEvent("Lead", { content_name: "inner_child" })` — 이벤트 골격은 /minds 와 동일,
    `content_name` 만 분리해 광고 최적화 신호가 섞이지 않게 한다.
  - `createAnonLead()`: `POST /api/minds/lead` 에 `channel: "inner_child"` (§3).
- **test**: `<InnerChildTest skipIntro onComplete={runAnalysis}/>` (§2).
- **analyzing**: `<MindsAnalyzing/>` 재사용. 내면아이 무료 분석은 코드 채점 + flash 2필드라
  /minds(2~5초)와 유사한 대기 — 화면 그대로 맞는다.
- **runAnalysis(input: ScoreInput)**: `POST /api/inner-child/free-report` (§3) →
  성공 시 `localStorage[inner_child_lead_id] = leadId` 저장, `router.replace("/inner-child/r/{leadId}")`.
  - MindsFlow 는 결과를 인라인 렌더하지만, 내면아이 무료 리포트는 서버 저장본 기준
    페이지(`/inner-child/r/[id]`)로 곧장 보낸다 — 재방문·공유·?checkout=1 복귀가 전부
    한 경로로 수렴해 상태 분기가 준다. (leadId 확보 실패라는 희귀 케이스만 인라인 폴백 렌더.)
- **재방문 자동복원**: 마운트 시 `localStorage[inner_child_lead_id]` 있으면
  `/inner-child/r/{id}` 로 replace. 로그인 계정 복원은
  `GET /api/minds/my-reports?product=inner_child` (§9-7) 의 latestLeadId 사용.
  `?auth=kakao` 양보 로직은 /minds 와 동일하게 복사.
- **클라이언트 최종 폴백**: LLM 이 아니라 **코드 채점이 본체**이므로, API 실패 시
  `computeScore(input)` 를 클라에서 돌려 유형카드 고정필드만으로 리포트를 인라인 렌더
  (LLM 2필드 자리는 생략) — /minds 의 `buildClientFallback` 역할의 내면아이판.

---

## 2. InnerChildTest 임베드 — 내부 인트로 우회

`src/components/minds/inner-child/InnerChildTest.tsx` **수정 (1곳, 하위호환)**:

```ts
export function InnerChildTest({ onComplete, skipIntro = false }:
  { onComplete: (input: ScoreInput) => void; skipIntro?: boolean }) {
  const [started, setStarted] = useState(skipIntro);
```

- `skipIntro=true` 면 `IntroScreen`("테스트 시작하기" 자체 버튼)을 건너뛰고 1부 첫 문항에서
  시작 — **"시작" 버튼의 주인은 재사용된 `MindsLanding` 하나**가 된다.
- `IntroScreen` 이 담고 있던 `TIME_FRAME_NOTICE`("요즘의 나 기준") + `DISCLAIMER`(면책)는
  테스트 진입 시 놓치면 안 되는 고지 — **1부 첫 문항 화면 상단에 접힌 안내줄**(1회성,
  `chapter===1 && idx===0` 조건 렌더)로 옮겨 skipIntro 경로에서도 노출을 보장한다.
- 인트로를 컴포넌트 밖으로 들어내는(lift-out) 안은 기각 — `/dev/inner-child` 하네스가
  인트로 포함 전체 흐름을 계속 검증해야 하므로 기본값 false 유지가 맞다.
- 챕터·인터스티셜·포맷 다양화·위기필터(CrisisScreen)는 **전부 그대로** — 문항 수 불변
  (스크리닝 8 + C1 + 드릴다운 6~9 + 지킴이 3 + **SCT 5**).

---

## 3. 무료 리포트 — 백엔드 + 페이지

### 3-1. 리드 태깅: `channel = "inner_child"`

`src/app/api/minds/lead/route.ts` **수정 (하위호환)**: channel 화이트리스트에
`"inner_child"` 추가 — 처리 로직은 `anon` 과 동일(email null, ip/ua/attribution 저장).

```ts
const channel = b.channel === "kakao" ? "kakao"
  : b.channel === "inner_child" ? "inner_child"
  : b.channel === "anon" ? "anon" : "email";
```

- DB 의 `channel` 은 CHECK 제약 없는 `text NOT NULL DEFAULT 'email'` — **마이그레이션 불필요.**
- `parts_map.test_version="v2.0"` 만으로는 부족한 이유: 그 태그는 **분석 완료 후**에야 생긴다.
  로그인 자동복원(my-reports)·리드 claim 은 분석 전 리드도 다루므로 리드 행 자체에
  퍼널 표식이 있어야 /minds ↔ /inner-child 가 서로의 리드를 집어가지 않는다.

### 3-2. 신규: `src/app/api/inner-child/free-report/route.ts`

`/api/minds/parts-map` 의 골격(캐시→예산→LLM→저장)을 내면아이용으로 신작. 공개 라우트.

- **Body**: `{ input: ScoreInput, leadId?: string }` — 클라 채점값이 아니라 **원응답**을 받아
  서버가 `computeScore(input)` 를 재수행(권위 채점, 클라 값 불신).
- **GET**: `?leadId=` 저장본 다시보기(LLM 미호출) — `/inner-child/r/[id]` 서버 렌더용과 동일
  데이터라 실제로는 페이지가 직접 admin 조회해도 됨. POST 만 필수.
- 흐름:
  1. `RATE_LIMITS.ai` 레이트리밋 + **리드당 1회 캐시**(이미 `parts_map.test_version==="v2.0"`
     이면 저장본 반환) + `minds_llm_bump` 일일예산 — parts-map 라우트의 3겹 비용방어 재사용.
  2. `computeScore(input)` → `crisis_flag=true` 면 **LLM 스킵**, `free_report` 없이 블롭 저장,
     응답에 `crisis: true` — 페이지가 전문기관 안내를 렌더하고 페이월을 숨긴다.
  3. `getTypeCard(score.primary_child.schema_id)` → `chatCompletion(gemini-2.5-flash,
     FREE_SYSTEM_PROMPT + buildFreeUserMessage(card, score))` + `safeJsonParse` + 2회 재시도.
     실패 시 결정론적 폴백: `gap` ← `card.gap_hint` 기반 고정문, `relation_pattern` ←
     `top_item_text` + SCT 인용 조립 고정문 (무료라 항상 결과 보장 — /minds 폴백 철학 동일).
  4. `minds_leads` UPDATE:
     - `parts_map` ← `FreeReportBlob { test_version:"v2.0", score_result, free_report }`
     - `answers` ← **평탄화한 `{id, question, answer}[] 배열`** (screening/drilldown 은 문항
       원문+점수 문자열, guardian 은 선택지 원문, SCT 는 자유입력 원문).
       배열로 저장하는 이유: ⓐ 결제 create 라우트의 "무료 테스트 완료" 검증이
       `Array.isArray(lead.answers) && length>0` 이라 **무수정 통과** ⓑ 운영자가 원답을
       사람이 읽을 수 있는 형태로 보존.

### 3-3. 신규: `src/app/inner-child/r/[id]/page.tsx` + `InnerChildResultView.tsx`

`/minds/r/[id]` 와 동형. 서버에서 `minds_leads.parts_map` admin 조회 →
`readFreeReportBlob()`(신규 검증 리더, §3-5) 통과 시 `InnerChildFreeReport` 렌더.
`robots: noindex`. 블롭 없거나 v2.0 아니면 "결과 없음" 안내 + localStorage 정리
(`MindsResultView` 의 무한복원 방지 로직 이식, 키만 `inner_child_lead_id`).
링크 복사 바: `MindsResultLinkBar` 에 `base?: string = "/minds/r"` prop 추가(§9-10)해 재사용.

### 3-4. 신규: `src/components/minds/inner-child/report/InnerChildFreeReport.tsx`

dev 하네스(`/dev/inner-child` 의 `ReportPreview`)를 뼈대로 승격 + HANDOFF §5-1 8카테고리:

| # | 섹션 | 소스 | 비고 |
|---|---|---|---|
| 1 | ChildHeroCard | 고정: `child_name`·`one_liner`·`core_belief` 칩 (+일러스트 슬롯) | dev 프리뷰 ① 그대로 |
| 2 | VoiceQuote | 고정: `voice` 세리프 인용 | dev ② |
| 3 | TraitsSection | 고정: `traits` | dev ③ |
| 4 | ThoughtChips | 고정: `auto_thoughts` 3칩 | dev ④ |
| 5 | GapSection | **생성**: `free_report.gap` — "외부/내부" 대비 레이아웃 | dev 점선 자리 실데이터 |
| 6 | RelationPatternSection | **생성**: `free_report.relation_pattern` (SCT 인용 세리프) | 〃 |
| 7 | StressSignals | 고정: `triggers` 3개 + `surface_reaction` 1줄 | dev ⑦ 확장 |
| 8 | **LockCta** | 템플릿: `lockSection(card)`(fixed-texts) + ₩9,900 CTA | 아래 결제 배선 |

- LockCta CTA → `setCheckoutOpen(true)` 로 **같은 `MindsCheckoutModal`** 을 연다
  (`funnel={INNER_CHILD_FUNNEL}` 만 다름). `trackMetaEvent("InitiateCheckout")` 류 추적은
  모달 내부 공용 로직이 그대로 처리.
- `?checkout=1` 자동 재개 effect 를 `MindsFreeReport` 에서 이식(카카오 로그인 복귀 시
  모달 자동 오픈 + URL 표식 즉시 제거).
- `crisis_flag=true` 블롭이면 리포트 대신 위기 안내(InnerChildTest 의 `CrisisScreen`
  export 재사용) — 페이월 미노출.
- 디자인: 콰이엇 에디토리얼 토큰(`M`) 그대로. 하단 면책 문구 고정.

### 3-5. 신규: `src/lib/minds/inner-child/free-report-store.ts`

`result-store.ts` 의 내면아이판: `getSavedFreeReport(leadId)` — admin 조회 +
`readFreeReportBlob()`(형태 검증: `test_version==="v2.0"` && `score_result.primary_child`
존재. 캐스팅 금지, 깨진 블롭은 null). 페이지·free-report 캐시 체크가 공유.

---

## 4. 결제 동일성 + 내면아이 구매 구분

**메커니즘: orderId prefix `IC-` (컬럼 추가 없음).** 검토한 3안:

| 안 | 평가 |
|---|---|
| ⓐ `product` 컬럼 추가 | 명시적·조회 편리하나 마이그레이션 1개 + INSERT/SELECT 전부 수정. prefix 로 같은 정보를 이미 영속화할 수 있어 중복 |
| ⓑ **orderId prefix `IC-`** ✅ | 마이그레이션 0. `order_id` 는 UNIQUE·불변·모든 조회에 포함 — 행 자체가 변형 표식을 영구 보유. return 라우트가 이미 7종 prefix 분기 관례 (HM/WB/CT/MS/MD/CN/MR) — 8번째로 자연 편입. 환불 라우트(`type=minds_relationship`)도 같은 테이블이라 무수정 |
| ⓒ 별도 테이블 | RLS·인덱스·환불·어드민 결제조회 전부 복제 — 과잉 |

가격이 갈라지는 순간에만 ⓐ를 재검토한다(현재 동일 ₩9,900이라 return 검증 상수 공유 가능).

### 4-1. `src/lib/minds/relationship-constants.ts` **수정 (추가만)**

```ts
export const INNER_CHILD_ORDER_PREFIX = "IC-";
export const INNER_CHILD_GOODS_NAME = "내면 아이 심층 리포트";
```
가격 상수는 추가하지 않는다 — 동일가라 `MINDS_RELATIONSHIP_PRICE` 공유(단일 출처 원칙).

### 4-2. `src/app/api/payment/minds-relationship/create/route.ts` **수정 (하위호환)**

- Body 에 `product?: "relationship" | "inner_child"` 추가. **기본값 "relationship"** —
  기존 /minds 클라이언트는 payload 를 안 바꿔도 지금과 동일하게 MR- 주문 생성.
- `product==="inner_child"` 일 때만: `orderId = IC-{ts}-{nanoid}`.
- 나머지(로그인 401 게이트, 리드 answers 검증, user_id 바인딩, 멱등 already_purchased,
  금액 서버상수 고정, pending INSERT)는 **한 줄도 안 바뀐다.** answers 검증은 §3-2 에서
  배열로 저장했으므로 그대로 통과. already_purchased 는 lead_id 기준인데 리드가 퍼널당
  1개(저장키 분리)라 product 필터 불필요 — 정합 유지.
- 응답에 `product` 를 에코해 훅이 리다이렉트 베이스를 재확인할 수 있게 한다(선택).

### 4-3. `src/app/api/payment/nicepay/return/route.ts` **수정 (하위호환)**

- `const isInnerChild = orderId.startsWith("IC-")` 추가.
- `handleMindsRelationshipPayment` 에 파라미터 `reportBase: string = "/minds/relationship"`
  추가 — IC 분기는 같은 핸들러를 `reportBase: "/inner-child/full"` 로 호출.
  **금액검증(₩9,900 동일)·승인·pending→confirmed·슬랙 알림·알림톡까지 전부 공유**;
  `reportUrl = ${baseUrl}${reportBase}/${purchase.id}` 하나만 갈라진다 → 알림톡의
  리포트 링크도 자동으로 올바른 경로가 된다.
- 인증 실패(resultCode≠0000) 분기: `isInnerChild → /inner-child?error=...` 추가.
- MR- 경로는 기본 인자로 현행과 동일 — /minds 무회귀.

### 4-4. `src/lib/payment/useMindsRelationshipCheckout.ts` **수정 (하위호환)**

시그니처: `useMindsRelationshipCheckout(funnel: MindsFunnelConfig = MINDS_FUNNEL)`.

- leadId 읽기: `localStorage[funnel.leadStorageKey]` (기본값 = 현행 `minds_lead_id`).
- create POST body: `{ leadId, phone, product: funnel.product }`.
- `already_purchased` → `router.push(`${funnel.paidReportBase}/${purchase_id}`)`.
- `AUTHNICE.requestPay` 의 `goodsName: funnel.goodsName`, `amount`·`returnUrl`·
  `method`("kakaopay"/"naverpayCard") 는 **불변** — 결제수단 파라미터가 /minds 와
  바이트 동일하므로 NicePay 동작도 동일(신규 오류 표면 없음).
- 별도 래퍼 훅은 만들지 않는다 — 인자 기본값 하나로 충분.

### 4-5. `src/components/minds/MindsCheckoutModal.tsx` **수정 (하위호환)**

- `funnel: MindsFunnelConfig = MINDS_FUNNEL` prop 추가.
- `useMindsRelationshipCheckout(funnel)` 로 전달, `<MindsAuthGate funnel={funnel}/>`.
- 상품 설명 블록(제목·리드문·INCLUDES 체크리스트)만 `funnel.checkoutCopy` 로 치환 —
  가격 앵커링·전화번호 입력·환불 사전고지·SDK 로드·버튼 2종(카카오/네이버)·상태 문구는
  **공용 그대로.** 기본값이 현행 카피이므로 /minds 화면 무변.
- `trackMetaEvent("InitiateCheckout", { content_name: ... })` 의 content_name 도
  funnel.variant 로 분리(`minds_to_relationship` 기본 유지).

---

## 5. `MindsAuthGate` 리다이렉트 파라미터화

`src/components/minds/MindsAuthGate.tsx` **수정 (하위호환)**:

- prop: `funnel: MindsFunnelConfig = MINDS_FUNNEL` (모달이 내려줌).
- `readLeadId()` → `localStorage.getItem(funnel.leadStorageKey)`.
- 카카오 핸들러의 하드코딩 쿠키:
  ```ts
  document.cookie = `auth_redirect=${encodeURIComponent(
    `${funnel.freeReportBase}/${leadId}?checkout=1`
  )}; ...`;
  ```
  → 내면아이에선 `/inner-child/r/{leadId}?checkout=1` 로 복귀. `/auth/callback` 은
  쿠키값을 그대로 따라가므로 **무수정.** `?checkout=1` 자동 모달 재개는 §3-4 effect 가 처리.
- 이메일 로그인/가입·프로필 upsert·환영 알림톡·`claimLead()`(leadId 만 다름, claim
  API 는 리드 id 로 동작하니 무수정)는 전부 공용 그대로 — **로그인 화면 UI 는 픽셀 동일.**

---

## 6. 유료 리포트 엔진 + 페이지

### 6-1. 신규: `src/lib/minds/inner-child/paid-report.ts`

```ts
export async function generateInnerChildPaidReport(score: ScoreResult): Promise<PaidReportGenerated>
```
- `getTypeCard(primary)` + `getTypeCard(secondary[0])`(미집필이면 null) →
  `chatCompletion(gemini-2.5-pro, PAID_SYSTEM_PROMPT + buildPaidUserMessage(...))`
  → `safeJsonParse` → 5필드 존재·최소길이 검증(`readPaidReport()` 정규화 리더 동봉 —
  relationship-report 의 "캐시 정규화 후 렌더" 원칙 동일).
- 유료 산출물이라 **폴백 없음** — 재시도는 라우트에서 2회(minds 관례).

### 6-2. 신규: `src/app/api/inner-child/report/route.ts`

`/api/minds/relationship/route.ts` 와 동형 골격, 데이터 소스만 다름:

1. `purchaseId` 로 `minds_relationship_purchases` admin 조회 →
   `status==="confirmed"` 게이트 + user_id 소유권 게이트(동일).
2. **변형 가드**: `purchase.order_id.startsWith("IC-")` 아니면 400 —
   MR- 구매가 이 라우트로 잘못 들어와 내면아이 리포트가 캐시되는 사고 차단.
3. `report_json` 있으면 캐시 반환.
4. 리드의 `parts_map`(FreeReportBlob) 에서 `score_result` 로드 —
   원응답 재분석이 아니라 **권위 채점본 재사용**(재응답·재채점 0비용).
   블롭 없거나 v2.0 아니면 500(운영 알림 대상).
5. `generateInnerChildPaidReport(score)` 2회 재시도 → `report_json` 캐시 저장 → 반환.

### 6-3. 신규: `src/app/inner-child/full/[id]/page.tsx` + `InnerChildPaidView.tsx`

`/minds/relationship/[id]` 와 동형:

- 서버: admin 으로 `status, report_json, user_id, order_id` 조회. **IC- 아니면
  `/minds/relationship/[id]` 로 redirect**(역가드 — MR- 링크가 잘못 들어온 경우).
  소유권: user_id 있고 불일치면 `redirect(/login?next=/inner-child/full/${id})` (동일 패턴).
  `robots: noindex`.
- 클라(`InnerChildPaidView`): confirmed + report 없음 → `/api/inner-child/report` 호출
  (생성 대기 화면 — "응답을 다시 읽고 있어요", ~30초, MindsRelationshipView 의 로딩/재시도
  패턴 이식). 렌더는 HANDOFF §6-2 6섹션, `MindsRelationshipView` 의 스와이프 덱 셸
  패턴(카드 페이저 + 진행 도트) 재사용:

| # | 섹션 | 조립 |
|---|---|---|
| 0 | 읽기 전에 | `READ_BEFORE` 고정 |
| 1 | 이 아이의 전체 구조 | 카드 고정: `origin_hypothesis` + `domains`(관계/일/자기관리) |
| 2 | 같은 상처가 반복되는 구조 | 생성 `loop_narrative` (+반복 루프 요약 다이어그램 1장 — 촉발→해석→행동→결과→강화 5스텝 텍스트 다이어그램) |
| 3 | 두 번째 아이의 신호 | 두번째 카드 요약(고정) + 생성 `second_child_relation` |
| 4 | 방어 시스템: 지킴이 | `guardianDefinitionBlock(type)` 고정 + 생성 `guardian_anatomy` |
| 5 | 정말 원했던 것 | 생성 `core_need_bridge` + 카드 `core_need` 고정 |
| 6 | 지금의 당신이 줄 수 있는 것 | `reparentingSteps(card)` 3단계 고정 + 생성 `closing` + 상담 연계 CTA(minds 관례) |

### 6-4. `src/app/api/minds/relationship/route.ts` **수정 (가드 1줄, 하위호환)**

`purchase.order_id.startsWith("IC-")` 이면 400 — 내면아이 구매가 다섯배역 엔진으로
흘러들어 `RelationshipReport` 가 캐시되는 교차오염 차단. MR- 경로 무변.

---

## 7. DB 변경

**마이그레이션 0개.**

| 데이터 | 위치 | 근거 |
|---|---|---|
| 퍼널 표식(리드) | `minds_leads.channel = "inner_child"` | text, CHECK 없음 (`20260624_minds_leads.sql` 확인) |
| 원응답 | `minds_leads.answers` jsonb — 평탄화 배열 | create 라우트 검증 무수정 통과 |
| 채점+무료리포트 | `minds_leads.parts_map` jsonb — `FreeReportBlob` | `test_version:"v2.0"` 로 구/신 판별 |
| 구매 변형 | `minds_relationship_purchases.order_id` prefix `IC-` | UNIQUE·불변·전 조회 포함 |
| 유료 리포트 | `minds_relationship_purchases.report_json` jsonb | 스키마 자유 — `readPaidReport()` 로 정규화 |

---

## 8. /minds 무회귀 — 수정 파일 전수 + 하위호환 근거

| # | 파일 | 수정 | /minds 하위호환 근거 |
|---|---|---|---|
| 1 | `MindsAuthGate.tsx` | `funnel` prop 추가 | 기본값 `MINDS_FUNNEL` = 현행 하드코딩 값 그대로 |
| 2 | `MindsCheckoutModal.tsx` | `funnel` prop + 카피 치환 | 기본 카피 = 현행 문자열 이동, 렌더 결과 동일 |
| 3 | `useMindsRelationshipCheckout.ts` | `funnel` 인자 | 무인자 호출 = 현행 동작 |
| 4 | `payment/minds-relationship/create/route.ts` | `product` 필드(기본 relationship) | 필드 미전송 = MR- 현행 |
| 5 | `payment/nicepay/return/route.ts` | IC 분기 + 핸들러 `reportBase` 인자 | MR 은 기본 인자 — 경로·검증·알림 무변 |
| 6 | `api/minds/lead/route.ts` | channel 화이트리스트 +1 | 기존 3채널 분기 무변 |
| 7 | `api/minds/my-reports/route.ts` | 리드 쿼리에 기본 `.neq("channel","inner_child")` + `?product=inner_child` 파라미터 | /minds 호출(무파라미터)은 내면아이 리드 제외 — 오늘까지의 데이터엔 그런 리드가 없으므로 결과 동일 |
| 8 | `api/minds/relationship/route.ts` | IC- 400 가드 | MR- 무영향 |
| 9 | `/minds/r/[id]/page.tsx` | `parts_map.test_version==="v2.0"` 이면 `/inner-child/r/[id]` redirect 가드 | 기존 PartsMap 엔 test_version 없음 — 무영향. (역방향 가드는 /inner-child/r 신규 페이지에) |
| 10 | `MindsResultLinkBar.tsx` | `base?: string = "/minds/r"` prop | 기본값 = 현행 URL |
| 11 | `relationship-constants.ts` | IC 상수 **추가만** | 기존 상수 무변 |
| 12 | `inner-child/InnerChildTest.tsx` | `skipIntro` prop(기본 false) | /minds 프로덕션 미사용 파일. /dev 하네스 동작 무변 |

**무접촉(0줄)**: `MindsFlow.tsx`, `MindsLanding.tsx`, `MindsConversation.tsx`,
`MindsFreeReport.tsx`, `MindsAnalyzing.tsx`, `api/minds/parts-map`, `relationship-report.ts`,
`MindsRelationshipView.tsx`, `/auth/callback`, claim/track/notify, NicePay approve/config.

**릴리즈 전 /minds 스모크 목록**
1. 익명 신규: 랜딩 → 5문항 → 분석 → 무료 리포트 → 새로고침 시 `/minds/r/[id]` 자동복원.
2. 페이월 CTA → 모달: 비로그인 → 인증게이트(이메일 가입 / 카카오 — 카카오 복귀가
   `/minds/r/[id]?checkout=1` 로 오고 모달 자동 재개).
3. 결제: 카카오페이·네이버페이 각 1건 — orderId `MR-` 확인, 승인 후
   `/minds/relationship/[id]` 도착, 리포트 생성·캐시, 알림톡 수신.
4. already_purchased 리드로 재결제 시도 → 새 결제 없이 리포트 이동.
5. 기존(구버전) `/minds/r/[id]` 공유링크 렌더 + `/minds/relationship/[id]` 재방문 캐시 렌더.
6. 로그인 상태 `/minds` 진입 → my-reports 복원이 다섯배역 리드만 잡는지
   (테스트 계정에 내면아이 리드를 만들어 교차복원 안 되는 것 확인).

---

## 9. 빌드 순서 — 단계별 독립 검증

> 공통 게이트: `npx tsc --noEmit` + `npx vitest run`(**기존 9개 그린 유지** — 채점 로직
> 무접촉이므로 전 단계에서 그린이어야 정상) + `npm run build`.

**Step 1 — 퍼널 골격 (신규 위주, /minds 무접촉)**
- 신규: `funnel-config.ts`, `app/inner-child/page.tsx`, `InnerChildFlow.tsx`
- 수정: `InnerChildTest.tsx`(skipIntro)
- 검증: dev 서버에서 `/inner-child` — MindsLanding 동일 렌더 → 시작 → 인트로 없이 1부
  첫 문항 → 26문항 완주 → (임시) 채점 요약 콘솔 확인. `/minds`·`/dev/inner-child` 육안 무변.

**Step 2 — 무료 리포트 E2E**
- 신규: `api/inner-child/free-report/route.ts`, `free-report-store.ts`,
  `app/inner-child/r/[id]/`(page + view), `components/minds/inner-child/report/InnerChildFreeReport.tsx`
- 수정: `api/minds/lead/route.ts`(channel), `MindsResultLinkBar`(base prop)
- 검증: 익명 완주 → `/inner-child/r/[id]` 8섹션 렌더(gap/relation_pattern 실생성),
  DB 에서 `channel=inner_child`·`answers` 배열·`parts_map.test_version=v2.0` 확인,
  새로고침 자동복원, SCT 에 위기 키워드 넣은 런은 위기 안내 + 페이월 미노출.

**Step 3 — 결제 파라미터화 + 배선 (여기가 /minds 접촉 구간 — 한 커밋)**
- 수정: `MindsAuthGate`, `MindsCheckoutModal`, `useMindsRelationshipCheckout`,
  `create/route.ts`, `nicepay/return/route.ts`, `relationship-constants.ts`,
  `my-reports/route.ts`, `api/minds/relationship`(IC 가드), `/minds/r/[id]`(v2 redirect)
- 검증: ⓐ **§8 /minds 스모크 1·2·4 를 먼저**(회귀 게이트) ⓑ /inner-child 페이월 →
  모달(내면아이 카피·₩9,900) → 인증게이트 → 카카오 복귀가 `/inner-child/r/[id]?checkout=1`
  ⓒ 결제 시작 시 DB 에 `IC-` pending 생성 확인.
  ※ NicePay 샌드박스 주의(마음체크 퍼널 경험): dev 샌드박스는 인증까지만 유효하고
  실승인 캡처는 prod 모드에서만 확인된다. dev 에선 return 라우트를 `IC-` 주문으로
  직접 POST(폼 인코딩 모킹)해 분기·리다이렉트를 검증하고, 실결제는 Step 5 에서.

**Step 4 — 유료 리포트 E2E**
- 신규: `lib/minds/inner-child/paid-report.ts`, `api/inner-child/report/route.ts`,
  `app/inner-child/full/[id]/`(page + `InnerChildPaidView`)
- 검증: dev DB 에서 IC- 구매 행을 수동 confirmed 전환 → `/inner-child/full/[id]` 진입 →
  생성 대기 → 6섹션 렌더 → `report_json` 캐시 확인 → 재방문 대기 0.
  소유권(타 계정 로그인 시 /login redirect), MR- 구매 id 로 접근 시 역가드 redirect,
  `/api/minds/relationship` 에 IC purchaseId 호출 시 400 확인.

**Step 5 — 릴리즈 게이트**
- `tsc` + `vitest`(9 그린) + `next build` → 배포.
- **prod NicePay 실결제**: /inner-child 에서 카카오페이·네이버페이 각 1건 소액 결제 →
  승인 → `/inner-child/full/[id]` 리포트 → 알림톡 링크 확인 → 어드민 환불 페이지에서
  해당 건 환불 처리(환불 경로까지 IC 건으로 1회 검증).
- §8 /minds 스모크 전체 1회.

---

## 10. 리스크 메모

- **교차오염이 최대 리스크** — 방어 4겹: 저장키 분리(`inner_child_lead_id`) ·
  channel 태그 · my-reports 기본 제외 · 리포트 라우트 상호 가드(IC↔MR 400/redirect).
- **모달 카피 vs "동일 경험"**: 결제 모달의 상품 설명은 파는 물건이 달라 반드시 갈라져야
  한다(잠금 목차 4약속과 불일치하면 전환 붕괴). 구조·가격·버튼·고지·인증 UI 는 동일 유지.
- **파일럿 3종 외 13유형 미집필**: `getTypeCard` null 이면 무료 라우트는 폴백 서술로 렌더
  가능하나 상품성이 없다 — **런칭 게이트는 16장 집필 완료**(피벗 플랜 Phase 6 병렬).
  그 전 배포 시 미집필 유형은 "리포트 준비 중 + 연락 수단" 안내로 방어.
- **LLM 실패(유료)**: 폴백 없음 정책 유지 — 실패 시 페이지 재시도 안내 + 슬랙 알림
  (minds 관례). 환불 루트는 기존 cancel 라우트 그대로.
