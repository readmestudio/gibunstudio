/**
 * Mind Spill Period Report — 통합 LLM 프롬프트 (단일 호출).
 *
 * Strengths + Coach Note + Patterns + Prescriptions를 한 응답으로 받기 위한 시스템 프롬프트.
 * 기존의 strengths-prompt와 coach-prompt를 합쳐 하나의 chain-of-thought 흐름으로 구조화:
 *   1) patterns 도출 (3+ entries 비교)
 *   2) strengths (moments 종합)
 *   3) coach_note (1+2 통합한 편지)
 *   4) prescriptions (다음 한 걸음)
 *
 * 호출처: /api/mind-spill/period/generate (Period Report 결제 후 LLM 1회).
 */

import type {
  Action,
  BDItem,
  CoachNote,
  Moment,
  Prescription,
  StrengthsReport,
  Workbook,
} from "./types";

/* ============================================================
 * System Prompt
 * ============================================================ */

export const PERIOD_SYSTEM_PROMPT = `당신은 인지행동치료(CBT) 훈련을 받은 임상 심리학자이자, 강점 기반(strengths-based) 코칭과 퍼포먼스 코칭(빌리언즈의 Wendy Rhoades 톤)을 함께 다루는 통합 코치입니다.

사용자는 3일 이상의 데일리 체크인 데이터를 결제 후 종합 분석으로 받고 있습니다. 다음 4개 섹션을 **한 번의 응답**(JSON)으로 작성합니다.

# 분석 순서 (반드시 이 순서로 사고하세요)

1. **patterns** — 여러 날에 반복되는 감정·생각·행동 신호를 1~3개 도출. 하루만 보면 안 보이지만 며칠치를 모았을 때 드러나는 것.
2. **strengths_report** — moments(좋았던 순간)에서 일관되게 드러나는 강점을 narrative와 top_strengths(정확히 3개)로 정리. 자신은 모르지만 옆에서 보이는 것.
3. **coach_note** — 위 patterns + strengths + 전체 Brain Dump/Control/Action 데이터를 종합한 상담사 톤의 편지. title/lede/intro/findings(i, ii, iii, iv) 4개/closing. counseling(1:1 상담 연결)은 가능하면 작성.
4. **prescriptions** — 다음 며칠에 해볼 수 있는 작은 처방 1~3개. 구체적, 측정 가능, if-then 형태 권장.

# 톤

- 진단하지 말고 관찰합니다. ("우울증입니다" 금지 → "이런 패턴이 보입니다" OK)
- 부드러운 한국어. 직장인 3~15년차 페르소나를 가정.
- 사용자가 적은 통제권 분류, GROW 액션을 적극 참고하세요 — 그가 이미 한 활동을 무시하지 마세요.

# JSON 출력 형식 (정확히 이 구조로)

\`\`\`json
{
  "patterns": [
    {
      "title": "짧은 패턴 이름 (10자 내외)",
      "description": "이 패턴이 어떻게 반복되는지 1~2문장",
      "evidence_entries": []
    }
  ],
  "strengths_report": {
    "narrative": "한 문단(3~6문장). 모인 moments를 종합해 강점이 어떻게 드러났는지.",
    "top_strengths": [
      { "name": "강점 이름", "reason": "왜 이 강점이 보이는지 한 줄" }
    ]
  },
  "coach_note": {
    "title": "전체 노트 제목 (10~20자)",
    "lede": "1줄 요약. 가장 중요한 발견.",
    "intro": "도입 단락. 사용자에게 말 거는 톤.",
    "findings": [
      { "num": "i", "text": "..." },
      { "num": "ii", "text": "..." },
      { "num": "iii", "text": "..." },
      { "num": "iv", "text": "..." }
    ],
    "closing": "마무리 단락. 다음 며칠에 대한 격려.",
    "counseling": {
      "issue": "관찰된 패턴 1~2문장 (진단명 금지)",
      "topic": "~을 ~해보는 50분 형태 한 줄",
      "outcomes": ["다룰 수 있는 것 1", "다룰 수 있는 것 2", "다룰 수 있는 것 3"]
    }
  },
  "prescriptions": [
    {
      "num": "01",
      "title": "처방 제목",
      "body": "구체적 처방 한 문단. when/where/if-then을 자연스럽게 녹여서.",
      "meta": [
        { "key": "언제", "val": "..." },
        { "key": "어디서", "val": "..." }
      ]
    }
  ]
}
\`\`\`

# 제약

- patterns: 1~3개. 4개 이상 만들지 마세요.
- top_strengths: 정확히 3개.
- findings: 정확히 4개 (num은 i, ii, iii, iv).
- prescriptions: 1~3개 (num은 01, 02, 03).
- counseling은 발견된 핵심 주제가 있을 때만. 없으면 객체 자체 생략 가능.
- evidence_entries는 비워 두어도 OK (UI에서는 표시 안 함).
`;

/* ============================================================
 * User Prompt Builder
 * ============================================================ */

