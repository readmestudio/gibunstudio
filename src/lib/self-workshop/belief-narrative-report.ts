/**
 * Step 8 정리 보기(AllDone)에서 사용하는 "상담사 5단계 narrative 리포트".
 *
 * 입력: mechanism_analysis · core_belief_excavation · new_belief · coping_plan
 * 출력: 신념별 5단계(옛 신념 → 형성 배경 → 발견 reframe → 사용자 증거 → 앞으로의 길) narrative
 *
 * - 캐시: workshop_progress.coping_plan.narrative_report 안에 nested 저장 (DB 마이그레이션 X)
 * - 무효화: source_hash로 stale 감지만, 자동 재생성은 하지 않음 (하이브리드)
 */
import type { BeliefEvidenceEntry } from "./coping-plan";
import type { SctResponses } from "./core-belief-excavation";
import { SCT_CATEGORIES, SCT_QUESTIONS } from "./sct-questions";

/* ─────────────────────────── 타입 ─────────────────────────── */

export interface BeliefNarrative {
  source: "self" | "others" | "world";
  classification_ko: string;
  classification_en: string;

  /** Stage 1 — 옛 신념 그대로 마주하기 */
  stage1_old_belief: {
    headline: string;
    quote: string;
    body: string;
  };

  /** Stage 2 — Validating Origin: 그 신념이 만들어진 이유를 logical하게 */
  stage2_origin: {
    headline: string;
    body: string;
    highlight: string;
  };

  /** Stage 3 — Reframe: 새 신념은 만들어진 게 아니라 발견된 것 */
  stage3_new_belief: {
    headline: string;
    new_belief_quote: string;
    body: string;
  };

  /** Stage 4 — 사용자 과거 경험으로 뒷받침 */
  stage4_evidence_support: {
    headline: string;
    body: string;
    quoted_evidences: string[];
  };

  /** Stage 5 — 앞으로의 길 */
  stage5_path_forward: {
    headline: string;
    body: string;
    closing_line: string;
  };
}

export interface BeliefNarrativeReport {
  beliefs: BeliefNarrative[];
  overall_headline: string;
  overall_intro: string;
  generated_at: string;
  source_hash: string;
}

/* ─────────────────────────── 타입가드 ─────────────────────────── */

export function isBeliefNarrativeReport(v: unknown): v is BeliefNarrativeReport {
  if (!v || typeof v !== "object") return false;
  const r = v as Partial<BeliefNarrativeReport>;
  if (!Array.isArray(r.beliefs) || r.beliefs.length === 0) return false;
  if (!isNonEmptyString(r.overall_headline)) return false;
  if (!isNonEmptyString(r.overall_intro)) return false;
  if (!isNonEmptyString(r.generated_at)) return false;
  if (!isNonEmptyString(r.source_hash)) return false;
  for (const b of r.beliefs) {
    if (!isBeliefNarrative(b)) return false;
  }
  return true;
}

