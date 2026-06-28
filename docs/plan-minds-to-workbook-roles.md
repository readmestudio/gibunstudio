# 기획안 — /minds 배역을 워크북으로 잇기

> **상태:** 기획 확정 단계 (구현 미착수)
> **작성:** 2026-06-28
> **결정 사항:** 워크북 화면에서 배역명(리더/빌런/난봉꾼/관리자/추방자) **그대로 노출** /
> 산출물 범위는 **본 기획안 확정까지**
> **목표:** gibunstudio.com/minds 무료 테스트에서 만난 "배역"이 워크북 결제 후에도
> 끊기지 않고 이어지게 한다. 워크북 1~10단계 **순서는 그대로 유지**하고, 각 단계에
> 배역을 어떻게 등장(연출)시킬지 정의한다.

---

## 1. 배경 — 두 구조를 나란히

### ① /minds 무료 테스트의 5배역 (드라마 배역명 그대로 노출)

`src/lib/minds/characters.ts` 의 `ROLE_SLOTS`(5종) + `CHARACTER_CAST`(10명).

| 배역 | 하는 일 (blurb) | affinity(PartRole) | 소속 캐릭터 |
|------|-----------------|--------------------|-------------|
| **리더** | 삶의 주된 정서를 만들며 무대를 끌고 감 | manager | 인정받고파氏, 중재가 |
| **빌런** | 나를 다그치지만 *사실은 지키려는* 마음 | self_critic | Mr.다그쳐, 비교돌이 |
| **난봉꾼** | 위기에 발작버튼처럼 튀어나오는 마음 | firefighter | 도망가, 억울이 |
| **관리자** | 고통이 닥치기 전 미리 차단·방어 | manager | 완벽주의 여사, 불안이 |
| **추방자** | 과거 상처를 홀로 짊어진 채 깊이 밀려난 마음 | exile | 쉬고싶어氏, 무기력씨 |

### ② 워크북 10단계 (현재 순서 — 그대로 유지)

`src/lib/self-workshop/diagnosis.ts` 의 `WORKSHOP_STEPS`.

```
TEST     1 성취중독 테스트        · 2 진단 리포트(캐릭터 프로필)
FIND OUT 3 마음 안의 존재들 만나기 · 4 패턴 발견 · 5 마음↔패턴 잇기(AI)
RESHAPE  6 안에서 지키는 마음     · 7 본래 바람 · 8 역할과 건강한 활용
SUMMARY  9 내 마음들의 이야기(AI) · 10 마무리
```

### 핵심 관찰

워크북 RESHAPE 단계가 이미 **IFS 정석 순서(방어막 단단한 마음 → 가장 여린 마음)**를
따르고 있어, /minds 배역 성격과 거의 1:1로 맞아떨어진다. 억지 끼워맞춤이 필요 없다.
**minds = "등장인물 소개편", 워크북 = "본편 스토리".**

---

## 2. 연속성 구현 토대 (LLM 변주 우려 해소)

> **우려:** "테스트에서 LLM으로 배역을 생성하면 10가지 캐릭터 외 다른 캐릭터가 나오지 않나?"

구조상 **차단된다.** 렌더 경로:

```
LLM (api/minds/parts-map/route.ts)
  → parts[] 자유 생성 (name·description·role… role은 5종 중 1개)
        ↓
buildCharacterViews(partsMap)   ← 캐스팅 디렉터 (characters.ts)
  → 각 part의 role을 고정 10인 CHARACTER_CAST 중 하나로 스냅
        ↓
MindsFreeReport → 화면엔 항상 "고정 캐릭터"만 출력
```

- **화면 캐릭터 = 항상 고정 10명 중 일부** (11번째 캐릭터는 발생 불가)
- **배역 = 항상 고정 5종 중**
- LLM·유저가 바꾸는 건 `evidenceQuote`(인용)·`userGivenName`(유저가 붙인 이름)뿐.
  초상·이름·설명은 고정.

**개인별로 받은 배역은 `minds_leads.parts_map` 에 이미 저장됨**
(`route.ts` 의 백그라운드 UPDATE). 워크북에서 같은 `parts_map` 으로
`buildCharacterViews` 를 다시 돌리면 **동일 캐스팅을 손실 없이 복원**한다.

> **결론:** 워크북 연속성은 "무한 변주"가 아니라 **5배역 × 10캐릭터 닫힌 카탈로그**
> 위에 설계한다. 따라서 배역 연출 카피를 **캐릭터별로 사전 작성** 가능(LLM 재생성 불필요).