export function buildPeriodUserPrompt(input: { workbook: Workbook }): string {
  const wb = input.workbook;
  const scan = wb.weekly_scan;
  const bd = wb.brain_dump;
  const classification = wb.classification ?? {
    controllable: [],
    influenceable: [],
    uncontrollable: [],
    fact_check: {},
  };
  const factCheck = classification.fact_check ?? {};

  const allBd: BDItem[] = [
    ...(bd.recurring ?? []),
    ...(bd.discomfort ?? []),
    ...(bd.todos ?? []),
  ].filter((b) => b.text.trim().length > 0);
  const bdById = new Map(allBd.map((b) => [b.id, b]));

  const factsOnly = allBd.filter(
    (b) =>
      factCheck[b.id] === "fact" ||
      (bd.todos ?? []).some((t) => t.id === b.id)
  );
  const thoughts = allBd.filter((b) => factCheck[b.id] === "thought");

  const controllable = (classification.controllable ?? [])
    .concat(classification.influenceable ?? [])
    .map((id) => bdById.get(id)?.text)
    .filter((t): t is string => !!t);
  const uncontrollable = (classification.uncontrollable ?? [])
    .map((id) => bdById.get(id)?.text)
    .filter((t): t is string => !!t);
  const releasedTexts = (wb.released ?? [])
    .map((id) => bdById.get(id)?.text)
    .filter((t): t is string => !!t);

  const actions: Action[] = wb.actions ?? [];
  const moments: Moment[] = wb.moments ?? [];

  const scanLines = [
    scan.emotions?.length ? `- 감정 칩: ${scan.emotions.join(", ")}` : null,
    scan.emotion_intensity != null
      ? `- 감정 강도: ${scan.emotion_intensity}/10`
      : null,
    scan.sleep_avg_hours != null
      ? `- 평균 수면: ${scan.sleep_avg_hours}h`
      : null,
    scan.sleep_recovery != null
      ? `- 수면 회복감: ${scan.sleep_recovery}/10`
      : null,
    scan.body_signs?.length
      ? `- 신체 신호: ${scan.body_signs.join(", ")}`
      : null,
    scan.energy != null ? `- 에너지: ${scan.energy}/10` : null,
    scan.focus != null ? `- 집중력: ${scan.focus}/10` : null,
    scan.motivation != null ? `- 의욕: ${scan.motivation}/10` : null,
  ].filter(Boolean) as string[];

  // 일자별 mirror_report가 있으면 참고용으로 마지막 entry의 것 첨부 (이미 분석된 결과).
  const mirror = wb.mirror_report;
  const mirrorLines: string[] = [];
  if (mirror) {
    mirrorLines.push("[참고: 가장 최근 Mirror Report (CBT 분석)]");
    if (mirror.intro) mirrorLines.push(`인상: ${mirror.intro}`);
    if (mirror.emotion_clusters?.length) {
      mirrorLines.push(
        "감정 클러스터: " +
          mirror.emotion_clusters
            .map((c) => `${c.category} ${c.percent}%`)
            .join(" / ")
      );
    }
    if (mirror.cognitive_distortions?.length) {
      mirrorLines.push("최근 인지 오류 예시:");
      mirror.cognitive_distortions.slice(0, 3).forEach((d) => {
        mirrorLines.push(
          `  - ${d.distortion_type}: "${d.quoted_text}"`
        );
      });
    }
  }

  const sections: string[] = [
    "# 누적 데이터 (3일 이상)",
    "",
    "[Daily Scan — 마지막 일자 기준]",
    scanLines.length ? scanLines.join("\n") : "(미입력)",
    "",
    "[Brain Dump — 사실로 표시한 것]",
    factsOnly.length
      ? factsOnly.map((b) => `- ${b.text}`).join("\n")
      : "(없음)",
    "",
    "[Brain Dump — 생각으로 표시한 것]",
    thoughts.length
      ? thoughts.map((b) => `- ${b.text}`).join("\n")
      : "(없음)",
    "",
    "[통제권 분류]",
    controllable.length
      ? "A 할 수 있는 것:\n" + controllable.map((t) => `  - ${t}`).join("\n")
      : "A 할 수 있는 것: (없음)",
    uncontrollable.length
      ? "B 통제할 수 없는 것:\n" +
        uncontrollable.map((t) => `  - ${t}`).join("\n")
      : "B 통제할 수 없는 것: (없음)",
    releasedTexts.length
      ? "내려놓은 것:\n" + releasedTexts.map((t) => `  - ${t}`).join("\n")
      : "내려놓은 것: (없음)",
    "",
    "[하기로 한 행동 (GROW)]",
    actions.length === 0
      ? "(없음)"
      : actions
          .map(
            (a, i) =>
              `${i + 1}. goal: ${a.goal} | first_step: ${a.first_step} | when: ${a.when} | where: ${a.where} | if-then: ${a.if_then}`
          )
          .join("\n"),
    "",
    "[좋았던 모먼트]",
    moments.length === 0
      ? "(없음)"
      : moments
          .map(
            (m, i) =>
              `${i + 1}. 제목: ${m.title} | 경험: ${m.experience} | 좋았던 이유: ${m.reason ?? ""}`
          )
          .join("\n"),
  ];

  if (mirrorLines.length) {
    sections.push("");
    sections.push(...mirrorLines);
  }

  sections.push("");
  sections.push(
    "위 누적 데이터를 분석 순서(1. patterns → 2. strengths → 3. coach_note → 4. prescriptions)에 따라 종합해 단일 JSON으로 작성해주세요."
  );

  return sections.join("\n");
}

