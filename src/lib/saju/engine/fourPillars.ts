import { Solar } from "lunar-typescript";
import type { BirthInput, Element, FourPillars, Pillar } from "../types";
import { STEM_ELEMENT } from "../personas";

/** 지지(地支) → 대표 오행 */
const BRANCH_ELEMENT: Record<string, Element> = {
  子: "Water", 丑: "Earth", 寅: "Wood", 卯: "Wood", 辰: "Earth", 巳: "Fire",
  午: "Fire", 未: "Earth", 申: "Metal", 酉: "Metal", 戌: "Earth", 亥: "Water",
};

/** iztro timeIndex(지지시) → lunar-typescript 계산용 대표 시(hour). 일주는 이 값들에서 안정적. */
function timeIndexToHour(ti: number | null): number {
  switch (ti) {
    case 0: return 0; // 早子 00–01
    case 3: return 6; // 卯 05–07
    case 4: return 8; // 辰 07–09
    case 6: return 12; // 午 11–13
    default: return 12; // 모름 → 정오(일간에 영향 없음)
  }
}

/**
 * 사주팔자 계산. lunar-typescript로 연·월·일주(+시주)의 간지를 뽑고,
 * 오행 밸런스를 집계한다. 일간(day master)은 시간 없이도 정확하다.
 */
export function computeFourPillars(input: BirthInput): FourPillars {
  const [y, m, d] = input.date.split("-").map((n) => Number(n));
  const hour = timeIndexToHour(input.timeIndex);
  const ec = Solar.fromYmdHms(y, m, d, hour, 0, 0).getLunar().getEightChar();
  const hasHour = input.timeIndex !== null;

  const gz = {
    year: ec.getYear(),
    month: ec.getMonth(),
    day: ec.getDay(),
    time: ec.getTime(),
  };

  const pillars: Pillar[] = [
    { label: "Year", stem: gz.year.charAt(0), branch: gz.year.charAt(1) },
    { label: "Month", stem: gz.month.charAt(0), branch: gz.month.charAt(1) },
    { label: "Day", stem: gz.day.charAt(0), branch: gz.day.charAt(1) },
  ];
  if (hasHour) {
    pillars.push({ label: "Hour", stem: gz.time.charAt(0), branch: gz.time.charAt(1) });
  }

  const elements: Record<Element, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
  for (const p of pillars) {
    const se = STEM_ELEMENT[p.stem];
    if (se) elements[se.element] += 1;
    const be = BRANCH_ELEMENT[p.branch];
    if (be) elements[be] += 1;
  }

  return { pillars, dayMaster: ec.getDayGan(), hasHour, elements };
}
