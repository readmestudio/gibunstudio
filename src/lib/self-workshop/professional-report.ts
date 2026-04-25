/**
 * SUMMARY · 1단계: 전문 상담사 리포트
 *
 * "심리 상담사가 작성한 통합 리포트" 톤.
 * 도입 → 분석 → 변화 여정 → DO & DON'Ts 5+5 구조.
 */

export interface DoDontItem {
  /** 12자 이내 짧은 제목 */
  title: string;
  /** 60~120자 설명 */
  description: string;
}

export interface ProfessionalReport {
  intro: {
    /** 사용자 이름 + 1~2문단 인사 */
    greeting: string;
    /** 진단 점수/레벨/4영역의 임상적 의미를 일상어로 풀어쓴 3~5문장 */
    diagnosis_summary: string;
  };
  analysis: {
    /** 핵심 패턴 한 줄 */
    headline: string;
    /** 자동사고 → 핵심 신념 → 6-Part 사이클 서술 (3~5문단, 사용자 표현 직접 인용) */
    body: string;
    /** 사용자 자동사고/표현 직접 인용 모음 (1~3개) */
    cognitive_error_quotes: string[];
  };
  transformation: {
    /** 변화의 핵심 한 줄 */
    headline: string;
    /** 새 핵심 신념 + 대체 사고 + 실천 계획이 사이클을 어떻게 끊는지 (3~5문단) */
    body: string;
  };
  do_donts: {
    /** 새 핵심 신념과 일관된 행동 — 정확히 5개 */
    dos: DoDontItem[];
    /** 옛 핵심 신념을 강화하는 행동 — 정확히 5개 */
    donts: DoDontItem[];
  };
  generated_at: string;
}

/* ─────────────── 타입 가드 ─────────────── */

function isString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isDoDontItem(v: unknown): v is DoDontItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Partial<DoDontItem>;
  return isString(o.title) && isString(o.description);
}

export function isProfessionalReport(v: unknown): v is ProfessionalReport {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const r = v as Partial<ProfessionalReport>;

  if (!r.intro || typeof r.intro !== "object") return false;
  if (!isString(r.intro.greeting)) return false;
  if (!isString(r.intro.diagnosis_summary)) return false;

  if (!r.analysis || typeof r.analysis !== "object") return false;
  if (!isString(r.analysis.headline)) return false;
  if (!isString(r.analysis.body)) return false;
  if (!Array.isArray(r.analysis.cognitive_error_quotes)) return false;

  if (!r.transformation || typeof r.transformation !== "object") return false;
  if (!isString(r.transformation.headline)) return false;
  if (!isString(r.transformation.body)) return false;

  if (!r.do_donts || typeof r.do_donts !== "object") return false;
  if (!Array.isArray(r.do_donts.dos) || r.do_donts.dos.length !== 5) {
    return false;
  }
  if (!Array.isArray(r.do_donts.donts) || r.do_donts.donts.length !== 5) {
    return false;
  }
  for (const item of r.do_donts.dos) if (!isDoDontItem(item)) return false;
  for (const item of r.do_donts.donts) if (!isDoDontItem(item)) return false;

  if (!isString(r.generated_at)) return false;

  return true;
}
