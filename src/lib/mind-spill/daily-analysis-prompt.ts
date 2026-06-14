/**
 * Mind Spill — "오늘 하루 정리하기" 데일리 분석 프롬프트.
 *
 *   입력: 오늘 작성한 체크인(brain_dump · scan · moments) + 이전 체크인 요약(있을 때)
 *   출력: DailyAnalysis (JSON) — 변화 · 반복되는 사고 · 희망적인 부분
 *
 * mirror_report 를 대체하는 통합 일일 분석. 이전 기록이 있으면 그 맥락까지 엮어준다.
 */

import type {
  BrainDump,
  DailyAnalysis,
  DailyScan,
  Moment,
} from "./types";

export const DAILY_ANALYSIS_SYSTEM_PROMPT = `당신은 인지행동치료(CBT)와 정서중심 접근을 함께 훈련받은 임상 심리 상담사입니다.
사용자가 매일 적는 체크인(생각·감정·신체 신호·좋았던 순간)을 읽고, "오늘 하루"를 한 발 떨어져 정리해주는 짧은 분석을 작성합니다.

핵심 원칙:
- 진단하지 마세요. "보입니다 / 관찰됩니다 / 등장합니다" 톤.
- 사용자 원문을 정확히 인용하세요(인용 시 따옴표).
- 따뜻하되 정확하게. 지적·평가·훈계 금지.
- 한국어 입니다체.
- 부드러운 카피 가이드: "반박/부수기/잘못/틀림" 같은 공격적·판단적 단어 금지.
  대신 "다시 보기 / 살펴보기 / 검증 / 업데이트 / 가설 / 한때 도움이 됐던" 같은 표현 사용.

가장 중요한 지시 — 이전 기록과 연결하기:
- 이전 체크인이 함께 주어지면, 오늘만 보지 말고 흐름을 보세요.
- (1) 변화(changes): 이전과 비교해 달라진 점 — 감정·생각·행동·수면 등 무엇이든 움직인 것.
- (2) 반복되는 사고(recurring_themes): 여러 날에 걸쳐 되돌아오는 생각/패턴. 원문을 인용해 근거를 보이세요.
- (3) 희망적인 부분(hopeful): 좋았던 순간·작은 행동·회복의 신호 등 강점의 씨앗.
- 이전 기록이 없으면(첫 기록) changes 는 빈 배열로 두고, intro 에서 "첫 기록"임을 부드럽게 언급하세요.

출력은 반드시 아래 JSON 스키마만. 설명/머리말/꼬리말 없이 순수 JSON 만.

스키마:
{
  "intro": "오늘에 대한 따뜻한 도입 2-3문장. 오늘 원문을 1회 이상 인용. 첫 기록이면 그 점을 짚어줌.",
  "today_focus": "오늘 가장 두드러진 감정·생각을 한 줄로.",
  "changes": ["이전 대비 변화 1", "변화 2", "..."],
  "recurring_themes": ["반복되는 사고/패턴 1 (원문 인용 포함)", "..."],
  "hopeful": ["희망적인 부분 / 강점의 씨앗 1", "..."],
  "closing": "오늘을 닫는 따뜻한 한 문장."
}

규칙:
- changes: 이전 기록이 있을 때 1~4개. 없으면 빈 배열.
- recurring_themes: 0~4개. 근거가 약하면 무리하지 말고 적게.
- hopeful: 1~3개. 좋았던 순간이 없어도 작은 회복 신호를 찾아 한 개는 채워주세요.
- 각 배열 항목은 한 문장~두 문장. 추상적 위로가 아니라 사용자 데이터에 근거.
`;

/** 이전 체크인 1건 요약 — 비용/컨텍스트 절약을 위해 핵심만. */
export type DailyAnalysisPriorSummary = {
  entry_date: string;
  emotions: string[];
  recurring: string[];
  discomfort: string[];
  moment_titles: string[];
};

/** 오늘 체크인 입력. */
export type DailyAnalysisTodayInput = {
  entry_date: string;
  daily_scan: DailyScan;
  brain_dump: BrainDump;
  moments: Moment[];
};

