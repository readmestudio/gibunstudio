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

function DiaryScreen() {
  return (
    <div className="flex flex-col h-full">
      {/* 상단 날짜 */}
      <div className="text-center py-2 border-b border-[var(--border)]">
        <span className="text-[8px] text-[var(--foreground)]/50">Day 3</span>
        <p className="text-[9px] font-semibold text-[var(--foreground)]">오늘의 감정 일기</p>
      </div>
      {/* 채팅 말풍선 */}
      <div className="flex-1 flex flex-col gap-2 py-3 px-1 overflow-hidden">
        {/* AI 질문 (좌측) */}
        <div className="flex gap-1 items-start">
          <div className="w-4 h-4 rounded-full bg-[var(--foreground)] flex-shrink-0 flex items-center justify-center">
            <span className="text-[6px] text-white font-bold">G</span>
          </div>
          <div className="bg-[var(--surface)] rounded-lg rounded-tl-none px-2 py-1.5 max-w-[85%]">
            <p className="text-[7px] text-[var(--foreground)]/80 leading-tight">
              오늘 하루 어떤 감정이 가장 크게 느껴졌나요?
            </p>
          </div>
        </div>
        {/* 사용자 답변 (우측) */}
        <div className="flex gap-1 items-start justify-end">
          <div className="bg-[var(--foreground)] rounded-lg rounded-tr-none px-2 py-1.5 max-w-[85%]">
            <p className="text-[7px] text-white leading-tight">
              회사에서 발표할 때 불안했어요. 실수할까봐 계속 긴장됐어요.
            </p>
          </div>
        </div>
        {/* AI 후속 질문 */}
        <div className="flex gap-1 items-start">
          <div className="w-4 h-4 rounded-full bg-[var(--foreground)] flex-shrink-0 flex items-center justify-center">
            <span className="text-[6px] text-white font-bold">G</span>
          </div>
          <div className="bg-[var(--surface)] rounded-lg rounded-tl-none px-2 py-1.5 max-w-[85%]">
            <p className="text-[7px] text-[var(--foreground)]/80 leading-tight">
              그 불안감은 어린 시절에도 느꼈던 감정인가요?
            </p>
          </div>
        </div>
      </div>
      {/* 입력 필드 */}
      <div className="px-1 pb-2">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]">
          <span className="text-[7px] text-[var(--foreground)]/40 flex-1">메시지를 입력하세요...</span>
          <svg className="w-3 h-3 text-[var(--foreground)]/40" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
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
            <PhoneMockupFrame label="7일 감정 일기">
              <DiaryScreen />
            </PhoneMockupFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
