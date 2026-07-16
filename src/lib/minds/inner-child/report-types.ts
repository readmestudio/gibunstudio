/**
 * 내면 아이 찾기 — 유형카드 스키마 + 리포트 출력 타입.
 *
 * TypeCard: 16장 사전 집필 자산(HANDOFF-v2 7-1). 해당 유형만 프롬프트에 주입한다.
 * 무료/유료 리포트는 채점 결과 JSON + 유형카드 + LLM 생성필드를 합쳐 렌더한다.
 */

import type { AreaId, GuardianType } from "./types";

/** 유형카드(아이 1종). HANDOFF 7-1 yaml 스키마의 TS 판. */
export interface TypeCard {
  schema_id: string; // 채점 코드와 동일 키
  child_name: string;
  area: AreaId | "limits"; // 특권의식은 손상된 한계(limits)
  conditional: boolean;
  one_liner: string;
  core_belief: string;
  voice: string; // 1인칭 대사(내면의 목소리)
  strength: string; // 과발달된 능력(강점 선행)
  traits: string; // 무료 3번 '기본 성향' 3~4문장
  auto_thoughts: string[]; // 무료 4번 + 유료 loop 해석 슬롯
  auto_thought_notes?: string[]; // 무료 4번, auto_thoughts 와 1:1 부가 설명(대사만 나오지 않게)
  gap_hint: string; // 겉/속 간극 힌트(무료 gap 생성 참고)
  triggers: string[]; // 무료 7번 활성화 조건
  trigger_notes?: string[]; // triggers 와 1:1 — 이 상황에서 왜 스트레스를 받는지 설명
  typical_scenes: string[]; // 관계에서의 패턴 — 구체 장면(제목)
  typical_scene_notes?: string[]; // typical_scenes 와 1:1 — 그 장면이 어떻게 흘러가는지 설명
  origin_hypothesis: string; // 유료 1번, 부모 단정 없이 환경 서술
  domains: { 관계: string; 일: string; 자기관리: string }; // 유료 1번 3영역 발현
  core_need: string; // 유료 5번 고정 본문
  reparenting_line: string; // 유료 6번 재양육 한 문장
  coping_cards: string[]; // 유료 6번 대처카드 2개
  metrics?: { name: string; value: number; tone: "hot" | "cool"; desc?: string }[]; // 측정 지표(Signal Index) 바 + 의미 설명
  symbol_action: string; // 무료 잠금 섹션 {유형별 상징 행동}
  key_emotion: string; // 무료 잠금 섹션 {핵심정서}
  surface_reaction: string; // 무료 잠금 {지킴이 표면 반응}(escape 힌트)
  guardian_cost: Record<GuardianType, string>; // 지킴이 유형별 장기 상실
}

/**
 * 무료 리포트 LLM 생성 구간. 한국어/영어 퍼널이 공유하는 타입이라 필드가 모두 옵션이다
 * — 퍼널마다 생성하는 필드가 다르기 때문(아래 참조).
 *
 * 한국어(/inner-child): portrait 만 생성한다. 무료를 '유형 진단 + 훅'까지로 좁히고 나머지
 *   해설을 유료로 옮기면서(파운더 지시), insight·daily_prediction 은 유료 생성으로 이관됐고
 *   gap·relation_pattern 은 폐기됐다(렌더되는 곳이 없었다 — 어드민 뷰만 읽던 고아 필드).
 * 영어(/inner-child/en): 5필드를 모두 생성한다(개편 전 한국어 구조 유지).
 */
export interface FreeReportGenerated {
  /**
   * 개인화 도입부. 무료에서 유일한 생성 문단이자 '이건 내 얘기' 훅.
   * 한국어는 짧은 훅(150~220자), 영어는 긴 도입부(400~550자 상당).
   * 옵션 — 없으면 렌더러가 유형카드로 정적 도입부를 조립한다(LLM 실패·구버전 블롭 방어).
   */
  portrait?: string;
  /** 개인화 통찰(원인+반전). 영어 퍼널 전용 — 한국어는 유료 PaidReportGenerated.insight 로 이관. */
  insight?: string;
  /** 일상 예측 문단. 영어 퍼널 전용 — 한국어는 유료 PaidReportGenerated.daily_prediction 으로 이관. */
  daily_prediction?: string;
  /** 겉과 속. 영어 퍼널 전용(어드민 뷰에서만 열람) — 한국어는 생성하지 않는다. */
  gap?: string;
  /** 관계에서의 패턴. 영어 퍼널 전용(어드민 뷰에서만 열람) — 한국어는 생성하지 않는다. */
  relation_pattern?: string;
}

