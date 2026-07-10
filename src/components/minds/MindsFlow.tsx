"use client";

/**
 * 무료 "마음 확인"(/minds) 상태머신 오케스트레이터.
 *
 *   landing → conversation → analyzing → report
 *
 * [개편 2026-07-06] 연락처 캡처 단계를 제거했다. "결과부터 보여주고 지갑은 나중에"
 * 원칙으로, 무료 흐름에선 연락처를 받지 않는다(알림톡용 연락처는 결제 시점에 받는다).
 * 대신 테스트 시작 순간 *익명 리드*(email 없이)를 1행 만들어 id 를 확보하고, 이후
 * 답변·마음지도를 그 행에 붙여 재방문 시 결과를 복원한다.
 *
 * 공유 상태(리드 id·마음지도)를 들고 단계를 전환한다.
 *  - landing 시작 즉시 /api/minds/lead(channel:"anon") 로 익명 리드를 만들고 id 확보.
 *  - conversation 완료 시 /api/minds/parts-map 로 실제 LLM 분석을 호출해 마음지도를
 *    만들고(leadId 동봉 → 같은 리드 행에 답변·결과가 붙는다), report 로 넘어간다.
 *  - 분석 호출이 길어질 수 있어 그 사이 analyzing 로딩 화면을 보여준다.
 *
 * 전환 측정: 테스트 시작(Lead) · 결과 도달(ViewContent) 을 Meta 픽셀로 추적한다.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PartsMap } from "@/lib/self-workshop/core-belief-excavation";
import { MINDS_LEAD_STORAGE_KEY } from "@/lib/minds/storage";
import { getAttribution } from "@/lib/attribution";
import { trackMetaEvent, trackMetaCustom } from "@/lib/meta-pixel";
import { trackMindsFunnel } from "@/lib/minds/track";
import { MindsLanding } from "./MindsLanding";
import { MindsConversation, type MindAnswer } from "./MindsConversation";
import { MindsFreeReport } from "./MindsFreeReport";
import { MindsAnalyzing } from "./MindsAnalyzing";

type Phase = "landing" | "conversation" | "analyzing" | "report";

export function MindsFlow() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [partsMap, setPartsMap] = useState<PartsMap | null>(null);
  const router = useRouter();

  // 재방문·로그인 복귀 처리.
  //  · ?started=1 (카카오 로그인 후 복귀) → 랜딩을 건너뛰고 새 테스트를 대화부터 시작한다.
  //  · 저장값 있으면 → 이전 결과 페이지로 복원.
  //  · 저장값 없어도 로그인 상태면 → 계정 귀속 최근 리포트로 복원(기기/브라우저 무관).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    // 카카오 로그인 후 복귀 — 세션이 잡힌 상태로 돌아온다. 새 테스트를 시작.
    if (params.get("started") === "1") {
      window.history.replaceState(null, "", window.location.pathname);
      beginTest();
      return;
    }

    const saved = localStorage.getItem(MINDS_LEAD_STORAGE_KEY);
    if (saved) {
      router.replace(`/minds/r/${saved}`);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled || !user) return;
        const res = await fetch("/api/minds/my-reports");
        const json = await res.json().catch(() => null);
        if (cancelled || !json?.latestLeadId) return;
        localStorage.setItem(MINDS_LEAD_STORAGE_KEY, json.latestLeadId);
        router.replace(`/minds/r/${json.latestLeadId}`);
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

  // 익명 리드 생성(fire-and-forget). 연락처 없이 email=null 로 1행 만들고 id 만 확보한다.
  // 실패해도 사용자 흐름은 막지 않는다(leadId 없으면 결과 저장·재방문 복원만 생략).
  const createAnonLead = async () => {
    try {
      const res = await fetch("/api/minds/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "anon",
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
  // 세션이 없으면(401) 익명 리드로 폴백해 흐름은 막지 않는다.
  const createKakaoLead = async () => {
    try {
      const res = await fetch("/api/minds/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "kakao", attribution: getAttribution() }),
      });
      if (res.status === 401) return void createAnonLead();
      const json = await res.json().catch(() => null);
      if (json?.id) setLeadId(json.id);
    } catch {
      void createAnonLead();
    }
  };

  // 테스트 시작 공통 동작 — 전환 픽셀 발화 + 리드 확보 + 대화 진입.
  // (로그인 직후 onStart, 그리고 카카오 복귀(?started=1) 두 경로에서 함께 쓴다.)
  const beginTest = () => {
    trackMetaCustom("StartTest", { content_name: "minds" });
    trackMindsFunnel("test_start");
    trackMetaEvent("Lead", { content_name: "minds" });
    void createKakaoLead();
    setPhase("conversation");
  };

  // 대화 완료 → 실제 LLM 분석 호출 → 리포트.
  const runAnalysis = async (answers: MindAnswer[]) => {
    setPhase("analyzing");
    try {
      const res = await fetch("/api/minds/parts-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, leadId }),
      });
      const json = await res.json().catch(() => null);
      if (json?.parts_map) {
        setPartsMap(json.parts_map as PartsMap);
        // 결과를 다시 볼 수 있도록 이 브라우저에 leadId 를 남긴다(재방문 자동 복원용).
        if (leadId) localStorage.setItem(MINDS_LEAD_STORAGE_KEY, leadId);
        trackMetaEvent("ViewContent", { content_name: "minds_report" });
        setPhase("report");
        return;
      }
    } catch {
      // 아래 폴백으로.
    }
    // API가 끝내 실패하면 최소한의 마음지도라도 만들어 결과를 보여준다.
    setPartsMap(buildClientFallback(answers));
    trackMetaEvent("ViewContent", { content_name: "minds_report" });
    setPhase("report");
  };

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
            // (복귀 경로는 쿠키에 심는다 — /auth/callback 이 읽어 되돌린다.)
            document.cookie = `auth_redirect=${encodeURIComponent(
              "/minds?started=1"
            )}; path=/; max-age=600; SameSite=Lax`;
            try {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "kakao",
                options: { redirectTo: `${window.location.origin}/auth/callback` },
              });
              if (error) throw error;
              // 성공 시 카카오로 리다이렉트되어 아래는 실행되지 않는다.
            } catch {
              // 로그인 시작 실패 — 최소한 테스트는 진행시킨다(익명 폴백).
              beginTest();
            }
          }}
        />
      )}

      {phase === "conversation" && (
        <MindsConversation onComplete={(answers) => void runAnalysis(answers)} />
      )}

      {phase === "analyzing" && <MindsAnalyzing />}

      {phase === "report" && partsMap && (
        <MindsFreeReport partsMap={partsMap} leadId={leadId ?? undefined} />
      )}
    </div>
  );
}

/* ─────────────── 클라이언트 최종 폴백 ───────────────
 *
 * API 호출 자체가 실패(네트워크 단절 등)했을 때를 위한 마지막 안전망. 서버 폴백과
 * 같은 골격(다그치는 마음 ↔ 쉬고 싶은 마음)을 사용자 답변으로 개인화한다.
 * 정상 경로에서는 서버 /api/minds/parts-map 응답이 쓰인다.
 */
