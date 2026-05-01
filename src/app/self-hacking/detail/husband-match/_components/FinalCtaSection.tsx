export default function FinalCtaSection() {
  return (
    <section className="py-24 text-center">
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] leading-snug mb-6 whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"결혼이라는 결정 앞에서\n나를 먼저 알아야 합니다"}
      </h2>
      <p
        className="text-base text-[var(--foreground)]/60 max-w-md mx-auto mb-10 leading-relaxed whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"유튜브 구독 채널을 붙여넣는 데 1분이면 됩니다.\n인생에서 가장 중요한 결정을 앞두고 있다면\n절대 이 검사가 아깝지 않을 거예요."}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-8 py-3 text-base font-medium rounded-lg cursor-not-allowed border-2 border-[var(--foreground)]/30 text-[var(--foreground)]/50"
        >
          알림 신청
        </button>
      </div>
    </section>
  );
}
