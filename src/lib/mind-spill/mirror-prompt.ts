/**
 * Mind Spill — Mirror Report 프롬프트 (시안 §4.1 + Gemini 호환).
 *
 *   입력: BrainDump + WeeklyScan
 *   출력: MirrorReport (JSON)
 */

import type { BrainDump, MirrorReport, WeeklyScan } from "./types";

export const MIRROR_SYSTEM_PROMPT = `당신은 인지행동치료(CBT) 훈련을 받은 임상 심리학자입니다.
사용자가 자기 관찰로 적은 데이터(생각·감정·신체 신호)를 종합해 다시 비춰주는 짧은 리포트를 작성합니다.

원칙:
- 진단하지 마세요. "보입니다", "패턴이 등장합니다", "관찰됩니다" 톤.
- 사용자 원문을 정확하게 인용하세요(인용 시 따옴표).
- 따뜻하되 정확하게. 모욕적이거나 지적하는 표현 금지.
- 한국어 입니다체.
- 부드러운 카피 가이드: "반박/부수기/잘못/틀림" 같은 공격적·판단적 단어 금지.
  대신 "다시 보기 / 살펴보기 / 검증 / 업데이트 / 가설 / 한때 도움이 됐던" 같은 표현 사용.
- 데이터가 부족하면 "이번 회는 데이터가 적어 단정하기 어렵습니다" 같은 신중한 표현 사용.

출력은 반드시 아래 JSON 스키마만. 설명/머리말/꼬리말 없이 순수 JSON 만.

스키마:
{
  "intro": "한 단락(2-4 문장) 종합 인상. 사용자 원문을 1-2회 인용.",
  "emotion_clusters": [
    { "category": "불안" | "압박" | "무력" | "분노" | "슬픔" | "긍정",
      "percent": 0-100 정수,
      "keywords": ["키워드1","키워드2","..."]
    }
  ],
  "cognitive_distortions": [
    { "distortion_type": "독심술" | "파국화" | "당위적 사고" | "과잉 일반화" | "흑백 사고" | "개인화" | "라벨링",
      "quoted_text": "사용자 원문 그대로",
      "frequency": 1 이상 정수,
      "brief_explanation": "한 줄 설명 — 왜 이 왜곡으로 보이는지. 판단조 금지.",
      "reframe": "한 줄의 '생각의 전환' — 사용자 원문을 다시 한 번 부드럽게 비춰주는 대안."
    }
  ],
  "body_thought_links": [
    { "body": "사용자가 표시한 신체 신호 (예: 어깨 결림)",
      "linked_thought": "그것과 묶인 사용자 생각 한 줄"
    }
  ]
}

reframe 작성 가이드 (중요):
- 사용자의 원래 생각을 "잘못이다" 라고 평가하지 마세요. 다른 시각을 살짝 제시하는 톤.
- 명령형/단정형 금지 — "~해야 합니다" "~가 맞습니다" "~가 진실입니다" 금지.
- "이렇게 다시 볼 수도 있어요" / "한때 도움이 됐던 가설일 수 있어요" / "또 다른 가능성은" 같은
  부드러운 가설형 표현 사용.
- 사용자 원문의 핵심 키워드를 한 번 인용하면 더 좋음.
- 예시 (참고만, 그대로 복사하지 말 것):
    원문: "내가 만드는 영상이 이상한가? 왜 반응이 없을까"
    reframe: "외부 반응이 아직 보이지 않는다는 사실이, 곧 '내 콘텐츠가 이상하다'를 뜻하는 건 아닐 수 있어요. 같은 데이터를 '아직 과정 중'이라는 가설로도 한 번 볼 수 있습니다."

규칙:
- emotion_clusters: 합이 100에 가깝도록. 최대 4개 카테고리.
- cognitive_distortions: 발견된 만큼만. 0개~5개. 없으면 빈 배열. 각 항목은 반드시 brief_explanation 과 reframe 둘 다 채워주세요.
- body_thought_links: 신체 신호와 BD 항목이 연결될 때만. 0개~5개.
`;

