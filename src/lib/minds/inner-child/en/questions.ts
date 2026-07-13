/**
 * Inner Child — English question bank (display strings only).
 *
 * ⚠️ 채점 무관 · 표시 전용. 채점 엔진(scoring.ts)은 이 파일이 아니라 한국어 questions.ts 의
 * ID/schema_id 를 권위 소스로 쓴다. 이 파일은 영어 테스트 UI 가 "화면에 보일 영어 텍스트"를
 * 같은 ID 로 제공하기 위한 병렬 콘텐츠일 뿐이다. 그래서 여기 모든 항목의 id/area/schema_id/
 * conditional/slot/value 는 한국어 원본과 바이트 단위로 동일해야 한다(텍스트만 영어).
 * 이 불변식이 깨지면 영어 테스트가 엉뚱한 유형을 배정한다.
 *
 * 채점에 쓰는 순수 상수(threshold·priority·TOP_AREAS_COUNT)는 한국어 모듈에서 재수출한다.
 */

import type { AreaId, GuardianType, SlotType } from "../types";
import {
  AREA_PRIORITY,
  ENTITLEMENT_CANDIDATE_THRESHOLD,
  TOP_AREAS_COUNT,
  GUARDIAN_TIEBREAK_ITEM_ID,
} from "../questions";

// 채점용 순수 상수는 한국어 모듈 것을 그대로 쓴다(단일 출처).
export { AREA_PRIORITY, ENTITLEMENT_CANDIDATE_THRESHOLD, TOP_AREAS_COUNT, GUARDIAN_TIEBREAK_ITEM_ID };

/** 6-point scale — only the two endpoints are labeled (no midpoint). */
export const SCALE_MIN = 1;
export const SCALE_MAX = 6;
export const SCALE_LABELS = {
  min: "Not like me at all",
  max: "Completely me",
} as const;

export const TIME_FRAME_NOTICE = "Answer based on who you are these days.";

// ───────────────────────── Part 1. Screening (8, everyone) ─────────────────────────

export interface ScreeningItem {
  id: string;
  area: AreaId;
  slot: SlotType;
  text: string;
}

export const SCREENING_ITEMS: ScreeningItem[] = [
  { id: "S1", area: "disconnection", slot: "affect", text: "Even surrounded by people, I sometimes feel suddenly alone." },
  { id: "S2", area: "disconnection", slot: "behavior", text: "The closer a relationship gets, the more careful — not more relaxed — I become." },
  { id: "S3", area: "impaired_autonomy", slot: "affect", text: "When I have to decide something on my own, a sense of being overwhelmed comes first." },
  { id: "S4", area: "impaired_autonomy", slot: "behavior", text: "I put off starting things, worried I won't be able to handle them." },
  { id: "S5", area: "other_directedness", slot: "affect", text: "I notice what the other person wants before I notice what I want." },
  { id: "S6", area: "other_directedness", slot: "behavior", text: "I go along with others first, then quietly feel hurt about it later." },
  { id: "S7", area: "overvigilance", slot: "affect", text: "Even when things are going well, part of me stays tense." },
  { id: "S8", area: "overvigilance", slot: "behavior", text: "Even on a day off, I can't fully let myself relax." },
];

// ───────────────────────── Part 2. Common (1, everyone) ─────────────────────────

/** C1 entitlement — excluded from area screening, measured by this single common item. */
export const COMMON_ITEM = {
  id: "C1",
  schema_id: "entitlement",
  child_name: "The Child Wearing a Crown",
  conditional: false,
  text: "It stings when I'm treated as just one of the crowd.",
} as const;

// ───────────────────────── Part 3. Drilldown pool (15) ─────────────────────────

export interface DrilldownItem {
  id: string;
  area: AreaId;
  schema_id: string;
  child_name: string;
  conditional: boolean;
  text: string;
}

