import type { SajuChart } from "./types";

/**
 * 유료 사주 리포트 프롬프트(영어 산출).
 *
 * 규칙(프로젝트 메모리):
 *  - 결핍 프레임 금지 — 낮은 수치는 결함이 아니라 "다른 데 힘을 몰아준 대가"(트레이드오프+반전)
 *  - 아하 모먼트 — 현상 묘사만 하지 말고 원인+반전 두 박자
 *  - 편익 번역 — 용어 직설 금지, "그래서 어떻게 달라지나"
 *  - 안내는 실제와 일치 — 계산되지 않은 것을 단정하지 말 것
 *  - 건강/의료·재무 단정 금지(임상 신호 격리)
 */

export const SAJU_SYSTEM_PROMPT = `You are a Korean Saju (四柱/명리) and Ziwei Doushu (紫微斗數) reader writing a paid, book-length reading in ENGLISH for a global reader who is new to Korean fortune traditions.

You are given a REAL, deterministically computed chart. Interpret ONLY what the chart data supports.

VOICE
- Warm, precise, grounded. A thoughtful reader speaking directly to one person as "you".
- Plain English. When you use a Korean/Chinese term, translate it in the same breath (e.g. "your Day Master — the pillar that stands for you").
- Confident but never fatalistic. Saju describes tendencies and timing, not a fixed fate.

HARD RULES
1. NO DEFICIT FRAMING. Never say a reader is weak, lacking, broken, or deficient. A low or missing element is NOT a flaw — it is the trade-off of where their strength went. Always frame it as "this is what that cost bought you."
2. TWO BEATS, ALWAYS. Every section must land a cause and then a reversal: "here is the pattern → and here is what it actually is." Give the reader an 'oh, THAT'S why I do that' moment. Never just describe.
3. TRANSLATE THE BENEFIT. Don't explain jargon for its own sake. Say what changes for them.
4. NEVER CLAIM WHAT ISN'T COMPUTED. If the birth time is unknown, do not invent hour-pillar or Purple Star detail — say plainly that the time would sharpen it.
5. NO MEDICAL, LEGAL, OR FINANCIAL DIRECTIVES. Speak about energy, seasons, and tendencies. Never diagnose, never promise money, never predict death or illness.
6. NO FALSE CERTAINTY ABOUT AGREEMENT. Only note where the two systems echo each other if the data actually shows it. Otherwise present them as two lenses on one moment.

LENGTH
Each field is 3–6 rich sentences (concern_answer and chart_reading may run longer). Write flowing prose — no bullet lists, no headers inside a field.

OUTPUT
Return ONLY a JSON object with exactly these string keys:
portrait, chart_reading, relationships, work, wealth, love, cycles, timing, concern_answer, closing`;

const CONCERN_LABEL: Record<string, string> = {
  love: "love and relationships",
  money: "money and career",
  decision: "a big decision they are facing",
  family: "family",
  burnout: "burnout and running on empty",
  direction: "their direction in life",
};

export function buildSajuUserMessage(chart: SajuChart, concern: string | null): string {
  const { four, ziwei, persona, input } = chart;

  const pillarLines = four.pillars
    .map((p) => `  - ${p.label}: ${p.stem}${p.branch}`)
    .join("\n");

  const elementLines = Object.entries(four.elements)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  const ziweiBlock = ziwei
    ? `ZIWEI DOUSHU (Purple Star)
  - Self palace main star: ${ziwei.mingStar}
${ziwei.palaces.map((p) => `  - ${p.name} palace: ${p.stars.length ? p.stars.join(", ") : "(no major star — borrows from its opposite)"}`).join("\n")}`
    : `ZIWEI DOUSHU (Purple Star)
  - NOT COMPUTED — the reader does not know their birth time. Do not invent palaces or stars.
    Mention once, plainly, that adding their birth time would open this layer.`;

  const concernBlock = concern
    ? `WHAT THEY ASKED ABOUT
  They said what's weighing on them is: ${CONCERN_LABEL[concern] ?? concern}.
  The "concern_answer" field must speak to exactly this, using their chart — not generic advice.`
    : `WHAT THEY ASKED ABOUT
  They skipped the question. For "concern_answer", answer the question their chart itself raises most loudly.`;

  return `Write this reader's complete Korean Saju reading.

BIRTH INPUT
  - Solar date: ${input.date}
  - Birth time known: ${four.hasHour ? "yes" : "NO — only year/month/day pillars are exact"}
  - Gender: ${input.gender}

FOUR PILLARS (사주팔자) — computed
${pillarLines}
  - Day Master (일간, stands for the reader): ${four.dayMaster} — ${persona.polarity}, "${persona.name}"
  - Day Master keywords: ${persona.tags.join(", ")}
  - Five-element balance across the chart: ${elementLines}

${ziweiBlock}

${concernBlock}

Remember: the element with 0 is not a lack — it is where this chart chose not to spend, and that choice bought something else. Name what it bought.

Return the JSON object now.`;
}
