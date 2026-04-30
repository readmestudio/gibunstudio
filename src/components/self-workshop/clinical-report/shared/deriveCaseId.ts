/**
 * 임상 리포트 헤더에 표시할 CASE ID를 derive.
 * 형식: "CASE-{대문자 8자 hex}"
 *
 * workshop_id (UUID 등 어떤 식별자든)에서 hex 문자만 뽑아 앞 8자를 대문자로.
 * 동일한 workshopId는 항상 같은 CASE ID를 반환 — 사용자가 여러 번 열어도 안정적.
 */
export function deriveCaseId(workshopId: string | null | undefined): string {
  if (!workshopId) return "CASE-00000000";
  const hex = workshopId.replace(/[^0-9a-fA-F]/g, "");
  const prefix = (hex.slice(0, 8) || "00000000").toUpperCase().padEnd(8, "0");
  return `CASE-${prefix}`;
}
