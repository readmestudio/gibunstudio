# 내면 아이 찾기 피벗 — 구현 플랜 (코드베이스 반영본)

> 원천 설계: `~/Downloads/HANDOFF-v2.md`
> 이 문서는 그 설계를 **GIBUN 코드베이스 현실**(현재 /minds = "다섯 배역")에 맞춰
> "뭘 재사용하고 뭘 갈아엎을지"로 구체화한 실행 플랜이다.

## 0. 확정 결정사항

| 항목 | 결정 |
|---|---|
| LLM | **Gemini 유지** (새 클라이언트 없음). 무료=`gemini-2.5-flash`, 유료=`gemini-2.5-pro` |
| 배치 | 기존 `/minds`에 **in-place 교체** (랜딩·로그인게이트·결제·리드 인프라 재사용) |
| 로그인 게이트 | 이미 결제 시점으로 이동 완료(커밋 `29b243d`). 이 피벗과 독립 |
| 콘텐츠 자산 | 16개 유형카드·일러스트는 **파일럿 3종 먼저**, 나머지는 병렬 워크스트림 |

---

## 1. 재사용 / 교체 / 신규 (한눈에)

### ✅ 재사용 (건드리지 않음)
- **DB 테이블**: `minds_leads`(`answers` jsonb, `parts_map` jsonb, `user_id`, ip/ua) +
  `minds_relationship_purchases`(`report_json` jsonb, `status`, `order_id`, `phone`)
- **결제·인증·리드 인프라**: NicePay 배선(`useMindsRelationshipCheckout`), 결제 게이트(로그인 401),
  `MindsAuthGate`/`MindsCheckoutModal`, 리드 claim, `relationship-constants.ts`
- **LLM 클라이언트**: `src/lib/gemini-client.ts`의 `chatCompletion()` + `safeJsonParse()`
- **캐싱·비용방어**: 리드당 1회 분석 캐시, IP 레이트리밋, 일일예산(`minds_llm_bump` RPC)
- **렌더 셸**: 카드덱 UI (`MindsFreeReport`의 CardCarousel, `MindsRelationshipView`의 스와이프 덱)
- **라우트 2분할**: 무료(공개 `/minds/r/[id]`) + 유료(로그인 게이트 `/minds/relationship/[id]`)

### ♻️ 교체 (다섯 배역 → 내면 아이)
- **문항**: `src/lib/minds/free-minds-flow.ts`(6스텝) → 적응형 문항 세트
- **채점**: (없음) → 순수함수 채점 엔진 신규
- **무료 분석 프롬프트+스키마**: `src/app/api/minds/parts-map/route.ts` 인라인 프롬프트
- **유료 엔진**: `src/lib/minds/relationship-report.ts`(`RelationshipReport` 스키마 + 프롬프트)
- **콘텐츠**: `src/lib/minds/characters.ts`(10 캐스트) → 16 유형카드
- **렌더 카피**: `MindsFreeReport`/`MindsRelationshipView`의 고정 텍스트

### ➕ 신규
- `src/lib/minds/inner-child/` 하위:
  - `questions.ts` — 전체 문항(스크리닝8·공통1·드릴다운16·지킴이3·SCT5) + ID/영역/도식 매핑
  - `scoring.ts` — 순수함수 채점(영역점수→대표아이→지킴이→위기필터), **유닛테스트 필수**
  - `crisis-words.ts` — 위기 키워드 + `detectCrisis()`
  - `type-cards/` — 16 유형카드(yaml/ts). 파일럿 3종 먼저
  - `fixed-texts.ts` — 지킴이 정의블록·"읽기 전에"·잠금템플릿·재양육3단계
  - `free-report-prompt.ts` / `paid-report-prompt.ts` — 5-2 / 6-4 시스템 프롬프트
  - `report-types.ts` — 채점결과 JSON·무료·유료 리포트 TS 타입
- 위기 분기 화면(전문기관 안내)
- 6점 척도 컴포넌트, 적응형 분기 로직, SCT 입력, 진행률 바
- 면책 문구(시작 화면 + 리포트 하단)

---

## 2. 데이터 모델 (마이그레이션 최소화)

기존 jsonb 컬럼을 재사용해 **핵심 데이터엔 신규 마이그레이션 0개**.

| 저장 위치 | 내용 |
|---|---|
| `minds_leads.answers` (jsonb) | 원본 답변 배열 (스크리닝/드릴다운/지킴이/SCT 원문) |
| `minds_leads.parts_map` (jsonb) | `{ test_version, score_result, free_report }` — 코드 채점 결과 + 무료 LLM 2필드. **단일 입력 JSON** 역할 |
| `minds_relationship_purchases.report_json` (jsonb) | 유료 리포트(6섹션) 캐시 |

