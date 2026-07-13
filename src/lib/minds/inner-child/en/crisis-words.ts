/**
 * Crisis filter keywords — ENGLISH.
 *
 * 영어 사용자가 SCT 자유입력에 자·타해 신호를 영어로 쓰면 잡는다. 한국어 detectCrisis 와
 * 함께(OR) 써서 영어 퍼널의 위기 응답을 전문기관 안내로 분기시킨다.
 *
 * ⚠️ 부분일치라 반드시 '구(phrase)' 단위로 둔다. 단어 하나("die")는 "diet/died"에 오탐하므로 금지.
 * 소문자화 + 공백/기호 제거 후 substring 검사(띄어쓰기 변형에 견디게).
 */

export const CRISIS_KEYWORDS_EN: string[] = [
  // self-harm / suicide
  "killmyself",
  "killingmyself",
  "wanttodie",
  "wannadie",
  "wishiwasdead",
  "wishiweredead",
  "betteroffdead",
  "endmylife",
  "endingmylife",
  "enditall",
  "takemyownlife",
  "takingmyownlife",
  "suicid", // suicide / suicidal
  "cutmyself",
  "cuttingmyself",
  "hurtmyself",
  "hurtingmyself",
  "harmmyself",
  "selfharm",
  "hangmyself",
  "hangingmyself",
  "slitmywrist",
  "overdose",
  "noreasontolive",
  "notworthliving",
  "dontwanttolive",
  "donotwanttolive",
  "cantgoonanymore",
  "wanttodisappear",
  // harm to others
  "killhim",
  "killher",
  "killthem",
  "hurtsomeone",
  "wanttohurt",
];

/** 소문자화 + 영숫자 외 제거 정규화. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** SCT 응답 묶음에 영어 위기 신호가 있으면 true. */
export function detectCrisisEn(texts: Array<string | undefined | null>): boolean {
  const haystack = normalize(texts.filter(Boolean).join(" "));
  if (!haystack) return false;
  return CRISIS_KEYWORDS_EN.some((kw) => haystack.includes(kw));
}
