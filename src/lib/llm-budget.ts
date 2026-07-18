/**
 * 전역 일일 LLM 호출 상한 (서킷 브레이커)
 *
 * 왜 필요한가:
 * - IP별 Rate Limit(`rate-limit.ts`)은 "한 명의 공격자"만 막는다.
 * - 봇넷처럼 여러 IP로 각자 한도 아래로 천천히 때리면, 합산 호출 수는
 *   무제한으로 늘어 비용이 폭주할 수 있다.
 * - 이 유틸은 "이름(name) 버킷의 하루 총 호출 수"에 절대 상한을 둬서,
 *   최악의 경우에도 하루 LLM 비용이 일정 금액을 넘지 못하게 막는다.
 *
 * 작동 원리:
 * - 버킷별로 (오늘 날짜, 카운트)를 인메모리에 저장
 * - 날짜가 바뀌면 카운트를 0으로 리셋 (UTC 기준 자정)
 * - 상한 도달 시 allowed:false → 호출자는 LLM을 호출하지 말고 즉시 차단
 *
 * 주의: 인메모리·인스턴스별이라 멀티 인스턴스 배포에서는 실질 상한이
 * (인스턴스 수 × limit)이 된다. 정확한 전역 상한이 필요하면 Redis/DB
 * 카운터로 교체할 것. (rate-limit.ts와 동일한 트레이드오프)
 */

import { alertLimitReached } from "@/lib/cost-alert";

interface DailyCounter {
  /** "YYYY-MM-DD" (UTC) — 날짜가 바뀌면 리셋 트리거 */
  day: string;
  count: number;
}

const counters = new Map<string, DailyCounter>();

function todayKey(): string {
  // UTC 날짜 문자열 (예: "2026-06-29"). 자정에 자연스럽게 리셋된다.
  return new Date().toISOString().slice(0, 10);
}

export interface DailyBudgetResult {
  /** false면 호출자는 LLM을 호출하지 말고 즉시 차단해야 한다. */
  allowed: boolean;
  /** 이번 호출 포함 오늘 누적 호출 수 */
  count: number;
  /** 적용된 일일 상한 */
  limit: number;
}

/**
 * name 버킷의 오늘 카운트를 1 증가시키고 상한 초과 여부를 반환한다.
 *
 * LLM을 호출하기 "직전"에 부르는 것을 권장한다(Rate Limit·입력 검증을
 * 모두 통과한 정상 요청만 예산을 소비하도록). 실패한 호출은 되돌리지
 * 않으므로, limit은 비용 천장(상한)으로만 해석한다.
 *
 * @param name  버킷 이름 (예: "achievement-diagnose")
 * @param limit 하루 최대 호출 수
 *
 * @example
 * ```ts
 * const budget = consumeDailyBudget("achievement-diagnose", 500);
 * if (!budget.allowed) return NextResponse.json({ error: "..." }, { status: 503 });
 * // ... LLM 호출
 * ```
 */
/**
 * 자유서술 입력을 프롬프트에 넣기 전에 안전 길이로 자른다(토큰 폭증 방어).
 *
 * 왜 필요한가:
 * - LLM 비용은 입력 토큰 수에 비례한다. 사용자가 수십 KB짜리 글을 붙여넣으면
 *   Rate Limit·일일상한을 다 통과한 "정상 1회 호출"이라도 단가가 폭증한다.
 * - 심리 자유서술은 길어야 수백 자면 충분하므로, 넉넉한 상한(기본 2000자)을
 *   넘기면 조용히 잘라낸다. 정상 사용자는 영향받지 않고, 악용만 막힌다.
 *
 * null/undefined/비문자열은 빈 문자열로 정규화한다.
 *
 * @param text     원본 입력 (null 가능)
 * @param maxChars 최대 문자 수 (기본 2000)
 */
export function clampInput(text: unknown, maxChars = 2000): string {
  if (typeof text !== "string") return "";
  const trimmed = text.trim();
  return trimmed.length > maxChars ? trimmed.slice(0, maxChars) : trimmed;
}

export function consumeDailyBudget(name: string, limit: number): DailyBudgetResult {
  const day = todayKey();
  const existing = counters.get(name);

  // 새 날(또는 첫 호출) → 카운트 리셋 후 1로 시작
  if (!existing || existing.day !== day) {
    counters.set(name, { day, count: 1 });
    return { allowed: true, count: 1, limit };
  }

  // 이미 상한 도달 → 차단 (카운트는 더 올리지 않음)
  if (existing.count >= limit) {
    // 운영 Slack 알림. dedupeKey에 날짜를 넣고 쿨다운을 24h로 둬서
    // "오늘 이 버킷 1회"만 울린다(한 번 막히면 그 뒤 수천 번 막혀도 조용).
    alertLimitReached({
      kind: "daily-budget",
      dedupeKey: `budget:${name}:${day}`,
      title: `일일 LLM 호출 상한 도달: ${name}`,
      fields: {
        버킷: name,
        상한: `${limit}회/일`,
        날짜: `${day} (UTC)`,
        안내: "오늘은 추가 호출이 차단됩니다. 정상 트래픽이면 상한 상향 검토.",
      },
      cooldownMs: 24 * 60 * 60 * 1000,
    });
    return { allowed: false, count: existing.count, limit };
  }

  existing.count += 1;
  return { allowed: true, count: existing.count, limit };
}
