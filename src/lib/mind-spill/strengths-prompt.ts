/**
 * Mind Spill — Strengths Report 프롬프트.
 * 사용자가 적은 모먼트(제목+경험+좋았던 이유)를 보고, 그 안에서
 *   1) 사용자가 한 행동
 *   2) 드러난 강점
 * 을 한 발 떨어진 상담사 톤으로 짚어준다.
 */

import type { Moment } from "./types";

export const STRENGTHS_SYSTEM_PROMPT = `당신은 강점 기반(strengths-based) 코칭 훈련을 받은 임상 상담사입니다.
사용자가 적은 "좋았던 모먼트"들을 모두 읽고, 그 안에서 사용자가 직접 한 행동과 거기서 드러난 강점을
한 발 떨어진 관찰자 시점에서 짚어주는 역할입니다.

원칙:
- 진단하지 마세요. "보입니다", "관찰됩니다", "드러납니다" 톤.
- 사용자가 자기 입으로 말하지 않은 행동도 경험·이유에서 합리적으로 추론 가능하면 짚어주세요.
  단, 추측은 사용자 원문과 일관되어야 합니다.
- 따뜻하되 정확하게. 모욕적이거나 평가적인 표현 금지.
- 한국어 입니다체.
- 부드러운 카피 가이드: "반박/잘못/틀림" 같은 단어 금지.
- 강점은 너무 추상적이지 않게(예: "성장 마인드셋" 같은 슬로건 금지). "솔직함", "끈기",
  "관계 회복력", "차분함", "분해하는 사고", "먼저 다가가기" 처럼 행동에서 곧장 보이는 단어.

출력은 반드시 아래 JSON 스키마만. 설명/머리말/꼬리말 없이 순수 JSON 만.

스키마:
{
  "narrative": "모든 모먼트를 종합해 한 문단(3~6 문장)으로 작성한 상담사 코멘트.",
  "top_strengths": [
    {
      "name": "핵심 강점 키워드 (예: 보살핌, 끈기, 차분함)",
      "reason": "이 강점을 발견하게 된 이유를 1~2문장으로. 사용자의 어느 모먼트 / 어떤 행동에서 보였는지 짧게 인용/요약."
    }
  ],
  "moments": [
    {
      "id": "사용자가 보낸 모먼트의 id 그대로",
      "actions": ["그때 한 구체적 행동 한 줄"],
      "strengths": ["짧은 강점 단어 1~3개"]
    }
  ]
}

narrative 가이드(중요):
- 모든 모먼트를 종합해 한 문단으로. 줄바꿈 없이 자연스러운 줄글.
- 사용자가 한 행동을 짚을 때는 그 행동을 인용에 가깝게 표현하세요(예: "지인을 집으로 맞이해
  편안한 대화의 장을 만들었습니다").
- 강점은 줄글 안에 자연스럽게 녹이되, 핵심 강점 키워드 2~4개는 강조하기 위해 <em>키워드</em>로
  감싸주세요(예: "<em>관계 맺기</em>"). 강조 키워드는 너무 많지 않게.
- 톤: "이번 워크북에서 ~ 한 행동이 보입니다. 그 안에서 <em>...</em> 같은 강점이 드러납니다." 같은
  관찰형 문장 권장.
- 마지막 문장은 사용자가 자기 안의 자원을 한 번 더 확인할 수 있게 부드럽게 마무리.

규칙:
- actions: 모먼트당 1~3개. 반드시 사용자 원문(경험 또는 좋았던 이유)에서 추론 가능해야 합니다.
- strengths: 모먼트당 1~3개. 한두 단어로 끊는 명사형. 추상 명사 자제.
- top_strengths: 정확히 3개. 모든 모먼트에서 가장 두드러진 강점 3개를 골라주세요.
  중복되지 않도록. reason 은 1~2문장 (모먼트와 행동을 짧게 인용).
- 입력에서 빠진 모먼트는 응답에서도 빼주세요(빈 actions/strengths 만 있는 모먼트는 응답에 포함하지 마세요).
- narrative 는 비어 있지 않아야 합니다.
- 모먼트가 매우 적어 3개 강점을 뽑기 어려운 경우엔 1~2개만 반환해도 됩니다.
`;

export function buildStrengthsUserPrompt(input: { moments: Moment[] }): string {
  const filtered = input.moments.filter(
    (m) =>
      m.title.trim().length > 0 ||
      m.experience.trim().length > 0 ||
      (m.reason ?? "").trim().length > 0
  );

  if (filtered.length === 0) {
    return "분석할 모먼트가 없습니다. 빈 moments 배열만 반환해주세요.";
  }

  const lines = filtered.map((m) => {
    return [
      `[모먼트 ${m.id}]`,
      `제목: ${m.title || "(빈 제목)"}`,
      `좋았던 경험: ${m.experience || "(미입력)"}`,
      `좋았던 이유: ${m.reason || "(미입력)"}`,
    ].join("\n");
  });

  return [
    "사용자가 적은 좋았던 모먼트들입니다. 각 모먼트에서 사용자가 한 행동과 드러난 강점을 JSON 스키마로 짚어주세요.",
    "",
    ...lines.flatMap((l) => [l, ""]),
    "위 모먼트들에 대한 분석을 JSON 으로 출력해주세요.",
  ].join("\n");
}

export type StrengthsAnalysis = {
  perMoment: Map<string, { actions: string[]; strengths: string[] }>;
  narrative: string;
  topStrengths: Array<{ name: string; reason: string }>;
};

/** LLM 응답을 검증해 moment 별 actions/strengths + narrative + top_strengths 반환. */
export function validateStrengthsResponse(
  raw: unknown
): StrengthsAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as {
    moments?: unknown;
    narrative?: unknown;
    top_strengths?: unknown;
  };
  if (!Array.isArray(r.moments)) return null;
  if (typeof r.narrative !== "string" || r.narrative.trim().length === 0) return null;

  const perMoment = new Map<string, { actions: string[]; strengths: string[] }>();
  for (const m of r.moments) {
    if (!m || typeof m !== "object") continue;
    const obj = m as Record<string, unknown>;
    if (typeof obj.id !== "string") continue;
    const actions = Array.isArray(obj.actions)
      ? obj.actions
          .filter((x): x is string => typeof x === "string")
          .map((x) => x.trim())
          .filter((x) => x.length > 0)
      : [];
    const strengths = Array.isArray(obj.strengths)
      ? obj.strengths
          .filter((x): x is string => typeof x === "string")
          .map((x) => x.trim())
          .filter((x) => x.length > 0)
      : [];
    perMoment.set(obj.id, { actions, strengths });
  }

  const topStrengths: Array<{ name: string; reason: string }> = Array.isArray(
    r.top_strengths
  )
    ? r.top_strengths
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .map((x) => ({
          name: typeof x.name === "string" ? x.name.trim() : "",
          reason: typeof x.reason === "string" ? x.reason.trim() : "",
        }))
        .filter((x) => x.name.length > 0 && x.reason.length > 0)
        .slice(0, 3)
    : [];

  return {
    perMoment,
    narrative: r.narrative.trim(),
    topStrengths,
  };
}
