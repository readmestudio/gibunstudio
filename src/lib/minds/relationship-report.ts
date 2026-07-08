/**
 * /minds 유료 리포트 — "내 마음 배역표 + 관계도" 분석 엔진 (₩19,900).
 *
 * 무료 parts-map 은 답변에서 *최대 3개 마음*만 뽑는다(비용·가벼움). 유료 리포트는
 * 약속한 **5배역(리더·빌런·난봉꾼·관리자·추방자)을 전부** 다뤄야 하므로, 결제 후
 * 답변을 *다시* 분석해 5개 ROLE_SLOTS 각각에 그 사람의 마음을 배정하고, 배역들이
 * 서로 어떻게 얽히는지(관계도)와 가장 센 갈등쌍(헤드라인)을 만들어낸다.
 *
 * 설계 원칙
 *  - 무료는 flash + 3마음. **유료는 pro + 5슬롯 전부** — 값을 한 만큼 깊이가 나와야 한다.
 *  - 약한 배역을 *지어내지 않는다.* 답변에 근거가 약하면 presence="dormant"(잠잠)로
 *    정직하게 표시한다(환각 방지·신뢰). "5개 말해놓고 억지로 채운" 느낌을 피한다.
 *  - 배역명(리더/빌런/…)은 minds 의 제품 어휘이므로 그대로 노출한다. 단 본문(설명)은
 *    임상 용어를 피하고 따뜻한 상담가 톤(~에요/~인 것 같아요)을 유지한다.
 *
 * 출력은 결제 레코드(minds_relationship_purchases.report_json)에 1회 캐시된다.
 */

import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import {
  PART_TYPE_REFERENCE,
  IFS_TERM_BAN_RULES,
} from "@/lib/self-workshop/ifs-parts-data";
import { ROLE_SLOTS } from "@/lib/minds/characters";
import type { PartsMap } from "@/lib/self-workshop/core-belief-excavation";

/* ─────────────────── 데이터 계약 (결제·DB·화면이 매달리는 스키마) ─────────────────── */

/** 배역 슬롯 key — ROLE_SLOTS 와 1:1. */
export type RoleSlotKey =
  | "leader"
  | "villain"
  | "rake"
  | "manager"
  | "exile";

/** 이 사람 안에서 한 배역이 얼마나 활성인지. dormant=이번 답변엔 거의 안 나타남(정직). */
export type RolePresence = "dominant" | "active" | "dormant";

/** 5배역 각각의 개별 심화 분석. */
export interface RoleSlotAnalysis {
  slot: RoleSlotKey;
  /** ROLE_SLOTS 라벨(리더/빌런/…). UI 가 채워도 되지만 캐시 안정성 위해 같이 저장. */
  label: string;
  presence: RolePresence;
  /** 이 사람 안에서 이 배역을 맡는 마음 한 줄(이름/묘사). */
  innerVoice: string;
  /** 이 배역이 어떻게 작동하는지(2~3문장, 무료보다 깊게). */
  howItWorks: string;
  /** 무엇을 지키려는 보호 논리인지(1~2문장). */
  protects: string;
  /** 답변 원문 인용. dormant 면 빈 문자열 가능. */
  evidenceQuote: string;
}

/** 가장 센 갈등쌍(메인 각본). */
export interface HeadlineConflict {
  a: RoleSlotKey;
  b: RoleSlotKey;
  /** 두 배역이 서로를 부르는 악순환 루프(3~4문장). */
  loop: string;
  /** 그 고리를 느슨하게 푸는 화해 시나리오(2~3문장). */
  mediation: string;
}

/** 헤드라인 외 추가 관계 한 줄. */
export interface RelationshipEdge {
  a: RoleSlotKey;
  b: RoleSlotKey;
  dynamic: string;
}

/** 배역들이 만들어낸 방어기제(보호 전략) 하나. */
export interface DefenseMechanism {
  /** 방어기제 이름(쉬운 한국어, 임상용어 금지). 예: "완벽함이라는 갑옷 입기" */
  name: string;
  /** 이 방어기제가 이 사람에게 어떻게 나타나는지 2~3문장. */
  howYouUseIt: string;
  /** 이 방어기제를 함께 만들어내는 배역 슬롯들(0~2개). */
  fromRoles: RoleSlotKey[];
}