**미묘한 점:** 매핑이 `role` 일치 + "이미 쓴 캐릭터 소비" 방식이라, *어떤 사람이
정확히 10명 중 누구를 받는지*는 답변·순서에 따라 달라진다(집합은 닫혀 있으나 1:1 고정은
아님). 워크북은 이 가변성을 그대로 수용하고, 저장된 `parts_map` 복원으로 일관성을 맞춘다.

---

## 3. 배역이 워크북 어디에 "주연"으로 등장하는가

순서(1→10)는 그대로. 각 단계마다 **이미 minds에서 만난 배역을 다시 소환**한다.
🎬 = 해당 배역이 그 단계의 주연.

| 단계 | 배역 등장 방식 | 왜 여기인가 |
|------|----------------|-------------|
| **2 진단 리포트** | 🎬 *재회 지점* — "minds에서 만난 5배역, 이제 한 명씩 깊이 만나요" | 연속성의 첫 접점. minds 캐릭터 카드를 그대로 불러와 안심시킴 |
| **3 존재들 만나기** | 5배역 전원이 **출연진(캐스팅)으로 등장** | "한 사건 속 여러 마음" = minds 캐스팅이 출발점 |
| **4 패턴 발견** | **빌런·난봉꾼**의 트리거가 삶 전반에 반복됨을 추적 | 두 배역의 trigger 정의가 "반복 패턴"과 직결 |
| **5 마음↔패턴 잇기(AI)** | 배역 간 **갈등 구도**(minds의 conflicts) 시각화 | minds가 유료로 남겨둔 "관계 역학"의 본편 |
| **6 안에서 지키는 마음** | 🎬 **관리자 + 리더** 주연 | affinity=manager. 통제·계획하는 마음 = 정확히 이 둘 |
| **7 본래 바람** | 🎬 **빌런** 주연 — "다그치지만 사실은 지키려던 것" | minds 빌런 blurb의 반전을 여기서 완성 |
| **8 역할과 건강한 활용** | 🎬 **난봉꾼** 주연 (응급처치의 한계·활용) | 위기 대응 마음의 건강한 자리 찾기 |
| **9 내 마음들의 이야기(AI)** | 🎬 **추방자** 마지막에 드러남 + 전체 라인업 마무리 | IFS 정석: 숨어있던 어린 마음을 맨 끝에 |
| **10 마무리** | **리더/중재가**("고요히 바라보는 자리")로 닫기 | 모든 배역을 품는 가장 어른스러운 마음 |

**연출 원리:** 6~9단계에서 관리자 → 빌런 → 난봉꾼 → 추방자 순으로 주연이 바뀌는 것은
**방어막이 단단한 마음부터 만나고, 가장 여린 마음(추방자)을 맨 나중에** 만나는
심리치료의 안전 순서다. 배역 등장은 어디까지나 **연출**이며 단계 자체는 건드리지 않는다.

---

## 4. 용어 정책 결정 (중요)

워크북에는 `IFS_TERM_BAN_RULES`(`ifs-parts-data.ts`)가 있어 화면에 "관리자·추방자·
소방관" 같은 IFS 용어 노출을 금지하고 자연어만 쓰게 돼 있다. minds 배역명에 하필
"관리자/추방자"가 그대로 들어 있어 충돌한다.

**결정: 워크북에서도 배역명을 그대로 노출한다(리더/빌런/난봉꾼/관리자/추방자).**

→ 구현 시 `IFS_TERM_BAN_RULES` 를 **배역 레이어에 한해 예외 처리**해야 한다.
배역명은 "드라마 메타포 라벨"로 취급하고, 자연어 본문(상담 톤 설명)은 기존 정책 유지.
즉 *배지/라벨 = 배역명 허용*, *본문 서술 = IFS 전문용어 여전히 금지*.

