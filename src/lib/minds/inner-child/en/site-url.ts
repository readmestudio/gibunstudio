/**
 * 고객에게 그대로 전달되는 링크(메일·슬랙)는 **항상 정식 도메인**이어야 한다.
 *
 * NEXT_PUBLIC_SITE_URL 에는 로컬(localhost:3000)이나 프리뷰 값이 들어올 수 있고, 실제로
 * Vercel prod 에 `gibunstudio.vercel.app`(전 라우트 404)이 박혀 발송 링크가 전부 죽은 사고가
 * 있었다. env 와 무관하게 여기서 방어한다(saju/site-url.ts 와 동일 가드).
 *
 * ⚠️ 예전엔 이 로직이 notify.ts 안에 사본으로 있었다 — 링크가 여러 곳에 흩어지면 한 곳만
 *    고쳐 또 죽는다. 이제 메일(email.ts)·슬랙(notify.ts)이 이 한 파일을 공유한다.
 */

const CANONICAL_SITE_URL = "https://gibunstudio.com";

export function customerSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return CANONICAL_SITE_URL;
  try {
    const { hostname } = new URL(raw);
    if (hostname === "gibunstudio.com" || hostname.endsWith(".gibunstudio.com")) {
      return raw.replace(/\/+$/, "");
    }
  } catch {
    // 파싱 불가 — 정식 도메인으로 떨어진다.
  }
  return CANONICAL_SITE_URL;
}

/** 무료 결과 링크(고객 공유). */
export function enFreeResultLink(leadId: string): string {
  return `${customerSiteUrl()}/inner-child/en/r/${leadId}`;
}

/** full(유료/베타) 리포트가 열릴 주소 — 자동 발송 메일에 담기는 링크. */
export function enFullReportLink(leadId: string): string {
  return `${customerSiteUrl()}/inner-child/en/full/${leadId}`;
}