/** 마음의 목소리 하나 — 대사(독백) + 그 대사에 대한 세부 설명. */
export interface InnerVoice {
  /** 자주 되뇌는 1인칭 독백/생각(짧은 한 문장). 예: "이 정도론 부족해, 더 해야 해." */
  voice: string;
  /** 이 대사가 어떤 배역·마음에서 나오는지, 어떤 순간에 떠오르는지 3~4줄 설명. */
  detail: string;
}

/** "이런 생각이 들 때 → 이렇게 해라" 실천 처방 하나. */
export interface ActionItem {
  /** 이런 생각/순간이 들 때 — 이 사람 특유의 트리거. 예: "'이 정도론 부족해'라는 생각이 들 때" */
  trigger: string;
  /** 그때 이렇게 해라 — 구체적이고 바로 실행 가능한 행동(추상적 조언 금지). */
  action: string;
  /** 왜 이게 진짜 도움이 되는지 — 이 사람의 패턴/배역에 근거해 1~2문장(영혼없는 일반론 금지). */
  why: string;
}

/** 유료 리포트 전체 — report_json 으로 캐시되는 최종 산출물. */
export interface RelationshipReport {
  /** 리포트 전체를 한 줄 비유로 요약(상단 표시). 클리셰·일반론 금지, 이 사람만의 그림. */
  metaphor: string;
  roles: RoleSlotAnalysis[]; // 항상 5개(모든 슬롯)
  /** 배역들이 만든 방어기제(2~4개). 5배역 다음에 보여준다. */
  defenseMechanisms: DefenseMechanism[];
  /** 마음의 목소리 TOP 5 — 대사 + 세부 설명(정확히 5개, 강한 순). */
  innerVoices: InnerVoice[];
  headlineConflict: HeadlineConflict;
  relationships: RelationshipEdge[]; // 0~4개
  /** "이런 생각이 들 때 → 이렇게 해라" 실천 처방(정확히 3개). */
  actions: ActionItem[];
  /** 마무리 편지(3~4문장, 따뜻한 가설 톤). */
  closing: string;
  generated_at: string;
}

const SLOT_KEYS: RoleSlotKey[] = [
  "leader",
  "villain",
  "rake",
  "manager",
  "exile",
];

/* ─────────────────── 프롬프트 ─────────────────── */

function buildPartTypeReference(): string {
  return PART_TYPE_REFERENCE.map(
    (t) => `- ${t.role} (${t.user_facing_label}): ${t.signals.join(", ")}`
  ).join("\n");
}

function buildRoleSlotReference(): string {
  return ROLE_SLOTS.map(
    (s) => `- ${s.key} ("${s.label}"): ${s.blurb}`
  ).join("\n");
}