export const DRILLDOWN_ITEMS: DrilldownItem[] = [
  // Area 1. Disconnection & Rejection (5) — all unconditional
  { id: "D01", area: "disconnection", schema_id: "abandonment", child_name: "The Child Waiting by the Door", conditional: false, text: "The more precious someone is, the more I keep checking, afraid of losing them." },
  { id: "D02", area: "disconnection", schema_id: "mistrust_abuse", child_name: "The Child with Their Back to the Wall", conditional: false, text: "Even with people I'm close to, I keep one layer of myself held back." },
  { id: "D03", area: "disconnection", schema_id: "emotional_deprivation", child_name: "The Hungry Child", conditional: false, text: "I wish people would just know without my saying it, and I feel let down alone when they don't." },
  { id: "D04", area: "disconnection", schema_id: "defectiveness_shame", child_name: "The Child Who Hid Away", conditional: false, text: "I can't fully open up, unsure whether people would still like the real me." },
  { id: "D05", area: "disconnection", schema_id: "social_isolation", child_name: "The Child at the Window", conditional: false, text: "Even while laughing together, I suddenly feel like the only one on the outside." },

  // Area 2. Impaired Autonomy (4) — all unconditional
  { id: "D06", area: "impaired_autonomy", schema_id: "dependence_incompetence", child_name: "The Child Who Won't Let Go of a Hand", conditional: false, text: "Even after I've decided, I only feel at ease once someone says 'that's right.'" },
  { id: "D07", area: "impaired_autonomy", schema_id: "vulnerability_harm", child_name: "The Trembling Child", conditional: false, text: "Even in good moments, part of me braces, afraid something will go wrong." },
  { id: "D08", area: "impaired_autonomy", schema_id: "enmeshment", child_name: "The Shadow Child", conditional: false, text: "When I ask myself 'what do I actually want?', the answer is blurry." },
  { id: "D09", area: "impaired_autonomy", schema_id: "failure", child_name: "The Child Who Sat Down", conditional: false, text: "To avoid disappointment, I lower my hopes and put off starting." },

  // Area 4. Other-Directedness (3) — all conditional
  { id: "D10", area: "other_directedness", schema_id: "subjugation", child_name: "The Child with a Bowed Head", conditional: true, text: "I swallow my own opinion to keep the mood, and the words stay with me after I turn away." },
  { id: "D11", area: "other_directedness", schema_id: "self_sacrifice", child_name: "The Child Who Grew Up Too Soon", conditional: true, text: "After looking after everyone, I feel a lonely ache — 'who looks after me?'" },
  { id: "D12", area: "other_directedness", schema_id: "approval_seeking", child_name: "The Child on Stage", conditional: true, text: "Being noticed lifts me up; getting no reaction leaves me shaken." },

  // Area 5. Overvigilance & Inhibition (3) — only negativity/pessimism unconditional, rest conditional
  { id: "D13", area: "overvigilance", schema_id: "negativity_pessimism", child_name: "The Child Holding Their Worries", conditional: false, text: "When something good happens, I start bracing for what could go wrong." },
  { id: "D14", area: "overvigilance", schema_id: "emotional_inhibition", child_name: "The Frozen Child", conditional: true, text: "Joy or hurt, I tend to hold it inside first." },
  { id: "D15", area: "overvigilance", schema_id: "unrelenting_standards", child_name: "The Child with the Whip", conditional: true, text: "Even after doing well, 'I have to do better next time' is the first thing that comes." },
];

/** area → its drilldown items. Used to present only the top-2 areas. */
export const DRILLDOWN_BY_AREA: Record<AreaId, DrilldownItem[]> = {
  disconnection: DRILLDOWN_ITEMS.filter((d) => d.area === "disconnection"),
  impaired_autonomy: DRILLDOWN_ITEMS.filter((d) => d.area === "impaired_autonomy"),
  other_directedness: DRILLDOWN_ITEMS.filter((d) => d.area === "other_directedness"),
  overvigilance: DRILLDOWN_ITEMS.filter((d) => d.area === "overvigilance"),
};

// ───────────────────────── Part 4. Guardian (3, single-choice) ─────────────────────────

export interface GuardianOption {
  text: string;
  value: GuardianType;
}
export interface GuardianItem {
  id: string;
  prompt: string;
  options: GuardianOption[]; // order randomized at render
}

