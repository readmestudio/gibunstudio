"use client";

/**
 * /minds 2단계 — 리드 확보 (이메일 또는 카카오). 콰이엇 에디토리얼 리스킨.
 *
 * 무거운 회원가입 대신 가벼운 연락처만. 결과(마음 리스트)는 곧바로 보여주고,
 * 이 연락처로 "더 깊은 분석/워크북" 후속 마케팅과 결제 전환 시 연속성(무료에서
 * 만난 마음 이관)을 잇는다.
 *
 * 카카오: 실제 Supabase OAuth(provider:"kakao")로 인증창을 띄운다. 인증 후
 * /auth/callback 이 세션을 굽고 auth_redirect 쿠키로 /minds?auth=kakao 로 되돌리면,
 * MindsFlow 가 세션을 감지해 실제 카카오 이메일로 리드를 저장하고 대화로 진입한다.
 * 이메일: 형식만 검증하고 곧장 onSubmit 으로 다음 단계로 넘어간다.
 */

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { M, Kicker, dispStyle, leadStyle, ctaStyle } from "./quiet-editorial";

export type LeadChannel = "email" | "kakao";

export interface MindsLead {
  channel: LeadChannel;
  /** email 채널일 때 입력값. kakao는 OAuth 후 세션에서 서버가 실제 이메일을 채운다. */
  value: string;
}

interface Props {
  onSubmit: (lead: MindsLead) => void;
  onBack: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldStyle = {
  width: "100%",
  padding: "15px 16px",
  borderRadius: 2,
  background: M.paper2,
  fontSize: 15,
  color: M.ink,
  fontFamily: M.font,
  outline: "none",
} as const;

export function MindsLeadCapture({ onSubmit, onBack }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [kakaoLoading, setKakaoLoading] = useState(false);

  const submitEmail = () => {
    const v = email.trim();
    if (!EMAIL_RE.test(v)) {
      setError("이메일 형식을 확인해주세요.");
      return;
    }
    onSubmit({ channel: "email", value: v });
  };

  // 진짜 카카오 로그인. 성공하면 카카오 인증창으로 리다이렉트되므로 이 함수는 거기서
  // 끝난다. 인증 후엔 /auth/callback → /minds?auth=kakao 로 돌아와 MindsFlow 가 이어받는다.
  const startKakao = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setError("로그인 설정이 아직 준비되지 않았어요. 이메일로 진행해주세요.");
      return;
    }
    setKakaoLoading(true);
    setError("");
    try {
      // OAuth 후 /minds 로 돌아와 대화를 이어가도록 복귀 경로를 쿠키에 저장한다.
      // (/auth/callback 이 이 쿠키를 읽어 같은 경로로 되돌린다.)
      document.cookie = `auth_redirect=${encodeURIComponent(
        "/minds?auth=kakao"
      )}; path=/; max-age=600; SameSite=Lax`;
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: `${origin}/auth/callback` },
      });
      if (oauthError) throw oauthError;
      // 성공 시 카카오로 리다이렉트되어 아래 코드는 실행되지 않는다.
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "카카오 로그인에 실패했어요. 잠시 후 다시 시도해주세요."
      );
      setKakaoLoading(false);
    }
  };

  return (
    <section style={{ paddingTop: 12 }}>
      <button
        type="button"
        onClick={onBack}
        style={{ marginBottom: 26, fontSize: 13, color: M.mute, fontFamily: M.font, background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        ← 뒤로
      </button>

      <Kicker>Almost there · 결과 받기</Kicker>
      <h2 style={{ ...dispStyle, fontSize: 28, marginTop: 16 }}>
        결과를 어디로
        <br />
        보내드릴까요?
      </h2>
      <p style={{ ...leadStyle, marginTop: 16, maxWidth: 340 }}>
        마음 리스트는 바로 보여드려요. 남겨주신 곳으로는, 원하실 때 더 깊은 분석
        리포트를 이어볼 수 있게 안내해드릴게요.
      </p>

      {/* 카카오 — 실제 Supabase OAuth. 누르면 카카오 인증창으로 이동한다. */}
      <button
        type="button"
        onClick={startKakao}
        disabled={kakaoLoading}
        style={{
          ...ctaStyle,
          marginTop: 28,
          background: "#FEE500",
          color: "#191600",
          padding: "18px 20px",
          fontSize: 15,
          opacity: kakaoLoading ? 0.6 : 1,
          cursor: kakaoLoading ? "default" : "pointer",
        }}
      >
        {kakaoLoading ? "카카오로 이동 중…" : "카카오로 시작하기"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
        <span style={{ height: 1, flex: 1, background: M.line }} />
        <span style={{ fontSize: 12, color: M.mute, fontFamily: M.mono, letterSpacing: "0.08em" }}>또는 이메일로</span>
        <span style={{ height: 1, flex: 1, background: M.line }} />
      </div>

      <input
        type="email"
        inputMode="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submitEmail();
        }}
        placeholder="name@example.com"
        style={{ ...fieldStyle, boxShadow: error ? `inset 0 0 0 1px ${M.accent}` : `inset 0 0 0 1px ${M.line}` }}
      />
      {error && (
        <p style={{ marginTop: 8, fontSize: 12, color: M.accent, fontFamily: M.font }}>{error}</p>
      )}

      <button
        type="button"
        onClick={submitEmail}
        style={{ ...ctaStyle, marginTop: 16, padding: "18px 20px", fontSize: 15 }}
        className="transition-transform active:scale-[0.99]"
      >
        이메일로 시작하기
      </button>

      <p style={{ marginTop: 20, fontSize: 11.5, lineHeight: 1.6, color: M.mute, fontFamily: M.font }}>
        입력하신 정보는 결과 안내와 서비스 소식 전달에만 쓰여요. 언제든 수신을 해지할 수 있어요.
      </p>
    </section>
  );
}
