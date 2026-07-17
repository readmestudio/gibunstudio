import { astro } from "iztro";
import type { BirthInput, ZiweiChart, ZiweiPalace } from "../types";

/** iztro 궁 키 → 표시 라벨(영문) */
const PALACE_LABEL: Record<string, string> = {
  soul: "Self",
  spouse: "Partner",
  wealth: "Wealth",
  career: "Career",
};

const WANTED_PALACES = ["soul", "spouse", "wealth", "career"] as const;

/** iztro 영문 성명(camel/lower) → 표시용 Title Case */
function pretty(name: string): string {
  const spaced = name.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function starNames(stars: ReadonlyArray<{ name: string }> | undefined): string[] {
  return (stars ?? []).map((s) => pretty(s.name));
}

/**
 * 자미두수 명반. iztro로 12궁·주성을 계산한다(en-US 로케일).
 * 시간을 모르면 궁 배치가 성립하지 않으므로 null을 반환한다(정직한 축소).
 */
export function computeZiwei(input: BirthInput): ZiweiChart | null {
  if (input.timeIndex === null) return null;

  const [y, m, d] = input.date.split("-").map((n) => Number(n));
  const dateStr = `${y}-${m}-${d}`;
  const chart = astro.bySolar(dateStr, input.timeIndex, input.gender, true, "en-US");

  const soul = chart.palace("soul");
  const mingStars = starNames(soul?.majorStars);

  const palaces: ZiweiPalace[] = [];
  for (const key of WANTED_PALACES) {
    const p = chart.palace(key);
    if (!p) continue;
    palaces.push({
      name: PALACE_LABEL[key] ?? pretty(p.name),
      stars: starNames(p.majorStars),
    });
  }

  return { mingStar: mingStars[0] ?? "—", palaces };
}
