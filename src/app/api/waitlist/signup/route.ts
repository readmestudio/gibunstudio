import { after, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSlackMessage, SLACK_OPEN_NOTIFY_CHANNEL } from "@/lib/slack";
import {
  WAITLIST_WORKBOOKS,
  WAITLIST_LABELS,
  PURCHASE_TYPE_OPTIONS,
  CONCERN_OPTIONS,
  JOB_OPTIONS,
  YEARS_OPTIONS,
  COUNSELING_EXPERIENCE_OPTIONS,
  COUNSELING_REASON_OPTIONS,
  DESIRED_START_OPTIONS,
  GOAL_OPTIONS,
} from "@/lib/waitlist/constants";

/** id → 라벨. 없으면 대시. */
function labelOf(map: Record<string, string>, id: string | null): string {
  if (!id) return "—";
  return map[id] ?? id;
}

/** id[] → "라벨, 라벨". 비었으면 대시. */
function labelsOf(map: Record<string, string>, ids: string[]): string {
  if (!ids || ids.length === 0) return "—";
  return ids.map((id) => map[id] ?? id).join(", ");
}

/**
 * 운영자 채널에 신규 대기신청 서베이를 알린다.
 *
 * `next/server` 의 `after()` 안에서 호출돼야 한다 — Vercel 서버리스 함수는
 * 응답을 보낸 직후 컨텍스트를 종료해서 await 안 한 fetch 가 잘릴 수 있다.
 * after() 는 응답 후 백그라운드 작업이 끝까지 실행되도록 보장한다.
 */