> **구현 시 주의:** `minds/characters.ts:20-21` 의 정책 주석("무료 /minds는 배역명을
> 그대로 노출, 유료 워크북의 IFS_TERM_BAN_RULES와 별개")과,
> `free-minds-flow.ts:15-18` 의 "무료→워크북 연속성 스킵은 의도적으로 만들지 않는다"
> 주석을 이번 결정에 맞게 갱신할 것. (단계 스킵이 아니라 **배역 연출 연속성**이므로
> 후자 정책과 모순되지 않음 — 워크북 1~10단계는 그대로 전부 진행한다.)

---

## 5. 데이터 연결 조사 결과 (2026-06-28)

> **판정: (C) 연결 키 자체가 없어 신규 설계 필요.**
> minds와 워크북이 서로 다른 신원 체계를 써서, 현재 두 세계를 잇는 다리가 없다.

|              | minds (무료)                       | 워크북 (유료)                 |
|--------------|------------------------------------|-------------------------------|
| 신원         | **비로그인** — `minds_leads.id` + (선택)email | **로그인** — `auth.users.id`  |
| 배역 데이터  | `minds_leads.parts_map` ✅ 저장됨   | 조회 경로 ❌ 없음             |

### 끊긴 지점 3곳

1. **결제 전환 시 leadId 미전달** — `MindsFreeReport.tsx:41` 의 `openCheckout` 이
   `/payment/start` 로만 이동, leadId 미동봉.
2. **결제 API가 leadId 미수신** — `api/payment/workshop/create` 는 `workshopType`·
   `amount` 만 받음. `nicepay/return` 의 `workshop_progress` insert 에도 minds 키 없음.
3. **워크북 테이블에 연결 컬럼 부재** — `workshop_progress`·`workshop_purchases`
   (`supabase-create-workshop-progress.sql`, `supabase-create-workshop-purchases.sql`)
   어디에도 `minds_lead_id` / email 매칭 컬럼 없음.

### 관련 스키마/파일 (근거)

- `supabase/migrations/20260624_minds_leads.sql` — `minds_leads` 컬럼: `id`, `channel`
  ('email'|'kakao'), `email`(nullable), `answers`(jsonb), `parts_map`(jsonb), utm…
  **`user_id` 없음**. RLS: service role 전용.
- `api/minds/lead/route.ts:52-76` — 리드 생성(비로그인, email·utm만).
- `api/minds/parts-map/route.ts` — `parts_map` 을 `leadId`(=`minds_leads.id`)로 UPDATE.
- `supabase-create-workshop-purchases.sql` — `user_id uuid NOT NULL REFERENCES auth.users`.
- `supabase-create-workshop-progress.sql` — `user_id` + `purchase_id` 기반, minds 키 없음.

### 권장 연결 경로 — 옵션 A(leadId 배선) 메인 + 옵션 B(email 매칭) 보조

- **옵션 B(email)만은 위험**: minds 는 카카오 채널이면 `email` 이 NULL 일 수 있고,
  minds 이메일 ≠ 로그인 이메일일 수 있어 누락 발생.
- **옵션 A(leadId)** 가 정확: 결제 버튼 시점에 leadId 가 이미 클라이언트에 있음.
- **A의 함정**: minds→결제 사이 **로그인 왕복**에서 쿼리파라미터가 유실될 수 있으므로,
  leadId 를 URL 파라미터가 아니라 **localStorage 등에 보존**해 왕복 후에도 살린다.

```
MindsFreeReport(leadId 보존) → /payment/start → [로그인 왕복] →
payment/workshop/create(leadId 수신) → workshop_purchases.minds_lead_id 저장 →
nicepay/return → workshop_progress.minds_lead_id 복사 →
워크북 step: minds_leads.parts_map JOIN 조회 → buildCharacterViews 복원
```

```sql
-- 워크북 step에서 배역 복원용 조회
SELECT ml.parts_map FROM minds_leads ml
  JOIN workshop_progress wp ON ml.id = wp.minds_lead_id
  WHERE wp.user_id = $1 AND wp.workshop_type = 'achievement-addiction';
```

---

## 6. 다음 단계 (구현 시 — 본 기획 확정 이후)

1. ~~**데이터 연결 조사**~~ → §5 완료. **판정: 신규 배선 필요.**
2. **연결 배선 구현** (§5 권장 경로):
   - DB: `workshop_purchases` + `workshop_progress` 에 `minds_lead_id` 컬럼 추가.
   - 클라이언트: `MindsFreeReport` 에서 leadId 보존(localStorage) + 결제 플로우 전달.
   - 서버: `payment/workshop/create` 수신 → `nicepay/return` 에서 progress 로 복사.
3. **캐스팅 복원 유틸**: 워크북에서 `buildCharacterViews(parts_map)` 재호출로 동일
   배역 라인업 복원하는 헬퍼.
4. **배역별 워크북 카피**: 10캐릭터 × 등장 단계별 연출 카피 사전 작성.
5. **용어 가드 예외**: `IFS_TERM_BAN_RULES` 를 배역 라벨에 한해 우회하는 규칙.
6. **단계 컴포넌트 배선**: 위 §3 표대로 각 step 페이지/프롬프트에 배역 연출 삽입.

> 본 문서는 **기획 확정용**이다. 위 2~6은 컨펌 후 별도 작업으로 진행한다.
