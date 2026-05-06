/**
 * Slack 메시지 전송 헬퍼.
 *
 * 토큰: `SLACK_BOT_TOKEN` (xoxb-...). 슬랙 앱의 Bot Token Scopes 에
 * `chat:write` 가 있어야 하고, 메시지를 보낼 채널에 봇이 초대돼 있어야 한다.
 *
 * 운영 정책:
 *  - 토큰이 없으면 콘솔 경고만 남기고 silent fail — 알림은 부가 기능이지
 *    핵심 흐름이 아니다. Slack 장애가 사용자 요청을 막아선 안 된다.
 *  - 호출부는 await 하지 말고 fire-and-forget 으로 호출할 것 (응답 지연 회피).
 *
 * 메시지 포맷: 짧은 텍스트는 `text`만, 풍부한 알림은 Block Kit 사용.
 */

interface SlackBlock {
  type: string;
  text?: { type: string; text: string };
  fields?: Array<{ type: string; text: string }>;
  elements?: Array<{ type: string; text: string }>;
}

interface PostMessageOptions {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
}

export async function sendSlackMessage(
  options: PostMessageOptions
): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn(
      "[slack] SLACK_BOT_TOKEN is not set — skipping message",
      options.channel,
      options.text.slice(0, 80)
    );
    return;
  }

  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(options),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };
    if (!data.ok) {
      console.error("[slack] postMessage failed:", data.error, options.channel);
    }
  } catch (err) {
    console.error("[slack] postMessage exception:", err);
  }
}

/** 알림 신청 채널 — 운영자 전용 */
export const SLACK_OPEN_NOTIFY_CHANNEL = "C0AFVFCTZGS";
