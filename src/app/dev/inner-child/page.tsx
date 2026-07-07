"use client";

/**
 * 내면 아이 찾기 — 개발용 프리뷰 (/dev/inner-child).
 *
 * 실제 /inner-child 퍼널과 동일하게 /minds 랜딩으로 시작 → 테스트(skipIntro) → 무료 리포트.
 * 리포트는 실컴포넌트(InnerChildFreeReport)를 그대로 렌더한다(생성필드만 dev mock).
 * 채점은 클라이언트 computeScore 로만 돌려 LLM/DB 없이 확인한다.
 */

import { useState, type CSSProperties } from "react";
import { M, LabelS, Hr } from "@/components/minds/quiet-editorial";
import { MindsLanding } from "@/components/minds/MindsLanding";
import { InnerChildTest } from "@/components/minds/inner-child/InnerChildTest";
import { InnerChildFreeReport } from "@/components/minds/inner-child/report/InnerChildFreeReport";
import { computeScore, type ScoreInput } from "@/lib/minds/inner-child/scoring";
import { getTypeCard } from "@/lib/minds/inner-child/type-cards";
import type { ScoreResult } from "@/lib/minds/inner-child/types";

/** dev 프리뷰용 mock 생성필드 — 실제로는 gemini-2.5-flash 가 채운다. */
const DEV_MOCK_FREE = {
  gap: "외부에서는 관계에 크게 흔들리지 않는 사람으로 보이지만, 내부적으로는 상대의 신호를 끊임없이 살피는 상태입니다. (미리보기 — 실제로는 응답 기반으로 생성됩니다.)",
  relation_pattern:
    "가까워질수록 확인이 늘고, 그 확인이 상대에게 부담으로 닿을 때 이 아이는 다시 거리를 확인합니다. (미리보기 — 실제로는 SCT 인용과 함께 생성됩니다.)",
};

export default function InnerChildDevPage() {
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [started, setStarted] = useState(false);
  const [runKey, setRunKey] = useState(0);

  const handleComplete = (input: ScoreInput) => setResult(computeScore(input));
  const restart = () => {
    setResult(null);
    setStarted(false);
    setRunKey((k) => k + 1);
  };

  // 결과 = 풀스크린 리포트(실제 화면과 동일). 디버그 UI 없음.
  if (result) {
    const card = getTypeCard(result.primary_child.schema_id);
    return (
      <>
        {card ? (
          <InnerChildFreeReport card={card} score={result} free={DEV_MOCK_FREE} />
        ) : (
          <div style={{ height: "100dvh", background: "#050506", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <p style={{ color: "#fff", fontFamily: "'Pretendard',sans-serif", textAlign: "center" }}>
              (유형카드 미집필 — {result.primary_child.schema_id})
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={restart}
          style={{
            position: "fixed",
            top: 12,
            right: 12,
            zIndex: 60,
            padding: "7px 12px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.25)",
            background: "rgba(0,0,0,.4)",
            color: "rgba(255,255,255,.8)",
            fontFamily: "ui-monospace,monospace",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          ↺ 다시
        </button>
      </>
    );
  }

  // 테스트 = 풀스크린 다크(라이트 크롬 우회).
  if (started) {
    return (
      <>
        <InnerChildTest key={runKey} skipIntro onComplete={handleComplete} />
        <button type="button" onClick={restart} style={devRestartStyle}>↺ 다시</button>
      </>
    );
  }

  // 첫 화면 = /minds 랜딩(라이트 컨테이너).
  return (
    <main style={{ background: M.paper, minHeight: "100vh" }}>
      <div style={{ maxWidth: 448, margin: "0 auto", padding: "24px 20px 60px" }}>
        <div style={{ marginBottom: 20 }}>
          <LabelS>DEV · /dev/inner-child</LabelS>
          <p style={{ fontFamily: M.mono, fontSize: 11, color: M.mute, marginTop: 4 }}>
            /minds 랜딩 → 테스트 → 무료 리포트 프리뷰
          </p>
        </div>
        <Hr style={{ marginBottom: 24 }} />
        <MindsLanding onStart={() => setStarted(true)} />
      </div>
    </main>
  );
}

const devRestartStyle: CSSProperties = {
  position: "fixed",
  top: 12,
  right: 12,
  zIndex: 60,
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.25)",
  background: "rgba(0,0,0,.4)",
  color: "rgba(255,255,255,.8)",
  fontFamily: "ui-monospace,monospace",
  fontSize: 11,
  cursor: "pointer",
};
