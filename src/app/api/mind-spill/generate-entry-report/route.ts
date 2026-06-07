/**
 * @deprecated POST /api/mind-spill/generate-entry-report
 *
 * Freemium 전환으로 entry 단위 LLM 통합 트리거는 폐기. PeriodReport(`/api/mind-spill/period/generate`)로 대체.
 * 이 라우트는 410 Gone 응답. Phase 3 cleanup에서 파일 삭제 예정.
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