function buildSystemPrompt(): string {
  return `당신은 따뜻한 IFS(내면가족체계) 진행자입니다. 내담자의 답변을 바탕으로, 그 사람 마음속 무대에 오른 **다섯 배역**을 한 명씩 짚어 주고, 그 배역들이 서로 어떻게 얽혀 지금의 기분을 만들어내는지(관계도)를 보여 줍니다. 이것은 무료 진단보다 한 걸음 더 깊이 들어가는 *유료 해설 리포트*이므로, 각 배역을 충분히 풀어서 "사람이 나를 제대로 읽고 있구나" 싶게 써 주세요.

## 다섯 배역 슬롯 (반드시 5개 전부 다룬다)
${buildRoleSlotReference()}

## 마음 역할 추정 단서 (배정 참고용, 내부 분류)
${buildPartTypeReference()}

## 출력 스키마 (JSON 단일 객체로만, 다른 텍스트 금지)
{
  "metaphor": "...",               // 이 리포트 전체를 한 줄 *비유*로 요약. 이 사람의 마음 풍경을 하나의 장면/그림으로(예: "한 무대에서, 쉴 새 없이 채찍을 휘두르는 감독과 한계가 오면 객석으로 도망치는 배우가 같이 사는 극장 같아요"). 상투적 위로 금지.
  "roles": [
    {
      "slot": "leader",            // leader|villain|rake|manager|exile 중 1개
      "presence": "dominant",      // dominant(지금 무대 중심) | active(작동 중) | dormant(이번 답변엔 거의 안 나타남)
      "innerVoice": "...",         // 이 사람 안에서 이 배역을 맡는 마음 한 줄(이름/묘사). 예: "더 해야 한다고 다그치는 마음"
      "howItWorks": "...",         // 이 배역이 어떻게 작동하는지 2~3문장(무료보다 깊게)
      "protects": "...",           // 사실은 무엇을 지키려는 마음인지(보호 논리) 1~2문장
      "evidenceQuote": "..."       // 답변 원문에서 그대로/가깝게 인용. 근거 약하면 빈 문자열("")
    }
    // ↑ 위 형식으로 **정확히 5개** — leader·villain·rake·manager·exile 각각 1개씩
  ],
  "defenseMechanisms": [
    {
      "name": "...",              // 방어기제 이름(쉬운 한국어). 예: "완벽함이라는 갑옷 입기", "충동적으로 도망치기"
      "howYouUseIt": "...",       // 이 방어기제가 당신에게 어떻게 나타나는지 2~3문장("당신은 ~할 때 …하곤 해요")
      "fromRoles": ["leader"]     // 이 방어기제를 만들어내는 배역 슬롯 0~2개
    }
    // ↑ 배역들이 *만들어낸* 방어기제 2~4개. "당신이 자주 쓰는 방어기제는 이거예요" 톤
  ],
  "innerVoices": [
    {
      "voice": "이 정도론 부족해, 더 해야 해.",  // 마음의 목소리 — *위 roles(5배역)의 목소리를 근거로 추정한* 1인칭 독백(짧고 생생하게)
      "detail": "..."                          // 이 대사가 어느 배역/마음에서 나오는지, 어떤 순간에 떠오르고 무엇을 지키려는지 3~4줄 설명
    }
    // ↑ 위 형식으로 **정확히 5개**, 자주 떠오르는 강한 순서대로
  ],
  "headlineConflict": {
    "a": "leader", "b": "rake",    // 답변에서 *가장 세게 부딪치는* 두 배역
    "loop": "...",                 // 둘이 서로를 부르는 악순환 3~4문장(A가 ~하면 B가 ~하고, 그래서 다시 A가…)
    "mediation": "..."             // 그 고리를 느슨하게 푸는 화해 시나리오 2~3문장
  },
  "relationships": [
    { "a": "leader", "b": "exile", "dynamic": "..." }  // 헤드라인 외 눈에 띄는 관계 0~4개
  ],
  "actions": [
    {
      "trigger": "...",            // 이런 생각/순간이 들 때 — 이 사람 특유의 트리거(innerVoices·답변에서). 예: "'이 정도론 부족해'라는 생각이 들 때"
      "action": "...",             // 그때 이렇게 해라 — 바로 할 수 있는 구체적 행동(추상적 조언 금지)
      "why": "..."                 // 왜 진짜 도움이 되는지 — 이 사람의 배역/패턴에 근거 1~2문장
    }
    // ↑ 정확히 3개. "이런 생각이 들 때 → 이렇게 해라" 형식의 실질적 처방
  ],
  "closing": "..."                 // 마무리 편지 3~4문장. 전체 여정을 따뜻하게 매듭
}

## 규칙
1. **roles 는 정확히 5개.** leader·villain·rake·manager·exile 슬롯을 빠짐없이 하나씩. 순서도 이대로.
2. **약한 배역을 지어내지 마라.** 답변에 근거가 또렷하면 dominant/active, 거의 안 보이면 presence="dormant" 로 정직하게. dormant 배역도 howItWorks·protects 는 "이번엔 이 마음이 잠잠한 편이에요. 보통 이 배역은 …" 식으로 짧고 따뜻하게 채우고, evidenceQuote 는 "".
3. **presence 가 dominant 인 배역은 1~2개만.** 무대 중심을 흐리지 않는다.
4. innerVoice·evidenceQuote 는 **답변에 근거**하거나 가까운 paraphrase. 없는 내용 지어내기 금지.
5. headlineConflict 는 답변에서 *실제로 가장 세게 충돌하는* 두 배역. 억지 연결 금지. (예: 다그치는 리더 ↔ 위기에 튀어나오는 난봉꾼)
6. 본문(howItWorks·protects·loop·mediation·closing)은 단답이 아니라 *풀어쓴 문장*으로, 어떤 배역도 나쁜 마음으로 단정하지 말고 "겉으론 이렇게 행동하지만 더 깊은 곳을 지키려는 마음"이라는 비판단적 시선을 유지한다. "~인 것 같아요/~로 보여요"의 가설 톤.
6-1. **protects 문장의 시작을 매번 다르게 쓴다.** "사실은~"으로 5장을 똑같이 시작하지 말 것. 예: "정말로 지키고 싶은 건…", "그 행동 밑에는…", "이 마음이 두려워하는 건…", "겉모습과 달리…", "여기엔 …하려는 바람이 숨어 있어요" 등으로 매번 표현을 바꾼다.
7. 답변 주제에 맞춰 쓴다(관계 고민이면 관계 언어로, 일·성취면 그 언어로). 특정 주제로 미리 몰아가지 말 것.
8. 배역명(리더/빌런/난봉꾼/관리자/추방자)은 그대로 써도 된다(제품 어휘). 그 외 임상 용어는 아래 규칙을 따른다.
9. **defenseMechanisms**: 위 배역들이 *함께 만들어낸* 실제 행동 패턴(방어 전략)을 2~4개. "당신이 자주 쓰는 방어기제는 이거예요"처럼, 임상용어가 아니라 그 사람이 실제로 하는 행동의 언어로 이름 짓고("완벽함으로 무장하기", "괜찮은 척 삼키기", "충동적으로 도망치기" 등), howYouUseIt 은 답변에 근거해 "당신은 ~할 때 …하곤 해요" 톤으로 쓴다. roles 와 그대로 겹치지 말고, 배역들이 *합쳐져* 빚어내는 패턴에 초점.
10. **innerVoices**: 이 사람이 머릿속에서 자주 되뇔 법한 *독백/생각* 을 정확히 5개, 각각 "voice"(대사)와 "detail"(세부 설명)로.
    - **voice**: **답변을 그대로 옮겨 적지 말고**, 위에서 캐스팅한 roles(5배역)가 그 사람 안에서 *실제로 이렇게 속삭일 것 같다*고 추정해서 쓴다 — 즉 (a)각 배역의 innerVoice·howItWorks 와 (b)유저가 보고한 마음, 이 둘을 근거로 *역할별 속마음을 상상해 재구성*한 1인칭 한 문장. 짧고 생생하게. 근거 없는 창작이 아니라, 분석된 배역에서 자연스럽게 흘러나올 법한 독백이어야 한다.
    - **detail**: 그 대사에 대한 **3~4줄 설명**. 이 목소리가 *어느 배역/마음에서 나오는지*, 주로 *어떤 순간에* 떠오르는지, 그리고 겉으론 그렇게 말하지만 *사실은 무엇을 지키려는 마음*인지를 따뜻한 가설 톤(~인 것 같아요/~로 보여요)으로 풀어 쓴다. 대사를 그대로 반복하지 말고 한 걸음 더 들어가 해설한다.
    - 자주·강하게 떠오르는 순서로 정렬하되, 서로 다른 배역의 목소리가 고루 섞이게(리더의 다그침·빌런의 남 탓/자책·난봉꾼의 도피충동·관리자의 괜찮은 척·추방자의 지친 속마음 등).
11. **actions**: 정확히 3개. "이런 생각이 들 때 → 이렇게 해라"의 *실질적 처방*이다. 절대 영혼 없는 일반론("긍정적으로 생각하기", "충분히 쉬기", "자신을 사랑하기")을 쓰지 마라.
    - trigger 는 이 사람이 *실제로 자주 겪는* 구체적 생각·순간(innerVoices·답변에서 끌어온다). 예: "마감을 끝냈는데도 '부족해'라는 생각에 잠 못 들 때"
    - action 은 *지금 당장 몸으로 할 수 있는* 행동이어야 한다. 추상("마음을 다스리세요") 금지, 구체("타이머 10분 맞추고 그 시간 동안만 '못 끝낸 일 목록'을 종이에 적어 책상 밖으로 치워두세요")로.
    - why 는 그 행동이 *이 사람의 어떤 배역·패턴*을 어떻게 누그러뜨리는지 콕 집어 설명한다(예: "리더에게 '통제권을 잃지 않았다'는 안전감을 주면서도, 난봉꾼이 폭발하기 전에 압력을 빼주는 작은 밸브가 돼요"). 일반적 효능이 아니라 *이 사람*에게 왜 듣는지를 말한다.
    - 세 처방은 서로 다른 상황을 겨냥한다(예: 압박 정점 / 자책이 시작될 때 / 관계에서 괜찮은 척이 올라올 때).
12. **상투적 위로·클리셰 절대 금지** (closing·metaphor 포함 전 구간). 다음 같은 표현은 쓰지 마라: "당신은 혼자가 아니에요", "당신은 충분히 소중한 사람", "있는 그대로의 당신도 괜찮아요", "조금씩 나아질 거예요", "토닥토닥", "다 잘 될 거예요", "당신을 응원해요" 등 어디서나 통하는 빈말. 대신 *이 사람의 답변·배역에 근거한 구체적 문장*만 쓴다. closing 도 막연한 위로가 아니라, 이 사람의 마음들이 실제로 어떻게 작동했는지를 짚으며 매듭짓는다.
13. **metaphor**: 리포트 전체를 한 줄 비유로. 이 사람만의 그림이어야 하며(누구에게나 갖다 붙일 수 있는 비유 금지), 배역 구도(특히 헤드라인 갈등)를 한 장면으로 압축한다.

${IFS_TERM_BAN_RULES}`;
}

