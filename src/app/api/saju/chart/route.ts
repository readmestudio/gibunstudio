import { NextResponse, after } from "next/server";
import { computeSajuChart } from "@/lib/saju/engine";
import { notifySajuTestStart } from "@/lib/saju/notify";
import type { BirthInput, Gender } from "@/lib/saju/types";

export const runtime = "nodejs";

/**
 * POST /api/saju/chart
 * body: { date: "YYYY-MM-DD", timeIndex: number|null, gender: "male"|"female" }
 * → { chart: SajuChart }
 *
 * 사주팔자 × 자미두수 명반을 결정적으로 계산해 반환한다(저장 없음).
 */
export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const b = (body ?? {}) as Record<string, unknown>;

    const date = String(b.date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "invalid_date" }, { status: 400 });
    }

    const rawTi = b.timeIndex;
    let timeIndex: number | null = null;
    if (typeof rawTi === "number" && Number.isFinite(rawTi)) {
      timeIndex = rawTi;
    }

    const gender: Gender = b.gender === "male" ? "male" : "female";
    const input: BirthInput = { date, timeIndex, gender };

    const chart = computeSajuChart(input);

    // 테스트 시작 = 이 라우트 도달 시점. 슬랙 "시작" 종을 울린다(저장 없음, fire-and-forget).
    after(async () => {
      await notifySajuTestStart({ date, timeIndex, gender });
    });

    return NextResponse.json({ chart });
  } catch {
    return NextResponse.json({ error: "compute_failed" }, { status: 500 });
  }
}
