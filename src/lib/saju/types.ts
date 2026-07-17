/**
 * 사주(Saju) 엔진 공통 타입.
 * Four Pillars(사주팔자) + Ziwei(자미두수) 계산 결과를 앱 표준 형태로 정규화한다.
 * 언어 중립 — 표시 텍스트는 personas / 프롬프트에서 영어로 매핑한다.
 */

export type Element = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

export const GENDERS = ["female", "male"] as const;
export type Gender = (typeof GENDERS)[number];

export interface BirthInput {
  /** solar date, yyyy-mm-dd */
  date: string;
  /** 지지시 index 0..11 (子=0 … 亥=11), or null when the user doesn't know */
  timeIndex: number | null;
  gender: Gender;
}

export interface Pillar {
  /** "Year" | "Month" | "Day" | "Hour" */
  label: string;
  /** 天干 (heavenly stem) hanja, e.g. "甲" */
  stem: string;
  /** 地支 (earthly branch) hanja, e.g. "子" */
  branch: string;
}

export interface FourPillars {
  /** [year, month, day] always; hour appended when known */
  pillars: Pillar[];
  /** day stem hanja — the Day Master */
  dayMaster: string;
  hasHour: boolean;
  /** five-element tally across all stems + branches' hidden stems */
  elements: Record<Element, number>;
}

export interface ZiweiPalace {
  /** English palace name, e.g. "Self", "Wealth" */
  name: string;
  /** main stars present, English/pinyin, e.g. ["Tian Fu"] */
  stars: string[];
}

export interface ZiweiChart {
  /** 命宫 main star, English/pinyin, e.g. "Tian Fu" */
  mingStar: string;
  palaces: ZiweiPalace[];
}

export interface DayMasterPersona {
  /** 天干 hanja */
  stem: string;
  pinyin: string;
  element: Element;
  /** true = Yin (乙丁己辛癸), false = Yang (甲丙戊庚壬) */
  yin: boolean;
  /** "Yang Wood" */
  polarity: string;
  /** "The Great Tree" */
  name: string;
  tags: string[];
}

export interface SajuChart {
  input: BirthInput;
  four: FourPillars;
  /** null when computation unavailable (e.g. unknown time in strict Ziwei) */
  ziwei: ZiweiChart | null;
  persona: DayMasterPersona;
  /** true when Four Pillars day-master element ↔ Ziwei main star theme align */
  crossAligned: boolean;
}
