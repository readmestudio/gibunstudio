/**
 * 워크북 기능 플래그.
 *
 * IFS 상담사형 적응형 대화 단계 롤아웃 제어. 기본 OFF —
 * 플래그가 꺼져 있으면 기존 폼 기반 단계가 그대로 동작한다.
 *
 * 활성 조건 (둘 중 하나):
 *  - env `WORKSHOP_ADAPTIVE_STEPS` = "on" (전체 활성)
 *  - env `ADAPTIVE_STEPS_ALLOWLIST` (쉼표 구분 이메일)에 해당 사용자 포함
 */
export function isAdaptiveStepsEnabled(email?: string | null): boolean {
  if (process.env.WORKSHOP_ADAPTIVE_STEPS === "on") return true;

  if (email) {
    const allow = (process.env.ADAPTIVE_STEPS_ALLOWLIST ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allow.includes(email.toLowerCase())) return true;
  }

  return false;
}
