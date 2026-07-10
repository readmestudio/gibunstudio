/**
 * 내면 아이 상담 진단 — 로우데이터 export (SPEC §8 = 핸드오프 §7-2).
 *
 * GET /api/intake/export/[id]?format=json|csv
 * - json: 세션 메타 + 문항별 응답(item_id, value 배열) + 산출 결과 전체
 * - csv : 1행 = 1세션 와이드 포맷 (S01_1..S18_4 문항ID 순, P1~P3, C1~C5,
 *          도식별 mean 18개, 판정 결과, 플래그) — 누적 분석용.
 *          엑셀 한글 호환을 위해 UTF-8 BOM 프리픽스.
 * - 관리자 인증 필수 (로그인 + ADMIN_EMAILS).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/auth";
import { getSessionById } from "@/lib/intake/store";
import {
  PART_A_QUESTIONS,
  PART_B_QUESTIONS,
  PART_C_QUESTIONS,
  SCHEMA_CODES,
} from "@/lib/intake/questions";

/** CSV 값 이스케이프 — 쉼표/따옴표/개행 포함 시 큰따옴표로 감싸고 내부 따옴표는 2배로. */
function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // 관리자 인증 — 다운로드 라우트이므로 리다이렉트 대신 상태코드로 응답.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  const session = await getSessionById(id);
  if (!session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const { responses, result } = session;

  // ── JSON ──────────────────────────────────────────────────────
  if (format === "json") {
    const payload = {
      session: {
        id: session.id,
        display_name: session.display_name,
        memo: session.memo,
        session_date: session.session_date,
        status: session.status,
        crisis_flag: session.crisis_flag,
        quality_flag: session.quality_flag,
        completed_at: session.completed_at,
        created_at: session.created_at,
      },
      // 문항별 응답 — item_id/value 배열 (문항ID 순)
      items: {
        partA: PART_A_QUESTIONS.map((q) => ({
          item_id: q.item_id,
          value: responses?.partA?.[q.item_id] ?? null,
        })),
        partB: PART_B_QUESTIONS.map((q) => ({
          item_id: q.item_id,
          value: responses?.partB?.[q.item_id] ?? null,
        })),
        partC: PART_C_QUESTIONS.map((q) => ({
          item_id: q.item_id,
          value: responses?.partC?.[q.item_id] ?? null,
        })),
        timings: responses?.timings ?? null,
      },
      result, // ScoreResult 전체 (미완료 시 null)
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="intake_${session.id}.json"`,
      },
    });
  }

  // ── CSV (1행 = 1세션, 와이드) ─────────────────────────────────
  if (format === "csv") {
    const header: string[] = [];
    const row: string[] = [];
    const push = (col: string, value: unknown) => {
      header.push(col);
      row.push(csvEscape(value));
    };

    // 세션 메타
    push("session_id", session.id);
    push("display_name", session.display_name);
    push("session_date", session.session_date);
    push("status", session.status);
    push("completed_at", session.completed_at);

    // Part A: S01_1..S18_4 (문항ID 순 — ITEM_ORDER 아님)
    for (const q of PART_A_QUESTIONS) {
      push(q.item_id, responses?.partA?.[q.item_id] ?? "");
    }
    // Part B: P1~P3 (guardian value)
    for (const q of PART_B_QUESTIONS) {
      push(q.item_id, responses?.partB?.[q.item_id] ?? "");
    }
    // Part C: C1~C5 (자유 서술 원문)
    for (const q of PART_C_QUESTIONS) {
      push(q.item_id, responses?.partC?.[q.item_id] ?? "");
    }

    // 도식별 mean 18개 (S01..S18 코드순)
    const meanByCode = new Map(
      (result?.schema_scores ?? []).map((s) => [s.code, s.mean]),
    );
    for (const code of SCHEMA_CODES) {
      push(`mean_${code}`, meanByCode.get(code)?.toFixed(2) ?? "");
    }

    // 판정 결과 + 플래그
    push("primary_child", result?.primary_child?.child_id ?? "");
    push("secondary_child_1", result?.secondary_children?.[0]?.child_id ?? "");
    push("secondary_child_2", result?.secondary_children?.[1]?.child_id ?? "");
    push(
      "co_primary",
      (result?.co_primary ?? []).map((c) => c.child_id).join("|"),
    );
    push("guardian", result?.guardian?.type ?? "");
    push("crisis_flag", session.crisis_flag);
    push("quality_flag", session.quality_flag ?? "");
    push("low_elevation_profile", result?.low_elevation_profile ?? "");

    // UTF-8 BOM — 엑셀에서 한글 깨짐 방지
    const csv = "\uFEFF" + header.join(",") + "\r\n" + row.join(",") + "\r\n";

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="intake_${session.id}.csv"`,
      },
    });
  }

  return NextResponse.json(
    { error: "format 은 json 또는 csv 여야 합니다." },
    { status: 400 },
  );
}