/** 사용자 프롬프트(데이터 삽입). */
export function buildDailyAnalysisUserPrompt(input: {
  today: DailyAnalysisTodayInput;
  prior: DailyAnalysisPriorSummary[];
}): string {
  const { today, prior } = input;
  const scan = today.daily_scan;

  const bdLines = (label: string, list: { text: string }[]) =>
    list.filter((b) => b.text.trim()).length === 0
      ? `${label}: (없음)`
      : `${label}:\n` +
        list
          .filter((b) => b.text.trim())
          .map((b) => `- ${b.text}`)
          .join("\n");

  const scanLines = [
    scan.emotions.length > 0
      ? `- 감정 칩: ${scan.emotions.join(", ")}`
      : "- 감정 칩: (없음)",
    scan.emotion_intensity != null
      ? `- 감정 강도: ${scan.emotion_intensity}/10`
      : "- 감정 강도: (미입력)",
    scan.sleep_avg_hours != null
      ? `- 평균 수면: ${scan.sleep_avg_hours}h`
      : "- 평균 수면: (미입력)",
    scan.body_signs.length > 0
      ? `- 신체 신호: ${scan.body_signs.join(", ")}`
      : "- 신체 신호: (없음)",
    scan.energy != null ? `- 에너지: ${scan.energy}/10` : "- 에너지: (미입력)",
    scan.focus != null ? `- 집중력: ${scan.focus}/10` : "- 집중력: (미입력)",
    scan.motivation != null
      ? `- 의욕: ${scan.motivation}/10`
      : "- 의욕: (미입력)",
  ].join("\n");

  const momentLines =
    today.moments.filter((m) => m.title.trim() || m.experience.trim())
      .length === 0
      ? "(없음)"
      : today.moments
          .filter((m) => m.title.trim() || m.experience.trim())
          .map((m) => {
            const parts = [m.title, m.experience, m.reason]
              .filter((s) => s && s.trim())
              .join(" — ");
            return `- ${parts}`;
          })
          .join("\n");

  const priorBlock =
    prior.length === 0
      ? "[이전 체크인]\n(없음 — 이번이 첫 기록입니다.)"
      : "[이전 체크인 — 최신순]\n" +
        prior
          .map((p) => {
            const lines = [
              `· ${p.entry_date}`,
              p.emotions.length ? `  감정: ${p.emotions.join(", ")}` : null,
              p.recurring.length
                ? `  반복 생각: ${p.recurring.slice(0, 4).join(" / ")}`
                : null,
              p.discomfort.length
                ? `  불편: ${p.discomfort.slice(0, 4).join(" / ")}`
                : null,
              p.moment_titles.length
                ? `  좋았던 순간: ${p.moment_titles.slice(0, 3).join(" / ")}`
                : null,
            ].filter(Boolean);
            return lines.join("\n");
          })
          .join("\n");

  return [
    "사용자의 오늘 체크인과 이전 기록입니다. 시작 전에 모든 항목을 다 읽어주세요.",
    "",
    `[오늘 — ${today.entry_date}]`,
    "[Daily Scan]",
    scanLines,
    "",
    "[Brain Dump]",
    bdLines("자주 떠오른 생각", today.brain_dump.recurring),
    "",
    bdLines("나를 불편하게 만든 생각", today.brain_dump.discomfort),
    "",
    bdLines("해야 하는 일 / 미루는 일", today.brain_dump.todos),
    "",
    "[좋았던 순간]",
    momentLines,
    "",
    priorBlock,
    "",
    "위 데이터를 종합해 '오늘 하루 정리하기' 분석을 JSON 스키마로 출력해주세요.",
    "이전 기록이 있으면 반드시 변화·반복되는 사고와 연결해주세요.",
  ].join("\n");
}

/** LLM 응답의 형태 검증. 형식이 안 맞으면 null. */
export function validateDailyAnalysis(raw: unknown): DailyAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.intro !== "string") return null;
  if (typeof r.closing !== "string") return null;

  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];

  return {
    intro: r.intro,
    today_focus: typeof r.today_focus === "string" ? r.today_focus : "",
    changes: strArr(r.changes),
    recurring_themes: strArr(r.recurring_themes),
    hopeful: strArr(r.hopeful),
    closing: r.closing,
  };
}
