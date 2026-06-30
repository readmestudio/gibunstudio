"use client";

/**
 * 무료 "마음 확인"(/minds) 상태머신 오케스트레이터.
 *
 *   landing → capture → conversation → analyzing → report
 *
 * 공유 상태(리드 id·마음지도)를 들고 단계를 전환한다.
 *  - capture 완료 즉시 /api/minds/lead 로 연락처를 저장하고 id 를 받아 둔다(이탈 대비).
 *  - conversation 완료 시 /api/minds/parts-map 로 실제 LLM 분석을 호출해 마음지도를
 *    만들고(leadId 동봉 → 같은 리드 행에 답변·결과가 붙는다), report 로 넘어간다.
 *  - 분석 호출이 길어질 수 있어 그 사이 analyzing 로딩 화면을 보여준다.
 *
 * 전환 측정: 연락처 제출(Lead) · 결과 도달(ViewContent) 을 Meta 픽셀로 추적한다.
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
import { MindsLeadCapture, type MindsLead } from "./MindsLeadCapture";
import { MindsConversation, type MindAnswer } from "./MindsConversation";
import { MindsFreeReport } from "./MindsFreeReport";
import { MindsAnalyzing } from "./MindsAnalyzing";

type Phase = "landing" | "capture" | "conversation" | "analyzing" | "report";

export function MindsFlow() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [partsMap, setPartsMap] = useState<PartsMap | null>(null);
  const router = useRouter();

  // 재방문 자동 복원 — 이전에 분석을 마친 브라우저면 저장된 결과 페이지로 보낸다.
  // (무효 id 면 결과 페이지가 안내를 띄우고 저장값을 정리하므로 무한 복원되지 않는다.)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(MINDS_LEAD_STORAGE_KEY);
    if (saved) router.replace(`/minds/r/${saved}`);
    // 마운트 시 1회만 — router 는 안정 참조.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 연락처 저장(fire-and-forget). 실패해도 사용자 흐름은 막지 않는다.
  const saveLead = async (lead: MindsLead) => {
    try {
      const res = await fetch("/api/minds/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: lead.channel,
          email: lead.value,
          attribution: getAttribution(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (json?.id) setLeadId(json.id);
    } catch {
      // 네트워크 실패 — 결과 보기는 계속 진행.
    }
  };

  // 카카오 OAuth 복귀 처리.
  // /auth/callback 이 세션을 굽고 /minds?auth=kakao 로 되돌려보내면, 로그인된 세션에서
  // 실제 카카오 이메일을 읽어 리드를 저장하고 곧장 대화 단계로 진입시킨다(capture 생략).
  // 표식은 곧바로 URL 에서 지워 새로고침/뒤로가기 시 재진입을 막는다.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") !== "kakao") return;
    // 이미 분석을 마친 브라우저면 위 복원 effect가 결과 페이지로 보내므로 양보한다.
    if (localStorage.getItem(MINDS_LEAD_STORAGE_KEY)) return;

    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      // URL 에서 auth 표식 제거 (히스토리 치환).
      router.replace("/minds");
      if (cancelled || !data.user) return;
      // 실제 카카오 이메일로 리드 저장(서버가 세션에서 신원을 다시 확인) → 대화로.
      await saveLead({ channel: "kakao", value: data.user.email ?? "" });
      trackMetaEvent("Lead", { content_name: "minds" });
      if (!cancelled) setPhase("conversation");
    })();
    return () => {
      cancelled = true;
    };
    // 마운트 시 1회만 — router 는 안정 참조, saveLead 는 매 렌더 동일 동작.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          onStart={() => {
            // 광고 최적화용 — "테스트 시작" 클릭을 맞춤 이벤트로 잡는다.
            // 이 단계는 URL 이동이 없어 PageView 가 울리지 않으므로 코드로 직접 발화.
            trackMetaCustom("StartTest", { content_name: "minds" });
            // 운영자 슬랙에도 "테스트 시작" 신호를 보낸다(세션당 1회 dedupe).
            trackMindsFunnel("test_start");
            setPhase("capture");
          }}
        />
      )}

      {phase === "capture" && (
        <MindsLeadCapture
          onSubmit={(lead) => {
            void saveLead(lead);
            trackMetaEvent("Lead", { content_name: "minds" });
            setPhase("conversation");
          }}
          onBack={() => setPhase("landing")}
        />
      )}

      {phase === "conversation" && (
        <MindsConversation onComplete={(answers) => void runAnalysis(answers)} />
      )}

      {phase === "analyzing" && <MindsAnalyzing />}

      {phase === "report" && partsMap && (
        <MindsFreeReport partsMap={partsMap} />
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
