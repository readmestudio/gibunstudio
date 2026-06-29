/**
 * 비용/남용 리밋 도달 시 Slack 운영 알림.
 *
 * Rate Limit(`rate-limit.ts`)·일일 상한(`llm-budget.ts`) 같은 방어막이
 * 실제로 발동했을 때, 기존 운영 봇(`SLACK_BOT_TOKEN`)으로 기존 알림
 * 채널(`SLACK_OPEN_NOTIFY_CHANNEL`)에 신호를 보낸다. 어떤 유입 경로든
 * 공통 리밋 함수를 거치므로, 그 함수 안에서 한 번만 호출하면 전 경로가
 * 자동으로 커버된다.
 *
 * 핵심: **알림 폭주 방지(throttle)**.
 * 리밋은 한 번 걸리면 같은 공격자가 수천 번 더 두드린다. 매번 알리면
 * 채널이 도배되고 Slack 자체 rate limit에도 걸린다. 그래서 dedupeKey별로
 * 쿨다운 동안 1회만 전송한다.
 *  - Rate Limit: 같은 IP+경로는 15분에 1번
 *  - 일일 상한: 같은 버킷·날짜는 하루 1번
 *
 * 전송은 fire-and-forget (sendSlackMessage 내부에서 실패 silent).
 * 알림은 부가 기능이라 사용자 요청 흐름을 절대 막지 않는다.
 */

import { sendSlackMessage, SLACK_OPEN_NOTIFY_CHANNEL } from "@/lib/slack";

const DEFAULT_COOLDOWN_MS = 15 * 60 * 1000; // 15분

// dedupeKey → 마지막 전송 시각(ms). 인메모리·인스턴스별.
const lastAlertAt = new Map<string, number>();

// 분산 공격 시 키가 무한정 늘지 않도록 상한 + 만료 정리.
const MAX_KEYS = 5_000;

function pruneIfNeeded(now: number) {
  if (lastAlertAt.size < MAX_KEYS) return;
  // 가장 긴 쿨다운(하루)보다 오래된 항목 제거.
  const cutoff = now - 24 * 60 * 60 * 1000;
  for (const [key, ts] of lastAlertAt) {
    if (ts < cutoff) lastAlertAt.delete(key);
  }
  // 그래도 가득 차 있으면(전부 최신) 전체 비워 메모리 누수 방지.
  if (lastAlertAt.size >= MAX_KEYS) lastAlertAt.clear();
}

export type LimitKind = "rate-limit" | "daily-budget";

export interface LimitAlertParams {
  kind: LimitKind;
  /** 알림 중복 제거 키. 이 키 단위로 쿨다운이 적용된다. */
  dedupeKey: string;
  /** 한 줄 제목 (예: "일일 LLM 호출 상한 도달: achievement-diagnose") */
  title: string;
  /** 상세 필드 — Slack에 "• key: value" 줄로 렌더 */
  fields: Record<string, string | number>;
  /** 쿨다운(ms). 미지정 시 15분. 일일 상한은 12시간 등으로 길게. */
  cooldownMs?: number;
}

/**
 * 리밋 도달을 Slack에 알린다(throttle 적용, fire-and-forget).
 * 호출부는 await 하지 말 것.
 */
export function alertLimitReached(params: LimitAlertParams): void {
  const now = Date.now();
  const cooldown = params.cooldownMs ?? DEFAULT_COOLDOWN_MS;

  const last = lastAlertAt.get(params.dedupeKey) ?? 0;
  if (now - last < cooldown) return; // 쿨다운 내 → 전송 skip

  pruneIfNeeded(now);
  lastAlertAt.set(params.dedupeKey, now);

  const emoji = params.kind === "daily-budget" ? "🚨" : "⚠️";
  const fieldLines = Object.entries(params.fields)
    .map(([k, v]) => `• *${k}:* ${v}`)
    .join("\n");

  void sendSlackMessage({
    channel: SLACK_OPEN_NOTIFY_CHANNEL,
    text: `${emoji} ${params.title}`,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `${emoji} *${params.title}*` },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: fieldLines },
      },
    ],
  });
}
