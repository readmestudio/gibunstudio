"use client";

/**
 * 유료 리포트 뷰 — 생성/로딩/에러 상태 + 본문 렌더.
 *
 * 최초 진입(캐시 없음)이면 마운트 시 생성 라우트를 호출하고(~50초) 진행 화면을 보여준다.
 * 캐시가 있으면(server 에서 initialReport 주입) 즉시 본문을 렌더한다. 디자인은 무료
 * /minds 와 같은 '콰이엇 에디토리얼' 토큰(M)을 따른다(모노톤·헤어라인·각진 블록).
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { M } from "@/components/minds/quiet-editorial";
import { KAKAO_CHANNEL_URL, TESTIMONIALS } from "@/app/programs/counseling/content";
import type {
  RelationshipReport,
  RolePresence,
  RoleSlotAnalysis,
  RoleSlotKey,
} from "@/lib/minds/relationship-report";

const PRESENCE_KO: Record<RolePresence, string> = {
  dominant: "지금 무대 중심",
  active: "작동 중",
  dormant: "이번엔 잠잠",
};

const LOADING_STEPS = [
  "답변을 다시 읽고 있어요",
  "다섯 배역을 캐스팅하는 중",
  "배역들의 관계를 잇는 중",
  "당신만의 처방을 쓰는 중",
  "거의 다 됐어요",
];

export function MindsRelationshipView({
  purchaseId,
  status,
  initialReport,
}: {
  purchaseId: string;
  status: string | null;
  initialReport: RelationshipReport | null;
}) {
  const [report, setReport] = useState<RelationshipReport | null>(initialReport);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const running = useRef(false);

  useEffect(() => {
    if (report || status !== "confirmed" || running.current) return;
    running.current = true;
    setError(null);
    (async () => {
      try {
        const res = await fetch("/api/minds/relationship", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purchaseId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.report) {
          setError(data?.error || "리포트를 불러오지 못했어요.");
        } else {
          setReport(data.report as RelationshipReport);
        }
      } catch {
        setError("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
      } finally {
        running.current = false;
      }
    })();
  }, [purchaseId, status, report, attempt]);

  const retry = () => {
    setError(null);
    setAttempt((a) => a + 1);
  };

  if (report) return <ReportBody report={report} />;
  if (status === null) {
    return (
      <Centered
        title="리포트를 찾을 수 없어요"
        body="링크가 정확한지 다시 확인해주세요. 문제가 계속되면 카카오톡 채널로 문의해주세요."
      />
    );
  }
  if (status !== "confirmed") {
    return (
      <Centered
        title="아직 결제가 확인되지 않았어요"
        body="결제가 완료되면 이 화면에서 바로 리포트를 볼 수 있어요."
      />
    );
  }
  if (error) return <ErrorView error={error} onRetry={retry} />;
  return <LoadingView />;
}

/* ───────────────── 상태 화면 ───────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: M.paper, minHeight: "100vh" }}>
      <div style={{ maxWidth: 448, margin: "0 auto", padding: "0 24px" }}>
        {children}
      </div>
    </div>
  );
}

function Centered({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 12,
        }}
      >
        <div style={{ fontFamily: M.font, fontWeight: 800, fontSize: 20, color: M.ink }}>
          {title}
        </div>
        <p style={{ fontFamily: M.font, fontSize: 14, color: M.ink2, lineHeight: 1.7, margin: 0 }}>
          {body}
        </p>
      </div>
    </Shell>
  );
}

function LoadingView() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)),
      9000
    );
    return () => clearInterval(t);
  }, []);
  return (
    <Shell>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            border: `2px solid ${M.line}`,
            borderTopColor: M.ink,
            borderRadius: "50%",
            animation: "mr-spin 0.9s linear infinite",
          }}
        />
        <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 17, color: M.ink }}>
          {LOADING_STEPS[step]}
        </div>
        <p style={{ fontFamily: M.font, fontSize: 13, color: M.mute, lineHeight: 1.7, margin: 0 }}>
          내 답변을 다시 읽고 다섯 배역과 그 관계를 분석하고 있어요.
          <br />
          20~50초쯤 걸려요. 이 화면을 닫아도 괜찮아요 — 제작이 끝나면
          <br />
          <a
            href="/minds/my"
            style={{ color: M.ink, fontWeight: 700, textDecoration: "underline" }}
          >
            내 리포트 대시보드
          </a>
          에서 언제든 다시 확인할 수 있어요.
        </p>
        <style>{`@keyframes mr-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </Shell>
  );
}

function ErrorView({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Shell>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 16,
        }}
      >
        <div style={{ fontFamily: M.font, fontWeight: 800, fontSize: 19, color: M.ink }}>
          리포트를 만드는 데 문제가 생겼어요
        </div>
        <p style={{ fontFamily: M.font, fontSize: 14, color: M.ink2, lineHeight: 1.7, margin: 0 }}>
          {error}
        </p>
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: 4,
            padding: "14px 28px",
            borderRadius: 2,
            background: M.ink,
            color: M.paper,
            fontFamily: M.font,
            fontWeight: 700,
            fontSize: 15,
            border: "none",
            cursor: "pointer",
          }}
        >
          다시 시도하기
        </button>
        <p style={{ fontFamily: M.font, fontSize: 12.5, color: M.mute, margin: 0 }}>
          이미 결제는 완료됐어요. 계속 안 되면 카카오톡 채널로 문의해주세요.
        </p>
      </div>
    </Shell>
  );
}

/* ───────────────── 리포트 본문 ───────────────── */

