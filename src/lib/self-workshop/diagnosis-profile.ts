/**
 * DiagnosisProfile
 *
 * Step 3 "나의 성취 중독 패턴 찾기" 상단에서 보여주는
 * 진단 결과 기반 캐릭터 프로필. `personalize-report` API가 LLM으로 생성해
 * `workshop_progress.diagnosis_profile` JSONB 컬럼에 캐시합니다.
 *
 * diagnosis_scores 만으로 만들어지므로, 실습(mechanism_analysis) 이전 단계에서
 * 사용자에게 자기 패턴의 얼개를 한눈에 보여주는 용도입니다.
 */

export interface DiagnosisProfile {
  /** 따옴표 포함 12자 이내 은유적 캐릭터 한 줄. 예: '"뒤처짐"에 쫓기는 경주자' */
  character_line: string;
  /** 캐릭터 네이밍의 의미를 풀어내는 2~3문장 */
  character_description: string;
  life_impact: {
    /** 일·업무 영역 1~2문장 */
    work: string;
    /** 사람·관계 영역 1~2문장 */
    relationship: string;
    /** 쉼·여가 영역 1~2문장 */
    rest: string;
    /** 몸·신체 감각 1~2문장 */
    body: string;
  };
}

export function isDiagnosisProfile(v: unknown): v is DiagnosisProfile {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const p = v as Partial<DiagnosisProfile>;

  if (
    typeof p.character_line !== "string" ||
    p.character_line.trim().length === 0
  ) {
    return false;
  }
  if (
    typeof p.character_description !== "string" ||
    p.character_description.trim().length === 0
  ) {
    return false;
  }

  const li = p.life_impact;
  if (!li || typeof li !== "object") return false;
  for (const k of ["work", "relationship", "rest", "body"] as const) {
    if (typeof li[k] !== "string" || li[k].trim().length === 0) return false;
  }

  return true;
}
