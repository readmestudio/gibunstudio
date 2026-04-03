import Link from "next/link";

const FREE_ITEMS = [
  "TCI 6축 기질 분석 그래프",
  "기본 성격 + 기질 분석",
  "관계 패턴 + 갈등 스타일",
  "스트레스 반응 패턴",
  "딜브레이커 + 행복 공식",
  "나에게 맞는 남편 타입 매칭",
];

const PAID_ITEMS = [
  "YouTube × 설문 교차 검증",
  "인생 가치관 + 숨겨진 욕망",
  "무의식 욕구 분석",
  "CBT 감정 도미노 (자동적 사고)",
  "핵심 신념 발굴",
  "관계 패턴 영향 분석",
  "가장 깊은 두려움",
  "성장 포인트 3가지 실천 과제",
  "심층 매칭 (교차검증 결과)",
  "당신에게 보내는 마무리 편지",
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20">
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3 text-center">
        요금 안내
      </p>
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-3"
        style={{ wordBreak: "keep-all" }}
      >
        무료로 시작해 충분히 확인한 뒤 결정하면 됩니다
      </h2>
      <p className="text-base text-[var(--foreground)]/60 text-center mb-12">
        결제 없이 9장 무료 리포트를 먼저 받아보세요.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* 무료 카드 */}
        <div className="rounded-2xl border border-[var(--border)] p-6">
          <p className="text-xs font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-2">
            무료 리포트
          </p>
          <p className="text-3xl font-bold text-[var(--foreground)] mb-1">
            0원
          </p>
          <p
            className="text-sm text-[var(--foreground)]/50 mb-6"
            style={{ wordBreak: "keep-all" }}
          >
            유튜브 구독 채널만 있으면 시작 가능
          </p>
          <ul className="space-y-2.5">
            {FREE_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--foreground)]/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-[var(--foreground)]/70">
                  {item}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/husband-match/birth-info"
            className="mt-6 block w-full text-center py-3 rounded-lg border-2 border-[var(--foreground)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
          >
            무료로 시작하기
          </Link>
        </div>

        {/* 유료 카드 */}
        <div className="relative rounded-2xl border-2 border-[var(--foreground)] p-6">
          <span className="absolute -top-3 left-6 px-3 py-0.5 text-xs font-bold bg-[var(--foreground)] text-white rounded-full">
            추천
          </span>
          <p className="text-xs font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-2">
            분자 형성 이유까지
          </p>
          <p className="text-3xl font-bold text-[var(--foreground)] mb-1">
            9,900원
          </p>
          <p
            className="text-sm text-[var(--foreground)]/50 mb-6"
            style={{ wordBreak: "keep-all" }}
          >
            무료 분석 완료 후 진행 가능
          </p>
          <ul className="space-y-2.5">
            {PAID_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--foreground)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-[var(--foreground)]">
                  {item}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 block w-full text-center py-3 rounded-lg bg-[var(--foreground)] text-sm font-medium text-white">
            무료 분석 후 구매 가능
          </div>
        </div>
      </div>
    </section>
  );
}