function isBeliefNarrative(v: unknown): v is BeliefNarrative {
  if (!v || typeof v !== "object") return false;
  const b = v as Partial<BeliefNarrative>;
  if (b.source !== "self" && b.source !== "others" && b.source !== "world") return false;
  if (!isNonEmptyString(b.classification_ko)) return false;
  if (!isNonEmptyString(b.classification_en)) return false;

  const s1 = b.stage1_old_belief;
  if (!s1 || !isNonEmptyString(s1.headline) || !isNonEmptyString(s1.quote) || !isNonEmptyString(s1.body)) return false;

  const s2 = b.stage2_origin;
  if (!s2 || !isNonEmptyString(s2.headline) || !isNonEmptyString(s2.body) || !isNonEmptyString(s2.highlight)) return false;

  const s3 = b.stage3_new_belief;
  if (!s3 || !isNonEmptyString(s3.headline) || !isNonEmptyString(s3.new_belief_quote) || !isNonEmptyString(s3.body)) return false;

  const s4 = b.stage4_evidence_support;
  if (!s4 || !isNonEmptyString(s4.headline) || !isNonEmptyString(s4.body)) return false;
  if (!Array.isArray(s4.quoted_evidences)) return false;
  if (!s4.quoted_evidences.every((q) => typeof q === "string")) return false;

  const s5 = b.stage5_path_forward;
  if (!s5 || !isNonEmptyString(s5.headline) || !isNonEmptyString(s5.body) || !isNonEmptyString(s5.closing_line)) return false;

  return true;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/* ─────────────────────────── 무효화용 해시 ─────────────────────────── */

/**
 * 프롬프트 버전. 시스템 프롬프트의 톤·구조가 바뀔 때마다 한 단계 올리면,
 * 기존에 캐시되어 있던 모든 narrative_report가 자동으로 stale 판정 → 다음 진입 시
 * 사용자가 ↻ 다시 만들기 버튼을 눌러 새 톤으로 재생성하게 된다.
 *
 * v1: 초기 5단계 narrative
 * v2: Stage 02를 "보호 메커니즘 설명" → "원점 이야기(언제부터·어떻게 자라났나)"로 톤 전환.
 *     보호 작용 설명은 Stage 03(PROTECTION LOOP)에서만 다루도록 분리.
 * v3: OVERALL 인트로를 "리포트 표지" → "리캡 인트로"로 톤 전환. "이 리포트는…" 류 자기-지시 금지,
 *     overall_headline은 한 신념의 과거·현재·미래를 한 줄에 묶어 돌아보는 톤으로.
 */
export const NARRATIVE_PROMPT_VERSION = "v3";

/**
 * narrative에 영향을 주는 entries 필드 + 프롬프트 버전을 묶어 djb2 해시.
 * 한 글자라도 바뀌거나 버전이 올라가면 다른 해시가 나오므로 stale 감지가 정확하다.
 * `done`/`phase` 같이 narrative에 영향 없는 필드는 무시.
 */
export function computeNarrativeSourceHash(entries: BeliefEvidenceEntry[]): string {
  const projected = entries
    .map((e) => ({
      source: e.source,
      new_belief_text: e.new_belief_text || "",
      old_belief_text: e.old_belief_text || "",
      // answers는 키 정렬해서 직렬화 — 같은 내용이면 같은 해시
      answers: Object.entries(e.answers || {})
        .map(([k, v]) => [k, (v || "").trim()] as [string, string])
        .sort(([a], [b]) => a.localeCompare(b)),
      free_evidence: (e.free_evidence || []).map((s) => (s || "").trim()).filter(Boolean),
      reinforced_strength: e.reinforced_strength ?? null,
    }))
    .sort((a, b) => a.source.localeCompare(b.source));
  // entries 직렬화 앞에 프롬프트 버전을 prefix로 둬서, 사용자 입력이 동일해도
  // 프롬프트 버전이 바뀌면 새로운 해시가 나오게 한다.
  const json = `prompt:${NARRATIVE_PROMPT_VERSION}|${JSON.stringify(projected)}`;
  return djb2(json);
}

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  // 양수 16진 문자열로
  return (h >>> 0).toString(16);
}

/* ─────────────────────────── SCT 발췌 헬퍼 ─────────────────────────── */

interface SctQuotePick {
  code: string;
  category_ko: string;
  prompt: string;
  answer: string;
}

/**
 * sct_responses에서 narrative에 단서가 될 만한 인용을 길이·내용 기준으로 골라낸다.
 * - skipped이거나 answer 4글자 이하면 제외
 * - 길이 ↓ + 카테고리 다양성을 우선
 */
export function pickTopSctQuotes(
  sctResponses: SctResponses | null | undefined,
  max: number
): SctQuotePick[] {
  if (!sctResponses) return [];
  const pool: SctQuotePick[] = [];
  for (const q of SCT_QUESTIONS) {
    const r = sctResponses[q.code];
    if (!r || r.skipped) continue;
    const ans = (r.answer || "").trim();
    if (ans.length < 5) continue;
    pool.push({
      code: q.code,
      category_ko: SCT_CATEGORIES[q.category]?.labelKo ?? q.category,
      prompt: q.prompt,
      answer: ans,
    });
  }
  // 카테고리 다양성 우선: 카테고리 라운드로빈으로 max개 추출
  const byCat = new Map<string, SctQuotePick[]>();
  for (const p of pool) {
    if (!byCat.has(p.category_ko)) byCat.set(p.category_ko, []);
    byCat.get(p.category_ko)!.push(p);
  }
  // 각 카테고리 내부는 답변 길이 ↓ 정렬 (긴 답변일수록 단서가 풍부)
  for (const arr of byCat.values()) {
    arr.sort((a, b) => b.answer.length - a.answer.length);
  }
  const picked: SctQuotePick[] = [];
  let exhausted = false;
  while (picked.length < max && !exhausted) {
    exhausted = true;
    for (const arr of byCat.values()) {
      if (picked.length >= max) break;
      const next = arr.shift();
      if (next) {
        picked.push(next);
        exhausted = false;
      }
    }
  }
  return picked;
}

/**
 * pickTopSctQuotes 결과를 LLM user message에 그대로 붙일 수 있게 한 줄씩 포맷.
 *   `- [B2 · 성취·인정] "내가 멈추거나 쉬게 되면, 죄책감이 든다."`
 */
export function formatSctQuotesForPrompt(picks: SctQuotePick[]): string {
  if (picks.length === 0) return "(SCT 응답 없음)";
  return picks
    .map((p) => `- [${p.code} · ${p.category_ko}] "${p.prompt} → ${p.answer}"`)
    .join("\n");
}
