/**
 * 고객에게 그대로 전달되는 링크(메일·슬랙)는 **항상 정식 도메인**이어야 한다.
 *
 * NEXT_PUBLIC_SITE_URL 에는 로컬(localhost:3000)이나 프리뷰 값이 들어올 수 있고, 실제로
 * Vercel prod 에 전 라우트 404인 값이 박혀 발송 링크가 전부 죽은 사고가 있었다
 * (inner-child en/notify 의 동일 가드 참고). env 와 무관하게 여기서 방어한다.
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

export function sajuReportLink(leadId: string): string {
  return `${customerSiteUrl()}/saju/en/r/${leadId}`;
}
