"use client";

/**
 * /minds 결제 직전 로그인 관문 — 결제 모달 안에서 뜨는 인증 폼.
 *
 * 정책: 무료 리포트는 비로그인으로 진행하되, "결제 직전"에 로그인/가입을 받아 이후 결제·
 * 리포트를 계정(user_id)에 묶는다. 로그인 한 번이면 결제 단계에서 추가 로그인이 없다.
 *
 *  · 이메일+비밀번호: 페이지 이동 없이 그 자리에서 로그인/가입(흐름 안 끊김).
 *    - 로그인/가입 성공 즉시 이 브라우저의 leadId 를 계정에 귀속(claim)하고 onAuthed().
 *    - 가입 시 이메일 인증(Confirm email)이 켜져 있으면 세션이 안 생긴다 → 안내 메시지.
 *      (즉시 결제로 이어지려면 Supabase 의 Confirm email 을 꺼야 한다.)
 *  · 카카오: OAuth 는 페이지를 떠나므로, 돌아올 곳(현재 리포트 + 결제 재개)을 쿠키에
 *    심고 리다이렉트한다. /auth/callback 이 auth_redirect 쿠키를 읽어 복귀시킨다.
 *
 * 디자인은 무료 /minds 와 같은 '콰이엇 에디토리얼' 토큰(M)을 따른다.
 */

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MINDS_LEAD_STORAGE_KEY } from "@/lib/minds/storage";
import { M, ctaStyle } from "./quiet-editorial";
import { isValidKrMobile } from "@/lib/solapi/client";

type Tab = "login" | "signup";

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: "13px 14px",
  borderRadius: 2,
  border: `1.5px solid ${M.line}`,
  background: M.paper2,
  fontFamily: M.font,
  fontSize: 15,
  color: M.ink,
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontFamily: M.mono,
  fontSize: 10.5,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: M.mute,
};

/** 이 브라우저의 leadId(없으면 null). */
function readLeadId(): string | null {
  try {
    return localStorage.getItem(MINDS_LEAD_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** 로그인/가입 직후 이 브라우저의 리드를 계정에 귀속(claim). 실패해도 흐름은 막지 않는다. */
async function claimLead() {
  try {
    await fetch("/api/minds/lead/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: readLeadId() }),
    });
  } catch {
    // 결제 라우트가 한 번 더 바인딩하므로, 여기 실패는 치명적이지 않다.
  }
}

export function MindsAuthGate({ onAuthed }: { onAuthed: () => void }) {
  const [tab, setTab] = useState<Tab>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabase) {
      setMessage("로그인이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await claimLead();
        onAuthed();
        return;
      }

      // 가입 — 알림톡 발송·결제 안내를 위해 휴대폰 번호를 필수로 받는다.
      if (!isValidKrMobile(phone)) {
        setMessage("알림톡을 받을 휴대폰 번호를 정확히 입력해주세요.");
        return;
      }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.session) {
        // Confirm email 이 켜져 있어 세션이 없음 — 즉시 결제로 못 넘어간다.
        setMessage(
          "확인 메일을 보냈어요. 메일의 링크로 인증한 뒤 다시 결제해주세요."
        );
        return;
      }
      // 프로필 보강(이름·전화번호 저장). 실패해도 결제 흐름은 진행.
      if (data.user) {
        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: email.trim().toLowerCase(),
            name: name || null,
            phone: phone.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      }
      // 가입 환영 알림톡 — 서버가 profiles.phone 으로 1회 발송(멱등). 실패해도 흐름 유지.
      try {
        await fetch("/api/notify/signup-welcome", { method: "POST" });
      } catch {
        /* 알림톡 실패는 가입/결제 흐름을 막지 않는다 */
      }
      await claimLead();
      onAuthed();
    } catch (err) {
      setMessage(
        err instanceof Error ? authMessageKo(err.message) : "처리에 실패했어요."
      );
    } finally {
      setLoading(false);
    }
  };

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
      const leadId = readLeadId();
      if (leadId) {
        document.cookie = `auth_redirect=${encodeURIComponent(
          `/minds/r/${leadId}?checkout=1`
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
        리포트를 계정에 안전하게 보관하기 위해 로그인해요. 한 번 로그인하면 결제까지
        바로 이어지고, 다음에 어느 기기에서든 로그인만 하면 무료·유료 리포트를 다시 볼 수 있어요.
      </p>

      {/* 카카오 */}
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
        카카오로 계속하기
      </button>

      {/* 구분선 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
        <div style={{ flex: 1, height: 1, background: M.line }} />
        <span style={{ ...labelStyle, fontSize: 10 }}>또는 이메일</span>
        <div style={{ flex: 1, height: 1, background: M.line }} />
      </div>

      {/* 로그인/가입 탭 */}
      <div style={{ display: "flex", border: `1.5px solid ${M.ink}`, borderRadius: 2, padding: 3, marginBottom: 16 }}>
        {(["signup", "login"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setMessage(null); }}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 1,
              border: "none",
              cursor: "pointer",
              fontFamily: M.font,
              fontWeight: 700,
              fontSize: 13.5,
              background: tab === t ? M.ink : "transparent",
              color: tab === t ? M.paper : M.ink2,
            }}
          >
            {t === "signup" ? "가입하기" : "로그인"}
          </button>
        ))}
      </div>

      <form onSubmit={handleEmail}>
        <label style={labelStyle}>
          이메일
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@email.com"
            style={inputStyle}
          />
        </label>
        <div style={{ height: 12 }} />
        <label style={labelStyle}>
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder={tab === "signup" ? "6자 이상" : "비밀번호"}
            style={inputStyle}
          />
        </label>
        {tab === "signup" && (
          <>
            <div style={{ height: 12 }} />
            <label style={labelStyle}>
              이름 <span style={{ textTransform: "none", letterSpacing: 0 }}>(선택)</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                style={inputStyle}
              />
            </label>
            <div style={{ height: 12 }} />
            <label style={labelStyle}>
              휴대폰
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="010-1234-5678"
                style={inputStyle}
              />
            </label>
          </>
        )}

        <button
          type="submit"
          disabled={loading || !hasSupabase}
          style={{ ...ctaStyle, marginTop: 18, opacity: loading || !hasSupabase ? 0.5 : 1 }}
        >
          {loading
            ? "처리 중…"
            : tab === "signup"
            ? "가입하고 계속하기"
            : "로그인하고 계속하기"}
        </button>
      </form>

      {message && (
        <p style={{ fontFamily: M.font, fontSize: 13, color: M.accent, lineHeight: 1.6, margin: "14px 0 0" }}>
          {message}
        </p>
      )}
    </div>
  );
}

/** Supabase 의 영문 에러를 사용자용 한국어로 부드럽게 바꾼다. */
function authMessageKo(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login")) return "이메일 또는 비밀번호가 올바르지 않아요.";
  if (m.includes("already registered") || m.includes("already exists"))
    return "이미 가입된 이메일이에요. '로그인' 탭에서 로그인해주세요.";
  if (m.includes("password")) return "비밀번호는 6자 이상이어야 해요.";
  if (m.includes("email")) return "이메일 형식을 확인해주세요.";
  return raw;
}
