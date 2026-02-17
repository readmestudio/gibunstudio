const STEPS = [
  {
    number: 1,
    text: "같은 패턴에 빠지고, 같은 상처를 받으면서도 왜 그런지 알아차리지 못했던 당신의 마음을 들여다봅니다.",
  },
  {
    number: 2,
    text: "기분 스튜디오는 인지행동치료를 통해 무의식적으로 작동하는 자동사고를 포착하고, 당신의 행동을 지배해온 핵심 신념을 마주하게 합니다.",
  },
  {
    number: 3,
    text: "그 신념의 뿌리에는 상처받은 내면의 아이가 있습니다. 오랫동안 외면당하고, 보호받지 못했던 그 아이를 만나는 것, 그것이 우리의 여정이 향하는 곳입니다.",
  },
];

function PhoneMockupFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[180px] h-[360px] sm:w-[200px] sm:h-[400px] bg-white rounded-[2rem] border-[4px] border-[var(--foreground)] shadow-lg overflow-hidden">
        {/* 노치 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-[var(--foreground)] rounded-b-xl z-10" />
        {/* 화면 내용 */}
        <div className="h-full flex flex-col pt-8 px-3">
          {children}
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-[var(--foreground)]/70">{label}</p>
    </div>
  );
}

function ZoomScreen() {
  return (
    <div className="flex flex-col h-full">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[8px] font-semibold text-[var(--foreground)]">Zoom 상담</span>
        <div className="w-2 h-2 rounded-full bg-green-500" />
      </div>
      {/* 2x2 비디오 그리드 */}
      <div className="flex-1 grid grid-cols-2 gap-1 px-1 pb-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--surface)] rounded-md flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--foreground)]/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
            </svg>
          </div>
        ))}
      </div>
      {/* 하단 툴바 */}
      <div className="flex items-center justify-center gap-3 py-2 border-t border-[var(--border)]">
        <div className="w-6 h-6 rounded-full bg-[var(--surface)] flex items-center justify-center">
          <svg className="w-3 h-3 text-[var(--foreground)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
          </svg>
        </div>
        <div className="w-6 h-6 rounded-full bg-[var(--surface)] flex items-center justify-center">
          <svg className="w-3 h-3 text-[var(--foreground)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ValueWorldcupScreen() {
  return (
    <div className="flex flex-col h-full">
      {/* 상단 타이틀 */}
      <div className="text-center py-2 border-b border-[var(--border)]">
        <p className="text-[9px] font-semibold text-[var(--foreground)]">가치관 월드컵</p>
        <span className="text-[7px] text-[var(--foreground)]/50">16강 · Round 3</span>
      </div>

      {/* VS 대결 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 py-3 px-1">
        {/* 카드 A */}
        <div className="w-full rounded-lg border-2 border-[var(--foreground)] bg-white px-3 py-4 text-center">
          <p className="text-[11px] font-bold text-[var(--foreground)]">자유</p>
          <p className="text-[7px] text-[var(--foreground)]/60 mt-1">
            원하는 대로 살 수 있는 삶
          </p>
        </div>

        {/* VS 뱃지 */}
        <div className="w-6 h-6 rounded-full border-2 border-[var(--foreground)] flex items-center justify-center bg-white">
          <span className="text-[7px] font-bold text-[var(--foreground)]">VS</span>
        </div>

        {/* 카드 B */}
        <div className="w-full rounded-lg border-2 border-[var(--foreground)] bg-white px-3 py-4 text-center">
          <p className="text-[11px] font-bold text-[var(--foreground)]">안정</p>
          <p className="text-[7px] text-[var(--foreground)]/60 mt-1">
            흔들리지 않는 견고한 삶
          </p>
        </div>
      </div>

      {/* 하단 진행 바 */}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[6px] text-[var(--foreground)]/50">진행률</span>
          <span className="text-[6px] text-[var(--foreground)]/50">3 / 8</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--foreground)] rounded-full" style={{ width: "37.5%" }} />
        </div>
      </div>
    </div>
  );
}

export function FeatureTwo() {
  return (
    <section id="howitworks">
      <div className="container items-center px-5 py-24 mx-auto lg:px-24">
        {/* 헤딩 영역 */}
        <div className="flex flex-col w-full mb-6 text-center">
          <h2
            className="mb-6 text-4xl font-bold tracking-tighter text-[var(--foreground)] md:text-8xl lg:text-6xl"
            style={{ wordBreak: 'keep-all' }}
          >
            Meet your inner child.
            <br />
            Healing begins.
          </h2>
          <p
            className="mx-auto text-lg leading-snug text-[var(--foreground)]/70 lg:w-1/2"
            style={{ wordBreak: 'keep-all' }}
          >
            내면 아이를 만나는 순간, 치유는 시작됩니다.
          </p>
        </div>

        {/* 2컬럼 그리드 */}
        <div className="grid items-center w-full grid-cols-1 pt-20 mx-auto lg:grid-cols-2 gap-12">
          {/* 왼쪽: 3개 번호 항목 */}
          <div className="max-w-lg mx-auto lg:mx-0">
            <ol role="list" className="overflow-hidden">
              {STEPS.map((step) => (
                <li key={step.number} className="relative pb-10">
                  <div className="relative flex items-start group">
                    <div className="flex items-center h-9">
                      <span className="relative z-10 flex items-center justify-center w-8 h-8 text-sm text-white bg-[var(--foreground)] rounded-full">
                        {step.number}
                      </span>
                    </div>
                    <p
                      className="ml-4 text-lg text-[var(--foreground)]/70 leading-relaxed"
                      style={{ wordBreak: 'keep-all' }}
                    >
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* 오른쪽: 2개 폰 목업 */}
          <div className="flex gap-4 justify-center">
            <PhoneMockupFrame label="Zoom 화상 상담">
              <ZoomScreen />
            </PhoneMockupFrame>
            <PhoneMockupFrame label="가치관 월드컵">
              <ValueWorldcupScreen />
            </PhoneMockupFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
