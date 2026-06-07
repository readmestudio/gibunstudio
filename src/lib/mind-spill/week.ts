/**
 * Mind Spill — 주(week) 헬퍼.
 * "이번 주"는 사용자 로컬(KST)의 월요일 시작 기준.
 */

import { todayKstString } from "./date";

/** YYYY-MM-DD → 그 날짜가 속한 주의 월요일 YYYY-MM-DD. */
export function weekOfKst(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  // 로컬 (UTC offset 무관) Date 로 계산하기 위해 UTC 자정 기준.
  const date = new Date(Date.UTC(y, m - 1, d));
  // getUTCDay: 0(일)..6(토). 월요일은 1.
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day; // 일요일이면 6일 전, 그 외엔 1-day일 전
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

/** 이번 주 월요일. */
export function thisWeekOfKst(): string {
  return weekOfKst(todayKstString());
}

/** 주의 마지막 일(일요일) YYYY-MM-DD. */
export function weekEndOf(weekOfMonday: string): string {
  const [y, m, d] = weekOfMonday.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + 6);
  return date.toISOString().slice(0, 10);
}

/** "May 19 — 25" 형태. */
export function formatWeekRange(weekOfMonday: string): string {
  const end = weekEndOf(weekOfMonday);
  const [, m1, d1] = weekOfMonday.split("-").map(Number);
  const [, m2, d2] = end.split("-").map(Number);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  if (m1 === m2) {
    return `${months[m1 - 1]} ${d1} — ${d2}`;
  }
  return `${months[m1 - 1]} ${d1} — ${months[m2 - 1]} ${d2}`;
}

/** "5월 19일 — 5월 25일" 한국어. */
export function formatWeekRangeKr(weekOfMonday: string): string {
  const end = weekEndOf(weekOfMonday);
  const [, m1, d1] = weekOfMonday.split("-").map(Number);
  const [, m2, d2] = end.split("-").map(Number);
  if (m1 === m2) return `${m1}월 ${d1}일 — ${d2}일`;
  return `${m1}월 ${d1}일 — ${m2}월 ${d2}일`;
}