/* ─────────────────── 정규화 (LLM 출력 → 안정 스키마) ─────────────────── */

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asSlot(v: unknown): RoleSlotKey | null {
  return typeof v === "string" && (SLOT_KEYS as string[]).includes(v)
    ? (v as RoleSlotKey)
    : null;
}

function labelOf(slot: RoleSlotKey): string {
  return ROLE_SLOTS.find((s) => s.key === slot)?.label ?? slot;
}

/**
 * LLM 응답을 안정적인 RelationshipReport 로 정규화한다. 5슬롯이 누락되면 dormant
 * 플레이스홀더로 채워 화면이 항상 5장을 그릴 수 있게 보장한다(readPartsMap 와 같은 철학).
 */
export function readRelationshipReport(
  parsed: Record<string, unknown> | null
): RelationshipReport | null {
  if (!parsed || typeof parsed !== "object") return null;

  const rawRoles = Array.isArray(parsed.roles) ? parsed.roles : [];
  const bySlot = new Map<RoleSlotKey, RoleSlotAnalysis>();
  for (const r of rawRoles) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const slot = asSlot(o.slot);
    if (!slot || bySlot.has(slot)) continue;
    const presence = (["dominant", "active", "dormant"].includes(
      String(o.presence)
    )
      ? o.presence
      : "active") as RolePresence;
    bySlot.set(slot, {
      slot,
      label: labelOf(slot),
      presence,
      innerVoice: str(o.innerVoice),
      howItWorks: str(o.howItWorks),
      protects: str(o.protects),
      evidenceQuote: str(o.evidenceQuote),
    });
  }

  // 5슬롯 보장 — 빠진 배역은 dormant 플레이스홀더.
  const roles: RoleSlotAnalysis[] = SLOT_KEYS.map(
    (slot) =>
      bySlot.get(slot) ?? {
        slot,
        label: labelOf(slot),
        presence: "dormant",
        innerVoice: "",
        howItWorks: "이번 답변에선 이 배역이 잘 드러나지 않았어요.",
        protects: "",
        evidenceQuote: "",
      }
  );

  // headlineConflict — 없거나 깨지면 dominant/active 배역 두 개로 폴백.
  const hcRaw =
    parsed.headlineConflict && typeof parsed.headlineConflict === "object"
      ? (parsed.headlineConflict as Record<string, unknown>)
      : {};
  let hcA = asSlot(hcRaw.a);
  let hcB = asSlot(hcRaw.b);
  if (!hcA || !hcB || hcA === hcB) {
    const strong = roles.filter((r) => r.presence !== "dormant");
    hcA = strong[0]?.slot ?? "leader";
    hcB = strong.find((r) => r.slot !== hcA)?.slot ?? (hcA === "leader" ? "rake" : "leader");
  }
  const headlineConflict: HeadlineConflict = {
    a: hcA,
    b: hcB,
    loop: str(hcRaw.loop),
    mediation: str(hcRaw.mediation),
  };

  const relationships: RelationshipEdge[] = [];
  if (Array.isArray(parsed.relationships)) {
    for (const e of parsed.relationships) {
      if (!e || typeof e !== "object") continue;
      const o = e as Record<string, unknown>;
      const a = asSlot(o.a);
      const b = asSlot(o.b);
      const dynamic = str(o.dynamic);
      if (a && b && a !== b && dynamic) {
        relationships.push({ a, b, dynamic });
      }
    }
  }

  // 방어기제 — name·howYouUseIt 둘 다 있어야 유효. fromRoles 는 유효 슬롯만 남긴다.
  const defenseMechanisms: DefenseMechanism[] = [];
  if (Array.isArray(parsed.defenseMechanisms)) {
    for (const d of parsed.defenseMechanisms) {
      if (!d || typeof d !== "object") continue;
      const o = d as Record<string, unknown>;
      const name = str(o.name);
      const howYouUseIt = str(o.howYouUseIt);
      if (!name || !howYouUseIt) continue;
      const fromRoles = Array.isArray(o.fromRoles)
        ? o.fromRoles
            .map(asSlot)
            .filter((s): s is RoleSlotKey => s !== null)
        : [];
      defenseMechanisms.push({ name, howYouUseIt, fromRoles });
    }
  }

  // 마음의 목소리 TOP 5 — {voice, detail}. 구버전(문자열 배열) 캐시도 관대하게 수용.
  const innerVoices: InnerVoice[] = [];
  if (Array.isArray(parsed.innerVoices)) {
    for (const v of parsed.innerVoices) {
      if (typeof v === "string") {
        const voice = str(v);
        if (voice) innerVoices.push({ voice, detail: "" });
      } else if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        const voice = str(o.voice);
        if (voice) innerVoices.push({ voice, detail: str(o.detail) });
      }
      if (innerVoices.length >= 5) break;
    }
  }

  // 실천 처방 — trigger·action 둘 다 있어야 유효. why 는 비어도 통과(있으면 더 좋음).
  const actions: ActionItem[] = [];
  if (Array.isArray(parsed.actions)) {
    for (const a of parsed.actions) {
      if (!a || typeof a !== "object") continue;
      const o = a as Record<string, unknown>;
      const trigger = str(o.trigger);
      const action = str(o.action);
      if (!trigger || !action) continue;
      actions.push({ trigger, action, why: str(o.why) });
    }
  }

  return {
    metaphor: str(parsed.metaphor),
    roles,
    defenseMechanisms: defenseMechanisms.slice(0, 4),
    innerVoices,
    headlineConflict,
    relationships: relationships.slice(0, 4),
    actions: actions.slice(0, 3),
    closing: str(parsed.closing),
    generated_at: new Date().toISOString(),
  };
}