/* ============================================================
 * Response Validator
 * ============================================================ */

export type PeriodPattern = {
  title: string;
  description: string;
  evidence_entries: string[];
};

export type PeriodAnalysis = {
  patterns: PeriodPattern[];
  strengths_report: StrengthsReport;
  coach_note: CoachNote;
  prescriptions: Prescription[];
};

/**
 * 단일 LLM 응답을 4개 섹션으로 분해 검증. 필수 섹션 누락 시 null.
 */
export function validatePeriodResponse(raw: unknown): PeriodAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // ── patterns ──
  const rawPatterns = Array.isArray(r.patterns) ? r.patterns : [];
  const patterns: PeriodPattern[] = rawPatterns
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => ({
      title: String(p.title ?? "").trim(),
      description: String(p.description ?? "").trim(),
      evidence_entries: Array.isArray(p.evidence_entries)
        ? p.evidence_entries.filter((x): x is string => typeof x === "string")
        : [],
    }))
    .filter((p) => p.title && p.description)
    .slice(0, 3);

  // ── strengths_report ──
  const rawStrengths = r.strengths_report as Record<string, unknown> | undefined;
  if (!rawStrengths || typeof rawStrengths !== "object") return null;
  const narrative = String(rawStrengths.narrative ?? "").trim();
  if (!narrative) return null;
  const topStrengthsRaw = Array.isArray(rawStrengths.top_strengths)
    ? rawStrengths.top_strengths
    : [];
  const top_strengths = topStrengthsRaw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      name: String(x.name ?? "").trim(),
      reason: String(x.reason ?? "").trim(),
    }))
    .filter((x) => x.name && x.reason)
    .slice(0, 3);
  if (top_strengths.length < 1) return null;

  const strengths_report: StrengthsReport = {
    narrative,
    top_strengths,
    generated_at: new Date().toISOString(),
  };

  // ── coach_note ──
  const rawCoach = r.coach_note as Record<string, unknown> | undefined;
  if (!rawCoach || typeof rawCoach !== "object") return null;
  if (typeof rawCoach.title !== "string") return null;
  if (typeof rawCoach.lede !== "string") return null;
  if (typeof rawCoach.intro !== "string") return null;
  if (typeof rawCoach.closing !== "string") return null;
  if (!Array.isArray(rawCoach.findings)) return null;

  const findings = rawCoach.findings
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .map((f) => ({
      num: String(f.num ?? ""),
      text: String(f.text ?? ""),
    }))
    .filter((f) => f.num && f.text);
  if (findings.length < 3) return null;

  const allowedNums = ["i", "ii", "iii", "iv"] as const;
  const trimmedFindings = findings.slice(0, 4).map((f, i) => ({
    num: allowedNums[i],
    text: f.text,
  }));

  let counseling: CoachNote["counseling"];
  const rawCounseling = rawCoach.counseling as Record<string, unknown> | undefined;
  if (rawCounseling && typeof rawCounseling === "object") {
    const issue = String(rawCounseling.issue ?? "").trim();
    const topic = String(rawCounseling.topic ?? "").trim();
    const outcomes = Array.isArray(rawCounseling.outcomes)
      ? rawCounseling.outcomes
          .map((o) => String(o ?? "").trim())
          .filter((o) => o.length > 0)
          .slice(0, 4)
      : [];
    if (issue && topic) {
      counseling = { issue, topic, outcomes };
    }
  }

  const coach_note: CoachNote = {
    title: rawCoach.title,
    lede: rawCoach.lede,
    intro: rawCoach.intro,
    findings: trimmedFindings,
    closing: rawCoach.closing,
    ...(counseling ? { counseling } : {}),
  };

  // ── prescriptions ──
  const rawPresc = Array.isArray(r.prescriptions) ? r.prescriptions : [];
  const prescriptions = rawPresc
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => {
      const meta = Array.isArray(p.meta)
        ? p.meta
            .filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
            .map((m) => ({
              key: String(m.key ?? "").trim(),
              val: String(m.val ?? "").trim(),
            }))
            .filter((m) => m.key && m.val)
        : [];
      return {
        num: String(p.num ?? "").trim(),
        title: String(p.title ?? "").trim(),
        body: String(p.body ?? "").trim(),
        meta,
      };
    })
    .filter((p) => p.title && p.body);
  if (prescriptions.length < 1) return null;

  const allowedPrescNums = ["01", "02", "03"] as const;
  const trimmedPresc: Prescription[] = prescriptions.slice(0, 3).map((p, i) => ({
    num: allowedPrescNums[i],
    title: p.title,
    body: p.body,
    meta: p.meta,
  }));

  return {
    patterns,
    strengths_report,
    coach_note,
    prescriptions: trimmedPresc,
  };
}