const monoLabel: CSSProperties = {
  fontFamily: M.mono,
  fontSize: 10.5,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: M.mute,
};

function SecLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: M.font,
        fontSize: 23,
        fontWeight: 800,
        letterSpacing: "-0.02em",
        color: M.ink,
        lineHeight: 1.3,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

function SecIntro({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: M.font, fontSize: 13.5, color: M.mute, lineHeight: 1.6, margin: "0 0 24px" }}>
      {children}
    </p>
  );
}

/* ───────────────── 개별 페이지 조각 ───────────────── */

/** 한 배역을 한 장 가득 채우는 카드(스크롤 → 페이지 전환의 핵심 단위).
 *  텍스트는 위쪽 불투명 배경에, 캐릭터 이미지는 카드 하단에 고정한다. */
function RolePageCard({ r, index }: { r: RoleSlotAnalysis; index: number }) {
  const dim = r.presence === "dormant";
  return (
    <div
      style={{
        opacity: dim ? 0.62 : 1,
        display: "flex",
        flexDirection: "column",
        // 카드가 화면을 가득 채워, 캐릭터가 항상 '하단'에 자리 잡게 한다.
        minHeight: "calc(100dvh - 212px)",
      }}
    >
      {/* 텍스트 영역 — 불투명 종이 배경 위라 글씨가 또렷하게 보인다 */}
      <div style={{ background: M.paper }}>
        <div style={{ ...monoLabel, marginBottom: 14 }}>배역 {index + 1} / 5</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ fontFamily: M.mono, fontSize: 14, color: M.mute }}>0{index + 1}</span>
          <span style={{ fontFamily: M.font, fontSize: 27, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {r.label}
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: M.mono,
              fontSize: 9.5,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "3px 8px",
              border: `1px solid ${r.presence === "dormant" ? M.line : M.ink}`,
              background: r.presence === "dominant" ? M.ink : "transparent",
              color: r.presence === "dominant" ? M.paper : r.presence === "dormant" ? M.mute : M.ink,
            }}
          >
            {PRESENCE_KO[r.presence]}
          </span>
        </div>
        {r.innerVoice ? (
          <h3 style={{ fontFamily: M.font, fontSize: 21, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.45, margin: "0 0 18px" }}>
            {r.innerVoice}
          </h3>
        ) : null}
        <p style={{ fontFamily: M.font, fontSize: 15.5, color: M.ink2, lineHeight: 1.8, margin: "0 0 14px" }}>
          {r.howItWorks}
        </p>
        {r.protects ? (
          <p style={{ fontFamily: M.font, fontSize: 15.5, color: M.ink, lineHeight: 1.8, margin: "0 0 16px" }}>
            {r.protects}
          </p>
        ) : null}
        {r.evidenceQuote ? (
          <blockquote
            style={{
              margin: "18px 0 0",
              padding: "12px 0 12px 16px",
              borderLeft: `2px solid ${M.ink}`,
              color: M.ink2,
              fontSize: 14,
              fontStyle: "italic",
              fontFamily: M.font,
              lineHeight: 1.7,
            }}
          >
            “{r.evidenceQuote}”
          </blockquote>
        ) : null}
      </div>

      {/* 캐릭터 이미지 — 카드 하단 고정. 불투명 배경 패널 위에 얹고, 배역명 캡션은
          검정 바 위 흰 글씨로 확실히 보이게 한다. slot key 가 파일명과 1:1. */}
      <div style={{ marginTop: "auto", paddingTop: 26 }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 300,
            background: M.paper2,
            border: `2px solid ${M.ink}`,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/minds/cast/${r.slot}.png`}
            alt={`${r.label} 배역 이미지`}
            style={{
              // contain: 배역마다 인물 위치가 달라(추방자는 하단), 잘라내는 cover 대신
              // 일러스트 전체를 담아 사람이 항상 보이게 한다. 남는 여백은 종이톤이 채운다.
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center bottom",
              // 하단 캡션 바(약 38px)에 인물 발끝이 가리지 않도록 아래 여백을 준다.
              padding: "10px 10px 40px",
              boxSizing: "border-box",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              background: M.ink,
              color: M.paper,
              fontFamily: M.font,
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: "-0.01em",
              padding: "9px 14px",
            }}
          >
            {r.label} <span style={{ fontFamily: M.mono, fontWeight: 400, fontSize: 11, opacity: 0.8 }}>· {PRESENCE_KO[r.presence]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 페이지 상단 제목(+선택 소개). 카테고리 페이지들이 공통으로 쓴다. */
function PageHead({ title, intro }: { title: string; intro?: string }) {
  return (
    <>
      <SecLabel>{title}</SecLabel>
      {intro ? <SecIntro>{intro}</SecIntro> : null}
    </>
  );
}

function ReportBody({ report }: { report: RelationshipReport }) {
  const labelOf = (slot: RoleSlotKey) =>
    report.roles.find((r) => r.slot === slot)?.label ?? slot;
  const voiceOf = (slot: RoleSlotKey) =>
    report.roles.find((r) => r.slot === slot)?.innerVoice ?? "";
  const hc = report.headlineConflict;

  /* 리포트를 '넘기는 카드' 배열로 조립한다. 배역이 바뀌거나 카테고리가 바뀔 때마다
     한 장을 새로 만들어, 세로 스크롤 한 장이 아니라 여러 장으로 보이게 한다. */
  const pages: { kicker: string; render: () => React.ReactNode }[] = [];

  // 표지
  pages.push({
    kicker: "표지",
    render: () => (
      <div>
        <div style={{ ...monoLabel, marginBottom: 18 }}>MINDS · 내 마음 배역표</div>
        <h1
          style={{
            fontFamily: M.font,
            fontSize: 31,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            color: M.ink,
            margin: 0,
          }}
        >
          내 마음 속<br />다섯 가지 배역과 그 관계
        </h1>
        {report.metaphor ? (
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: `2px solid ${M.ink}` }}>
            <div style={{ ...monoLabel, fontSize: 10, marginBottom: 10 }}>한 줄로 말하면</div>
            <p style={{ fontFamily: M.font, fontSize: 17, fontWeight: 600, lineHeight: 1.7, color: M.ink, margin: 0 }}>
              {report.metaphor}
            </p>
          </div>
        ) : null}
        <div style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${M.line}` }}>
          <p style={{ fontFamily: M.font, fontSize: 13.5, color: M.mute, lineHeight: 1.7, margin: 0 }}>
            아래 <b style={{ color: M.ink }}>다음</b> 버튼을 누르거나 화면을 옆으로 넘기면
            <br />
            배역 하나하나와 그 관계를 한 장씩 펼쳐 볼 수 있어요.
          </p>
        </div>
      </div>
    ),
  });

  // 배역 5장 — 배역이 바뀔 때마다 새 장
  report.roles.forEach((r, i) => {
    pages.push({
      kicker: `배역 ${i + 1} / 5`,
      render: () => <RolePageCard r={r} index={i} />,
    });
  });

  // 방어기제
  if (report.defenseMechanisms.length) {
    pages.push({
      kicker: "방어기제",
      render: () => (
        <div>
          <PageHead
            title="자주 쓰는 방어기제"
            intro="다섯 배역이 힘을 합쳐 만들어낸, 당신이 자주 꺼내 드는 마음의 방어 전략이에요."
          />
          {report.defenseMechanisms.map((d, i) => (
            <article
              key={i}
              style={{
                padding: "22px 0",
                borderBottom:
                  i === report.defenseMechanisms.length - 1 ? "none" : `1px solid ${M.line}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: M.mono, fontSize: 13, color: M.accent, fontWeight: 700 }}>
                  D{i + 1}
                </span>
                <h3 style={{ fontFamily: M.font, fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", margin: 0, lineHeight: 1.35 }}>
                  {d.name}
                </h3>
              </div>
              {d.fromRoles.length ? (
                <div style={{ margin: "8px 0 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {d.fromRoles.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontFamily: M.font,
                        fontSize: 11,
                        color: M.ink2,
                        border: `1px solid ${M.line}`,
                        padding: "2px 8px",
                        borderRadius: 2,
                      }}
                    >
                      {labelOf(s)}
                    </span>
                  ))}
                </div>
              ) : null}
              <p style={{ fontFamily: M.font, fontSize: 14.5, color: M.ink2, lineHeight: 1.7, margin: "10px 0 0" }}>
                {d.howYouUseIt}
              </p>
            </article>
          ))}
        </div>
      ),
    });
  }

  // 마음의 목소리 TOP 5
  if (report.innerVoices.length) {
    pages.push({
      kicker: "마음의 목소리",
      render: () => (
        <div>
          <PageHead
            title="마음의 목소리 TOP 5"
            intro="이런 당신이 머릿속에서 자주 되뇌었을 법한 말들이에요."
          />
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {report.innerVoices.map((v, i) => (
              <li
                key={i}
                style={{
                  padding: "20px 0",
                  borderBottom:
                    i === report.innerVoices.length - 1 ? "none" : `1px solid ${M.line}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{ fontFamily: M.mono, fontSize: 18, fontWeight: 800, color: M.ink, minWidth: 22, lineHeight: 1.4 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontFamily: M.font, fontSize: 15.5, fontWeight: 700, color: M.ink, lineHeight: 1.55 }}>
                    “{v.voice}”
                  </span>
                </div>
                {v.detail ? (
                  <p style={{ fontFamily: M.font, fontSize: 13.5, color: M.ink2, lineHeight: 1.75, margin: "10px 0 0", paddingLeft: 36 }}>
                    {v.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  // 가장 센 갈등
  pages.push({
    kicker: "가장 센 갈등",
    render: () => (
      <div>
        <PageHead title="가장 센 갈등" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, margin: "6px 0 18px" }}>
          <span style={{ fontFamily: M.font, fontSize: 20, fontWeight: 800, border: `2px solid ${M.ink}`, padding: "10px 16px" }}>
            {labelOf(hc.a)}
          </span>
          <span style={{ fontFamily: M.mono, fontSize: 16, color: M.accent, fontWeight: 700 }}>⇄</span>
          <span style={{ fontFamily: M.font, fontSize: 20, fontWeight: 800, border: `2px solid ${M.ink}`, padding: "10px 16px" }}>
            {labelOf(hc.b)}
          </span>
        </div>
        {/* 각 배역이 '어떤 마음'인지 — 유저가 배역명만 보고 헷갈리지 않게 innerVoice 를 짚어준다 */}
        {voiceOf(hc.a) || voiceOf(hc.b) ? (
          <div style={{ display: "flex", gap: 10, margin: "0 0 4px" }}>
            {([hc.a, hc.b] as RoleSlotKey[]).map((slot) => (
              <div key={slot} style={{ flex: 1, padding: "12px 14px", border: `1px solid ${M.line}`, background: M.paper }}>
                <div style={{ fontFamily: M.font, fontSize: 12, fontWeight: 800, color: M.ink, marginBottom: 4 }}>
                  {labelOf(slot)}
                </div>
                <div style={{ fontFamily: M.font, fontSize: 13.5, color: M.ink2, lineHeight: 1.55 }}>
                  {voiceOf(slot) || "이번 답변엔 잘 드러나지 않은 마음이에요."}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div style={{ fontFamily: M.font, fontWeight: 800, fontSize: 13, margin: "18px 0 6px" }}>반복되는 악순환</div>
        <p style={{ fontFamily: M.font, fontSize: 14.5, color: M.ink2, lineHeight: 1.7, margin: 0 }}>{hc.loop}</p>
        <div style={{ fontFamily: M.font, fontWeight: 800, fontSize: 13, margin: "18px 0 6px" }}>고리를 푸는 법</div>
        <p style={{ fontFamily: M.font, fontSize: 14.5, color: M.ink2, lineHeight: 1.7, margin: 0 }}>{hc.mediation}</p>
      </div>
    ),
  });

  // 나머지 관계도
  if (report.relationships.length) {
    pages.push({
      kicker: "관계도",
      render: () => (
        <div>
          <PageHead title="나머지 관계도" />
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {report.relationships.map((e, i) => (
              <li
                key={i}
                style={{
                  padding: "16px 0",
                  borderBottom:
                    i === report.relationships.length - 1 ? "none" : `1px solid ${M.line}`,
                }}
              >
                <span style={{ display: "block", fontFamily: M.font, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  {labelOf(e.a)} <span style={{ color: M.accent }}>×</span> {labelOf(e.b)}
                </span>
                {/* 각 배역이 어떤 마음인지 — 배역명만으로 헷갈리지 않게 짚어준다 */}
                {voiceOf(e.a) || voiceOf(e.b) ? (
                  <span style={{ display: "block", fontFamily: M.font, fontSize: 12.5, color: M.mute, lineHeight: 1.55, marginBottom: 6 }}>
                    {[e.a, e.b]
                      .map((slot) => (voiceOf(slot) ? `${labelOf(slot)} — ${voiceOf(slot)}` : ""))
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                ) : null}
                <span style={{ fontFamily: M.font, fontSize: 13.5, color: M.ink2, lineHeight: 1.65 }}>
                  {e.dynamic}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  // 이럴 땐, 이렇게
  if (report.actions.length) {
    pages.push({
      kicker: "이럴 땐, 이렇게",
      render: () => (
        <div>
          <PageHead
            title="이럴 땐, 이렇게"
            intro="영혼 없는 조언 말고, 당신의 패턴에 진짜 듣는 처방이에요."
          />
          {report.actions.map((a, i) => (
            <article
              key={i}
              style={{ border: `2px solid ${M.ink}`, padding: "20px 22px", marginBottom: i === report.actions.length - 1 ? 0 : 14 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span
                  style={{
                    fontFamily: M.mono,
                    width: 26,
                    height: 26,
                    border: `1.5px solid ${M.ink}`,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    flex: "0 0 auto",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ ...monoLabel, fontSize: 10 }}>이런 생각이 들 때</span>
              </div>
              <p style={{ fontFamily: M.font, fontSize: 16.5, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.45, margin: "0 0 14px" }}>
                “{a.trigger}”
              </p>
              <div style={{ padding: "1px 0 1px 14px", borderLeft: `3px solid ${M.ink}`, marginBottom: a.why ? 12 : 0 }}>
                <span style={{ display: "block", fontFamily: M.mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: M.accent, fontWeight: 700, marginBottom: 6 }}>
                  이렇게 해보세요
                </span>
                <p style={{ fontFamily: M.font, fontSize: 14.5, color: M.ink, fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                  {a.action}
                </p>
              </div>
              {a.why ? (
                <p style={{ fontFamily: M.font, fontSize: 13.5, color: M.ink2, lineHeight: 1.65, margin: 0 }}>
                  <span style={{ fontWeight: 800, color: M.ink }}>왜 도움이 되냐면 — </span>
                  {a.why}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ),
    });
  }

  // 마무리 편지
  pages.push({
    kicker: "마무리 편지",
    render: () => (
      <div>
        <PageHead title="마무리 편지" />
        <p style={{ fontFamily: M.font, fontSize: 15, color: M.ink, lineHeight: 1.85, whiteSpace: "pre-line", margin: 0 }}>
          {report.closing}
        </p>

        {/* 상담 전환 CTA — 리포트를 다 읽어 마음이 가장 열린 지금이 전환의 순간.
            국가공인 1급 심리상담사 1:1 상담을 카카오톡 문의로 연결한다. */}
        <div style={{ marginTop: 34, padding: "26px 22px", border: `2px solid ${M.ink}`, background: M.paper2 }}>
          <div style={{ ...monoLabel, marginBottom: 12 }}>다음 한 걸음</div>
          <h3 style={{ fontFamily: M.font, fontSize: 19, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.5, color: M.ink, margin: "0 0 10px" }}>
            이 배역들, 혼자 마주하기 벅차다면
            <br />
            1급 심리상담사와 함께 이야기해봐요.
          </h3>
          <p style={{ fontFamily: M.font, fontSize: 13.5, color: M.ink2, lineHeight: 1.7, margin: "0 0 20px" }}>
            리포트에서 만난 내 마음의 패턴을, 상담심리사 1급(한국상담심리학회)과 1:1로 더 깊이 들여다볼 수 있어요. 카카오톡으로 편하게 문의해주세요.
          </p>
          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              textAlign: "center",
              background: M.ink,
              color: M.paper,
              fontFamily: M.font,
              fontWeight: 800,
              fontSize: 15.5,
              letterSpacing: "-0.01em",
              padding: "15px 20px",
              textDecoration: "none",
            }}
          >
            💬 카카오톡으로 상담 문의하기
          </a>

          {/* 상담 후기 — 문의 직전 사회적 증거. counseling 랜딩과 같은 후기를 재사용. */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${M.line}` }}>
            <div style={{ ...monoLabel, marginBottom: 14 }}>먼저 다녀간 사람들</div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {TESTIMONIALS.slice(0, 2).map((t, i, arr) => (
                <li
                  key={i}
                  style={{
                    padding: i === 0 ? "0 0 16px" : "16px 0",
                    borderBottom:
                      i === arr.length - 1 ? "none" : `1px solid ${M.line}`,
                  }}
                >
                  <p style={{ fontFamily: M.font, fontSize: 14, fontWeight: 800, color: M.ink, lineHeight: 1.5, margin: "0 0 8px" }}>
                    “{t.trigger}”
                  </p>
                  <p style={{ fontFamily: M.font, fontSize: 12.5, color: M.ink2, lineHeight: 1.7, margin: "0 0 8px" }}>
                    {t.body}
                  </p>
                  <div style={{ fontFamily: M.font, fontSize: 11.5, color: M.mute }}>
                    {t.who} · {t.meta}
                    <span style={{ margin: "0 6px", opacity: 0.5 }}>|</span>
                    <span style={{ color: M.ink2, fontWeight: 700 }}>{t.plan}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${M.line}`, textAlign: "center" }}>
          <a href="/minds/my" style={{ fontFamily: M.font, fontSize: 13.5, fontWeight: 700, color: M.ink, textDecoration: "underline" }}>
            내 리포트 대시보드로
          </a>
          <div style={{ ...monoLabel, marginTop: 22 }}>GIBUN STUDIO</div>
        </div>
      </div>
    ),
  });

  const total = pages.length;
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = (d: number) =>
    setIdx((i) => Math.max(0, Math.min(total - 1, i + d)));

  // 장이 바뀌면 본문 스크롤을 맨 위로(긴 장에서 넘겨도 항상 처음부터 보이게).
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [idx]);

  // 데스크톱: 좌우 방향키로도 넘긴다.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => Math.min(total - 1, i + 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  // 스와이프(모바일 터치) + 드래그(데스크톱 마우스) 공통 처리.
  const dragStart = (x: number, y: number) => {
    touch.current = { x, y };
  };
  const dragEnd = (x: number, y: number) => {
    if (!touch.current) return;
    const dx = x - touch.current.x;
    const dy = y - touch.current.y;
    touch.current = null;
    // 가로 이동이 세로 스크롤보다 뚜렷할 때만 페이지 전환(세로 스크롤 방해 방지).
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };
  const onTouchStart = (e: React.TouchEvent) =>
    dragStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = (e: React.TouchEvent) =>
    dragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  const onMouseDown = (e: React.MouseEvent) => dragStart(e.clientX, e.clientY);
  const onMouseUp = (e: React.MouseEvent) => dragEnd(e.clientX, e.clientY);

  const atFirst = idx === 0;
  const atLast = idx === total - 1;

  return (
    <div style={{ background: M.paper, height: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* 상단 진행 표시 — 총 몇 장 중 몇 장째인지로 '분량감'을 준다 */}
      <div style={{ flex: "0 0 auto", borderBottom: `1px solid ${M.line}` }}>
        <div style={{ maxWidth: 448, margin: "0 auto", padding: "14px 24px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
            <span style={monoLabel}>{pages[idx].kicker}</span>
            <span style={{ fontFamily: M.mono, fontSize: 11, color: M.ink, fontWeight: 700, letterSpacing: "0.08em" }}>
              {idx + 1} / {total}
            </span>
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {pages.map((_, i) => (
              <span key={i} style={{ flex: 1, height: 3, background: i <= idx ? M.ink : M.line, transition: "background 0.25s" }} />
            ))}
          </div>
        </div>
      </div>

      {/* 본문 — 한 번에 한 장. 긴 장은 세로 스크롤, 좌우 스와이프로 장 전환 */}
      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        style={{ flex: "1 1 auto", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
      >
        <div key={idx} style={{ maxWidth: 448, margin: "0 auto", padding: "30px 24px 40px", animation: "mr-fade 0.32s ease" }}>
          {pages[idx].render()}
        </div>
      </div>

      {/* 하단 내비게이션 */}
      <div style={{ flex: "0 0 auto", borderTop: `1px solid ${M.line}`, background: M.paper }}>
        <div style={{ maxWidth: 448, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={atFirst}
            style={{
              fontFamily: M.font,
              fontSize: 14,
              fontWeight: 700,
              color: atFirst ? M.mute : M.ink,
              background: "transparent",
              border: `1px solid ${atFirst ? M.line : M.ink}`,
              padding: "11px 18px",
              cursor: atFirst ? "default" : "pointer",
              opacity: atFirst ? 0.5 : 1,
            }}
          >
            ‹ 이전
          </button>
          <div style={{ flex: 1 }} />
          {atLast ? (
            <button
              type="button"
              onClick={() => setIdx(0)}
              style={{
                fontFamily: M.font,
                fontSize: 15,
                fontWeight: 700,
                color: M.paper,
                background: M.ink,
                border: `1px solid ${M.ink}`,
                padding: "12px 24px",
                cursor: "pointer",
              }}
            >
              처음으로 ↑
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go(1)}
              style={{
                fontFamily: M.font,
                fontSize: 15,
                fontWeight: 700,
                color: M.paper,
                background: M.ink,
                border: `1px solid ${M.ink}`,
                padding: "12px 28px",
                cursor: "pointer",
              }}
            >
              다음 ›
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes mr-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
