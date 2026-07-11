/**
 * Meta Conversions API (CAPI) — 서버사이드 전환 이벤트 전송.
 *
 * 브라우저 픽셀은 광고차단·fbq 로드타이밍·렌더링·캐시 등 변수가 많아 결제완료 Purchase 가
 * 유실되기 쉽다(실제로 계속 유실됨). CAPI 는 결제가 확정되는 **우리 서버에서 메타로 직접**
 * 이벤트를 쏘므로 그 변수들과 무관하게 100% 도달한다 — 메타가 구매 최적화에 공식 권장.
 *
 * `event_id` 를 브라우저 픽셀과 동일하게(결제 레코드 id) 넘기면, 둘 다 발화돼도 메타가
 * 1건으로 합친다(dedup). 즉 CAPI 를 주력으로 두고 브라우저 픽셀은 보조로 둘 수 있다.
 *
 * 환경변수 `META_CAPI_ACCESS_TOKEN` 이 없으면 조용히 no-op — 토큰 없이 배포해도 안전하다.
 * 토큰은 이벤트 관리자 > 데이터 소스 > 설정 > Conversions API 에서 발급한다.
 */

import crypto from "crypto";

// layout.tsx 의 픽셀과 동일한 데이터셋(Gibun_studio).
const META_PIXEL_ID = "978167614596276";
const GRAPH_VERSION = "v21.0";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** 이메일 정규화(소문자·trim) 후 SHA-256. 빈 값이면 undefined. */
function hashEmail(email?: string | null): string | undefined {
  const normalized = (email ?? "").trim().toLowerCase();
  return normalized ? sha256(normalized) : undefined;
}

/** 전화번호를 국가코드 포함 숫자열로 정규화(한국 기본) 후 SHA-256. 빈 값이면 undefined. */
function hashPhone(phone?: string | null): string | undefined {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("0")) digits = "82" + digits.slice(1);
  else if (!digits.startsWith("82")) digits = "82" + digits;
  return sha256(digits);
}

/**
 * Purchase 전환 이벤트를 CAPI 로 전송한다. fire-and-forget 용(실패해도 결제 흐름 무영향).
 *
 * `externalIdSource` 는 항상 존재하므로(결제 id 등) user_data 식별자가 최소 하나는 보장된다
 * — 메타 CAPI 는 식별자가 하나도 없으면 이벤트를 거부한다.
 */
export async function sendMetaPurchaseEvent(params: {
  eventId: string; // dedup 키 = 결제 레코드 id (브라우저 픽셀 eventID 와 동일)
  value: number;
  contentName: string;
  currency?: string;
  eventSourceUrl?: string;
  eventTimeMs?: number; // 결제 확정 시각(ms). 없으면 호출 시각.
  externalIdSource: string; // 해시 전 원본(user_id ?? 결제 id) — 항상 존재
  email?: string | null;
  phone?: string | null;
}): Promise<{ success: boolean; reason?: string }> {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) return { success: false, reason: "no-token" };

  const userData: Record<string, unknown> = {
    external_id: [sha256(params.externalIdSource)],
  };
  const em = hashEmail(params.email);
  if (em) userData.em = [em];
  const ph = hashPhone(params.phone);
  if (ph) userData.ph = [ph];

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor((params.eventTimeMs ?? Date.now()) / 1000),
        action_source: "website",
        event_id: params.eventId,
        ...(params.eventSourceUrl
          ? { event_source_url: params.eventSourceUrl }
          : {}),
        user_data: userData,
        custom_data: {
          value: params.value,
          currency: params.currency ?? "KRW",
          content_name: params.contentName,
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, reason: `${res.status} ${text.slice(0, 300)}` };
    }
    return { success: true };
  } catch (e) {
    return { success: false, reason: e instanceof Error ? e.message : "fetch-error" };
  }
}
