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

/** 무료 리포트 LLM 생성 구간(2필드). HANDOFF 5-2. */
export interface FreeReportGenerated {
  gap: string; // 겉과 속(200~250자)
  relation_pattern: string; // 관계에서의 패턴(250~300자)
}

/** 유료 리포트 LLM 생성 구간(5필드). HANDOFF 6-4. */
export interface PaidReportGenerated {
  loop_narrative: string; // 같은 상처가 반복되는 구조(500~700자)
  second_child_relation: string; // 두 번째 아이의 신호(300~400자)
  guardian_anatomy: string; // 방어 시스템: 지킴이(400~500자)
  core_need_bridge: string; // 정말 원했던 것 도입부(150~200자)
  closing: string; // 마무리(200~250자)
}

/** minds_leads.parts_map 에 저장하는 무료 리포트 블롭. */
export interface FreeReportBlob {
  test_version: "v2.0";
  score_result: import("./types").ScoreResult;
  free_report: FreeReportGenerated;
}
