import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "구독 해지 | 기분 스튜디오",
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ status?: string; email?: string }>;
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const { status, email } = await searchParams;

  const content = getContent(status, email);

  return (
    <main className="bg-[var(--surface)] min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center py-24">
        <h1
          className="text-2xl font-bold text-[var(--foreground)] mb-4 leading-snug"
          style={{ wordBreak: "keep-all" }}
        >
          {content.title}
        </h1>
        <p
          className="text-base text-[var(--foreground)]/70 leading-relaxed mb-8"
          style={{ wordBreak: "keep-all" }}
        >
          {content.body}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] hover:opacity-70 transition-opacity"
        >
          ← 홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}

function getContent(status?: string, email?: string) {
  switch (status) {
    case "ok":
      return {
        title: "구독이 해지되었습니다",
        body: `${email ? `${email} 주소로` : ""} 더 이상 기분 레터를 보내지 않을게요. 언제든 다시 구독하러 돌아와 주세요.`,
      };
    case "already":
      return {
        title: "이미 해지된 상태예요",
        body: `${email ? `${email}은(는) ` : ""}이미 구독이 해지되어 있어요. 추가 조치는 필요 없습니다.`,
      };
    case "invalid":
      return {
        title: "해지 링크가 유효하지 않아요",
        body: "링크가 만료되었거나 잘못된 토큰이에요. 수신함의 최신 기분 레터에서 해지 링크를 다시 확인해 주세요.",
      };
    case "error":
      return {
        title: "잠시 문제가 있었어요",
        body: "서버 오류로 해지 처리가 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.",
      };
    default:
      return {
        title: "구독 해지 페이지",
        body: "이메일 내 해지 링크를 통해 접근해 주세요.",
      };
  }
}
