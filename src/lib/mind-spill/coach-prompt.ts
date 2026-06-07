/**
 * Mind Spill — Coach's Report 프롬프트.
 * 사용자가 작성한 모든 데이터(Weekly Scan + Brain Dump + Mirror Report +
 * 통제권 분류 + Actions + 좋았던 모먼트 + Strengths Report)를 입력으로 받아,
 * 빌리언즈의 퍼포먼스 코치 톤으로 분석 노트 4개와 코치가 제안하는 액션 아이템 3개,
 * 그리고 심리 상담으로 이어지는 연결 제안을 작성한다.
 */

import type {
  Action,
  BDItem,
  CoachNote,
  Moment,
  Prescription,
  Workbook,
} from "./types";

export const COACH_SYSTEM_PROMPT = `당신은 빌리언즈(Billions)의 Wendy Rhoades 같은 퍼포먼스 코치입니다.
사용자가 한 회의 워크북에 적은 모든 데이터(자기 관찰 수치·머릿속 생각·통제권 분류·하기로 한 행동·
좋았던 모먼트와 강점)를 종합해, 한 페이지의 코치 리포트를 작성합니다.

스타일 원칙:
- 위로하지 않습니다. "수고하셨어요", "잘하고 있어요" 같은 위로 멘트 금지.
- 데이터로 시작하고 리프레임으로 마칩니다.
- 사용자가 자기 묘사하는 방식과 실제 행동의 격차를 짚어냅니다.
- 사용자가 말하지 않은 것 — 선택하지 않은 영역, 회피한 영역 — 도 짚어냅니다.
- 약점을 정보로 리프레임합니다 ("정보입니다").
- 한 단락당 마지막 문장은 강력한 reframe.
- 어른 대 어른으로 대화합니다.
- 한국어 입니다체.
- 부드러운 카피 가이드: "반박/잘못/틀림" 같은 공격적·판단적 단어는 피하고,
  "다시 보기 / 살펴보기 / 검증 / 업데이트 / 가설" 같은 표현 우선.
  단, Wendy 톤의 직접성은 유지(돌려 말하지 않음).
- "처방"이라는 단어는 쓰지 마세요. 명령이 아니라 코치가 제안하는 "액션 아이템"입니다.

출력은 반드시 아래 JSON 스키마만. 설명/머리말/꼬리말 없이 순수 JSON.

스키마:
{
  "coach_note": {
    "title": "리포트 제목 1줄 — 핵심 패턴을 짚는 헤드라인. <em>키워드</em> 로 강조 가능.",
    "lede": "한 줄 부제 — 사용자 자기 묘사와 실제 행동의 격차를 시사.",
    "intro": "도입 단락(2~4 문장) — 데이터의 전반 인상. 사용자 원문 1~2회 인용.",
    "findings": [
      { "num": "i",   "text": "분석 1 (3~5 문장). 패턴/관찰. <em>...</em> 강조 키워드. 사용자 원문 인용 환영." },
      { "num": "ii",  "text": "분석 2" },
      { "num": "iii", "text": "분석 3" },
      { "num": "iv",  "text": "분석 4" }
    ],
    "closing": "마무리 단락(2~3 문장) — 사용자가 가진 자원을 한 번 더 확인하게 하는 리프레임.",
    "counseling": {
      "issue": "워크북 데이터에서 관찰된, 이 사람이 지금 겪고 있는 핵심 심리적 과제를 1~2 문장으로 짚어주세요. 막연한 위로 말고 구체적인 패턴으로. <em>...</em> 강조 가능.",
      "topic": "그 과제를 50분 심리 상담의 주제로 만든 한 줄. 예: \"성과에 묶인 자기 가치감을 분리해보는 50분\".",
      "outcomes": [
        "이 상담을 통해 해결하거나 다룰 수 있는 것 1 (짧은 명사구/한 줄).",
        "해결할 수 있는 것 2.",
        "해결할 수 있는 것 3."
      ]
    }
  },
  "prescriptions": [
    {
      "num": "01",
      "title": "액션 아이템 1 제목 — 행동 가능한 짧은 명사구.",
      "body": "본문 2~4 문장. 왜 이 액션 아이템인지, 어떻게 시작하는지.",
      "meta": [
        { "key": "why",  "val": "이 액션 아이템의 근원 이유 한 줄." },
        { "key": "when", "val": "구체 타이밍 (예: 다음 회기 시작 30분 전)." },
        { "key": "if",   "val": "막혔을 때 더 작은 대안." }
      ]
    },
    {
      "num": "02",
      "title": "액션 아이템 2 제목",
      "body": "...",
      "meta": [ { "key": "why", "val": "..." }, { "key": "how", "val": "..." } ]
    },
    {
      "num": "03",
      "title": "액션 아이템 3 제목",
      "body": "...",
      "meta": [ { "key": "why", "val": "..." }, { "key": "use", "val": "다음 회 워크북에 어떻게 쓰일지." } ]
    }
  ]
}

규칙:
- findings: 정확히 4개. num 은 "i","ii","iii","iv".
- prescriptions(코치 액션 아이템): 정확히 3개. num 은 "01","02","03".
- 각 findings.text 마지막 문장은 강력한 reframe 한 줄. (예: "약점이 아니라 <em>정보입니다</em>.")
- coach_note 와 prescriptions 의 텍스트 안에서 핵심 키워드는 <em>...</em> 으로 감싸 강조 가능.
  단, em 너무 많지 않게 (단락당 1~3개 정도).
- prescriptions[i].meta 는 2~3개 항목. key 후보: why / when / where / how / if / use / deeper.
  적어도 첫 액션 아이템엔 why 가 들어가도록.
- 사용자가 그 행동을 "이미 한" 거라면 액션 아이템으로 쓰지 마세요 (다른 행동을 제안).
- coach_note.counseling 은 반드시 작성합니다. 워크북에서 가장 반복적으로 드러난
  심리 주제 하나를 골라, 50분 1:1 심리 상담의 주제로 자연스럽게 연결하세요.
  issue 는 진단명을 붙이지 말고(예: "우울증입니다" 금지) 관찰된 패턴으로 서술합니다.
  topic 은 "~을 ~해보는 50분" 형태의 행동지향 한 줄로.
  outcomes 는 2~4개. 이 상담으로 실제로 해결하거나 다룰 수 있는 것들을 짧게.
`;

