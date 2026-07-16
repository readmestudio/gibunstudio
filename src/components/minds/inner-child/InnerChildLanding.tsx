"use client";

/**
 * /inner-child 1단계 — 내면 아이 전용 랜딩.
 *
 * 판매 페이지·유료 리포트와 같은 시각 언어(밤하늘 히어로 + 크림 본문 + 라벤더 포인트).
 * 이전엔 /minds 의 MindsLanding("다섯 배역")을 그대로 재사용해 시작 화면과 상품(내면 아이)이
 * 다른 얘기를 했다 — 그 불일치를 없애고 컨셉을 통일한다(PLAN §7 A단계).
 *
 * 구조: ① 밤하늘 히어로 — 흐릿한 아이들(16유형 중 누굴까) + 훅 카피
 *       ② 리프레임 — 내면 아이 개념  ③ 여정 3항목  ④ 스티키 CTA(카카오 로그인 게이트로)
 */

/** 히어로 배경 모자이크 — 검은 배경 브러시 캐릭터(원래 있던 이미지). 웅크린 실루엣이 내면 아이 결과 통한다. */
const CAST_SRCS = [
  "/minds/cast/exile.png",
  "/minds/cast/villain.png",
  "/minds/cast/leader.png",
  "/minds/cast/manager.png",
  "/minds/cast/rake.png",
];
// 3×3 = 9칸(5개 반복).
const TILES = [0, 1, 2, 3, 4, 2, 0, 4, 1].map((i) => CAST_SRCS[i]);

const FONT = "'Pretendard',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif";
const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
const ACCENT = "#6C6AA8";

const JOURNEY = [
  "16명의 아이 중, 당신의 아이가 누구인지",
  "그 아이가 왜 자꾸 같은 반응을 일으키는지",
  "오늘부터 그 아이와 잘 지내는 법",
];

export function InnerChildLanding({ onStart }: { onStart: () => void }) {
  return (
    <section style={{ paddingBottom: 138 }}>
      {/* ① 히어로 — 검은 배경 브러시 캐릭터 모자이크 + 하단 크림 스크림 */}
      <div
        className="relative -mx-6 -mt-8 overflow-hidden sm:-mt-10"
        style={{ minHeight: 470, background: "#100F0E" }}
      >
        {/* 배경: 검은 배경 브러시 캐릭터 타일(3×3) */}
        <div aria-hidden style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", opacity: 0.55 }}>
          {TILES.map((src, i) => (
            <div key={i} style={{ aspectRatio: "1 / 1", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>

        {/* 스크림 — 위는 살짝, 아래로 갈수록 진하게(하단 글자 보호 + 크림 본문으로 자연 전환) */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(16,15,14,.28) 0%, rgba(16,15,14,.62) 62%, rgba(16,15,14,.92) 88%, #F7F4EE 100%)",
          }}
        />

        {/* 콘텐츠 — 상단 라벨 / 하단 훅 카피(종이색) */}
        <div className="absolute inset-0 flex flex-col justify-between" style={{ padding: "20px 24px 30px" }}>
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600, color: "rgba(247,244,238,.92)" }}>
              기분 스튜디오
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600, color: "rgba(247,244,238,.55)" }}>
              무료 · 3분
            </span>
          </div>
          <div>
            <h1 style={{ fontFamily: FONT, fontSize: 28, fontWeight: 800, lineHeight: 1.34, letterSpacing: "-0.02em", color: "#fff", margin: 0 }}>
              당신 안에는,
              <br />
              오래전 어린 시절의
              <br />
              내가 아직 앉아 있어요.
            </h1>
            <p style={{ fontFamily: FONT, fontSize: 15.5, lineHeight: 1.75, color: "rgba(247,244,238,.82)", margin: "16px 0 0", maxWidth: 330 }}>
              남들에겐 사소한 순간에 유독 당신만 반응하게 되는 것 — 그 아이 때문일지 몰라요.
            </p>
          </div>
        </div>
      </div>

      {/* ② 리프레임 — 내면 아이 개념 */}
      <div style={{ paddingTop: 34 }}>
        <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, color: ACCENT }}>
          내면 아이란
        </span>
        <p style={{ fontFamily: FONT, fontSize: 17, lineHeight: 1.85, color: "var(--foreground)", margin: "14px 0 0" }}>
          자꾸 같은 자리에서 걸려 넘어진다면, 그건 성격 탓이 아니라 어릴 때 만들어진 마음의 습관 —{" "}
          <strong style={{ fontWeight: 700 }}>‘내면 아이’</strong> 때문이에요. 16가지 아이 중 하나가 지금 당신 안에 자리잡고 있어요.
        </p>
      </div>

      {/* ③ 여정 — 무엇을 알게 되나 */}
      <div style={{ marginTop: 30 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, color: "var(--muted, #8A8073)" }}>
          이 테스트로 알게 되는 것
        </span>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {JOURNEY.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span
                style={{
                  flex: "0 0 auto",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(108,106,168,.14)",
                  color: ACCENT,
                  fontFamily: MONO,
                  fontSize: 12,
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontFamily: FONT, fontSize: 15.5, lineHeight: 1.55, color: "var(--foreground)" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ④ 스티키 CTA — 카카오 로그인 게이트(onStart)로. */}
      <div className="fixed inset-x-0 bottom-0 z-40" style={{ pointerEvents: "none" }}>
        <div
          style={{
            maxWidth: 448,
            margin: "0 auto",
            padding: "16px 24px calc(env(safe-area-inset-bottom, 0px) + 16px)",
            background: "linear-gradient(180deg, rgba(247,244,238,0) 0%, rgba(247,244,238,.92) 30%, #F7F4EE 62%)",
          }}
        >
          <p style={{ textAlign: "center", margin: "0 0 10px", fontSize: 12, color: "var(--muted, #8A8073)", fontFamily: FONT, pointerEvents: "none" }}>
            진단이 아니라, 나를 이해하는 지도예요.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="transition-transform active:scale-[0.99]"
            style={{
              pointerEvents: "auto",
              width: "100%",
              padding: "16px 20px",
              borderRadius: 14,
              background: "var(--foreground)",
              color: "var(--background)",
              border: "none",
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(16,15,14,0.18)",
            }}
          >
            내 안의 아이 만나러 가기 →
          </button>
        </div>
      </div>
    </section>
  );
}
