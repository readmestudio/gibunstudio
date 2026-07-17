/**
 * 영어 full(유료/베타) 리포트 생성기 — ManualReport 콘텐츠를 LLM 으로 뽑는다.
 *
 * 한국어 유료 엔진(paid-report.ts)의 영어판. 다만 산출물이 PaidReportGenerated 가 아니라
 * ManualReport 의 콘텐츠 구간(hook/intro/sections/closing)이다 — 영어 full 뷰가 손원고용
 * ManualReport 를 렌더하기 때문. 섹션 번호(n)·schema_id·child_name·expires_at 은 호출부가 붙인다.
 *
 * 설계(paid-report.ts 미러): 유료 산출물이라 **폴백 없음**. 필드가 비거나 너무 짧으면 throw
 * 하고, 호출부(파이프라인)가 재시도(2회)를 판단한다. gemini-2.5-pro 는 max_tokens 가 작으면
 * thinking 이 예산을 잠식해 빈 문자열을 뱉으므로(실측), 토큰을 넉넉히 준다.
 */

import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { FULL_SYSTEM_PROMPT, buildFullUserMessage } from "./full-report-prompt";
import type { ManualBlock } from "./manual-reports";
import type { TypeCard } from "../report-types";
import type { ScoreResult } from "../types";

/** 생성 콘텐츠 — ManualReport 에서 코드가 채우는 필드(schema_id·child_name·n·expires_at)를 뺀 나머지. */
export interface GeneratedFull {
  hook: string;
  intro: string[];
  sections: { title: string; blocks: ManualBlock[] }[];
  closing: string[];
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(str).filter((s) => s.length > 0);
}

/** LLM 블록 하나를 알려진 ManualBlock 으로 살균. 형태가 깨졌으면 null(호출부가 버린다). */
function sanitizeBlock(raw: unknown): ManualBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  switch (o.kind) {
    case "p": {
      const text = str(o.text);
      return text ? { kind: "p", text } : null;
    }
    case "quote": {
      const text = str(o.text);
      return text ? { kind: "quote", text } : null;
    }
    case "callout": {
      const text = str(o.text);
      if (!text) return null;
      return { kind: "callout", label: str(o.label) || "NOTE", text };
    }
    case "line": {
      const text = str(o.text);
      return text ? { kind: "line", text } : null;
    }
    case "steps": {
      const rawItems = Array.isArray(o.items) ? o.items : [];
      const items = rawItems
        .map((it) => {
          const io = it && typeof it === "object" ? (it as Record<string, unknown>) : {};
          return { title: str(io.title), text: str(io.text) };
        })
        .filter((it) => it.title.length > 0 && it.text.length > 0);
      return items.length > 0 ? { kind: "steps", items } : null;
    }
    default:
      return null;
  }
}

/** 섹션 전체 텍스트 길이(검증용) — 블록 종류에 상관없이 사람이 읽는 글자를 센다. */
function blockTextLength(b: ManualBlock): number {
  switch (b.kind) {
    case "p":
    case "quote":
    case "line":
      return b.text.length;
    case "callout":
      return b.label.length + b.text.length;
    case "steps":
      return b.items.reduce((n, it) => n + it.title.length + it.text.length, 0);
  }
}

/**
 * LLM 응답(unknown)을 GeneratedFull 로 정규화·검증한다. 유료 산출물이라 미달이면 throw
 * (폴백 없음 — 파이프라인이 재시도). gemini 빈 문자열 실패 모드를 여기서 걸러낸다.
 */
export function readGeneratedFull(parsed: unknown): GeneratedFull {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("full report 응답이 객체가 아닙니다.");
  }
  const o = parsed as Record<string, unknown>;

  const hook = str(o.hook);
  if (hook.length < 12) {
    throw new Error(`full report 'hook' 이 비었거나 너무 짧습니다(${hook.length}자).`);
  }

  const intro = strArray(o.intro);
  const introLen = intro.join(" ").length;
  if (intro.length === 0 || introLen < 120) {
    throw new Error(`full report 'intro' 가 부족합니다(${intro.length}문단/${introLen}자).`);
  }

  const rawSections = Array.isArray(o.sections) ? o.sections : [];
  let quoteSeen = false;
  const sections = rawSections
    .map((s) => {
      const so = s && typeof s === "object" ? (s as Record<string, unknown>) : {};
      const title = str(so.title);
      const rawBlocks = Array.isArray(so.blocks) ? so.blocks : [];
      const blocks: ManualBlock[] = [];
      for (const rb of rawBlocks) {
        const b = sanitizeBlock(rb);
        if (!b) continue;
        // 'your words' 인용은 리포트당 하나만 — 초과분은 일반 문단으로 강등.
        if (b.kind === "quote") {
          if (quoteSeen) {
            blocks.push({ kind: "p", text: b.text });
            continue;
          }
          quoteSeen = true;
        }
        blocks.push(b);
      }
      return { title, blocks };
    })
    .filter((s) => s.title.length > 0 && s.blocks.length > 0)
    .filter((s) => s.blocks.reduce((n, b) => n + blockTextLength(b), 0) >= 100);

  if (sections.length < 5) {
    throw new Error(`full report 'sections' 가 부족합니다(${sections.length}개).`);
  }

  const closing = strArray(o.closing);
  const closingLen = closing.join(" ").length;
  if (closing.length === 0 || closingLen < 80) {
    throw new Error(`full report 'closing' 이 부족합니다(${closing.length}문단/${closingLen}자).`);
  }

  return { hook, intro, sections, closing };
}

/**
 * 채점 결과 + 유형카드로 full 리포트 콘텐츠를 생성한다.
 * 실패(타임아웃·JSON 깨짐·필드 미달) 시 throw — 호출부가 재시도/실패 처리를 판단한다.
 */
export async function generateEnFullReport(
  score: ScoreResult,
  primaryCard: TypeCard,
  secondCard: TypeCard | null,
  concern: string,
): Promise<GeneratedFull> {
  const response = await chatCompletion(
    [
      { role: "system", content: FULL_SYSTEM_PROMPT },
      { role: "user", content: buildFullUserMessage(score, primaryCard, secondCard, concern) },
    ],
    {
      // 유료급 산출물 — 품질 우선. pro + 넉넉한 토큰(gemini-2.5-pro thinking 예산 잠식 방어).
      model: "gemini-2.5-pro",
      temperature: 0.65,
      max_tokens: 24576,
      response_format: { type: "json_object" },
    },
  );

  const parsed = safeJsonParse<Record<string, unknown>>(response);
  return readGeneratedFull(parsed);
}
