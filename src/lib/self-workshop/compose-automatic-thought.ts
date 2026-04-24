export function composeAutomaticThought(
  primaryThought: string | null | undefined,
  worstCaseResult: string | null | undefined
): string {
  const p = (primaryThought ?? "").trim();
  const w = (worstCaseResult ?? "").trim();
  if (p && w) return `${p} 그 결과, ${w}`;
  if (p) return p;
  if (w) return w;
  return "";
}
