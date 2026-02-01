import Link from "next/link";

const COUNSELING_TYPES = [
  {
    id: "inner-child",
    title: "내면 아이 해석 상담",
    price: "80,000원",
    duration: "1시간",
    requirement: "7일 내면 아이 찾기 프로그램 수료자만 신청 가능",
    description: "7일 내면 아이 찾기 결과 리포트를 해석해주는 상담",
    recommended: "7일 프로그램을 완료하고 결과를 더 깊이 이해하고 싶은 분",
  },
  {
    id: "couple",
    title: "커플 내면 아이 상담",
    price: "150,000원",
    duration: "1시간",
    requirement: "둘 다 7일 내면 아이 찾기 프로그램 수료 필요",
    description: "2인에 15만원. 파트너와 함께 내면 아이를 이해하고 관계 패턴을 탐색하는 상담",
    recommended: "결혼을 앞둔 커플, 관계 개선을 원하는 부부",
  },
  {
    id: "package",
    title: "패키지 상담",
    price: "200,000원",
    duration: "1시간",
    requirement: null,
    description: "3가지 유료 검사를 통해 나를 더 심층있게 알아보는 풀패키지 상담",
    recommended: "자신을 더 깊이 알고 싶은 분",
  },
  {
    id: "individual",
    title: "1:1 개인 상담",
    price: "100,000원",
    duration: "1시간",
    requirement: null,
    description: "이별, 애도, 불안, 우울 등 개인 고민에 맞춘 개인 상담",
    recommended: "개인적 어려움으로 상담이 필요한 분",
  },
];

export default function ProgramCounselingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <article className="prose prose-neutral max-w-none">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          1:1 심리 상담
        </h1>
        <p className="mt-4 text-lg text-[var(--foreground)]/80">
          1급 심리 상담사와의 1:1 상담. 결제 후 캘린더를 통해 예약 가능 시간을 확인하고
          간단한 서베이를 제출하면, 심리 상담사가 시간을 확정하는 예약 시스템입니다.
        </p>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            상담 종류
          </h2>
          <div className="mt-6 space-y-8">
            {COUNSELING_TYPES.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[var(--border)] bg-white p-6"
              >
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-2xl font-bold text-[var(--accent)]">
                  {item.price} <span className="text-sm font-normal text-[var(--foreground)]/60">/ {item.duration}</span>
                </p>
                <p className="mt-3 text-[var(--foreground)]/80">{item.description}</p>
                {item.requirement && (
                  <p className="mt-2 text-sm text-[var(--foreground)]/60">
                    ※ {item.requirement}
                  </p>
                )}
                <p className="mt-2 text-sm text-[var(--foreground)]/70">
                  추천: {item.recommended}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            예약 플로우
          </h2>
          <ol className="mt-4 list-inside list-decimal space-y-2 text-[var(--foreground)]/80">
            <li>상담 카테고리 선택 → 입금 → 코치 입금 확인 → 구매 활성화</li>
            <li>예약 요청: 캘린더에서 코치가 설정한 가능 시간 선택 → 서베이 제출</li>
            <li>코치 확정: 예약 확정 + 줌 링크 노출</li>
            <li>상담일 2일 전까지 시간 변경 요청 가능</li>
          </ol>
        </section>
      </article>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link
          href="/payment/counseling/inner-child"
          className="rounded-lg border border-[var(--border)] bg-white p-4 text-center font-medium transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface)]"
        >
          내면 아이 해석 상담 신청
        </Link>
        <Link
          href="/payment/counseling/couple"
          className="rounded-lg border border-[var(--border)] bg-white p-4 text-center font-medium transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface)]"
        >
          커플 내면 아이 상담 신청
        </Link>
        <Link
          href="/payment/counseling/package"
          className="rounded-lg border border-[var(--border)] bg-white p-4 text-center font-medium transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface)]"
        >
          패키지 상담 신청
        </Link>
        <Link
          href="/payment/counseling/individual"
          className="rounded-lg border border-[var(--border)] bg-white p-4 text-center font-medium transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface)]"
        >
          1:1 개인 상담 신청
        </Link>
      </div>
    </div>
  );
}
