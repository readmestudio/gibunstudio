/**
 * 위기 필터 키워드 (HANDOFF-v2 3장 Step4).
 *
 * SCT 자유입력에 자·타해 신호가 있으면 crisis_flag=true → 리포트 생성 스킵,
 * 전문기관 안내 화면으로 분기한다. LLM 호출 전, 코드 레벨에서 판정한다.
 *
 * ⚠️ 이 목록은 지속 보강 대상이다. 오탐/누락은 운영 중 계속 다듬는다.
 * 정규화(공백 제거)한 문자열에 부분일치로 검사하므로, 띄어쓰기 변형에 크게 흔들리지 않는다.
 */

export const CRISIS_KEYWORDS: string[] = [
  // 자해 · 자살
  "자살",
  "죽고싶",
  "죽고 싶",
  "죽어버리",
  "사라지고싶",
  "사라지고 싶",
  "없어지고싶",
  "목숨",
  "목맬",
  "목을맬",
  "손목",
  "자해",
  "그어",
  "뛰어내리",
  "번개탄",
  "유서",
  "세상을떠",
  // 타해
  "죽이고싶",
  "죽여버리",
  "해치고싶",
];

/** 공백을 제거해 띄어쓰기 변형에 견디게 만든 정규화. */
function normalize(s: string): string {
  return s.replace(/\s+/g, "");
}

/** SCT 응답 묶음(또는 임의 문자열들)에 위기 신호가 있으면 true. */
export function detectCrisis(texts: Array<string | undefined | null>): boolean {
  const haystack = normalize(texts.filter(Boolean).join(" "));
  return CRISIS_KEYWORDS.some((kw) => haystack.includes(normalize(kw)));
}
