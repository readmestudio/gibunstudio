/**
 * intake 위기 신호 필터 (핸드오프 §3-4).
 *
 * Part C(SCT) 자유 서술에서 자·타해 신호 키워드를 매칭한다.
 * - 공백 제거 정규화 + 부분일치 → 띄어쓰기·조사·활용형 변형에 견딘다.
 * - 매칭 시 crisis_flag=true, 해당 문항·원문을 리포트 최상단에 표기(붉은 박스).
 * - 유저 화면에는 별도 표출 없이 정상 종료 (판단은 상담사 몫 — 낙인·불안 유발 금지).
 *
 * ⚠️ src/lib/minds/inner-child/crisis-words.ts(리드젠 퍼널)와 별개의 intake 전용 카피본.
 */

/** 위기 키워드 — 자해·자살 계열 + 타해 계열 (핸드오프 §3-4). */
export const CRISIS_KEYWORDS: string[] = [
  // 자해·자살 계열
  "죽고 싶",
  "사라지고 싶",
  "자해",
  "자살",
  "죽어버리",
  "끝내고 싶",
  "살기 싫",
  "없어지고 싶",
  // 타해 계열
  "죽이고 싶",
  "해치고 싶",
];

/** 개별 텍스트의 매칭 결과. */
export interface CrisisHit {
  /** detectCrisis 에 넘긴 배열에서의 인덱스 (호출부에서 C1..C5 로 매핑) */
  index: number;
  /** 매칭된 원문 그대로 */
  text: string;
  /** 매칭된 키워드 목록 */
  matched: string[];
}

/** 공백을 제거해 띄어쓰기 변형에 견디게 만드는 정규화. */
function normalize(s: string): string {
  return s.replace(/\s+/g, "");
}

/**
 * SCT 응답 묶음에서 위기 신호를 탐지한다.
 * 반환: flag(하나라도 매칭 시 true) + hits(문항별 매칭 상세).
 */
export function detectCrisis(texts: Array<string | undefined | null>): {
  flag: boolean;
  hits: CrisisHit[];
} {
  const hits: CrisisHit[] = [];

  texts.forEach((text, index) => {
    if (!text) return;
    const haystack = normalize(text);
    const matched = CRISIS_KEYWORDS.filter((kw) =>
      haystack.includes(normalize(kw)),
    );
    if (matched.length > 0) {
      hits.push({ index, text, matched });
    }
  });

  return { flag: hits.length > 0, hits };
}
