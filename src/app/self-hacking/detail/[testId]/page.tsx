import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTestById, EXPERT_PROFILE } from "@/lib/self-hacking/test-catalog";
import CtaButton from "./CtaButton";
import FaqAccordion from "./FaqAccordion";

interface PageProps {
  params: Promise<{ testId: string }>;
}

export default async function TestDetailPage({ params }: PageProps) {
  const { testId } = await params;
  const test = getTestById(testId);
  if (!test) notFound();

  /* notifyOnly 검사는 상세 페이지 접근 차단 */
  if (test.notifyOnly) redirect("/self-hacking");

  const { detail } = test;
  const isPaid = test.category === "paid";

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 pt-16 pb-32">
        {/* 뒤로가기 */}
        <Link
          href="/self-hacking"
          className="inline-flex items-center text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] mb-8"
        >
          ← 검사 목록
        </Link>

        {/* ① 히어로 */}
        <section className="py-20 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] leading-snug whitespace-pre-line">
            {detail.hero.hook}
          </h1>
          <p className="mt-4 text-base text-[var(--foreground)]/60">
            {detail.hero.tagline}
          </p>
        </section>

        {/* ② 소셜 프루프 */}
        <section className="py-10 border-y-2 border-[var(--foreground)]/10">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {detail.socialProof.map((item) => (
              <p
                key={item}
                className="text-sm sm:text-base font-semibold text-[var(--foreground)]"
              >
                {item}
              </p>
            ))}
          </div>
        </section>

        {/* ③ 공감 (painPoints) */}
        <section className="py-16">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
            혹시 이런 고민 있으신가요?
          </h2>
          <div className="flex flex-wrap gap-3">
            {detail.painPoints.map((point) => (
              <span
                key={point}
                className="inline-block px-4 py-2.5 text-sm rounded-full border-2 border-[var(--foreground)] text-[var(--foreground)]"
              >
                {point}
              </span>
            ))}
          </div>
        </section>

        {/* ④ 원인 → 해결 */}
        <section className="py-16 text-center">
          <p className="text-lg text-[var(--foreground)]/60">
            {detail.cause.before}
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
            {detail.cause.highlight}
          </p>
        </section>

        {/* ⑤ 인사이트 라인 */}
        <section className="py-12 border-y-2 border-[var(--foreground)]/10 text-center">
          <p className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] leading-relaxed">
            {detail.insightLine}
          </p>
        </section>

        {/* ⑥ 비교 테이블 */}
        {detail.comparison && (
          <section className="py-16">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
              이 검사 vs 일반 검사
            </h2>
            <div className="overflow-hidden rounded-2xl border-2 border-[var(--foreground)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--foreground)] text-white">
                    <th className="px-4 py-3 text-left font-semibold">항목</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      기분스튜디오
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      일반 검사
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detail.comparison.rows.map((row, i) => (
                    <tr
                      key={row.label}
                      className={i % 2 === 1 ? "bg-[var(--foreground)]/5" : ""}
                    >
                      <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                        {row.label}
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground)]">
                        {row.ours}
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground)]/50">
                        {row.general}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ⑦ 검사 소개 (스토리텔링) */}
        <section className="py-16">
          <div className="rounded-2xl bg-[var(--foreground)]/5 p-8">
            <p className="text-xl font-bold text-[var(--foreground)] mb-3">
              &ldquo;{detail.testIntro.question}&rdquo;
            </p>
            <p className="text-lg font-semibold text-[var(--foreground)] mb-4">
              {detail.testIntro.answer}
            </p>
            <p className="text-sm leading-relaxed text-[var(--foreground)]/70">
              {detail.testIntro.explanation}
            </p>
          </div>
        </section>

        {/* ⑧ 검사 정보 */}
        <section className="py-16">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
            검사 정보
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "문항 수", value: detail.specs.questions },
              { label: "소요 시간", value: detail.specs.duration },
              { label: "대상", value: detail.specs.target },
              { label: "가격", value: test.price },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border-2 border-[var(--foreground)] p-4"
              >
                <p className="text-xs text-[var(--foreground)]/50 mb-1">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ⑨ 제공 자료 */}
        <section className="py-16">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
            제공 자료
          </h2>
          <div className="space-y-3">
            {detail.deliverables.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--foreground)] text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-sm text-[var(--foreground)] pt-1">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ⑩ 진행 방법 (세로 타임라인) */}
        <section className="py-16">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
            진행 방법
          </h2>
          <div className="relative pl-10">
            {/* 타임라인 점선 */}
            <div className="absolute left-3.5 top-0 bottom-0 w-px border-l-2 border-dashed border-[var(--foreground)]/20" />
            <div className="space-y-8">
              {detail.steps.map((step, i) => (
                <div key={i} className="relative flex items-start gap-4">
                  {/* 원형 번호 */}
                  <span className="absolute -left-10 flex-shrink-0 w-7 h-7 rounded-full bg-[var(--foreground)] text-white text-xs font-bold flex items-center justify-center z-10">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm text-[var(--foreground)] pt-0.5">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⑪ 전문가 소개 */}
        <section className="py-16">
          <div className="rounded-2xl border-2 border-[var(--foreground)] p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              담당 전문가
            </h2>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[var(--foreground)]/10 flex items-center justify-center text-lg font-bold text-[var(--foreground)]">
                {EXPERT_PROFILE.name[0]}
              </div>
              <div>
                <p className="font-semibold text-[var(--foreground)]">
                  {EXPERT_PROFILE.name}
                </p>
                <p className="text-sm text-[var(--foreground)]/60 mb-2">
                  {EXPERT_PROFILE.title}
                </p>
                <p className="text-sm leading-relaxed text-[var(--foreground)]/70">
                  {EXPERT_PROFILE.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ⑫ FAQ */}
        <section className="py-16">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
            자주 묻는 질문
          </h2>
          <FaqAccordion items={detail.faq} />
        </section>
      </div>

      {/* ⑬ CTA 하단 고정 */}
      <CtaButton
        href={test.testHref}
        label={isPaid ? `${test.price} 결제하기` : "무료로 시작하기"}
      />
    </div>
  );
}
