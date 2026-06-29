"use client";

/**
 * 테스트 이탈 리뷰 팝업.
 *
 * 무료 테스트를 끝내고 페이월(결제 화면)을 본 방문자가 "결제하지 않고 나가려는 순간"
 * 떠올라 후기를 부탁한다. 매달 추첨으로 스타벅스 쿠폰을 드린다고 안내해 작성률을 높인다.
 *
 * 이탈 감지(둘 다 armed 일 때만 동작):
 *   · PC   — 마우스가 화면 위쪽(주소창/탭 방향)으로 빠져나갈 때(mouseout, clientY<=0)
 *   · 모바일 — 뒤로가기를 누를 때. 히스토리에 가짜 항목을 심어 첫 뒤로가기를 가로챈다.
 *
 * 세션당 1회만 노출한다(sessionStorage). 한 번 보거나 제출하면 다시 뜨지 않는다.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type TestType = "achievement" | "minds";

const STAR_LABELS = ["별로예요", "그저 그래요", "괜찮아요", "좋아요", "최고예요"];

export function ReviewPopup({
  testType,
  armed,
  getLeadId,
}: {
  testType: TestType;
  // 페이월을 본 뒤(이탈 감지를 켜야 할 때) true. 그 전에는 감지하지 않는다.
  armed: boolean;
  // minds 처럼 비로그인 식별자(leadId)를 붙일 수 있으면 전달. 없으면 익명.
  getLeadId?: () => string | null;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false); // 제출 완료(감사 화면)
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 세션당 1회 가드. shownRef 는 같은 렌더 사이에서 중복 트리거를 막는다.
  const shownRef = useRef(false);
  const sessionKey = `review_shown_${testType}`;

  const trigger = useCallback(() => {
    if (shownRef.current) return;
    try {
      if (sessionStorage.getItem(sessionKey)) {
        shownRef.current = true; // 이미 이번 세션에 봤음 → 다시 안 띄움
        return;
      }
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      // sessionStorage 접근 불가(시크릿 모드 등) — 가드 없이 1회 띄운다.
    }
    shownRef.current = true;
    setOpen(true);
  }, [sessionKey]);

  // ── 이탈 감지 배선 ──
  useEffect(() => {
    if (!armed) return;
    if (typeof window === "undefined") return;
    // 이미 이번 세션에 노출했으면 감지기를 달지 않는다.
    try {
      if (sessionStorage.getItem(sessionKey)) {
        shownRef.current = true;
        return;
      }
    } catch {
      /* 무시 */
    }

    // PC: 마우스가 뷰포트 위쪽 밖으로 나가면 이탈 의도로 본다.
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) trigger();
    };

    // 모바일: 뒤로가기를 가로채기 위해 가짜 히스토리 항목을 하나 심는다.
    // 첫 뒤로가기는 이 가짜 항목을 소비하며 popstate 를 일으키고 → 팝업을 띄운다.
    // (사용자는 같은 화면에 머물고, 한 번 더 뒤로가기를 누르면 정상 이탈)
    let pushed = false;
    try {
      window.history.pushState({ reviewGuard: testType }, "");
      pushed = true;
    } catch {
      /* 무시 */
    }
    const onPopState = () => trigger();

    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("popstate", onPopState);
      void pushed; // 심어둔 가짜 항목은 굳이 되돌리지 않는다(부작용 최소화).
    };
  }, [armed, sessionKey, trigger, testType]);

  const submit = useCallback(async () => {
    if (submitting) return;
    // 최대한 많이 모으기 위해 별점(한 번 탭)만 필수. 후기 글·연락처는 선택.
    if (rating < 1) {
      setError("별점만 눌러도 응모돼요!");
      return;
    }
    setSubmitting(true);
    setError(null);

    let leadId: string | null = null;
    try {
      leadId = getLeadId?.() ?? null;
    } catch {
      leadId = null;
    }

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType,
          rating,
          content: content.trim(),
          contact: contact.trim(),
          leadId,
          landingPath:
            typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "저장에 실패했어요. 잠시 후 다시 시도해 주세요");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("네트워크 오류가 발생했어요");
      setSubmitting(false);
    }
  }, [submitting, rating, content, contact, getLeadId, testType]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="테스트 후기 작성"
      style={overlay}
      onClick={() => setOpen(false)}
    >
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="닫기"
          onClick={() => setOpen(false)}
          style={closeBtn}
        >
          ✕
        </button>

        {done ? (
          // ── 감사 화면 ──
          <div style={{ textAlign: "center", padding: "12px 4px" }}>
            <p style={{ fontSize: 32, lineHeight: 1, marginBottom: 14 }}>🎉</p>
            <h2 style={title}>소중한 후기 감사해요!</h2>
            <p style={bodyText}>
              매달 추첨으로 <b>10분께 스타벅스 커피 쿠폰</b>을 보내드려요.
              <br />
              당첨되시면 남겨주신 연락처로 연락드릴게요.
            </p>
            <button type="button" style={primaryBtn} onClick={() => setOpen(false)}>
              닫기
            </button>
          </div>
        ) : (
          // ── 작성 화면 ──
          <>
            <p style={kicker}>잠깐, 나가기 전에 🎁</p>
            <h2 style={title}>리뷰 남기고 스타벅스 쿠폰 받아 가세요</h2>
            <p style={bodyText}>
              당신의 경험을 들려 주세요. 별점만 눌러도{" "}
              <b>매달 추첨 10분께 드리는 커피 쿠폰</b>에 응모돼요. 무엇보다, 당신이
              당신과 있을 때 가장 편안하기를 바랍니다!
            </p>

            {/* 별점 */}
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n}점`}
                    onClick={() => {
                      setRating(n);
                      setError(null);
                    }}
                    style={{
                      ...starBtn,
                      color: n <= rating ? "var(--foreground)" : "#d4d4d4",
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p style={starLabel}>
                {rating > 0 ? STAR_LABELS[rating - 1] : "별점을 눌러주세요"}
              </p>
            </div>

            {/* 후기 본문 */}
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError(null);
              }}
              maxLength={2000}
              rows={3}
              placeholder="(선택) 테스트 어떠셨나요? 한 줄 후기도 환영해요."
              style={textarea}
            />

            {/* 추첨 연락처 */}
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={200}
              placeholder="(선택) 당첨 시 연락받을 이메일 또는 휴대폰"
              style={input}
            />

            {error && <p style={errorText}>{error}</p>}

            <button
              type="button"
              style={{ ...primaryBtn, opacity: submitting ? 0.6 : 1 }}
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "보내는 중…" : "응모하기"}
            </button>
            <p style={fineprint}>
              연락처는 쿠폰 추첨·발송에만 사용하고 그 외 용도로 쓰지 않아요.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── 스타일 (Monotone — 화이트 기반, 검정 텍스트/테두리) ──
const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  background: "rgba(0,0,0,0.45)",
};

const panel: React.CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: 380,
  background: "#ffffff",
  border: "2px solid var(--foreground)",
  borderRadius: 18,
  padding: "28px 22px 22px",
  boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
};

const closeBtn: React.CSSProperties = {
  position: "absolute",
  top: 12,
  right: 14,
  fontSize: 15,
  color: "var(--foreground)",
  opacity: 0.4,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  lineHeight: 1,
};

const kicker: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.04em",
  color: "var(--foreground)",
  opacity: 0.55,
  textAlign: "center",
  marginBottom: 6,
};

const title: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "var(--foreground)",
  textAlign: "center",
  lineHeight: 1.4,
  marginBottom: 10,
};

const bodyText: React.CSSProperties = {
  fontSize: 13.5,
  lineHeight: 1.65,
  color: "var(--foreground)",
  opacity: 0.7,
  textAlign: "center",
};

const starBtn: React.CSSProperties = {
  fontSize: 30,
  lineHeight: 1,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 0,
  transition: "color 0.12s",
};

const starLabel: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12.5,
  textAlign: "center",
  color: "var(--foreground)",
  opacity: 0.6,
  minHeight: 16,
};

const textarea: React.CSSProperties = {
  width: "100%",
  marginTop: 16,
  padding: "11px 13px",
  fontSize: 14,
  lineHeight: 1.55,
  color: "var(--foreground)",
  border: "1.5px solid rgba(25,25,25,0.18)",
  borderRadius: 10,
  resize: "none",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const input: React.CSSProperties = {
  width: "100%",
  marginTop: 10,
  padding: "11px 13px",
  fontSize: 14,
  color: "var(--foreground)",
  border: "1.5px solid rgba(25,25,25,0.18)",
  borderRadius: 10,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const errorText: React.CSSProperties = {
  marginTop: 10,
  fontSize: 12.5,
  color: "#d92d20",
  textAlign: "center",
};

const primaryBtn: React.CSSProperties = {
  width: "100%",
  marginTop: 16,
  padding: "13px 16px",
  fontSize: 14.5,
  fontWeight: 700,
  color: "#ffffff",
  background: "var(--foreground)",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontFamily: "inherit",
};

const fineprint: React.CSSProperties = {
  marginTop: 10,
  fontSize: 11,
  lineHeight: 1.5,
  color: "var(--foreground)",
  opacity: 0.45,
  textAlign: "center",
};
