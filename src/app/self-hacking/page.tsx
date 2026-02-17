import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/* ── 배경 이미지 ── */
const PROGRAM_BG = [
  "/program-bg/program-bg-1.png",
  "/program-bg/program-bg-2.png",
];

/* ── 검사 카드 데이터 ── */
interface TestCardData {
  id: string;
  title: string;
  description: string;
  price: string;
  href: string;
  cta: string;
}

const TEST_CARDS: TestCardData[] = [
  {
    id: "husband-match",
    title: "남편상 검사",
    description:
      "유튜브 구독 목록을 AI가 분석해 나의 기질과 성격을 파악하고, 이상형 남편 유형을 매칭해 드립니다.",
    price: "무료",
    href: "/husband-match/onboarding",
    cta: "시작하기 →",
  },
  {
    id: "core-belief",
    title: "핵심 신념 검사",
    description:
      "문장완성 25문항을 통해 무의식 속 나에 대한 믿음, 타인에 대한 믿음, 세상에 대한 믿음을 탐색합니다.",
    price: "검사 무료 / 리포트 ₩19,900",
    href: "/self-hacking/core-belief",
    cta: "시작하기 →",
  },
];

export default async function SelfHackingPage() {
  /* 로그인 사용자: 이미 완료한 검사 확인 */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let completedTests = new Set<string>();

  if (user) {
    const [husbandRes, coreBeliefRes] = await Promise.all([
      supabase
        .from("phase1_results")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("core_belief_submissions")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (husbandRes.data) completedTests.add("husband-match");
    if (coreBeliefRes.data) completedTests.add("core-belief");
  }

  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto max-w-3xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[var(--foreground)] md:text-4xl">
            내면 분석 리포트
          </h1>
          <p className="mt-3 text-base text-[var(--foreground)]/70">
            나를 해독하는 셀프 검사를 선택하세요
          </p>
        </div>

        {/* 검사 카드 그리드 */}
        <div className="grid gap-6 sm:grid-cols-2">
          {TEST_CARDS.map((card, index) => {
            const bg = PROGRAM_BG[index % PROGRAM_BG.length];
            const isCompleted = completedTests.has(card.id);

            /* 완료된 검사: 결과 페이지로 분기 */
            const href = isCompleted
              ? card.id === "husband-match"
                ? "/husband-match/onboarding"
                : "/self-hacking/core-belief/result"
              : card.href;

            const ctaText = isCompleted ? "결과 보기 →" : card.cta;

            return (
              <Link key={card.id} href={href}>
                <div className="relative flex flex-col h-full overflow-hidden bg-white border-2 border-[var(--foreground)] rounded-2xl transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]">
                  {/* 수채화 배경 */}
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-40"
                    style={{ backgroundImage: `url('${bg}')` }}
                  />
                  <div className="relative z-10 flex flex-col h-full p-6">
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--foreground)]/70 flex-grow mb-4">
                      {card.description}
                    </p>

                    {/* 가격 */}
                    <p className="text-xs text-[var(--foreground)]/50 mb-3">
                      {card.price}
                    </p>

                    {/* CTA */}
                    <span className="inline-flex items-center text-sm font-semibold text-[var(--foreground)]">
                      {ctaText}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 홈 링크 */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
