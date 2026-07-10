import type { Metadata } from "next";
import { getSessionByToken } from "@/lib/intake/store";
import IntakeTestView from "./IntakeTestView";

/**
 * /intake/[token] — 내면 아이 상담 진단 검사 페이지 (SPEC Phase B).
 *
 * 토큰 링크가 곧 인증. 서버에서 세션을 조회해 상태 분기:
 *   - 세션 없음 → 유효하지 않은 링크 안내
 *   - completed → 이미 완료 안내 (재응시 불가)
 *   - expired → 만료 안내
 *   - issued / in_progress → 검사 진행 (IntakeTestView)
 *
 * ⚠️ 소비자 리드젠 퍼널(/inner-child)과 완전 별개 제품 — 결과·점수는 유저에게 절대 미노출.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "내면 아이 상담 진단 | GIBUN",
  description: "워크샵 사전 진단 검사입니다.",
  robots: { index: false, follow: false },
};

/** 검사 진행 불가 상태 안내 화면 (모노톤 — 결과·점수 미노출). */
function NoticeView({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-screen bg-white text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full rounded-2xl border-2 border-[var(--foreground)] bg-white p-8">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600 whitespace-pre-line">
            {body}
          </p>
        </div>
      </div>
    </main>
  );
}

export default async function IntakePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getSessionByToken(token);

  // 토큰 불일치 (또는 재발급으로 무효화된 이전 링크)
  if (!session) {
    return (
      <NoticeView
        title="유효하지 않은 링크예요"
        body={
          "검사 링크가 만료되었거나 잘못된 주소예요.\n담당 상담사 선생님께 링크를 다시 요청해주세요."
        }
      />
    );
  }

  // 1회 제출 소진 — 결과·점수는 어떤 경우에도 노출하지 않는다.
  if (session.status === "completed") {
    return (
      <NoticeView
        title="이미 검사를 완료하셨습니다"
        body={
          "이 링크의 검사는 한 번만 제출할 수 있어요.\n결과는 상담사 선생님이 세션 전에 직접 분석합니다. 세션에서 만나요."
        }
      />
    );
  }

  if (session.status === "expired") {
    return (
      <NoticeView
        title="만료된 링크예요"
        body={
          "이 검사 링크는 더 이상 사용할 수 없어요.\n담당 상담사 선생님께 새 링크를 요청해주세요."
        }
      />
    );
  }

  return <IntakeTestView token={token} displayName={session.display_name} />;
}