/** 사용자 프롬프트(데이터 삽입). */
export function buildMirrorUserPrompt(input: {
  brain_dump: BrainDump;
  weekly_scan: WeeklyScan;
}): string {
  const { brain_dump, weekly_scan } = input;

  const bdLines = (label: string, list: { text: string }[]) =>
    list.length === 0
      ? `${label}: (없음)`
      : `${label}:\n` + list.map((b) => `- ${b.text}`).join("\n");

  const scanLines = [
    weekly_scan.emotions.length > 0
      ? `- 감정 칩: ${weekly_scan.emotions.join(", ")}`
      : "- 감정 칩: (없음)",
    weekly_scan.emotion_intensity != null
      ? `- 감정 강도: ${weekly_scan.emotion_intensity}/10`
      : "- 감정 강도: (미입력)",
    weekly_scan.sleep_avg_hours != null
      ? `- 평균 수면: ${weekly_scan.sleep_avg_hours}h`
      : "- 평균 수면: (미입력)",
    weekly_scan.sleep_latency_min != null
      ? `- 잠들기까지: ${weekly_scan.sleep_latency_min}분`
      : "- 잠들기까지: (미입력)",
    weekly_scan.sleep_recovery != null
      ? `- 수면 회복감: ${weekly_scan.sleep_recovery}/10`
      : "- 수면 회복감: (미입력)",
    weekly_scan.body_signs.length > 0
      ? `- 신체 신호: ${weekly_scan.body_signs.join(", ")}`
      : "- 신체 신호: (없음)",
    weekly_scan.energy != null
      ? `- 에너지: ${weekly_scan.energy}/10`
      : "- 에너지: (미입력)",
    weekly_scan.focus != null
      ? `- 집중력: ${weekly_scan.focus}/10`
      : "- 집중력: (미입력)",
    weekly_scan.motivation != null
      ? `- 의욕: ${weekly_scan.motivation}/10`
      : "- 의욕: (미입력)",
  ].join("\n");

  return [
    "사용자가 적은 데이터입니다. 시작 전에 모든 항목을 다 읽어주세요.",
    "",
    "[Weekly Scan]",
    scanLines,
    "",
    "[Brain Dump]",
    bdLines("현재, 나를 불편하게 하는", brain_dump.recurring),
    "",
    bdLines("나를 불편하게 만든 생각들", brain_dump.discomfort),
    "",
    bdLines("해야 하는 일, 미루고 있는 일", brain_dump.todos),
    "",
    "위 데이터를 종합한 Mirror Report 를 JSON 스키마로 출력해주세요.",
  ].join("\n");
}

/** LLM 응답의 형태 검증. 형식이 안 맞으면 null. */
export function validateMirrorReport(raw: unknown): MirrorReport | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.intro !== "string") return null;
  if (!Array.isArray(r.emotion_clusters)) return null;
  if (!Array.isArray(r.cognitive_distortions)) return null;
  if (!Array.isArray(r.body_thought_links)) return null;

  return {
    intro: r.intro,
    emotion_clusters: r.emotion_clusters
      .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
      .map((c) => ({
        category: String(c.category ?? ""),
        percent: Number(c.percent ?? 0),
        keywords: Array.isArray(c.keywords)
          ? c.keywords.filter((k): k is string => typeof k === "string")
          : [],
      })),
    cognitive_distortions: r.cognitive_distortions
      .filter((d): d is Record<string, unknown> => !!d && typeof d === "object")
      .map((d) => ({
        distortion_type: String(d.distortion_type ?? ""),
        quoted_text: String(d.quoted_text ?? ""),
        frequency: Number(d.frequency ?? 1),
        brief_explanation: String(d.brief_explanation ?? ""),
        reframe: String(d.reframe ?? ""),
      })),
    body_thought_links: r.body_thought_links
      .filter((l): l is Record<string, unknown> => !!l && typeof l === "object")
      .map((l) => ({
        body: String(l.body ?? ""),
        linked_thought: String(l.linked_thought ?? ""),
      })),
  };
}
