"use client";

/**
 * /minds 1단계 — 후킹 랜딩 (콰이엇 에디토리얼 · 배역 모자이크 히어로).
 *
 * 구조:
 *  ① 다크 모자이크 히어로 — Higgsfield로 만든 5배역 일러스트(거의 검정 배경 +
 *     흰/주황 브러시)를 타일로 깔아 배경으로 쓴다. 어두운 모자이크 위에는 종이색
 *     글자(자책→몰아붙임→실망의 3박자 훅)를 얹는다.
 *  ② 리프레임 — "마음 = 하나의 덩어리가 아니라 여러 배역이 모여 사는 작은 가족".
 *  ③ 다섯 배역 명단 — 배역별 초상 + 한 줄 정의(리더/빌런/난봉꾼/관리자/추방자).
 *  ④ 핵심 메시지 — "나쁜 배역은 없다, 다만 어떤 목소리가 자리잡았는지 알아야
 *     대처할 수 있다" → CTA "내 마음의 소리들 알아보기".
 *
 * 카피 범위: 성취에 국한하지 않고 "마음이 불편/화났던 순간" 일반으로 확장(무료
 * 리드젠이라 진입장벽을 낮춘다). 실제 테스트 문항도 free-minds-flow 에서 일반화됨.
 */

import { M, Kicker, LabelS, dispStyle, leadStyle, ctaStyle } from "./quiet-editorial";
import { CharacterPortrait } from "./CharacterPortrait";

/** 다섯 배역 — 초상 + "어떤 역할인지" 한 줄 정의. 나쁜 배역은 하나도 없다. */
const CAST = [
  { src: "/minds/cast/leader.png", tag: "무대를 끌고 가는", name: "리더" },
  { src: "/minds/cast/villain.png", tag: "나를 다그치는", name: "빌런" },
  { src: "/minds/cast/rake.png", tag: "위기의 순간 튀어나오는", name: "난봉꾼" },
  { src: "/minds/cast/manager.png", tag: "미리 길목을 막아서는", name: "관리자" },
  { src: "/minds/cast/exile.png", tag: "상처를 안고 기다리는", name: "추방자" },
] as const;

/** 히어로 배경 모자이크 타일 순서(5배역 반복, 3열 × 4행 = 12칸). */
const TILES = [0, 1, 2, 3, 4, 2, 0, 4, 1, 3, 4, 1].map((i) => CAST[i].src);

export function MindsLanding({ onStart }: { onStart: () => void }) {
  return (
    <section>
      {/* ① 다크 모자이크 히어로 — 부모 컬럼 패딩을 음수 마진으로 상쇄해 풀-블리드 */}
      <div
        className="relative -mx-6 -mt-8 overflow-hidden sm:-mt-10"
        style={{ background: M.ink }}
      >
        {/* 배경: 5배역 일러스트 타일. 어둡게 깔아 글자를 받쳐준다. */}
        <div
          aria-hidden
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", opacity: 0.5 }}
        >
          {TILES.map((src, i) => (
            <div key={i} style={{ aspectRatio: "1 / 1", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>

        {/* 가독성 스크림 — 위는 살짝, 아래로 갈수록 진하게(하단 글자 보호 + 종이로 자연 전환) */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(16,15,14,0.30) 0%, rgba(16,15,14,0.70) 62%, rgba(16,15,14,0.94) 100%)",
          }}
        />

        {/* 콘텐츠 — 상단 라벨 / 하단 훅 카피 */}
        <div className="absolute inset-0 flex flex-col justify-between" style={{ padding: "20px 22px 26px" }}>
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: M.mono, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(247,244,238,0.92)" }}>
              기분 스튜디오
            </span>
            <span style={{ fontFamily: M.mono, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(247,244,238,0.55)" }}>
              무료 · 3분
            </span>
          </div>

          <div>
            <h1 style={{ ...dispStyle, color: M.paper, fontSize: 27, lineHeight: 1.32 }}>
              작은 실수에도 계속 자책하고,
              <br />
              더 잘해야 한다고 몰아붙이고,
              <br />
              역시 난 안 된다며 실망하고.
            </h1>
            <p style={{ ...leadStyle, color: "rgba(247,244,238,0.82)", marginTop: 16, maxWidth: 330 }}>
              이 모든 게 한 순간에 동시에 일어나요. 내 안엔 저마다 목소리를 내는
              여러 ‘배역’이 살고 있거든요.
            </p>
          </div>
        </div>
      </div>

      {/* ② 리프레임 — 심리학은 마음을 '작은 가족'으로 본다 */}
      <div style={{ paddingTop: 34 }}>
        <Kicker>심리학은 이렇게 말해요</Kicker>
        <p style={{ ...leadStyle, marginTop: 16 }}>
          마음은 하나의 단단한 덩어리가 아니라, 각자 다른 역할을 맡은 여러 배역이
          모여 사는 <strong style={{ color: M.ink, fontWeight: 600 }}>작은 가족</strong> 같은 거라고요.
          작은 실수에 자책하고, 더 몰아붙이고, 그러다 실망하는 그 짧은 순간에도 —
          사실 여러 배역이 저마다 목소리를 내고 있어요.
        </p>
      </div>

      {/* ③ 다섯 배역 명단 — 초상 + 한 줄 정의 */}
      <div style={{ marginTop: 32 }}>
        <LabelS style={{ marginBottom: 8 }}>내 안의 다섯 배역</LabelS>
        <div>
          {CAST.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                padding: "13px 0",
                borderBottom: i < CAST.length - 1 ? `1px solid ${M.line2}` : "none",
              }}
            >
              <div style={{ flex: "0 0 auto" }}>
                <CharacterPortrait src={c.src} alt={c.name} size={48} />
              </div>
              <div>
                <span style={{ fontSize: 12.5, color: M.mute, fontFamily: M.font, lineHeight: 1.4 }}>
                  {c.tag}
                </span>
                <div style={{ fontSize: 16, fontWeight: 700, color: M.ink, fontFamily: M.font, letterSpacing: "-0.01em" }}>
                  {c.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ④ 핵심 메시지 — 나쁜 배역은 없다, 다만 알아야 대처한다 */}
      <div
        style={{
          marginTop: 28,
          padding: "18px 18px 18px 20px",
          background: M.paper2,
          borderLeft: `2px solid ${M.accent}`,
          borderRadius: 2,
        }}
      >
        <p style={{ ...leadStyle, fontSize: 14.5 }}>
          <strong style={{ color: M.ink, fontWeight: 700 }}>그중 나쁜 배역은 하나도 없어요.</strong>{" "}
          다만 지금 내 안에서 어떤 목소리가 가장 크게 자리잡았는지 알아야, 다음
          상황에서 휘둘리지 않고 잘 대처할 수 있어요.
        </p>
      </div>

      {/* CTA */}
      <div style={{ marginTop: 28 }}>
        <button type="button" onClick={onStart} style={{ ...ctaStyle }} className="transition-transform active:scale-[0.99]">
          3분 무료 테스트로 진단하기
        </button>
        <p style={{ textAlign: "center", marginTop: 18, fontSize: 12.5, color: M.mute, fontFamily: M.font }}>
          진단이 아니라, 지금의 나를 비춰보는 거울이에요.
        </p>
      </div>
    </section>
  );
}
