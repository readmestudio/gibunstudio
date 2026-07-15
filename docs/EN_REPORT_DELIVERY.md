# 영문 유료 리포트 발송 절차 (/inner-child/en)

해외 결제가 없어 영어 퍼널은 **"Request the full report · $9.90" → 베타 무료 → 손으로 써서 발송"** 이다.
발송 형태는 **항상 링크**다. 이메일 본문에 원고를 붙여 넣지 않는다.

> **왜 링크인가**
> 원고가 길어 Gmail 이 중간에서 자르고("메시지 전체 보기"), 무엇보다 제품이 아니라 편지로 읽힌다.
> $9.90 을 매길 물건이면 페이지로 열려야 한다. 링크는 재방문·공유·수정도 된다.

> 🔴 **원고를 코드에 커밋하지 말 것.**
> 원고는 특정 개인의 심리검사 응답을 인용한 개인정보이고, **이 저장소는 공개다**(`readmestudio/gibunstudio`).
> 코드 파일에 넣으면 본인이 동의한 적 없는 데이터가 공개 저장소와 검색에 영구히 남는다.
> 원고는 반드시 **DB(`minds_leads.parts_map.manual_report`)** 에만 넣는다 — 아래 3번 참고.
> (2026-07-15: 실제로 코드 파일로 만들었다가 푸시 직전에 걸러냈다.)

---

## 슬랙 알림에서 시작한다

이메일 제출 시 `✉️ [EN] 유료 리포트 요청 접수` 알림이 온다. 필요한 게 다 들어 있다.

- **Email** — 회신할 주소
- **Type** — 배정된 16유형(영어명)
- **보낼 링크** — `…/inner-child/en/full/<leadId>` (그대로 복사해 회신)
- **Lead** — 응답 조회용 UUID

원고가 이미 있으면 헤드라인이 `유료 리포트 재요청` 으로 바뀌고 링크에 `✅ 준비됨` 이 붙는다.
그 경우 아래 절차를 건너뛰고 링크만 회신하면 된다.

---

## 1. 응답 조회

원고는 **반드시 실제 응답을 읽고** 쓴다. 유형 카드만 보고 쓰면 16명에게 같은 글이 나간다.

```bash
node -e '
require("dotenv").config({path:".env.local"});
const u=process.env.NEXT_PUBLIC_SUPABASE_URL, k=process.env.SUPABASE_SERVICE_ROLE_KEY;
const LEAD="<leadId>";
fetch(`${u}/rest/v1/minds_leads?id=eq.${LEAD}&select=email,created_at,answers,parts_map`,
  {headers:{apikey:k,Authorization:`Bearer ${k}`}})
 .then(r=>r.json()).then(d=>{
   const row=d[0];
   console.log(JSON.stringify(row.answers,null,2));
   console.log(JSON.stringify(row.parts_map?.score_result,null,2));
   console.log(JSON.stringify(row.parts_map?.free_report,null,2)); // 이미 읽은 내용 — 반복 금지
 });'
```

### 데이터 읽을 때 실제로 틀렸던 것들

- **문항 구성은 척도 17 + 지킴이 3 + SCT 5 = 25.** SCT 는 3개가 아니다(SCT4 = 퇴행 트리거,
  SCT5 = 회피 행동). 재양육 섹션은 SCT4 를 인용해 여는 것이 설계 의도.
- **척도는 6점.** 6 은 천장이다. "6을 줬다" 는 강한 신호이므로 반드시 짚는다.
- **지킴이 라벨을 과잉해석하지 말 것.** 3답이 전부 다르면 `resolveGuardian()` 이 **G2 하나로**
  tie-break 한다(`scoring.ts`). 이때 라벨은 지배적 방어가 아니다 — "셋을 상황별로 번갈아 쓴다" 가 사실.
- **선택지 텍스트를 답변으로 착각하지 말 것.** `answers[].answer` 만 그 사람이 고른 것이다.
  (실제로 고르지 않은 선택지를 "당신은 이렇게 답했죠" 로 쓴 초안이 나온 적 있음 — 신뢰가 즉사한다.)
- **`primary_child` 의 영역이 최고점 영역이 아닐 수 있다.** `areas` 순위를 따로 볼 것. 이 어긋남
  자체가 대개 리포트에서 가장 좋은 인사이트가 된다.
- **무료 리포트(`free_report`)에 이미 나간 내용은 반복하지 않는다.** 유료는 그 너머여야 한다.

---

## 2. 원고 작성

`ManualReport` 형태의 **JSON 파일**로 쓴다(저장소 밖 임시 경로에). 타입 정의는
`src/lib/minds/inner-child/en/manual-reports.ts` 에 있다. 블록 종류:

| kind | 쓰임 |
|---|---|
| `p` | 일반 문단 |
| `quote` | **본인이 쓴 문장** 인용 (주황 좌측선 + "YOUR WORDS" 라벨) |
| `callout` | 섹션의 결론/반전 한 덩어리 |
| `steps` | 루프 단계, 지킴이 목록, 실행 3단계 |
| `line` | 리포트의 못 — 한 문장만 크게 (그라데이션) |