function buildClientFallback(answers: MindAnswer[]): PartsMap {
  const byId = (id: string) =>
    answers.find((a) => a.id === id)?.answer.trim() ?? "";
  const trim = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  const loudest = byId("loudest_voice");
  const situation = byId("situation");
  const counter = byId("counter_voice");

  return {
    parts: [
      {
        id: "p1",
        name: "더 해야 한다고 다그치는 마음",
        traits: ["성취 압박", "통제"],
        catchphrase: trim(loudest || "더 해야 해, 멈추면 안 돼", 24),
        evidence_quote: trim(loudest || situation),
        role: "manager",
      },
      {
        id: "p2",
        name: "이제는 멈추고 쉬고 싶은 마음",
        traits: ["피로", "쉼"],
        catchphrase: "이제 좀 쉬어도 되지 않을까",
        evidence_quote: trim(counter || situation),
        role: "exile",
      },
    ],
    leader_id: "p1",
    conflicts: [
      {
        a: "p1",
        b: "p2",
        reason:
          "한 마음은 더 몰아붙이려 하고, 다른 마음은 멈추고 쉬고 싶어 해서 자주 부딪쳐요",
      },
    ],
    summary:
      "당신 안에는 끊임없이 더 하라고 다그치는 마음과, 이제는 멈추고 쉬고 싶은 마음이 함께 있어요.",
    source: "dialogue",
    generated_at: new Date().toISOString(),
  };
}
