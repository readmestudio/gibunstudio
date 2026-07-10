/**
 * 도식 ↔ 내면 아이 매핑 테이블 (핸드오프 §4 표 — 시스템 상수).
 *
 * - 매핑 대상 16도식: S01~S14, S16, S17 (각각 child_id 보유 → 유형 판정 대상)
 * - 보조 지표 2도식: S15(부족한 자기통제), S18(처벌) — is_auxiliary=true, child 없음.
 *   ※ 핸드오프 §3-2 본문의 "(S15 처벌·S18 자기통제 제외)" 표기는 오타이며, 이 §4 표가 정본.
 */

import type { SchemaCode, SchemaMapEntry } from "./types";

export const SCHEMA_MAP: Record<SchemaCode, SchemaMapEntry> = {
  S01: {
    code: "S01",
    schema_name: "정서적 결핍",
    schema_key: "emotional_deprivation",
    area: "단절·거절",
    is_auxiliary: false,
    child_id: "hungry_child",
    child_name: "허기진 아이",
  },
  S02: {
    code: "S02",
    schema_name: "유기·버림받음",
    schema_key: "abandonment",
    area: "단절·거절",
    is_auxiliary: false,
    child_id: "waiting_child",
    child_name: "문 앞에서 기다리는 아이",
  },
  S03: {
    code: "S03",
    schema_name: "불신·학대",
    schema_key: "mistrust_abuse",
    area: "단절·거절",
    is_auxiliary: false,
    child_id: "guarded_child",
    child_name: "등을 벽에 붙인 아이",
  },
  S04: {
    code: "S04",
    schema_name: "사회적 고립",
    schema_key: "social_isolation",
    area: "단절·거절",
    is_auxiliary: false,
    child_id: "outside_child",
    child_name: "창밖의 아이",
  },
  S05: {
    code: "S05",
    schema_name: "결함·수치심",
    schema_key: "defectiveness_shame",
    area: "단절·거절",
    is_auxiliary: false,
    child_id: "hidden_child",
    child_name: "숨어버린 아이",
  },
  S06: {
    code: "S06",
    schema_name: "실패",
    schema_key: "failure",
    area: "손상된 자율성",
    is_auxiliary: false,
    child_id: "fallen_child",
    child_name: "주저앉은 아이",
  },
  S07: {
    code: "S07",
    schema_name: "의존·무능감",
    schema_key: "dependence",
    area: "손상된 자율성",
    is_auxiliary: false,
    child_id: "clinging_child",
    child_name: "손을 놓지 못하는 아이",
  },
  S08: {
    code: "S08",
    schema_name: "위험·질병 취약성",
    schema_key: "vulnerability",
    area: "손상된 자율성",
    is_auxiliary: false,
    child_id: "trembling_child",
    child_name: "떨고 있는 아이",
  },
  S09: {
    code: "S09",
    schema_name: "융합·미발달 자기",
    schema_key: "enmeshment",
    area: "손상된 자율성",
    is_auxiliary: false,
    child_id: "shadow_child",
    child_name: "그림자 아이",
  },
  S10: {
    code: "S10",
    schema_name: "복종",
    schema_key: "subjugation",
    area: "타인 중심성",
    is_auxiliary: false,
    child_id: "bowed_child",
    child_name: "고개 숙인 아이",
  },
  S11: {
    code: "S11",
    schema_name: "자기희생",
    schema_key: "self_sacrifice",
    area: "타인 중심성",
    is_auxiliary: false,
    child_id: "early_grown_child",
    child_name: "너무 일찍 어른이 된 아이",
  },
  S12: {
    code: "S12",
    schema_name: "정서적 억제",
    schema_key: "emotional_inhibition",
    area: "과잉경계·억제",
    is_auxiliary: false,
    child_id: "frozen_child",
    child_name: "얼어붙은 아이",
  },
  S13: {
    code: "S13",
    schema_name: "엄격한 기준·과잉비판",
    schema_key: "unrelenting_standards",
    area: "과잉경계·억제",
    is_auxiliary: false,
    child_id: "whip_child",
    child_name: "채찍 든 아이",
  },
  S14: {
    code: "S14",
    schema_name: "특권의식·과대성",
    schema_key: "entitlement",
    area: "손상된 한계",
    is_auxiliary: false,
    child_id: "crowned_child",
    child_name: "왕관 쓴 아이",
  },
  S15: {
    code: "S15",
    schema_name: "부족한 자기통제",
    schema_key: "insufficient_self_control",
    area: "손상된 한계",
    is_auxiliary: true,
    child_id: null,
    child_name: null,
  },
  S16: {
    code: "S16",
    schema_name: "승인·인정 추구",
    schema_key: "approval_seeking",
    area: "타인 중심성",
    is_auxiliary: false,
    child_id: "stage_child",
    child_name: "무대 위의 아이",
  },
  S17: {
    code: "S17",
    schema_name: "부정성·비관주의",
    schema_key: "negativity_pessimism",
    area: "과잉경계·억제",
    is_auxiliary: false,
    child_id: "worried_child",
    child_name: "걱정을 끌어안은 아이",
  },
  S18: {
    code: "S18",
    schema_name: "처벌",
    schema_key: "punitiveness",
    area: "과잉경계·억제",
    is_auxiliary: true,
    child_id: null,
    child_name: null,
  },
};

/** 보조 지표 도식 코드 (유형 판정에서 제외). */
export const AUXILIARY_CODES: SchemaCode[] = ["S15", "S18"];

/** 유형 판정 대상 16개 도식 코드 (S01~S14, S16, S17). */
export const MAPPED_CODES: SchemaCode[] = (
  Object.keys(SCHEMA_MAP) as SchemaCode[]
).filter((code) => !SCHEMA_MAP[code].is_auxiliary);
