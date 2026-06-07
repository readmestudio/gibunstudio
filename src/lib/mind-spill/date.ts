/**
 * Mind Spill — 날짜 헬퍼.
 * 사용자의 로컬 날짜(KST 기준)로 entry_date 를 다룬다.
 *
 * 서버는 UTC, 사용자는 KST → 자정 직전 기록이 다음 날로 밀리지 않도록
 * 클라이언트 측 YYYY-MM-DD를 신뢰한다. 서버는 형식만 검증.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidEntryDate(value: unknown): value is string {
  return typeof value === "string" && DATE_RE.test(value);
}

/** "YYYY-MM-DD" (Asia/Seoul) */
export function todayKstString(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

/** "5월 27일 화요일" 형태 */
export function formatKoreanDate(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  if (!y || !m || !d) return yyyyMmDd;
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][
    new Date(`${yyyyMmDd}T00:00:00+09:00`).getDay()
  ];
  return `${m}월 ${d}일 ${weekday}요일`;
}

/** "May 27" 영문 (cover sub용) */
export function formatEnglishDate(yyyyMmDd: string): string {
  const [, m, d] = yyyyMmDd.split("-").map(Number);
  if (!m || !d) return "";
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[m - 1]} ${d}`;
}
