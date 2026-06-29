"use client";

/**
 * /minds 리포트 1번 카드 — 커버/인트로 (콰이엇 에디토리얼).
 *
 * "내 마음 속엔 N명이 살고 있어요" 표지. 키커 → 헤드라인 → 리드 → 헤어라인 사이
 * 4열 캐스트 그리드(초상 + 주황 인덱스 + 이름) → 넘김 안내. 한 명씩 만나보도록 유도.
 */

import { CardShell } from "./MindsCardShell";
import { CharacterPortrait } from "./CharacterPortrait";
import { M, Kicker, Hr, dispStyle, leadStyle } from "./quiet-editorial";
import type { CharacterView } from "@/lib/minds/characters";

export function MindsCoverCard({ views }: { views: CharacterView[] }) {
  const thumbs = views.slice(0, 4);

  return (
    <CardShell>
      <Kicker>My Inner Cast · 마음 극장</Kicker>

      <h1 style={{ ...dispStyle, fontSize: 32, marginTop: 18 }}>
        내 마음 속엔
        <br />
        {views.length}명이 살고 있어요
      </h1>

      <p style={{ ...leadStyle, marginTop: 18 }}>
        마음이 크게 흔들릴 때, 내 안에선 여러 마음이 동시에 무대에 올라요. 좋은
        마음도 나쁜 마음도 없어요. 각자 나를 지키려 애쓰는, 어엿한 등장인물들이죠.
      </p>

      <div style={{ marginTop: 32 }}>
        <Hr />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${thumbs.length}, 1fr)`,
            gap: 8,
            padding: "28px 0 24px",
          }}
        >
          {thumbs.map((v, i) => (
            <div key={v.archetype.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <CharacterPortrait src={v.archetype.portrait} alt={v.name} size={58} />
              <span style={{ fontFamily: M.mono, fontSize: 11, color: M.accent, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {/* 해석된 진짜 마음(tagline)을 주 라벨로, 익숙한 이름(name)은 작은 보조 라벨로. */}
              <span style={{ fontSize: 11.5, color: M.ink2, textAlign: "center", lineHeight: 1.4, fontWeight: 600, fontFamily: M.font }}>
                {v.tagline}
              </span>
              <span style={{ fontSize: 10, color: M.mute, textAlign: "center", lineHeight: 1.3, fontFamily: M.font }}>
                {v.name}
              </span>
            </div>
          ))}
        </div>
        <Hr />
      </div>

      <p style={{ marginTop: 22, fontSize: 13, color: M.mute, fontFamily: M.font }}>
        → 옆으로 넘기거나 화살표로 한 명씩 만나보세요
      </p>
    </CardShell>
  );
}
