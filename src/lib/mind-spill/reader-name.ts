/**
 * auth user → 리포트/워크북 표시용 이름.
 * user_metadata.name → 이메일 local part → "나".
 */
export function readerNameFrom(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  const meta = user.user_metadata ?? {};
  const name =
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.nickname === "string" && meta.nickname) ||
    "";
  if (name.trim()) return name.trim();
  if (user.email) return user.email.split("@")[0];
  return "나";
}
