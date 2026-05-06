import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendSlackMessage, SLACK_OPEN_NOTIFY_CHANNEL } from "@/lib/slack";

interface SlackNotifyPayload {
  programType: string;
  source: "kakao-login" | "anonymous-form";
  /** 사용자가 보고 식별할 수 있는 이름(있을 때만) */
  name: string | null;
  /** 익명 폼 흐름에서만 채워짐 */
  phone: string | null;
  /** 로그인 흐름에서만 채워짐 — 카카오 로그인 사용자의 이메일 */
  email: string | null;
  /** Supabase auth user id — 로그인 흐름에서만 */
  userId: string | null;
}

/** 운영자 채널에 신규 알림 신청을 알린다. await 하지 말고 fire-and-forget. */
function notifyOperatorsAboutNewSignup(payload: SlackNotifyPayload): void {
  const sourceLabel =
    payload.source === "kakao-login" ? "카카오 로그인" : "익명 폼";

  const fields: Array<{ type: string; text: string }> = [
    { type: "mrkdwn", text: `*프로그램*\n\`${payload.programType}\`` },
    { type: "mrkdwn", text: `*경로*\n${sourceLabel}` },
  ];
  if (payload.name) {
    fields.push({ type: "mrkdwn", text: `*이름*\n${payload.name}` });
  }
  if (payload.email) {
    fields.push({ type: "mrkdwn", text: `*이메일*\n${payload.email}` });
  }
  if (payload.phone) {
    fields.push({ type: "mrkdwn", text: `*전화*\n${payload.phone}` });
  }
  if (payload.userId) {
    fields.push({
      type: "mrkdwn",
      text: `*user_id*\n\`${payload.userId.slice(0, 8)}…\``,
    });
  }

  void sendSlackMessage({
    channel: SLACK_OPEN_NOTIFY_CHANNEL,
    text: `🔔 새 알림 신청: ${payload.programType} (${sourceLabel})`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🔔 새 알림 신청이 들어왔어요" },
      },
      { type: "section", fields },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `📅 ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (KST)`,
          },
        ],
      },
    ],
  });
}

/**
 * 알림 신청 등록.
 *
 * 두 가지 흐름을 모두 받는다.
 *  1) 익명 입력형 (기존): name + phone 직접 입력.
 *  2) 로그인 자동형 (신규): 카카오 등 OAuth 로그인 후 자동 등록 — body 비어도 됨.
 *     로그인 사용자라면 user_id 로 식별하고 user_metadata 에서 이름을 가져온다.
 *     같은 (user_id, program_type) 중복 INSERT 는 idempotent 하게 success 응답.
 *
 * 응답 형식:
 *   { success: true, alreadyRegistered?: true }
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await request.json().catch(() => ({}));
  const { name, phone, program_type } = body as {
    name?: unknown;
    phone?: unknown;
    program_type?: unknown;
  };

  const programType =
    typeof program_type === "string" && program_type.trim()
      ? program_type.trim()
      : "7day";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── (2) 로그인 자동형 ────────────────────────────────────────────
  if (user) {
    // 이미 신청했는지 확인 (UNIQUE 위반 잡기 전에 한 번 확인 — 사용자에게 alreadyRegistered 알려주기 위함)
    const { data: existing } = await supabase
      .from("open_notifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("program_type", programType)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, alreadyRegistered: true });
    }

    const meta = (user.user_metadata ?? {}) as {
      name?: string;
      full_name?: string;
      nickname?: string;
      phone?: string;
    };
    const resolvedName =
      (typeof name === "string" && name.trim()) ||
      meta.name ||
      meta.full_name ||
      meta.nickname ||
      null;
    const resolvedPhone =
      (typeof phone === "string" && phone.trim()) || meta.phone || null;

    const { error } = await supabase.from("open_notifications").insert({
      user_id: user.id,
      name: resolvedName,
      phone: resolvedPhone,
      program_type: programType,
    });

    if (error) {
      // UNIQUE 위반은 idempotent 하게 success 처리 (이미 알린 신청이므로 Slack 추가 호출 X)
      if (error.code === "23505") {
        return NextResponse.json({ success: true, alreadyRegistered: true });
      }
      console.error("open_notify insert error (auth):", error);
      return NextResponse.json(
        { error: "알림 신청 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    notifyOperatorsAboutNewSignup({
      programType,
      source: "kakao-login",
      name: resolvedName,
      phone: resolvedPhone,
      email: user.email ?? null,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  }

  // ── (1) 익명 입력형 ─────────────────────────────────────────────
  if (
    !name ||
    typeof name !== "string" ||
    !phone ||
    typeof phone !== "string"
  ) {
    return NextResponse.json(
      { error: "이름과 휴대폰 번호를 입력해 주세요." },
      { status: 400 }
    );
  }

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();

  const { error } = await supabase.from("open_notifications").insert({
    name: trimmedName,
    phone: trimmedPhone,
    program_type: programType,
  });

  if (error) {
    console.error("open_notify insert error (anon):", error);
    return NextResponse.json(
      { error: "알림 신청 저장에 실패했습니다." },
      { status: 500 }
    );
  }

  notifyOperatorsAboutNewSignup({
    programType,
    source: "anonymous-form",
    name: trimmedName,
    phone: trimmedPhone,
    email: null,
    userId: null,
  });

  return NextResponse.json({ success: true });
}

/**
 * 현재 로그인 사용자가 특정 프로그램에 이미 알림 신청을 했는지 조회.
 * 페이지 마운트 시 버튼 라벨을 "신청 완료" 로 노출하기 위해 사용.
 *
 * 미로그인 사용자는 항상 { registered: false }.
 */
export async function GET(request: NextRequest) {
  const program = new URL(request.url).searchParams.get("program") ?? "7day";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ registered: false });

  const { data } = await supabase
    .from("open_notifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("program_type", program)
    .maybeSingle();

  return NextResponse.json({ registered: !!data });
}