export const GUARDIAN_ITEMS: GuardianItem[] = [
  {
    id: "G1",
    prompt: "When someone close to me seems disappointed in me, I…",
    options: [
      { value: "surrender", text: "try even harder to accommodate them and make up for it" },
      { value: "avoidance", text: "push the thought aside and throw myself into something else" },
      { value: "overcompensation", text: "argue it out in my head — 'what exactly did I do wrong?'" },
    ],
  },
  {
    id: "G2",
    prompt: "On a day when my heart feels really heavy, I…",
    options: [
      { value: "surrender", text: "sink into the feeling and the whole day drags heavily" },
      { value: "avoidance", text: "eat, watch, or buy something — lose myself in it to forget" },
      { value: "overcompensation", text: "tell myself 'no time for this' and stay even busier" },
    ],
  },
  {
    id: "G3",
    prompt: "With something important ahead of me, I…",
    options: [
      { value: "surrender", text: "hear a louder voice saying 'I was never good at this anyway'" },
      { value: "avoidance", text: "keep finding distractions and putting off preparing" },
      { value: "overcompensation", text: "only feel at ease if I prepare perfectly, even pulling an all-nighter" },
    ],
  },
];

/** Guardian consumer labels. */
export const GUARDIAN_LABELS: Record<GuardianType, string> = {
  surrender: "The Yielding Guardian",
  avoidance: "The Numbing Guardian",
  overcompensation: "The Fighting Guardian",
};

// ───────────────────────── Part 5. SCT sentence completion (5, free text) ─────────────────────────

export interface SctItem {
  id: string;
  slot: keyof import("../types").SctAnswers;
  text: string; // ______ becomes an input field in the UI
}

export const SCT_GUIDE = "Whatever comes to mind — short is fine.";
export const SCT_TRANSITION =
  "Almost there. Now, instead of scores, tell me your story.";

export const SCT_ITEMS: SctItem[] = [
  { id: "SCT1", slot: "childhood_self", text: "As a child, I was a ______ kid." },
  { id: "SCT2", slot: "inner_voice", text: 'The voice inside that drives or stops me says, "______"' },
  { id: "SCT3", slot: "family_rule", text: "In my family, you had to ______." },
  { id: "SCT4", slot: "regression_trigger", text: "When I ______, I suddenly feel like a little kid again." },
  { id: "SCT5", slot: "escape_behavior", text: "When my heart is heavy, I escape into ______." },
];

/** Fixed disclaimer on the intro screen and at the bottom of the report. */
export const DISCLAIMER =
  "This test is content to support self-understanding — not a psychological assessment or diagnostic tool.";

// ───────────────────────── UX: chapters · interstitials ─────────────────────────

/** Three-part chapter labels. The progress bar is absorbed into chapters. */
export const CHAPTER_LABELS: Record<1 | 2 | 3, string> = {
  1: "The Lay of Your Heart",
  2: "A Little Closer",
  3: "Your Story",
};

/**
 * "Signal" line for the top-1 area used in the screening→drilldown interstitial.
 * Blunt, felt-sense wording instead of theory terms. A teaser, not a spoiler.
 */
export const AREA_SIGNAL: Record<AreaId, string> = {
  disconnection: "It seems there's a part of you that feels the distance between yourself and others a little more keenly than most.",
  impaired_autonomy: "It seems there's a part of you that feels the weight of having to stand on your own quite strongly.",
  other_directedness: "It seems there's a tender part of you that tends to others before yourself.",
  overvigilance: "It seems there's a part of you that rarely sets down its guard and is always watching.",
};

/** Neutral (zero-spoiler) alternative, if pilots dislike the signal line above. */
export const AREA_SIGNAL_NEUTRAL =
  "Looking at your answers, your heart leaned gently to one side. The remaining questions will lean that way too.";

/** Common closing line of interstitial ① — a warm turn toward meeting one of the 16 children. */
export const INTERSTITIAL_TO_DRILLDOWN =
  "Now let's go meet the one of the 16 inner children who stands closest to you right now. The next questions were chosen by your own answers, to come a little closer.";

/** Interstitial ② drilldown→guardian. Declares the format switch (scores→scenes). */
export const INTERSTITIAL_TO_GUARDIAN =
  "We've gathered enough of the child's signals. Now let's turn a different direction — to see how you've protected yourself when that child struggles. This time it's scenes, not scores.";

/** Drilldown (Part 2) slider endpoint labels — the 'coming closer' frame. */
export const DRILLDOWN_SCALE_LABELS = {
  min: "This child is far from me",
  max: "Close to me",
} as const;

/** Guardian (Part 2) scene-card intro line. */
export const GUARDIAN_SCENE_INTRO = "Picture a scene like this —";
