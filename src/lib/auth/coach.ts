/**
 * 코치 계정은 관리자가 수동으로 지정합니다.
 * 환경변수 COACH_EMAILS에 이메일을 쉼표로 구분하여 설정하세요.
 * 예: COACH_EMAILS=coach1@example.com,coach2@example.com
 */
export function getCoachEmails(): string[] {
  const env = process.env.COACH_EMAILS ?? "";
  return env
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isCoachEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return getCoachEmails().includes(email.toLowerCase());
}
