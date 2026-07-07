"use client";

/**
 * 무료 "내면 아이 찾기"(/inner-child) 상태머신 오케스트레이터.
 *
 *   landing → test → analyzing → report
 *
 * MindsFlow 를 본떠 만든 얇은 상태머신. 공유 자산(MindsLanding·MindsAnalyzing·API
 * 인프라)은 그대로 재사용하고, 갈라지는 것은 테스트(InnerChildTest)·분석 엔드포인트
 * (/api/inner-child/free-report)·저장키·결과 경로뿐이다. MindsFlow 는 0줄도 건드리지
 * 않으므로 /minds 회귀 위험이 없다.
 *
 * 무료 결과는 서버 저장본 기준 페이지(/inner-child/r/[id])로 곧장 보낸다 — 재방문·공유가
 * 한 경로로 수렴한다. leadId 확보 실패라는 희귀 케이스만 클라 채점으로 인라인 폴백 렌더.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAttribution } from "@/lib/attribution";
import { trackMetaEvent, trackMetaCustom } from "@/lib/meta-pixel";
import { trackMindsFunnel } from "@/lib/minds/track";
import { INNER_CHILD_FUNNEL } from "@/lib/minds/funnel-config";
import { MindsLanding } from "../MindsLanding";
import { MindsAnalyzing } from "../MindsAnalyzing";
import { InnerChildTest, CrisisScreen } from "./InnerChildTest";
import { InnerChildFreeReport } from "./report/InnerChildFreeReport";
import { computeScore, type ScoreInput } from "@/lib/minds/inner-child/scoring";
import { getTypeCard } from "@/lib/minds/inner-child/type-cards";
import { M, dispStyle, leadStyle, LabelS } from "../quiet-editorial";

type Phase = "landing" | "test" | "analyzing" | "report";

const KEY = INNER_CHILD_FUNNEL.leadStorageKey;

export function InnerChildFlow() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [leadId, setLeadId] = useState<string | null>(null);
  // API 실패·leadId 미확보 시 클라 채점으로 인라인 렌더할 원응답(희귀 폴백).
  const [fallbackInput, setFallbackInput] = useState<ScoreInput | null>(null);
  const router = useRouter();

  // 재방문 자동 복원 — 이전에 분석을 마친 브라우저면 저장된 결과 페이지로 보낸다.
  // (무효 id 면 결과 페이지가 안내를 띄우고 저장값을 정리하므로 무한 복원되지 않는다.)
  // 카카오 신규 진입(?auth=kakao)은 양보한다(결제 배선은 Step 3).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(KEY);
    if (saved) {
      router.replace(`${INNER_CHILD_FUNNEL.freeReportBase}/${saved}`);
      return;
    }
    // 마운트 시 1회만 — router 는 안정 참조.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 익명 리드 생성(fire-and-forget). channel:"inner_child" 로 1행 만들고 id 만 확보한다.
  // 실패해도 사용자 흐름은 막지 않는다(leadId 없으면 결과 저장·재방문 복원만 생략).
  const createAnonLead = async () => {
    try {
      const res = await fetch("/api/minds/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "inner_child",
          attribution: getAttribution(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (json?.id) setLeadId(json.id);
    } catch {
      // 네트워크 실패 — 결과 보기는 계속 진행.
    }
  };

  // 테스트 완료 → 서버 무료 리포트 생성 → 저장본 페이지로 이동.
  const runAnalysis = async (input: ScoreInput) => {
    setPhase("analyzing");
    try {
      const res = await fetch("/api/inner-child/free-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, leadId }),
      });
      const json = await res.json().catch(() => null);
      // 서버가 저장을 마쳤고(leadId 확보) 결과 페이지가 렌더 가능하면 그리로 보낸다.
      // 위기(crisis)여도 결과 페이지가 위기 안내를 렌더하므로 동일하게 이동한다.
      if (json?.ok && leadId) {
        localStorage.setItem(KEY, leadId);
        trackMetaEvent("ViewContent", { content_name: "inner_child_report" });
        router.replace(`${INNER_CHILD_FUNNEL.freeReportBase}/${leadId}`);
        return;
      }
    } catch {
      // 아래 인라인 폴백으로.
    }
    // leadId 미확보·API 실패 → 클라 채점으로 최소 리포트라도 인라인 렌더.
    setFallbackInput(input);
    trackMetaEvent("ViewContent", { content_name: "inner_child_report" });
    setPhase("report");
  };

  // 테스트·폴백 리포트는 자체 풀스크린(다크). 랜딩·분석은 라이트 컨테이너 유지.
  if (phase === "test") {
    return <InnerChildTest skipIntro onComplete={(input) => void runAnalysis(input)} />;
  }
  if (phase === "report" && fallbackInput) {
    return <InlineFallbackReport input={fallbackInput} />;
  }

  return (
    <div className="mx-auto w-full max-w-[448px] px-6 py-8 sm:py-10">
      {phase === "landing" && (
        <MindsLanding
          onStart={() => {
            // 광고 최적화용 — content_name 을 "inner_child" 로 분리해 /minds 신호와 섞이지 않게.
            trackMetaCustom("StartTest", { content_name: "inner_child" });
            trackMindsFunnel("test_start");
            void createAnonLead();
            trackMetaEvent("Lead", { content_name: "inner_child" });
            setPhase("test");
          }}
        />
      )}

      {phase === "analyzing" && <MindsAnalyzing />}
    </div>
  );
}

/* ─────────────── 클라이언트 최종 폴백 ───────────────
 *
 * API 호출 자체가 실패했거나 leadId 를 확보하지 못한 희귀 케이스. 코드 채점이 본체이므로
 * computeScore 를 클라에서 돌려 유형카드 고정필드만으로 리포트를 인라인 렌더한다
 * (LLM 2필드 자리는 생략). 위기 응답이면 위기 안내를 보인다.
 */
function InlineFallbackReport({ input }: { input: ScoreInput }) {
  const score = computeScore(input);
  if (score.crisis_flag) return <CrisisScreen />;
  const card = getTypeCard(score.primary_child.schema_id);
  if (!card) {
    return (
      <div>
        <LabelS>당신의 아이</LabelS>
        <h1 style={{ ...dispStyle, fontSize: 28, marginTop: 12 }}>{score.primary_child.child_name}</h1>
        <p style={{ ...leadStyle, marginTop: 10, color: M.mute }}>
          이 아이의 상세 리포트는 준비 중이에요. 곧 만나보실 수 있어요.
        </p>
      </div>
    );
  }
  return <InnerChildFreeReport card={card} score={score} free={null} />;
}
