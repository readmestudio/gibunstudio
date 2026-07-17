import { NextResponse } from "next/server";
import { computeSajuChart } from "@/lib/saju/engine";
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
    return NextResponse.json({ chart });
  } catch {
    return NextResponse.json({ error: "compute_failed" }, { status: 500 });
  }
}
