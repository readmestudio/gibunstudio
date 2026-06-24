"use client";

/**
 * /minds 분석 대기 화면.
 *
 * 대화 완료 후 /api/minds/parts-map(실제 LLM 분석)이 돌아오는 동안 보여주는 로딩.
 * 단순 스피너 대신, "마음들을 한 명씩 불러오는 중"이라는 서사로 기다림을 채운다.
 */

import { M, dispStyle, leadStyle, Kicker } from "./quiet-editorial";

const STEPS = [
  "흩어진 마음들을 모으고 있어요",
  "각 마음의 목소리를 듣고 있어요",
  "누가 무대 앞에 서 있는지 살펴보고 있어요",
];

export function MindsAnalyzing() {
  return (
    <section
      style={{
        paddingTop: 48,
        minHeight: 420,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Kicker>Reading · 마음 읽는 중</Kicker>
      <h2 style={{ ...dispStyle, fontSize: 27, marginTop: 16 }}>
        당신의 마음들을
        <br />
        한 명씩 불러오고 있어요
      </h2>
      <p style={{ ...leadStyle, marginTop: 16, maxWidth: 320 }}>
        적어주신 답을 천천히 읽으며, 그 안에 살고 있는 마음들을 캐릭터로
        그려내는 중이에요. 잠시만요.
      </p>

      <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              className="minds-pulse"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: M.accent,
                animationDelay: `${i * 0.4}s`,
              }}
            />
            <span style={{ fontFamily: M.font, fontSize: 14.5, color: M.ink2 }}>{s}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes mindsPulse {
          0%, 100% { opacity: 0.2; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
        .minds-pulse { animation: mindsPulse 1.4s ease-in-out infinite; }
      `}</style>
    </section>
  );
}