/* ─────────────────── 생성 ─────────────────── */

export interface RelationshipAnswer {
  id: string;
  question: string;
  answer: string;
}

/**
 * 답변(+선택적으로 무료에서 만든 partsMap)을 받아 5배역 배역표 + 관계도를 생성한다.
 * 실패(타임아웃·JSON 깨짐) 시 null 을 던지므로, 호출 측(결제 후 라우트)이 재시도/환불을
 * 판단한다. 무료 parts-map 과 달리 폴백을 만들지 않는다 — *유료* 산출물이라 품질 미달이면
 * 돈을 받은 채 어설픈 결과를 주느니 재시도하거나 환불하는 편이 옳다.
 */
export async function generateRelationshipReport(
  answers: RelationshipAnswer[],
  partsMap?: PartsMap | null
): Promise<RelationshipReport | null> {
  const userContent = answers
    .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
    .join("\n\n");
  if (!userContent.trim()) return null;

  // 무료 분석이 이미 있으면, 무대 중심(leader)·갈등 단서를 참고로 함께 넘긴다.
  let priorHint = "";
  if (partsMap && partsMap.parts.length > 0) {
    const names = partsMap.parts.map((p) => p.name).filter(Boolean);
    priorHint = `\n\n## 참고: 무료 진단에서 이미 드러난 마음들\n${names
      .map((n) => `- ${n}`)
      .join("\n")}\n(위는 참고일 뿐, 5배역은 답변 전체를 다시 읽고 배정하세요.)`;
  }

  const userMessage = `## 유저가 보고한 답변 (상담 대화)
${userContent}${priorHint}

위 답변을 바탕으로 roles(5개) · headlineConflict · relationships · oneAction · closing 을 JSON으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: userMessage },
    ],
    {
      // 유료 상품 — 품질 우선. 무료(flash)와 달리 pro 사용. 5배역 본문을 모두 풀어
      // 생성하므로 토큰을 넉넉히(한국어 토큰 비효율 대응).
      model: "gemini-2.5-pro",
      temperature: 0.6,
      max_tokens: 16384,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<Record<string, unknown>>(response);
  return readRelationshipReport(parsed);
}