- **무료→유료 재생성 무비용**: 유료 엔진은 `answers`(+ `score_result`)만 읽어 재생성. 재응답 불필요.
- **버전 태그**: `parts_map.test_version="v2.0"`로 구/신 리포트 구분 → 렌더러가 분기.
  구버전(다섯 배역) 공유링크는 noindex·저볼륨이므로 안내문으로 처리(선택: 구렌더 유지).
- **위기 플래그**: `score_result.crisis_flag=true`면 리포트 생성 스킵 + 전문기관 안내.

---

## 3. LLM 호출 (Gemini, 퍼널당 2회)

| 구간 | 모델 | 호출 | 생성 필드 |
|---|---|---|---|
| 무료 | `gemini-2.5-flash` | 채점(코드) 후 1회 | `gap`, `relation_pattern` (2개) — 나머지 8카테고리는 유형카드 고정 |
| 유료 | `gemini-2.5-pro` | 결제 후 1회 | `loop_narrative`, `second_child_relation`, `guardian_anatomy`, `core_need_bridge`, `closing` (5개) |

- 시스템 프롬프트는 HANDOFF 5-2 / 6-4 전문 사용. `safeJsonParse` 3단계 복구 + 1회 재시도 + 고정 폴백.
- 유형카드 주입은 **해당 유형만**(무료 1장, 유료 2장) — 16장 전체 주입 금지.

---

## 4. 테스트 UI (적응형)

현재는 고정 6스텝(클라이언트 index). 새 흐름:
```
스크리닝 8 → (클라 채점: 상위 2영역 확정) → 해당 영역 드릴다운 5~9
  → 공통 C1(특권의식) → 지킴이 3(3지선다) → SCT 5(자유입력)
  → 위기필터(SCT 키워드) → 분석
```
- 채점 로직(`scoring.ts`)은 **클라·서버 공유**. 클라가 상위2영역만 계산해 드릴다운 노출,
  최종 권위 채점은 서버(`/api/minds/free-report`)에서 재수행.
- 6점 척도(양끝 라벨만), "요즘의 나" 안내, 진행률 바, 세션 복원(localStorage + leadId).
- SCT 전환 문구·면책 문구 고정 삽입.

---

## 5. 단계별 구현 순서 (권장)

> HANDOFF 10-3을 코드베이스에 맞춰 조정. 각 단계 끝에 검증 게이트.

**Phase 1 — 채점 엔진 (UI 없음, 순수 로직)**
`questions.ts` + `scoring.ts` + `crisis-words.ts` + 유닛테스트
(동점 케이스, 특권의식 5점 컷, 지킴이 3개 상이 케이스). → 테스트 그린이 게이트.

**Phase 2 — 콘텐츠 자산 파일럿 + 프롬프트**
유형카드 3종(문 앞에서 기다리는 아이 / 채찍 든 아이 / 너무 일찍 어른이 된 아이)
+ `fixed-texts.ts` + `free-report-prompt.ts` + `paid-report-prompt.ts` + `report-types.ts`.

**Phase 3 — 테스트 UI**
`free-minds-flow.ts` 교체 + `MindsConversation` 적응형 분기 + 6점척도/SCT/진행률 + 위기 분기 화면.

**Phase 4 — 무료 리포트 E2E**
`/api/minds/free-report`(채점→`minds_leads` 저장, flash 2필드) + `MindsFreeReport` 8카테고리 재구성.
→ 익명 무료 테스트 한 바퀴 실동작.

**Phase 5 — 유료 리포트 E2E**
`relationship-report.ts` 교체(pro 5필드) + `MindsRelationshipView` 6섹션 재구성.
결제·게이트·캐싱 재사용. → prod 결제 테스트.

**Phase 6 — 콘텐츠 확장 (병렬)**
유형카드 13종 + 일러스트 16종(Higgsfield). 엔지니어링과 독립.

**Phase 7 — 파일럿**
지인 10~20명 → 문항·톤 검수 → 광고 오픈.

---

## 6. 리스크 / 검증 포인트

- **채점 정확도**: 순수함수 + 유닛테스트로 방어(동점/컷/다수결 엣지). 서버 권위 채점.
- **JSON 파싱**: `safeJsonParse` 재사용 + 1회 재시도 + 고정 폴백 텍스트 + 내부알림.
- **구/신 리포트 공존**: `test_version` 태그로 렌더 분기. 구링크 안내.
- **위기 대응**: SCT 키워드 스캔(클라 즉시 + 서버 권위) → 전문기관 안내, LLM 스킵.
- **면책·저작권**: 시작/하단 면책 문구, YSQ 원문 미사용(자체 문항만), 이론용어 코드 내부만 노출.
- **비용**: 무료 flash·유료 pro 유지 → 시작당 비용은 현행과 유사. 일일예산·레이트리밋 재사용.

---

## 7. 착수 지점

Phase 1(`questions.ts` + `scoring.ts` + `crisis-words.ts` + 유닛테스트)부터.
UI/결제/LLM 건드리지 않는 순수 로직이라 위험이 가장 낮고, 이후 전 단계의 토대가 된다.