async function notifyOperatorsAboutWaitlist(p: {
  name: string;
  email: string;
  phone: string;
  workbooks: string[];
  purchaseType: string | null;
  concern: string[];
  job: string | null;
  yearsExperience: string | null;
  goals: string[];
  desiredStart: string | null;
  inquiry: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
}): Promise<void> {
  const isCounselingLead = p.purchaseType === "workbook_counseling";

  await sendSlackMessage({
    channel: SLACK_OPEN_NOTIFY_CHANNEL,
    text: `📝 새 대기신청: ${p.name} (${labelsOf(WAITLIST_LABELS.workbooks, p.workbooks)})`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: isCounselingLead
            ? "📝 새 대기신청 서베이 (상담 희망)"
            : "📝 새 대기신청 서베이가 제출됐어요",
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*이름*\n${p.name}` },
          { type: "mrkdwn", text: `*연락처*\n${p.email}\n${p.phone}` },
          {
            type: "mrkdwn",
            text: `*관심 워크북*\n${labelsOf(WAITLIST_LABELS.workbooks, p.workbooks)}`,
          },
          {
            type: "mrkdwn",
            text: `*구매 의향*\n${labelOf(WAITLIST_LABELS.purchaseType, p.purchaseType)}`,
          },
          {
            type: "mrkdwn",
            text: `*고민*\n${labelsOf(WAITLIST_LABELS.concern, p.concern)}`,
          },
          {
            type: "mrkdwn",
            text: `*직업 / 연차*\n${labelOf(WAITLIST_LABELS.job, p.job)} / ${labelOf(WAITLIST_LABELS.yearsExperience, p.yearsExperience)}`,
          },
          {
            type: "mrkdwn",
            text: `*알고 싶은 내용*\n${labelsOf(WAITLIST_LABELS.goals, p.goals)}`,
          },
          {
            type: "mrkdwn",
            text: `*희망 시작*\n${labelOf(WAITLIST_LABELS.desiredStart, p.desiredStart)}`,
          },
        ],
      },
      ...(p.inquiry
        ? [
            {
              type: "section",
              text: { type: "mrkdwn", text: `*추가 문의*\n${p.inquiry}` },
            },
          ]
        : []),
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text:
              p.utmContent || p.utmCampaign
                ? `📣 유입 광고: ${p.utmContent ?? "—"}${p.utmCampaign ? ` (${p.utmCampaign})` : ""}`
                : "📣 유입 광고: 직접/자연 유입",
          },
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
 * POST /api/waitlist/signup
 *
 * Body: {
 *   name, email, phone (필수),
 *   workbooks: string[] (필수, 최소 1개),
 *   concern: string[], counselingReason: string[], goals: string[],
 *   job?, counselingExperience?, desiredStart?, inquiry?
 * }
 *
 * 로그인 없이 누구나 신청 가능. service role(admin) 클라이언트로 INSERT.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEXT = 2000;

const ids = (opts: { id: string }[]) => opts.map((o) => o.id);

// 문자열이면 trim + 길이 제한, 아니면 null.
function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_TEXT) : null;
}

// 허용된 단일 선택지 id 인지 검증.
function cleanChoice(value: unknown, allowed: string[]): string | null {
  return typeof value === "string" && allowed.includes(value) ? value : null;
}

// 배열에서 허용된 id 만 추리고 중복 제거.
function cleanMulti(value: unknown, allowed: string[]): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter(
        (v): v is string => typeof v === "string" && allowed.includes(v)
      )
    )
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;

  // ── 연락처 검증 (필수) ──
  const name = cleanText(b.name);
  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "이메일 형식을 확인해주세요." },
      { status: 400 }
    );
  }
  const phone = cleanText(b.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "전화번호를 입력해주세요." },
      { status: 400 }
    );
  }

  // ── 워크북 검증 (필수, 최소 1개) ──
  const workbooks = cleanMulti(b.workbooks, ids(WAITLIST_WORKBOOKS));
  if (workbooks.length === 0) {
    return NextResponse.json(
      { error: "대기신청할 워크북을 하나 이상 선택해주세요." },
      { status: 400 }
    );
  }

  const concern = cleanMulti(b.concern, ids(CONCERN_OPTIONS));
  const job = cleanChoice(b.job, ids(JOB_OPTIONS));
  const counselingReason = cleanMulti(
    b.counselingReason,
    ids(COUNSELING_REASON_OPTIONS)
  );
  const goals = cleanMulti(b.goals, ids(GOAL_OPTIONS));

  // "기타" 직접 입력값 — 해당 질문에서 실제로 'etc'를 고른 경우에만 저장.
  const etcRaw = (b.etcDetails ?? {}) as Record<string, unknown>;
  const etcDetails: Record<string, string> = {};
  const addEtc = (key: string, picked: boolean) => {
    if (!picked) return;
    const text = cleanText(etcRaw[key]);
    if (text) etcDetails[key] = text;
  };
  addEtc("workbooks", workbooks.includes("etc"));
  addEtc("concern", concern.includes("etc"));
  addEtc("job", job === "etc");
  addEtc("counseling_reason", counselingReason.includes("etc"));
  addEtc("goals", goals.includes("etc"));

  const purchaseType = cleanChoice(b.purchaseType, ids(PURCHASE_TYPE_OPTIONS));
  const yearsExperience = cleanChoice(b.yearsExperience, ids(YEARS_OPTIONS));
  const desiredStart = cleanChoice(b.desiredStart, ids(DESIRED_START_OPTIONS));
  const inquiry = cleanText(b.inquiry);

  // ── 광고 유입(attribution) — 클라이언트가 보관해 둔 UTM/fbclid ──
  // 문자열만 허용하고 길이를 제한해 저장한다(선택지 검증 대상이 아닌 자유값).
  const attr = (b.attribution ?? {}) as Record<string, unknown>;
  const utm = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 200) : null;
  };
  const utmSource = utm(attr.utm_source);
  const utmMedium = utm(attr.utm_medium);
  const utmCampaign = utm(attr.utm_campaign);
  const utmContent = utm(attr.utm_content);
  const utmTerm = utm(attr.utm_term);
  const fbclid = utm(attr.fbclid);
  const landingPath = utm(attr.landing_path);

  const admin = createAdminClient();

  const { error: insertError } = await admin.from("workbook_waitlist").insert({
    name,
    email,
    phone,
    workbooks,
    purchase_type: purchaseType,
    concern,
    job,
    years_experience: yearsExperience,
    counseling_experience: cleanChoice(
      b.counselingExperience,
      ids(COUNSELING_EXPERIENCE_OPTIONS)
    ),
    counseling_reason: counselingReason,
    desired_start: desiredStart,
    goals,
    etc_details: etcDetails,
    inquiry,
    source: "waitlist_page",
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
    fbclid,
    landing_path: landingPath,
  });

  if (insertError) {
    console.error("[waitlist/signup] INSERT 실패:", insertError);
    return NextResponse.json(
      { error: "잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }

  // 서베이 제출이 성공적으로 저장된 뒤에만 운영자 채널에 알림(fire-and-forget).
  after(() =>
    notifyOperatorsAboutWaitlist({
      name,
      email,
      phone,
      workbooks,
      purchaseType,
      concern,
      job,
      yearsExperience,
      goals,
      desiredStart,
      inquiry,
      utmCampaign,
      utmContent,
    })
  );

  return NextResponse.json({ ok: true });
}
