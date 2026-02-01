import Link from "next/link";

export default function Program7DayPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <article className="prose prose-neutral max-w-none">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          7일 내면 아이 찾기
        </h1>
        <p className="mt-4 text-lg text-[var(--foreground)]/80">
          7일간 데일리 미션을 수행하고 7일차에 분석 리포트를 받는 프로그램
        </p>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            내면 아이란?
          </h2>
          <p className="mt-3 text-[var(--foreground)]/80 leading-relaxed">
            해소되지 않은 어린 자아입니다. 내면 아이가 세상을, 타인을, 나를 어떻게 보는지가
            내 관계를 결정합니다. 내면 아이가 자주 느끼는 감정, 생각, 핵심 신념을 7일간 알아보고
            분석해서 7일차에 1급 심리상담사가 직접 작성한 리포트를 얻는 프로그램입니다.
          </p>
          <p className="mt-3 text-[var(--foreground)]/80 leading-relaxed">
            반복되는 이유로 연애에 실패하고, 파트너와의 갈등에서 어떤 패턴이 반복되고 있는지,
            상담을 받아도 개선이 없고 같은 고민만 계속 이야기하고 있는 분들께 필요한 프로그램입니다.
            모든 반복되는 패턴 밑에는 내면 아이가 숨어 있습니다.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            7일간 이런 것들을 하게 돼요
          </h2>
          <ul className="mt-4 space-y-3 text-[var(--foreground)]/80">
            <li>
              <strong>데일리 미션</strong>: 매일 대화를 통해 감정일기를 작성하며 내가 자주 느끼는 감정, 자동 사고, 핵심 신념을 파악해요.
            </li>
            <li>
              <strong>1일차</strong>: TCI 검사
            </li>
            <li>
              <strong>2일차</strong>: 어린시절을 돌아보는 문장 완성 검사
            </li>
            <li>
              <strong>3일차</strong>: 생각과 사고 구분하기 활동지
            </li>
            <li>
              <strong>4일차</strong>: 핵심 신념 문장완성 검사
            </li>
            <li>
              <strong>5일차</strong>: 안좋은 습관을 돌아보는 Habit Mapper
            </li>
            <li>
              <strong>6일차</strong>: 내면 아이가 자주 빠지는 인지적 오류 검사
            </li>
            <li>
              <strong>7일차</strong>: 리포트 작성 및 전송
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            7일 뒤엔 이런 것들을 받게 돼요
          </h2>
          <p className="mt-3 text-[var(--foreground)]/80">
            1급 심리상담사가 직접 작성한 상세 리포트를 이메일과 카카오 알림톡으로 받아보실 수 있습니다.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            이런 분들께 추천해요
          </h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-[var(--foreground)]/80">
            <li>같은 이유로 연인과 자주 다투시는 분</li>
            <li>반복되는 패턴의 연애를 하시는 분</li>
            <li>결혼을 앞두고 서로를 깊이 이해하고 싶은 커플</li>
            <li>심리 상담을 받았지만 별 효용을 느끼지 못한 분</li>
          </ul>
        </section>

        <section className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">유의사항</h3>
          <ul className="mt-3 space-y-1 text-sm text-[var(--foreground)]/70">
            <li>• 리포트는 1일~6일차 미션을 모두 완료한 경우에 작성됩니다.</li>
            <li>• 구매 후 14일 내에 미션을 수행하지 못하면 리포트가 제공되지 않습니다.</li>
            <li>• 감정일기는 작성하지 않아도 리포트 요청이 가능합니다.</li>
          </ul>
        </section>
      </article>

      <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-2xl font-bold text-[var(--foreground)]">
          정가 99,000원
        </p>
        <Link
          href="/payment/7day"
          className="inline-flex w-full justify-center rounded-lg bg-[var(--accent)] px-8 py-4 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)] sm:w-auto"
        >
          구매하기
        </Link>
      </div>
    </div>
  );
}
