const TCI_AXES = [
  { name: "자극추구", score: 44, desc: "새로운 자극을 찾는 정도" },
  { name: "위험회피", score: 17, desc: "불확실성을 피하는 정도" },
  { name: "연대감", score: 49, desc: "타인과의 유대 욕구" },
  { name: "인내력", score: 61, desc: "보상 없이 버티는 힘" },
  { name: "자율성", score: 77, desc: "스스로 결정하려는 의지" },
  { name: "자기초월", score: 100, desc: "삶의 의미를 추구하는 깊이" },
];

const RESULT_CARDS = [
  { num: 1, title: "인트로", desc: "당신의 구독 목록이 말하는 이야기" },
  { num: 2, title: "구독 데이터 개요", desc: "TCI 6축 분석 그래프 + 희소성" },
  { num: 3, title: "성격 + 기질", desc: "성격 유형, 내면의 모순, 세계관" },
  { num: 4, title: "스트레스 반응", desc: "분노 패턴, 트리거, 회복 방법" },
  { num: 5, title: "추구하는 미래", desc: "성격의 뿌리, 지금, 앞으로의 나" },
  { num: 6, title: "딜브레이커 + 행복", desc: "참을 수 없는 것과 행복 공식" },
  { num: 7, title: "배우자 타입 매칭", desc: "48개 유형 중 나에게 맞는 사람" },
  { num: 8, title: "파트너 상세 프로필", desc: "일상, 갈등, 오래된 관계 패턴" },
  { num: 9, title: "다음 스텝", desc: "더 깊은 분석으로의 안내" },
];

export default function HowItWorks() {
  return (
    <>
      {/* ── Step 1: 유튜브 구독 채널 분석 ── */}
      <section className="py-20">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--foreground)] text-white text-sm font-bold flex items-center justify-center">
            1
          </span>
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40">
            구독 채널 분석
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-4 leading-snug"
              style={{ wordBreak: "keep-all" }}
            >
              유튜브 구독 목록을 통해 당신에 대해 먼저 알아봅니다
            </h2>
            <p
              className="text-base leading-relaxed text-[var(--foreground)]/60 mb-4"
              style={{ wordBreak: "keep-all" }}
            >
              당신이 구독하는 채널들은 결코 무작위가 아닙니다. 새벽에 혼자 트는
              영상, 반복해서 찾게 되는 주제 — 이것이 당신의 무의식적 욕구와
              기질을 그대로 반영합니다.
            </p>
            <p
              className="text-base leading-relaxed text-[var(--foreground)]/60"
              style={{ wordBreak: "keep-all" }}
            >
              AI가 구독 채널을 카테고리별로 분류하고, 각 카테고리가 심리적으로
              무엇을 의미하는지 분석합니다.
            </p>
          </div>

          {/* 폰 목업 + 영상 */}
          <div className="flex justify-center">
            <div className="w-[240px] rounded-[2.5rem] border-2 border-[var(--foreground)] bg-[var(--foreground)] p-2">
              <div className="mx-auto w-20 h-4 rounded-b-lg bg-[var(--foreground)] relative z-10" />
              <div className="rounded-[2rem] overflow-hidden bg-white -mt-1">
                <video autoPlay loop muted playsInline className="w-full h-auto">
                  <source src="/videos/report-demo.mov" type="video/mp4" />
                </video>
              </div>
              <div className="mt-2 mx-auto w-24 h-1 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Step 2: TCI 기질 이론으로 성격 구조 도출 ── */}
      <section className="py-20 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--foreground)] text-white text-sm font-bold flex items-center justify-center">
            2
          </span>
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40">
            TCI 기질 분석
          </p>
        </div>

        <h2
          className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-4 leading-snug"
          style={{ wordBreak: "keep-all" }}
        >
          구독 패턴에서 TCI 6축 기질 점수를 도출합니다
        </h2>
        <p
          className="text-base leading-relaxed text-[var(--foreground)]/60 mb-8"
          style={{ wordBreak: "keep-all" }}
        >
          MBTI는 성격 유형만 봅니다. TCI는 유전적으로 타고난 기질(4가지)과
          경험으로 발전하는 성격(3가지)을 함께 분석합니다.
          카테고리별 가중치를 적용해 당신만의 6축 점수를 산출하고,
          MBTI와 에니어그램 유형까지 함께 추정합니다.
        </p>

        {/* 6축 바 차트 */}
        <div className="space-y-3 mb-8">
          {TCI_AXES.map((axis) => (
            <div key={axis.name} className="flex items-center gap-3">
              <span className="w-16 text-sm font-semibold text-[var(--foreground)] text-right flex-shrink-0">
                {axis.name}
              </span>
              <div className="flex-1 h-6 rounded-full bg-[var(--foreground)]/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--foreground)] transition-all"
                  style={{ width: `${axis.score}%` }}
                />
              </div>
              <span className="w-8 text-sm font-bold text-[var(--foreground)] text-right flex-shrink-0">
                {axis.score}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--foreground)]/40 text-center">
          * 실제 테스트 데이터 기반 샘플 결과입니다
        </p>
      </section>

      {/* ── Step 3: 배우자 매칭 + 9장 카드 ── */}
      <section className="py-20 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--foreground)] text-white text-sm font-bold flex items-center justify-center">
            3
          </span>
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40">
            배우자 매칭 + 리포트 발급
          </p>
        </div>

        <h2
          className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-4 leading-snug"
          style={{ wordBreak: "keep-all" }}
        >
          48개 유형 중 나에게 맞는 배우자를 찾아드립니다
        </h2>
        <p
          className="text-base leading-relaxed text-[var(--foreground)]/60 mb-4"
          style={{ wordBreak: "keep-all" }}
        >
          TCI 6축 + MBTI + 에니어그램을 조합한 18차원 벡터로 48개 배우자 유형과
          매칭합니다. 단순한 유형 분류가 아니라, 당신의 기질 구조와 가장
          잘 맞는 파트너 유형을 데이터로 찾아냅니다.
        </p>

        {/* 핵심 메시지 */}
        <div className="border-y-2 border-[var(--foreground)]/10 py-5 mb-10 text-center">
          <p className="text-lg sm:text-xl font-semibold text-[var(--foreground)]">
            9장 카드, 즉시 발급, 완전 무료.
          </p>
          <p
            className="text-sm text-[var(--foreground)]/50 mt-1"
            style={{ wordBreak: "keep-all" }}
          >
            너무 적나라해서 충격적일 수 있으니 주의하세요
          </p>
        </div>

        {/* 9장 카드 그리드 */}
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-6">
          받게 되는 9장의 카드
        </h3>
        <div className="grid grid-cols-3 gap-2.5 mb-10">
          {RESULT_CARDS.map((card) => (
            <div
              key={card.num}
              className="rounded-xl border-2 border-[var(--foreground)] p-3 transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--foreground)] text-white text-[9px] font-bold mb-1.5">
                {card.num}
              </span>
              <h4
                className="text-xs font-bold text-[var(--foreground)] mb-0.5"
                style={{ wordBreak: "keep-all" }}
              >
                {card.title}
              </h4>
              <p className="text-[10px] text-[var(--foreground)]/50 leading-snug">
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 px-8 py-3 text-base font-medium rounded-lg cursor-not-allowed border-2 border-[var(--foreground)]/30 text-[var(--foreground)]/50"
          >
            알림 신청
          </button>
        </div>
      </section>
    </>
  );
}