/** 유료 6번 '지금의 당신이 줄 수 있는 것' — 한 단계(제목 + 본문). */
export interface ReparentingStep {
  title: string; // 예: "그 순간을 알아차리는 신호"
  body: string; // SCT 기반 구체 지시(추상 기법 설명 아님)
}

/**
 * 유료 6번 재양육 실행계획 — 고정 3단계를 대체하는 LLM 생성 구간.
 * 그 사람의 SCT 트리거·도피행동을 인용해 '다음 한 주에 실행할 한 장면'으로 좁힌다.
 */
export interface ReparentingPlan {
  scene: string; // 도입: sct.regression_trigger 원문 인용 — "당신은 「…」고 썼습니다. 다음에 그 순간이 오면—"
  steps: ReparentingStep[]; // 2~3개: 알아차림 신호 / if-then 실행 / 물리적 앵커
}

/** 같은 상처가 반복되는 구조 — 단계별(소제목별) 서술. 각 120~200자. */
export interface LoopStages {
  trigger: string; // 촉발
  interpretation: string; // 해석
  action: string; // 행동
  result: string; // 결과
  reinforcement: string; // 강화
}

/** 일상에서의 발현 — 영역별 풍성 서술("내 이야기" 수준 공감). 각 150~260자. */
export interface DailyDomains {
  relationship: string; // 관계
  work: string; // 일
  self_care: string; // 자기관리
}

/** 유료 리포트 LLM 생성 구간(11필드). HANDOFF 6-4 + 재양육 개인화 + 갈등/해결 + 구조화. */
export interface PaidReportGenerated {
  /**
   * '왜 자꾸 이럴까'(300~420자) — 원인+반전의 아하 모먼트. 무료에 있던 insight 를 유료로
   * 옮긴 것. 무료판과 달리 페이월 티저("아직 남아 있어요")로 닫지 않고, 이어지는 유료
   * 본문으로 넘긴다.
   */
  insight: string;
  /**
   * '아마 당신은 —'(250~380자) — 일상 발현 섹션에 붙는 예측형 개인화. 무료에서 이관.
   * daily_domains(영역별 해설) 뒤에 붙어 구체 장면으로 쐐기를 박는다.
   */
  daily_prediction: string;
  daily_domains: DailyDomains; // 이 아이의 전체 구조 — 일상 발현(영역별 풍성)
  loop_stages: LoopStages; // 같은 상처가 반복되는 구조(단계별 소제목)
  guardian_anatomy: string; // 방어 시스템: 지킴이(450~600자)
  conflict_problems: string; // 이 아이가 만들어내는 갈등과 문제(500~700자)
  second_child_relation: string; // 두 번째 아이의 신호(300~400자)
  core_need_bridge: string; // 정말 원했던 것 도입부(150~200자)
  getting_along: string; // 이 아이와 잘 지내는 법(450~650자)
  reparenting: ReparentingPlan; // 지금의 당신이 줄 수 있는 것(SCT 기반 실행계획)
  closing: string; // 마무리(200~250자)
}

/** minds_leads.parts_map 에 저장하는 무료 리포트 블롭. */
export interface FreeReportBlob {
  test_version: "v2.0";
  score_result: import("./types").ScoreResult;
  free_report: FreeReportGenerated;
  /**
   * 고민 자유서술(텍스트, 스킵 시 없음). 채점 무관 — 결과 '고민 카드'에서 되돌려주고
   * 유료 프롬프트가 반영한다. score_result 를 오염시키지 않으려고 blob 최상위에 둔다.
   */
  concern?: string;
}
