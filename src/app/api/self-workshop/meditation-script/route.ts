import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { requireWorkshopAccess } from "@/lib/self-workshop/api-guard";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { IFS_TERM_BAN_RULES } from "@/lib/self-workshop/ifs-parts-data";

/**
 * POST /api/self-workshop/meditation-script
 *
 * Step 3의 명상 안내 화면에 띄울 안내문을 생성한다.
 * 사용자의 사건을 인용해, 음파 호흡 모션과 함께 천천히 등장할 6~8줄.
 * 몸·형태·목소리·말까지 함께 느껴보는 통합 안내.
 *
 * Body: { situation, selected_part_nickname }
 * Resp: { lines: string[] }  // 6~8줄, 사용자가 읽으며 호흡
 *
 * 실패 시 폴백: 정적 기본 스크립트 (사건 인용 없이).
 */

const FALLBACK_LINES = [
  "잠시 호흡을 가다듬어볼게요.",
  "방금 떠올린 그 순간으로 다시 돌아가봐요.",
  "장면을 천천히 그려보면서, 마음 안에서 일어나는 것을 그대로 느껴보세요.",
  "그 마음이 몸 어디에서 느껴지는지, 어떤 형태인지 살펴봐요.",
  "어떤 목소리나 말이 들리는지도 가만히 들어보세요.",
  "판단하지 말고, 그저 함께 있어주세요.",
  "준비되시면 아래 버튼을 눌러주세요.",
];

export async function POST(req: Request) {
  const guard = await requireWorkshopAccess(req, {
    rateLimit: RATE_LIMITS.conversation,
  });
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const situation =
    typeof body?.situation === "string" ? body.situation.trim() : "";
  const partNickname =
    typeof body?.selected_part_nickname === "string"
      ? body.selected_part_nickname.trim()
      : "";

  if (!situation) {
    return NextResponse.json({ lines: FALLBACK_LINES });
  }

  try {
    const lines = await generateScript(situation, partNickname);
    return NextResponse.json({
      lines: lines.length >= 5 ? lines : FALLBACK_LINES,
    });
  } catch (err) {
    console.error("[meditation-script] 실패, 폴백:", err);
    return NextResponse.json({ lines: FALLBACK_LINES });
  }
}

async function generateScript(
  situation: string,
  partNickname: string
): Promise<string[]> {
  const systemPrompt = `당신은 따뜻하고 차분한 명상 안내자입니다. 내담자가 한 사건을 떠올리며 그 안의 마음을 깊이 느껴보는 짧은 명상으로 안내해주세요.

## 작업
음파 호흡 모션과 함께 화면에 천천히 등장할 **6~8줄**의 안내 텍스트를 만드세요.

## 구성 (순서대로)
1. 호흡 가다듬기 안내 (1줄)
2. **사건으로 돌아가기** — 내담자 원문을 자연스럽게 인용 ("그 [구체적 장면]으로 다시 돌아가볼게요" 류)
3. 장면 떠올리기 안내 (느낌·심상 그대로)
4. **몸에서 느껴지는 위치** — 어디서 느껴지는지 가만히
5. **형태·모양** — 어떤 모양·이미지가 있는지
6. **목소리·내면 말** — 어떤 목소리나 말이 들리는지
7. 판단·해석 없이 함께 있어주기
8. 준비되면 버튼 눌러달라는 마무리

## 톤 규칙
- 한 줄당 30~70자.
- 차분하고 부드러운 명상 톤. 명령조 금지("~하세요" 강제 X). "~해보세요"·"~보면 좋아요" 같은 권유형.
- 단정 금지. "어떤 마음일 거예요" 같은 해석 금지. 그저 *느껴보기*만 안내.
- 내담자 원문 인용은 1~2번에. 어색하게 끼워 넣지 말 것.
- IFS 전문 용어 금지.

## 응답 형식 (JSON 단일 객체로만)
{"lines": ["1줄...", "2줄...", "3줄...", "4줄...", "5줄...", "6줄...", "7줄..."]}

${IFS_TERM_BAN_RULES}`;

  const userMessage = `## 사건 (내담자 원문)
${situation}

${partNickname ? `## 선택한 마음의 별명\n${partNickname}\n` : ""}
위 사건을 1~2번 줄에 자연스럽게 인용하면서, 6~8줄의 명상 안내 텍스트를 JSON으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.7,
      max_tokens: 1024,
      thinking_budget: 0,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<{ lines?: unknown }>(response);
  const raw = Array.isArray(parsed?.lines) ? parsed.lines : [];
  return raw
    .filter((l): l is string => typeof l === "string" && l.trim().length > 0)
    .map((l) => l.trim())
    .slice(0, 8);
}