export function buildCoachUserPrompt(input: { workbook: Workbook }): string {
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
  const factsOnly = allBd.filter((b) => factCheck[b.id] === "fact" || (bd.todos ?? []).some((t) => t.id === b.id));
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
    scan.emotion_intensity != null ? `- 감정 강도: ${scan.emotion_intensity}/10` : null,
    scan.sleep_avg_hours != null ? `- 평균 수면: ${scan.sleep_avg_hours}h` : null,
    scan.sleep_latency_min != null ? `- 잠들기까지: ${scan.sleep_latency_min}분` : null,
    scan.sleep_recovery != null ? `- 수면 회복감: ${scan.sleep_recovery}/10` : null,
    scan.body_signs?.length ? `- 신체 신호: ${scan.body_signs.join(", ")}` : null,
    scan.energy != null ? `- 에너지: ${scan.energy}/10` : null,
    scan.focus != null ? `- 집중력: ${scan.focus}/10` : null,
    scan.motivation != null ? `- 의욕: ${scan.motivation}/10` : null,
  ].filter(Boolean) as string[];

  const mirror = wb.mirror_report;
  const mirrorLines: string[] = [];
  if (mirror) {
    mirrorLines.push("[Mirror Report (CBT 분석)]");
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
      mirrorLines.push("감지된 인지 오류:");
      mirror.cognitive_distortions.forEach((d) => {
        mirrorLines.push(
          `  - ${d.distortion_type}: "${d.quoted_text}" — ${d.brief_explanation}`
        );
        if (d.reframe) mirrorLines.push(`    reframe: ${d.reframe}`);
      });
    }
    if (mirror.body_thought_links?.length) {
      mirrorLines.push("몸-생각 연결:");
      mirror.body_thought_links.forEach((l) => {
        mirrorLines.push(`  - ${l.body} ↔ ${l.linked_thought}`);
      });
    }
  }

  const strengthsReport = wb.strengths_report;
  const strengthsLines: string[] = [];
  if (strengthsReport?.narrative) {
    strengthsLines.push("[Strengths 코멘트] " + strengthsReport.narrative);
  }
  if (strengthsReport?.top_strengths?.length) {
    strengthsLines.push("top 강점:");
    strengthsReport.top_strengths.forEach((s) => {
      strengthsLines.push(`  - ${s.name}: ${s.reason}`);
    });
  }

  const sections: string[] = [
    "[Weekly Scan]",
    scanLines.length ? scanLines.join("\n") : "(미입력)",
    "",
    "[Brain Dump]",
    factsOnly.length
      ? "사실로 표시한 것: \n" + factsOnly.map((b) => `  - ${b.text}`).join("\n")
      : "사실로 표시한 것: (없음)",
    thoughts.length
      ? "생각으로 표시한 것: \n" + thoughts.map((b) => `  - ${b.text}`).join("\n")
      : "생각으로 표시한 것: (없음)",
    "",
    "[통제권 분류]",
    controllable.length
      ? "A 할 수 있는 것: \n" + controllable.map((t) => `  - ${t}`).join("\n")
      : "A 할 수 있는 것: (없음)",
    uncontrollable.length
      ? "B 통제할 수 없는 것: \n" + uncontrollable.map((t) => `  - ${t}`).join("\n")
      : "B 통제할 수 없는 것: (없음)",
    releasedTexts.length
      ? "내려놓은 것: \n" + releasedTexts.map((t) => `  - ${t}`).join("\n")
      : "내려놓은 것: (없음)",
    "",
    "[하기로 한 행동]",
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
  if (strengthsLines.length) {
    sections.push("");
    sections.push(...strengthsLines);
  }

  sections.push("");
  sections.push(
    "위 데이터를 종합해 Coach Note(findings 4개) + Prescriptions(3개)를 JSON 으로 작성해주세요."
  );

  return sections.join("\n");
}

