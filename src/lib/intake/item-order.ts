/**
 * Part A 문항 제시 순서 — 고정 셔플 (핸드오프 §6-1).
 *
 * 같은 도식 4문항이 연속되지 않도록 라운드별 시작 오프셋을 두고 순서를 생성한다.
 * - 라운드 1: S01_1, S02_1, … S18_1 (오프셋 0)
 * - 라운드 2: S10_2, S11_2, … S18_2, S01_2 … S09_2 (오프셋 9)
 * - 라운드 3·4: 동일한 방식의 오프셋 셔플 (오프셋 4, 13 — 라운드 경계에서
 *   직전 라운드 마지막 도식과 다음 라운드 첫 도식이 겹치지 않게 분산)
 *
 * 순서는 시스템 상수로 고정한다 (응답자 간 동일 — 비교 가능성 확보).
 */

import { SCHEMA_CODES } from "./questions";

/** 라운드별 시작 오프셋 (라운드 r 는 SCHEMA_CODES[offset] 도식부터 순환 제시). */
export const ROUND_OFFSETS = [0, 9, 4, 13] as const;

/** 오프셋 규칙으로 72문항 고정 순서를 생성한다. */
function buildItemOrder(): string[] {
  const order: string[] = [];
  ROUND_OFFSETS.forEach((offset, roundIndex) => {
    for (let i = 0; i < SCHEMA_CODES.length; i++) {
      const code = SCHEMA_CODES[(offset + i) % SCHEMA_CODES.length];
      order.push(`${code}_${roundIndex + 1}`);
    }
  });

  // 방어적 검증: 길이 72 + 같은 도식 비연속 (규칙이 어긋나면 빌드 시점에 즉시 실패).
  if (order.length !== 72) {
    throw new Error(`ITEM_ORDER 길이 오류: ${order.length}`);
  }
  for (let i = 1; i < order.length; i++) {
    const prev = order[i - 1].split("_")[0];
    const curr = order[i].split("_")[0];
    if (prev === curr) {
      throw new Error(`같은 도식 연속 감지: ${order[i - 1]} → ${order[i]}`);
    }
  }
  return order;
}

/** Part A 제시 순서 (길이 72, item_id 배열). */
export const ITEM_ORDER: string[] = buildItemOrder();
