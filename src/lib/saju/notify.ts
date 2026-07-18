import { sendSlackMessage, SLACK_OPEN_NOTIFY_CHANNEL } from "@/lib/slack";
import { sajuReportLink } from "./site-url";

/**
 * 사주 퍼널 운영자 슬랙 알림. 🔮 [SAJU] 접두로 다른 퍼널과 눈으로 구분한다.
 * 전부 fire-and-forget — 호출부는 after() 로 감싸고, 실패는 사용자 흐름을 막지 않는다.
 */

function timeContext() {
  return {
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `📅 ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (KST) · /saju/en`,
      },
    ],
  };
}

async function post(headline: string, lines: Array<string | null>): Promise<void> {
  const body = [headline, ...lines.filter(Boolean)].join("\n");
  try {
    await sendSlackMessage({
      channel: SLACK_OPEN_NOTIFY_CHANNEL,
      text: body,
      blocks: [
        { type: "section", text: { type: "mrkdwn", text: body } },
        timeContext(),
      ],
    });
  } catch (err) {
    console.error("[saju/notify] 슬랙 알림 실패:", err);
  }
}

/** 테스트 시작(생년월일 입력 후 명반 열기) — 아직 익명, 이메일 전 */
export async function notifySajuTestStart(args: {
  date: string;
  gender: "male" | "female";
  timeIndex: number | null;
}): Promise<void> {
  const { date, gender, timeIndex } = args;
  await post("🔮 *[SAJU] 테스트 시작*", [
    `• 생년월일: ${date}`,
    `• 성별: ${gender === "male" ? "남" : "여"}`,
    `• 태어난 시: ${timeIndex === null ? "모름" : `${timeIndex}시 인덱스`}`,
  ]);
}

/** 이메일 제출(요청 접수) — 생성 파이프라인 시작 */
export async function notifySajuReportRequest(args: {
  leadId: string;
  email: string;
  dayMaster?: string;
  personaName?: string;
  concern?: string | null;
}): Promise<void> {
  const { leadId, email, dayMaster, personaName, concern } = args;
  await post("🔮 *[SAJU] 리포트 요청 접수*", [
    `• email: ${email}`,
    dayMaster ? `• 일간: ${dayMaster}${personaName ? ` (${personaName})` : ""}` : null,
    concern ? `• 고민: ${concern}` : null,
    leadId ? `• 링크: ${sajuReportLink(leadId)}` : null,
  ]);
}

/** 생성·발송 결과 */
export async function notifySajuReportSent(args: {
  leadId: string;
  email: string;
  ok: boolean;
  reason?: string;
}): Promise<void> {
  const { leadId, email, ok, reason } = args;
  // leadId 가 없으면 링크를 찍지 않는다 — /saju/en/r/ 로 끝나는 404 링크가 나가는 걸 막는다.
  await post(
    ok ? "🔮 *[SAJU] 리포트 생성·발송 완료*" : "🔮 *[SAJU] ⚠️ 리포트 생성/발송 실패*",
    [
      `• email: ${email}`,
      ok ? null : `• 사유: ${reason ?? "unknown"}`,
      leadId ? `• 링크: ${sajuReportLink(leadId)}` : "• ⚠️ leadId 없음 — 리포트 저장/링크 불가",
    ],
  );
}
