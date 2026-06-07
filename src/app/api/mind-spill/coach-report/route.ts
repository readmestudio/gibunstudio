/**
 * @deprecated POST /api/mind-spill/coach-report
 *
 * Freemium 전환으로 coach note는 entry 단위가 아닌 PeriodReport 단위에서만 생성.
 * 이 라우트는 410 Gone 응답. period LLM은 `/api/mind-spill/period/generate` 사용.
 * Phase 3 cleanup에서 파일 삭제 예정.
 */
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST() {
  return NextResponse.json(
    {
      error:
        "이 엔드포인트는 더 이상 사용되지 않습니다. 종합 리포트(₩4,900)는 3일치 누적 후 받을 수 있어요.",
      code: "deprecated",
    },
    { status: 410 }
  );
}
