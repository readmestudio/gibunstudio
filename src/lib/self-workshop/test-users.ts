/**
 * 워크북 테스트 유저 화이트리스트.
 * 결제·만료 검증을 우회한다. 운영자 본인 검수용으로만 사용.
 *
 * step page와 API guard가 동일한 리스트를 참조해야 하므로 공용 위치에 둠.
 */
export const WORKSHOP_TEST_EMAILS: readonly string[] = [
  "mingle22@hanmail.net",
];

export function isWorkshopTestUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return WORKSHOP_TEST_EMAILS.includes(email);
}
