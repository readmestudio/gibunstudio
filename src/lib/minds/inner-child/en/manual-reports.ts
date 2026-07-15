/**
 * 영어 퍼널 — 손으로 쓴 유료 리포트의 타입 + 판정(순수).
 *
 * 영어판은 해외 결제가 없어 "Request the full report · $9.90" → 베타 무료 → 운영자가 직접
 * 써서 보낸다(자동 생성 파이프라인 미착수). 그 원고를 이메일 본문에 넣으면 Gmail 에서 잘리고
 * 제품이 아니라 편지로 읽히므로, leadId 로 열리는 페이지(`/inner-child/en/full/[id]`)로 준다.
 *
 * ⚠️ **원고는 코드에 두지 않는다. 반드시 DB(minds_leads.parts_map.manual_report)에 넣는다.**
 *    원고는 특정 개인의 심리검사 응답을 인용한 개인정보이고 이 저장소는 공개다. 코드 파일에
 *    넣으면 본인이 동의한 적 없는 데이터가 공개 저장소와 검색에 영구히 남는다.
 *    parts_map 은 이미 jsonb 라 마이그레이션이 필요 없고, `readFreeReportBlob` 은 test_version
 *    과 score_result 만 검증하므로 sibling 키 추가는 무료 리포트에 영향이 없다.
 *
 * 이 모듈은 **순수**하다(타입 + 판정만). DB 조회는 `manual-report-store.ts` — 무료 리포트의
 * `free-report-store.ts` 와 같은 구성이다.
 *
 * 원고 등록 절차와 이메일 템플릿: `docs/EN_REPORT_DELIVERY.md`
 */

/** 본문 블록 — 문단 / 본인이 쓴 문장 인용 / 강조 콜아웃 / 실행 스텝 / 큰 한 문장. */
export type ManualBlock =
  | { kind: "p"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "callout"; label: string; text: string }
  | { kind: "steps"; items: { title: string; text: string }[] }
  | { kind: "line"; text: string };

export interface ManualSection {
  n: string; // "01"
  title: string;
  blocks: ManualBlock[];
}

export interface ManualReport {
  schema_id: string; // TypeAvatar 조회용
  child_name: string;
  /** 히어로 아래 한 줄 — 이 사람에게만 해당하는 요약. */
  hook: string;
  intro: string[];
  sections: ManualSection[];
  closing: string[];
  /**
   * 열람 만료 시각(ISO). 등록 스크립트가 기본 7일로 넣는다.
   *
   * 고객에게 "7일 후 만료"라고 안내하므로 **실제로 만료돼야 한다.** 안내만 하고 열어두면
   * 그건 고객에게 하는 거짓말이다. 만료 후에는 회신으로 재발급(스크립트 재실행)한다.
   * 값이 없으면 만료 없음(과거 원고 호환).
   */
  expires_at?: string;
}

/** 만료됐나. expires_at 이 없거나 파싱 불가면 만료 없음으로 본다(열어주는 쪽이 안전). */
export function isManualReportExpired(report: ManualReport, now: Date = new Date()): boolean {
  if (!report.expires_at) return false;
  const at = Date.parse(report.expires_at);
  if (Number.isNaN(at)) return false;
  return now.getTime() > at;
}

/** parts_map.manual_report 원본(unknown)을 형태 검증. 깨졌으면 null(캐스팅 금지). */
export function readManualReport(raw: unknown): ManualReport | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.schema_id !== "string" || !o.schema_id) return null;
  if (typeof o.child_name !== "string" || !o.child_name) return null;
  if (!Array.isArray(o.sections) || o.sections.length === 0) return null;
  return {
    schema_id: o.schema_id,
    child_name: o.child_name,
    hook: typeof o.hook === "string" ? o.hook : "",
    intro: Array.isArray(o.intro) ? (o.intro.filter((t) => typeof t === "string") as string[]) : [],
    sections: o.sections as ManualSection[],
    closing: Array.isArray(o.closing)
      ? (o.closing.filter((t) => typeof t === "string") as string[])
      : [],
    expires_at: typeof o.expires_at === "string" ? o.expires_at : undefined,
  };
}
