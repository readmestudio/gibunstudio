import { Resend } from "resend";

/**
 * Resend 싱글톤. 환경변수가 없으면 지연 로딩 시점에 에러.
 *
 * API 라우트에서만 사용 (서버 사이드). 클라이언트 번들에 포함되면 안 됨.
 */
let cached: Resend | null = null;

export function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  cached = new Resend(key);
  return cached;
}

export function getFromAddress(): string {
  const email = process.env.NEWSLETTER_FROM_EMAIL;
  const name = process.env.NEWSLETTER_FROM_NAME ?? "기분 스튜디오";
  if (!email) {
    throw new Error("NEWSLETTER_FROM_EMAIL 환경변수가 설정되지 않았습니다.");
  }
  return `${name} <${email}>`;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
