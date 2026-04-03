"use client";

const STATS = [
  { value: "4.9", label: "평균 별점 (5점 만점)" },
  { value: "91%", label: "무료 후 심층 구매율" },
  { value: "3분", label: "평균 리포트 열람 시간" },
  { value: "★★★★★", label: "\"정확도에 소름 돋았어요\"" },
];

const FEATURED = {
  badge: "심층 리포트",
  content:
    "3년 만난 남자친구랑 결혼 얘기가 나올 때마다 이상하게 가슴이 답답했어요. 좋은 사람인 건 아는데 왜 확신이 안 드는지 몰랐거든요. 리포트 보고 나서야 제가 '완벽하게 준비되지 않으면 시작하면 안 된다'는 핵심 신념을 갖고 있다는 걸 알았어요. 그날 밤 파트너와 첫 진지한 대화를 시작했습니다.",
};

const REVIEWS = [
  {
    badge: "심층 리포트",
    content:
      "감정 도미노 카드가 제일 충격이었어요. '연인이 진지한 얘기 하자고 했을 때 가장 먼저 떠오르는 생각'에 '내가 뭘 잘못했지?'라고 썼는데, 이게 자동적 사고라는 거랑 연결해서 설명해주는데 처음으로 내가 왜 매번 사과부터 하는지 이해됐어요.",
    highlight:
      "유튜브 채널 목록만 넣었는데 이 정도 정확도가 나온다는 게 신기했고, 심층은 훨씬 더 구체적이었습니다.",
    name: "혜린",
    age: "28세",
    status: "솔로",
    action: "무료 후 심층 구매",
  },
  {
    badge: "무료 리포트",
    content:
      "무료 리포트만 봤는데도 충분히 놀라웠어요. 스트레스 반응 카드에서 '감정을 쌓아두다가 전혀 다른 일로 폭발한다'는 부분이 너무 정확해서 캡처해서 남자친구한테 보냈어요. '나 원래 이래'라고 설명할 말이 없었는데 이걸로 대신 설명됐어요.",
    highlight:
      "무료인데 이 정도면, 유료는 얼마나 정확할지 궁금해서 바로 결제했어요.",
    name: "수빈",
    age: "26세",
    status: "1년 교제 중",
    action: "무료 → 심층 구매",
  },
  {
    badge: "심층 리포트",
    content:
      "핵심 신념 카드에서 '사랑받으려면 상대의 기대에 맞춰야 한다'가 나왔는데, 읽는 순간 눈물이 났어요. 그동안 연애할 때마다 나를 잃어버리는 느낌이 들었던 이유를 처음 언어로 만난 느낌이었습니다.",
    highlight:
      "심리 상담 3개월 다닌 것보다 카드 한 장이 더 정확했어요.",
    name: "지원",
    age: "30세",
    status: "최근 이별",
    action: "무료 후 심층 구매",
  },
  {
    badge: "무료 리포트",
    content:
      "솔직히 유튜브 구독으로 뭘 알겠어 싶었는데, 기질 분석 그래프가 너무 정확해서 소름 돋았어요. 위험회피가 높고 자극추구가 낮다는 게 제 연애 패턴이랑 정확히 맞았거든요.",
    highlight:
      "반신반의하다가 결과 보고 입이 떡 벌어졌습니다.",
    name: "민지",
    age: "27세",
    status: "솔로",
    action: "무료 리포트",
  },
  {
    badge: "무료 리포트",
    content:
      "남편상 매칭 카드에서 추천된 유형이 '지금 만나는 사람이랑 거의 비슷한 것 같은데?' 싶어서 바로 심층 리포트 결제했어요. 무료만으로도 충분히 정확한데, 심층에서 그 사람이 왜 나한테 맞는지 이유가 설명되니까 오히려 확신이 생겼어요.",
    highlight:
      "결혼 확신이 없던 게 아니라, 왜 맞는지 설명할 언어가 없었던 거였어요.",
    name: "은지",
    age: "32세",
    status: "4년 교제 중",
    action: "무료 → 심층 구매",
  },
];

export default function TestimonialSection() {
  return (
    <section className="py-20">
      {/* 타이틀 */}
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3 text-center">
        유저 후기
      </p>
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-2"
        style={{ wordBreak: "keep-all" }}
      >
        먼저 자신을 발견한 분들
      </h2>
      <p className="text-base text-[var(--foreground)]/60 text-center mb-10">
        꾸며지지 않은 진짜 반응들입니다
      </p>

      {/* 통계 배너 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[var(--border)] p-4 text-center"
          >
            <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-1">
              {s.value}
            </p>
            <p className="text-xs text-[var(--foreground)]/50">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 피처드 후기 */}
      <div
        className="rounded-2xl bg-[var(--foreground)] text-white p-6 sm:p-8 mb-8"
        style={{ wordBreak: "keep-all" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm">★★★★★</span>
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-white/20">
            {FEATURED.badge}
          </span>
        </div>
        <p className="text-base leading-relaxed text-white/90">
          &ldquo;{FEATURED.content}&rdquo;
        </p>
      </div>

      {/* 후기 카드 */}
      <div className="space-y-4">
        {REVIEWS.map((review) => (
          <div
            key={review.name}
            className="rounded-2xl border-2 border-[var(--foreground)] p-6"
            style={{ wordBreak: "keep-all" }}
          >
            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">★★★★★</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--foreground)]/10 text-[var(--foreground)]">
                {review.badge}
              </span>
            </div>

            {/* 본문 */}
            <p className="text-sm leading-relaxed text-[var(--foreground)]/80 mb-3">
              &ldquo;{review.content}&rdquo;
            </p>

            {/* 하이라이트 */}
            <div className="rounded-lg bg-[var(--surface)] p-3 mb-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                &ldquo;{review.highlight}&rdquo;
              </p>
            </div>

            {/* 프로필 */}
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--foreground)] text-white text-xs font-bold">
                {review.name[0]}
              </span>
              <span className="text-xs text-[var(--foreground)]/50">
                {review.name} 님 · {review.age} / {review.status} · {review.action}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
