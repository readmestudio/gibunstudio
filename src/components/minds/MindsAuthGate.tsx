"use client";

/**
 * /minds 결제 직전 로그인 관문 — 결제 모달 안에서 뜨는 인증 폼.
 *
 * 정책: 무료 리포트는 비로그인으로 진행하되, "결제 직전"에 로그인/가입을 받아 이후 결제·
 * 리포트를 계정(user_id)에 묶는다. 로그인 한 번이면 결제 단계에서 추가 로그인이 없다.
 *
 * 인증은 카카오 전용이다. 이메일 가입은 연락처를 사용자 입력에 의존해 누락·오탈자가 잦지만,
 * 카카오는 auth/callback 에서 provider_token 으로 검증된 실제 전화번호를 받아온다 —
 * 결제 완료·유료 안내 알림톡 발송에 반드시 필요하다.
 *
 *  · 카카오: OAuth 는 페이지를 떠나므로, 돌아올 곳(현재 리포트 + 결제 재개)을 쿠키에
 *    심고 리다이렉트한다. /auth/callback 이 auth_redirect 쿠키를 읽어 복귀시킨다.
 *    복귀 후 결제 라우트가 이 브라우저의 leadId 를 계정에 귀속(bind)한다.
 *
 * 디자인은 무료 /minds 와 같은 '콰이엇 에디토리얼' 토큰(M)을 따른다.
 */

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MINDS_FUNNEL, type MindsFunnelConfig } from "@/lib/minds/funnel-config";
import { M } from "./quiet-editorial";

/** 이 브라우저의 leadId(없으면 null). 저장키는 퍼널별로 다르다. */
function readLeadId(storageKey: string): string | null {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function MindsAuthGate({
  funnel = MINDS_FUNNEL,
}: {
  // 카카오 전용 게이트 — OAuth 가 페이지를 떠나므로 복귀는 auth_redirect 쿠키 →
  // /auth/callback 이 담당한다(성공 콜백 prop 이 필요 없다).
  funnel?: MindsFunnelConfig;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  const handleKakao = async () => {
    if (!hasSupabase) {
      setMessage("로그인이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // 카카오는 페이지를 떠난다 → 돌아올 곳을 쿠키에 심는다.
      // 현재 리드의 결과 페이지로 복귀하며 ?checkout=1 로 결제 모달을 자동으로 다시 연다.
      const leadId = readLeadId(funnel.leadStorageKey);
      if (leadId) {
        document.cookie = `auth_redirect=${encodeURIComponent(
          `${funnel.freeReportBase}/${leadId}?checkout=1`
        )}; path=/; max-age=600; SameSite=Lax`;
      }
      const origin = window.location.origin;
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: `${origin}/auth/callback` },
      });
      if (error) throw error;
      // 성공 시 페이지가 카카오로 이동하므로 이후 코드는 실행되지 않는다.
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "카카오 로그인에 실패했어요."
      );
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: M.font, fontWeight: 800, fontSize: 22, color: M.ink, margin: 0, letterSpacing: "-0.02em" }}>
        결제 전, 잠깐만요
      </h2>
      <p style={{ fontFamily: M.font, fontSize: 13.5, color: M.ink2, lineHeight: 1.65, margin: "10px 0 0" }}>
        리포트를 계정에 안전하게 보관하기 위해 카카오로 로그인해요. 한 번 로그인하면
        결제까지 바로 이어지고, 결제·안내는 카카오에 연결된 연락처로 보내드려요.
        다음에 어느 기기에서든 로그인만 하면 무료·유료 리포트를 다시 볼 수 있어요.
      </p>

      {/* 카카오 (유일한 로그인 수단 — 검증된 연락처 확보) */}
      <button
        type="button"
        onClick={handleKakao}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: 20,
          padding: "15px 16px",
          borderRadius: 2,
          background: "#FEE500",
          color: "#191919",
          fontFamily: M.font,
          fontWeight: 700,
          fontSize: 15,
          border: "none",
          cursor: "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "카카오로 이동 중…" : "카카오로 계속하기"}
      </button>

      {message && (
        <p style={{ fontFamily: M.font, fontSize: 13, color: M.accent, lineHeight: 1.6, margin: "14px 0 0" }}>
          {message}
        </p>
      )}
    </div>
  );
}
