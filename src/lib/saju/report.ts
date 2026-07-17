import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { SAJU_REPORT_FIELDS, type SajuReport } from "./report-types";
import { SAJU_SYSTEM_PROMPT, buildSajuUserMessage } from "./report-prompt";
import type { SajuChart } from "./types";

/**
 * 계산된 명반 → 유료 사주 리포트(영어 10필드) 생성.
 *
 * ⚠️ max_tokens 는 절대 내리지 말 것. gemini-2.5-pro 는 thinking 이 예산을 잠식해
 *    작은 예산에서 빈 문자열을 돌려준다(실측: 2048→0자). build/test 로는 안 잡힌다.
 * ⚠️ 폴백 없음 — 미달이면 재시도, 그래도 실패하면 throw (호출측이 처리).
 */

const MIN_LEN = 80;
const MAX_ATTEMPTS = 2;

function validate(raw: unknown): SajuReport | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out = {} as Record<string, string>;
  for (const key of SAJU_REPORT_FIELDS) {
    const v = o[key];
    if (typeof v !== "string" || v.trim().length < MIN_LEN) return null;
    out[key] = v.trim();
  }
  return out as unknown as SajuReport;
}

export async function generateSajuReport(
  chart: SajuChart,
  concern: string | null,
): Promise<SajuReport> {
  const messages = [
    { role: "system" as const, content: SAJU_SYSTEM_PROMPT },
    { role: "user" as const, content: buildSajuUserMessage(chart, concern) },
  ];

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const text = await chatCompletion(messages, {
        temperature: 0.75,
        // 한 번에 10필드(책 한 권 분량) — thinking 잠식 방지로 넉넉히.
        max_tokens: 16384,
        response_format: { type: "json_object" },
      });
      const parsed = safeJsonParse<Record<string, unknown>>(String(text ?? ""));
      const report = validate(parsed);
      if (report) return report;
      lastErr = new Error("saju report validation failed (missing/short fields)");
    } catch (err) {
      lastErr = err;
    }
    console.error(`[saju/report] 생성 실패 (attempt ${attempt}/${MAX_ATTEMPTS}):`, lastErr);
  }

  throw lastErr instanceof Error ? lastErr : new Error("saju report generation failed");
}