섹션 구성은 한국어 유료 리포트 구조를 따른다:
출처(origin) → 영역별 발현 → 반복 루프 → 지킴이 → 두 번째 아이 → 핵심 욕구 → 재양육 → 마무리.
(기존 원고를 레퍼런스로 보려면 아래 3번의 `DRY_RUN` 대신 DB 에서 `parts_map.manual_report` 를 읽는다.)

### 톤 규칙

- **결핍 프레임 금지.** 낮은 수치는 결함이 아니라 **높은 수치와 같은 뿌리의 트레이드오프**
  ("실패한 게 아니라 예산을 다른 데 썼다"). 단, 아이 자신의 대사는 결핍어를 유지한다(외재화).
- **"그건 A가 아니라 B" 반전 박자**를 최소 한 번. 아하 모먼트가 없으면 유료가 아니다.
- 진단 아님을 도입부에 명시.

---

## 3. 원고 등록 (DB)

원고는 DB 에 들어가므로 **배포가 필요 없다.** 등록 즉시 링크가 열린다.

```bash
# 확인만 (저장 안 함) — 리드·유형·기존 원고 유무·만료·무료 블롭 보존 여부를 보여준다
LEAD_ID=<uuid> REPORT_FILE=./report.json DRY_RUN=1 node scripts/put-en-manual-report.js

# 실제 저장 (만료 기본 7일)
LEAD_ID=<uuid> REPORT_FILE=./report.json node scripts/put-en-manual-report.js

# 만료만 연장 — 재발급 요청이 왔을 때(원고는 그대로)
LEAD_ID=<uuid> EXTEND_ONLY=1 node scripts/put-en-manual-report.js
```

### 만료 (7일)

요청 모달과 회신 메일 모두 **"7일간 열린다"** 고 안내하므로 **실제로 닫힌다.** 안내만 하고 열어두면
그건 고객에게 하는 거짓말이고, 이 리포트는 "인용은 전부 당신이 쓴 문장이니 검증해보라"고 말하는
물건이라 특히 안 맞는다. `expires_at`(ISO)을 스크립트가 넣고 페이지가 검사한다.

- 만료 후에는 만료 안내가 뜨고, **회신하면 다시 열어준다**(`EXTEND_ONLY=1`) — 본인의 심리 리포트를
  영구히 막지 않는다
- 기간을 바꾸려면 `EXPIRES_DAYS=14`. **바꾸면 모달·메일 문구도 같이 고칠 것**(숫자가 어긋나면 안 된다)
- 슬랙 재요청 알림이 만료 상태(`⏳ 만료됨`)와 연장 명령을 함께 띄운다

스크립트가 하는 일:

- 형식 검증(`schema_id`/`child_name`/`sections`/블록 `kind`) — 깨진 원고를 미리 막는다
- 기존 `parts_map` 을 읽어 **`manual_report` 키만 병합** — 무료 리포트 블롭
  (`test_version`/`score_result`/`free_report`)을 덮어쓰지 않는다
- 저장 후 보낼 링크를 출력

같은 LEAD_ID 로 다시 실행하면 원고를 덮어쓴다(수정 시 그대로 재실행).

---

## 4. 회신 (템플릿)

제목: `Your Inner Child report is ready — <Type Name>`

```
Hi <Name>,

Your full report is written and waiting here:

👉 https://gibunstudio.com/inner-child/en/full/<leadId>

As promised, you're in as a beta reader — no charge, no card, the $9.90 is on us.

A few things worth knowing before you open it:

**It's yours, not a template.** I wrote it by hand from your twenty-five answers and the
five sentences you finished. Every quote in it is something you actually wrote, and I
left the numbers in so you can check my work.

**One section may sting.** <이 사람에게 가장 아픈 반전 한 줄로 교체>

**It's not a diagnosis.** Nothing in there says something is wrong with you. Every
pattern in it was, at some point, a good idea.

The link is yours alone — nobody finds it without it. It stays open for 7 days; if you
need more time, just reply and I'll reopen it.

If any of it misses, just reply and tell me which part. Beta readers are the only reason
the English version will get better, and a "that's not me" is more useful to me than a
thank-you.

Take care of that kid,

Jian
GIBUN Studio
```

약속한 리드타임은 요청 모달 기준 **"usually within a day or two"** 다.

---

## 알려진 미해결

- ~~영어 페이지에 한국어 전역 헤더~~ → 해결(2026-07-15). `isImmersiveRoute()` 에 `/inner-child/en`
  추가로 헤더·푸터 모두 숨김. EN 라우트를 새로 만들 때도 이 함수가 자동 적용된다.
- **Vercel prod 의 `NEXT_PUBLIC_SITE_URL` 이 `gibunstudio.vercel.app`**(전 라우트 404)로 박혀 있다.
  `en/notify.ts` 가 정식 도메인이 아닌 값을 무시하도록 방어해 슬랙 링크는 정상이지만,
  **다른 곳에서 이 env 를 쓰면 여전히 깨진다.** 대시보드에서 값을 고치거나 지울 것.
- 자동 생성(LLM) 파이프라인은 미착수 — 원고는 전부 손으로 쓴다.
- 등록 수단이 CLI 스크립트뿐이다(어드민 UI 없음). 볼륨이 붙으면 필요해진다.
