import type { BirthInput, SajuChart } from "../types";
import { personaFor } from "../personas";
import { computeFourPillars } from "./fourPillars";
import { computeZiwei } from "./ziwei";

/**
 * 사주팔자 × 자미두수 이중 엔진 진입점.
 * 같은 출생 정보로 두 명반을 계산하고, 일간 페르소나를 붙여 표준 SajuChart를 반환한다.
 */
export function computeSajuChart(input: BirthInput): SajuChart {
  const four = computeFourPillars(input);
  const ziwei = computeZiwei(input);
  const persona = personaFor(four.dayMaster);

  return {
    input,
    four,
    ziwei,
    persona,
    // 교차검증(두 시스템 주제 일치)은 후속에서 실제 계산. 지금은 거짓 주장 방지로 false 고정.
    crossAligned: false,
  };
}

export { computeFourPillars } from "./fourPillars";
export { computeZiwei } from "./ziwei";
