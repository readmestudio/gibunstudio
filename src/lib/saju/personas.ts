import type { DayMasterPersona, Element } from "./types";

/**
 * 10천간(天干) → Day Master 페르소나(영문). 고정 자산.
 * 사주팔자 日干(일간)이 사람의 코어 = 청월당 "주성"에 대응하는 무료 유형 공개.
 * 결핍어 금지(feedback_deficit_framing_ban): 트레이드오프 톤으로.
 */

export const STEM_ELEMENT: Record<string, { element: Element; yin: boolean; pinyin: string }> = {
  甲: { element: "Wood", yin: false, pinyin: "Jiǎ" },
  乙: { element: "Wood", yin: true, pinyin: "Yǐ" },
  丙: { element: "Fire", yin: false, pinyin: "Bǐng" },
  丁: { element: "Fire", yin: true, pinyin: "Dīng" },
  戊: { element: "Earth", yin: false, pinyin: "Wù" },
  己: { element: "Earth", yin: true, pinyin: "Jǐ" },
  庚: { element: "Metal", yin: false, pinyin: "Gēng" },
  辛: { element: "Metal", yin: true, pinyin: "Xīn" },
  壬: { element: "Water", yin: false, pinyin: "Rén" },
  癸: { element: "Water", yin: true, pinyin: "Guǐ" },
};

const NAME_TAGS: Record<string, { name: string; tags: string[] }> = {
  甲: { name: "The Great Tree", tags: ["deep roots", "hard to shake", "grows tall"] },
  乙: { name: "The Reaching Vine", tags: ["adaptable", "quietly persistent", "finds the light"] },
  丙: { name: "The Sun", tags: ["warm", "impossible to ignore", "lights the room"] },
  丁: { name: "The Lantern", tags: ["intimate warmth", "steady glow", "guides in the dark"] },
  戊: { name: "The Mountain", tags: ["unmovable", "reliable", "holds the weight"] },
  己: { name: "The Garden Soil", tags: ["nurturing", "makes things grow", "quietly generous"] },
  庚: { name: "The Blade", tags: ["decisive", "cuts clean", "no wasted motion"] },
  辛: { name: "The Jewel", tags: ["refined", "precise", "quietly precious"] },
  壬: { name: "The Ocean", tags: ["vast", "always moving", "carries everything"] },
  癸: { name: "The Rain", tags: ["gentle", "seeps in", "nourishes unseen"] },
};

export function personaFor(stem: string): DayMasterPersona {
  const meta = STEM_ELEMENT[stem];
  const nt = NAME_TAGS[stem];
  // fallback (should never hit for valid 天干)
  if (!meta || !nt) {
    return {
      stem,
      pinyin: stem,
      element: "Earth",
      yin: false,
      polarity: "Earth",
      name: "The Chart",
      tags: ["steady"],
    };
  }
  return {
    stem,
    pinyin: meta.pinyin,
    element: meta.element,
    yin: meta.yin,
    polarity: `${meta.yin ? "Yin" : "Yang"} ${meta.element}`,
    name: nt.name,
    tags: nt.tags,
  };
}

export const ELEMENT_LABEL: Record<Element, string> = {
  Wood: "Wood",
  Fire: "Fire",
  Earth: "Earth",
  Metal: "Metal",
  Water: "Water",
};
