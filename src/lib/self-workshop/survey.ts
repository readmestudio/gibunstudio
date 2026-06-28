// 워크북 맞춤 제작 설문 — 선택지 정의(단일 출처).
// 폼/검증/저장에서 같은 id를 쓰도록 여기서 관리한다.

export interface ConcernOption {
  id: string;
  label: string;
}

/**
 * 고민 키워드(복수 선택). 가볍게 고를 수 있도록 짧은 단어형으로 둔다.
 * "기타"는 옵션에 포함하지 않고 폼에서 별도 토글 + 주관식으로 처리한다.
 */
export const SURVEY_CONCERN_OPTIONS: ConcernOption[] = [
  { id: "anxiety", label: "불안" },
  { id: "burnout", label: "번아웃" },
  { id: "relationship", label: "관계" },
  { id: "depression", label: "우울감" },
  { id: "achievement", label: "성취중독" },
  { id: "perfectionism", label: "완벽주의" },
  { id: "self_criticism", label: "자기비판" },
  { id: "self_esteem", label: "자존감" },
  { id: "lethargy", label: "무기력" },
  { id: "anger", label: "분노 조절" },
  { id: "sleep", label: "불면" },
  { id: "relationship_family", label: "가족" },
];

const CONCERN_LABELS: Record<string, string> = Object.fromEntries(
  SURVEY_CONCERN_OPTIONS.map((o) => [o.id, o.label])
);

/**
 * 선택된 고민 id 목록 + 기타 주관식을 사람이 읽을 수 있는 한 줄 문자열로 합친다.
 * 저장(concern 컬럼)과 검증에서 공통으로 쓴다. 예: "불안, 번아웃, 기타: 이직 고민"
 */
export function buildConcernText(ids: string[], etc: string): string {
  const parts = ids
    .filter((id) => id !== "etc" && CONCERN_LABELS[id])
    .map((id) => CONCERN_LABELS[id]);
  const trimmedEtc = etc.trim();
  if (trimmedEtc) parts.push(`기타: ${trimmedEtc}`);
  return parts.join(", ");
}
