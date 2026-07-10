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
import { createClient } from "@/lib/supabase/client";
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
import { KAKAO_CHANNEL_URL } from "@/app/programs/counseling/content";

type Phase = "landing" | "test" | "analyzing" | "report";

const KEY = INNER_CHILD_FUNNEL.leadStorageKey;

export function InnerChildFlow() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [leadId, setLeadId] = useState<string | null>(null);
  // API 실패·leadId 미확보 시 클라 채점으로 인라인 렌더할 원응답(희귀 폴백).
  const [fallbackInput, setFallbackInput] = useState<ScoreInput | null>(null);
  // 결제 승인 실패로 returnUrl 이 /inner-child?error=… 로 되돌려보냈을 때의 안내.
  const [payError, setPayError] = useState<boolean>(false);
  const router = useRouter();

  // 재방문 자동 복원 — 이전에 분석을 마친 브라우저면 저장된 결과 페이지로 보낸다.
  // (무효 id 면 결과 페이지가 안내를 띄우고 저장값을 정리하므로 무한 복원되지 않는다.)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    // 결제 실패 복귀(?error) — 조용히 무료 리포트로 복원하지 말고 실패를 명확히 알린다.
    // (승인 실패 시 returnUrl 이 여기로 되돌려보낸다. 표식은 즉시 지워 재트리거를 막는다.)
    if (params.get("error")) {
      window.history.replaceState(null, "", window.location.pathname);
      setPayError(true);
      return;
    }
    // 카카오 로그인 후 복귀 — 세션이 잡힌 상태로 돌아온다. 새 테스트를 시작한다.
    if (params.get("started") === "1") {
      window.history.replaceState(null, "", window.location.pathname);
      beginTest();
      return;
    }
    const saved = localStorage.getItem(KEY);
    if (saved) {
      router.replace(`${INNER_CHILD_FUNNEL.freeReportBase}/${saved}`);
      return;
    }
    // 저장값 없어도 로그인 상태면 계정 귀속 최근 리포트로 복원(기기/브라우저 무관).
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled || !user) return;
        const res = await fetch("/api/minds/my-reports?product=inner_child");
        const json = await res.json().catch(() => null);
        if (cancelled || !json?.latestLeadId) return;
        localStorage.setItem(KEY, json.latestLeadId);
        router.replace(`${INNER_CHILD_FUNNEL.freeReportBase}/${json.latestLeadId}`);
      } catch {
        // 복원 실패 — 그냥 랜딩을 보여준다.
      }
    })();
    return () => {
      cancelled = true;
    };
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

  // 카카오 로그인 리드 — 서버가 세션에서 user_id·email 을 확정해 계정에 귀속한다.
  // variant:"inner_child" 로 test_type 을 고정한다(channel 이 kakao 여도 퍼널 출처 유지).
  // 세션이 없으면(401) 익명 리드로 폴백해 흐름은 막지 않는다.
  const createKakaoLead = async () => {
    try {
      const res = await fetch("/api/minds/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "kakao",
          variant: "inner_child",
          attribution: getAttribution(),
        }),
      });
      if (res.status === 401) return void createAnonLead();
      const json = await res.json().catch(() => null);
      if (json?.id) setLeadId(json.id);
    } catch {
      void createAnonLead();
    }
  };

  // 테스트 시작 공통 동작 — 전환 픽셀 발화 + 리드 확보 + 테스트 진입.
  // (로그인 직후 onStart, 그리고 카카오 복귀(?started=1) 두 경로에서 함께 쓴다.)
  const beginTest = () => {
    trackMetaCustom("StartTest", { content_name: "inner_child" });
    trackMindsFunnel("test_start", INNER_CHILD_FUNNEL);
    trackMetaEvent("Lead", { content_name: "inner_child" });
    void createKakaoLead();
    setPhase("test");
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

  // 결제 승인 실패 복귀 — 조용히 무료 리포트로 되돌아가지 않고 실패를 명확히 안내한다.
  if (payError) {
    return (
      <PaymentFailedScreen
        onRetry={() => {
          const saved = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
          if (saved) router.replace(`${INNER_CHILD_FUNNEL.freeReportBase}/${saved}`);
          else setPayError(false);
        }}
      />
    );
  }

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
          onStart={async () => {
            const supabase = createClient();
            const {
              data: { user },
            } = await supabase.auth.getUser();
            // 이미 로그인 → 바로 테스트 시작.
            if (user) {
              beginTest();
              return;
            }
            // 미로그인 → 카카오 로그인으로. 돌아오면 ?started=1 로 테스트를 이어간다.
            document.cookie = `auth_redirect=${encodeURIComponent(
              "/inner-child?started=1"
            )}; path=/; max-age=600; SameSite=Lax`;
            try {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "kakao",
                options: { redirectTo: `${window.location.origin}/auth/callback` },
              });
              if (error) throw error;
            } catch {
              // 로그인 시작 실패 — 최소한 테스트는 진행시킨다(익명 폴백).
              beginTest();
            }
          }}
        />
      )}

      {phase === "analyzing" && <MindsAnalyzing />}
    </div>
  );
}

/* ─────────────── 결제 실패 안내(다크) ───────────────
 *
 * 승인 실패 시 returnUrl 이 /inner-child?error=… 로 되돌려보낸다. 예전엔 자동복원이
 * 조용히 무료 리포트로 보내 실패가 묻혔다(페이월만 다시 노출). 이제 명확히 안내한다.
 */
function PaymentFailedScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ minHeight: "100dvh", background: "#050506", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      <div style={{ maxWidth: 400, width: "100%", background: "#0A0A0B", border: "1px solid #26272c", borderRadius: 20, padding: "34px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 34 }}>⚠️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "14px 0 0", letterSpacing: "-0.02em" }}>결제가 완료되지 않았어요</h1>
        <p style={{ fontSize: 14.5, lineHeight: 1.75, color: "rgba(255,255,255,.62)", margin: "14px 0 0" }}>
          결제 승인 단계에서 중단되어 리포트 발급이 마무리되지 않았어요. 다시 시도해 주세요. 혹시 결제가
          된 것 같은데 리포트가 열리지 않으면, 아래로 문의해 주시면 바로 확인해 드릴게요.
        </p>
        <button
          type="button"
          onClick={onRetry}
          style={{ width: "100%", marginTop: 24, padding: 16, borderRadius: 12, background: "linear-gradient(135deg,#FF5A1F,#FF8A4C,#FFB68A)", color: "#0A0A0B", border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
        >
          리포트로 돌아가 다시 시도하기
        </button>
        <a href={KAKAO_CHANNEL_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 16, fontSize: 12.5, color: "rgba(255,255,255,.42)", textDecoration: "underline" }}>
          카카오톡으로 문의하기
        </a>
      </div>
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
  return <InnerChildFreeReport card={card} score={score} />;
}