export type CoachAnalysis = {
  coach_note: CoachNote;
  prescriptions: Prescription[];
};

export function validateCoachResponse(raw: unknown): CoachAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { coach_note?: unknown; prescriptions?: unknown };
  const note = r.coach_note as Record<string, unknown> | undefined;
  if (!note || typeof note !== "object") return null;
  if (typeof note.title !== "string") return null;
  if (typeof note.lede !== "string") return null;
  if (typeof note.intro !== "string") return null;
  if (typeof note.closing !== "string") return null;
  if (!Array.isArray(note.findings)) return null;

  const findings = note.findings
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .map((f) => ({
      num: String(f.num ?? ""),
      text: String(f.text ?? ""),
    }))
    .filter((f) => f.num && f.text);
  if (findings.length < 3) return null;

  // 정확히 4개 finding 보장. 부족하면 더 채우지 않고 그대로 사용(룰러는 3개 이상 허용).
  // 4개 초과면 자르기.
  const allowedNums = ["i", "ii", "iii", "iv"] as const;
  const trimmedFindings = findings.slice(0, 4).map((f, i) => ({
    num: allowedNums[i],
    text: f.text,
  }));

  const presc = Array.isArray(r.prescriptions) ? r.prescriptions : [];
  const prescriptions = presc
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
  if (prescriptions.length < 2) return null;

  const allowedPrescNums = ["01", "02", "03"] as const;
  const trimmedPresc: Prescription[] = prescriptions.slice(0, 3).map((p, i) => ({
    num: allowedPrescNums[i],
    title: p.title,
    body: p.body,
    meta: p.meta,
  }));

  // 심리 상담 연결 — 옵셔널. issue/topic + outcomes 1개 이상일 때만 포함.
  let counseling: CoachNote["counseling"];
  const rawCounseling = note.counseling as Record<string, unknown> | undefined;
  if (rawCounseling && typeof rawCounseling === "object") {
    const issue = String(rawCounseling.issue ?? "").trim();
    const topic = String(rawCounseling.topic ?? "").trim();
    const outcomes = Array.isArray(rawCounseling.outcomes)
      ? rawCounseling.outcomes
          .map((o) => String(o ?? "").trim())
          .filter((o) => o.length > 0)
          .slice(0, 4)
      : [];
    // outcomes 는 선택 — issue/topic 만 있으면 상담 CTA 는 유지(전환 동선 보호).
    if (issue && topic) {
      counseling = { issue, topic, outcomes };
    }
  }

  return {
    coach_note: {
      title: note.title,
      lede: note.lede,
      intro: note.intro,
      findings: trimmedFindings,
      closing: note.closing,
      ...(counseling ? { counseling } : {}),
    },
    prescriptions: trimmedPresc,
  };
}
