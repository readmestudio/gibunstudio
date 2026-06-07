"use client";

/**
 * Step 종료 done 화면의 시각화 3카드 (2026-06-03 추가).
 *
 * 사용자가 흩어진 Q&A 답이 아니라 *연결된 시각적 인포그래픽*으로
 * 자기 발견을 받아보도록 카드 3장 + 다음 단계 브릿지를 그린다.
 *
 *   1. SurfaceCard  — 표면 · 그때 든 생각 (자동사고·몸·내면말·감정)
 *   2. TruthCard    — 진심 · 사실, 그 마음이 바란 것 (3 단계)
 *   3. CoreWishBanner — CORE WISH (다크 배너)
 *
 * step-recap API가 LLM으로 추출한 데이터를 받아 표시. 각 카드는 데이터 누락 시
 * 폴백 안내문으로 안전하게 비어 보이지 않도록 처리한다.
 */

import { D, TS } from "@/components/self-workshop/clinical-report/v3-shared";
import type {
  CoreWishData,
  PartProfileData,
  SurfaceCardData,
  TruthCardData,
} from "@/lib/self-workshop/conversation";

const CARD_RADIUS = 14;
const BANNER_RADIUS = 16;

/* ───────────────────────────── PartProfileCard ─────────────────────────────
 * Step 3 done 화면 맨 위 임상 카드. "이 마음이 무엇이고·왜 생겼고·어떤 상황에·
 * 어떤 역할로 발현되며·어떤 자동사고를 만드는지"를 정확히 짚는다. */

export function PartProfileCard({ data }: { data: PartProfileData | undefined }) {
  if (!data || (!data.name && !data.narrative)) return null;

  const rows: Array<{ label: string; value: string; quote?: boolean }> = [
    { label: "생긴 계기", value: data.origin },
    { label: "발현되는 상황", value: data.trigger_situation },
    { label: "하려는 역할", value: data.role },
    { label: "만들어내는 자동사고", value: data.automatic_thought, quote: true },
  ].filter((r) => r.value);

  return (
    <article
      style={{
        border: `1.5px solid ${D.ink}`,
        borderRadius: CARD_RADIUS,
        background: D.paper,
        padding: 24,
      }}
    >
      <CardHeader
        kicker="마음 프로필"
        headline={
          data.name ? (
            <>
              내가 만난 마음 ·{" "}
              <em style={{ color: D.accent, fontStyle: "normal", fontWeight: 800 }}>
                {data.name}
              </em>
            </>
          ) : (
            "내가 만난 마음"
          )
        }
        eyebrow="WHO YOU MET"
      />

      {/* 임상 내러티브 */}
      {data.narrative && (
        <p
          style={{
            marginTop: 16,
            fontFamily: D.font,
            fontSize: 15.5,
            color: D.ink,
            lineHeight: 1.75,
          }}
        >
          {data.narrative}
        </p>
      )}

      {/* 정의 리스트 — 계기 / 상황 / 역할 / 자동사고 */}
      {rows.length > 0 && (
        <div
          style={{
            marginTop: 18,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {rows.map((r, i) => (
            <div
              key={r.label}
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                gap: 14,
                padding: "12px 0",
                borderTop: i === 0 ? "none" : `1px solid ${D.hair2}`,
              }}
            >
              <div
                style={{
                  fontFamily: D.mono,
                  fontSize: TS.micro,
                  fontWeight: 600,
                  color: D.text3,
                  letterSpacing: "0.12em",
                  lineHeight: 1.6,
                }}
              >
                {r.label}
              </div>
              {r.quote ? (
                <div
                  style={{
                    borderLeft: `2px solid ${D.accent}`,
                    paddingLeft: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: D.font,
                      fontSize: 15,
                      fontWeight: 600,
                      color: D.ink,
                      lineHeight: 1.55,
                    }}
                  >
                    &ldquo;{r.value}&rdquo;
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: D.font,
                    fontSize: 15,
                    color: D.ink,
                    lineHeight: 1.6,
                  }}
                >
                  {r.value}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 자기연민 한마디 */}
      {data.self_compassion && (
        <div
          style={{
            marginTop: 18,
            background: D.hair3,
            borderRadius: 12,
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              fontFamily: D.mono,
              fontSize: TS.micro,
              fontWeight: 600,
              color: D.text3,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            — 그 마음에게 건네는 말
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: D.font,
              fontSize: 14.5,
              color: D.ink,
              lineHeight: 1.7,
            }}
          >
            {data.self_compassion}
          </p>
        </div>
      )}
    </article>
  );
}

/* ───────────────────────────── SurfaceCard ───────────────────────────── */

export function SurfaceCard({ data }: { data: SurfaceCardData | undefined }) {
  if (!data) return <FallbackCard kicker="표면" headline="그때 든 생각" />;
  const hasVoices = data.inner_voices.length > 0;
  const hasEmotions = data.emotions.length > 0;

  return (
    <article
      style={{
        border: `1px solid ${D.hair}`,
        borderRadius: CARD_RADIUS,
        background: D.paper,
        padding: 22,
      }}
    >
      <CardHeader kicker="표면" headline="그때 든 생각" eyebrow="WHAT IT FELT LIKE" />

      {/* 0. 그때 = 어떤 상황이었는지 먼저 짚어주기 */}
      {data.situation && (
        <div
          style={{
            marginTop: 16,
            background: D.hair3,
            borderRadius: 12,
            padding: "12px 16px",
          }}
        >
          <div
            style={{
              fontFamily: D.mono,
              fontSize: TS.micro,
              fontWeight: 600,
              color: D.text3,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            — 그때, 이런 순간이었어요
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: D.font,
              fontSize: 15,
              fontWeight: 600,
              color: D.ink,
              lineHeight: 1.5,
            }}
          >
            {data.situation}
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18 }}>
        {/* 1. 자동으로 떠오른 생각 */}
        {data.thought && (
          <Section label="자동으로 떠오른 생각">
            <div
              style={{
                borderLeft: `2px solid ${D.accent}`,
                paddingLeft: 14,
                marginTop: 8,
              }}
            >
              <p
                style={{
                  fontFamily: D.font,
                  fontSize: 17,
                  fontWeight: 600,
                  color: D.ink,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                &ldquo;{data.thought}&rdquo;
              </p>
            </div>
          </Section>
        )}

        {/* 2. 몸의 신호 */}
        {data.body_signal.headline && (
          <Section label="몸의 신호">
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: D.hair3,
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <CircleGauge />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontFamily: D.font,
                    fontSize: 15,
                    fontWeight: 600,
                    color: D.ink,
                    lineHeight: 1.4,
                  }}
                >
                  {data.body_signal.headline}
                </div>
                {data.body_signal.description && (
                  <div
                    style={{
                      fontFamily: D.font,
                      fontSize: 13,
                      color: D.text2,
                      marginTop: 2,
                      lineHeight: 1.4,
                    }}
                  >
                    {data.body_signal.description}
                  </div>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* 3. 내면의 목소리 */}
        {hasVoices && (
          <Section label="내면의 목소리">
            <div
              style={{
                marginTop: 10,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {data.inner_voices.map((v, i) => (
                <Chip key={i}>{v}</Chip>
              ))}
            </div>
          </Section>
        )}

        {/* 4. 올라온 감정 */}
        {hasEmotions && (
          <Section label="올라온 감정">
            <div
              style={{
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: data.emotions.length > 1 ? "1fr 1fr" : "1fr",
                gap: 10,
              }}
            >
              {data.emotions.map((e, i) => (
                <EmotionBar key={i} label={e.label} intensity={e.intensity} />
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* 상담사 코멘트 — 표면을 따뜻하게 비춰주기 */}
      {data.counselor_comment && (
        <CounselorComment text={data.counselor_comment} />
      )}
    </article>
  );
}

/* ───────────────────────────── TruthCard ───────────────────────────── */

export function TruthCard({ data }: { data: TruthCardData | undefined }) {
  if (!data) return <FallbackCard kicker="진심" headline="사실, 그 마음이 바란 것" />;

  return (
    <article
      style={{
        border: `1px solid ${D.hair}`,
        borderRadius: CARD_RADIUS,
        background: "rgba(255, 90, 31, 0.04)",
        padding: 22,
      }}
    >
      <CardHeader
        kicker="진심"
        headline={
          <>
            사실, 그 마음이{" "}
            <em style={{ color: D.accent, fontStyle: "italic", fontWeight: 700 }}>
              바란 것
            </em>
          </>
        }
        eyebrow="WHAT WAS TRUE"
      />

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column" }}>
        {/* 01 진짜 바란 모습 */}
        <TruthRow
          n="01"
          label="진짜 바란 모습"
          first
          body={
            <>
              {data.true_wish.quote && (
                <span
                  style={{
                    fontWeight: 700,
                    color: D.ink,
                  }}
                >
                  &lsquo;{data.true_wish.quote}&rsquo;
                </span>
              )}
              {data.true_wish.quote && data.true_wish.body && (
                <span style={{ color: D.text2 }}> — </span>
              )}
              {data.true_wish.body && (
                <span style={{ color: D.ink }}>{data.true_wish.body}</span>
              )}
            </>
          }
        />

        {/* 02 그 마음의 이유 */}
        <TruthRow
          n="02"
          label="그 마음의 이유"
          body={
            <>
              {data.reason.keywords.length > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginRight: 8,
                    verticalAlign: "middle",
                  }}
                >
                  {data.reason.keywords.map((k, i) => (
                    <KeywordChip key={i}>{k}</KeywordChip>
                  ))}
                </span>
              )}
              {data.reason.body && (
                <span style={{ color: D.ink }}>{data.reason.body}</span>
              )}
            </>
          }
        />

        {/* 03 그리고 그 덕분에 */}
        <TruthRow
          n="03"
          label="그리고 그 덕분에"
          body={<span style={{ color: D.ink }}>{data.thanks_to}</span>}
          last
        />
      </div>

      {/* 진심 도식 아래 상담사 코멘트 */}
      {data.counselor_comment && (
        <CounselorComment text={data.counselor_comment} accent />
      )}
    </article>
  );
}

function TruthRow({
  n,
  label,
  body,
  first,
  last,
}: {
  n: string;
  label: string;
  body: React.ReactNode;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr",
        gap: 14,
        padding: "14px 0",
        borderTop: first ? "none" : `1px solid ${D.hair2}`,
        borderBottom: last ? "none" : undefined,
      }}
    >
      <div
        style={{
          fontFamily: D.mono,
          fontSize: 22,
          fontWeight: 700,
          color: D.accent,
          lineHeight: 1.1,
          letterSpacing: "0.04em",
        }}
      >
        {n}
      </div>
      <div>
        <div
          style={{
            fontFamily: D.mono,
            fontSize: TS.micro,
            fontWeight: 600,
            color: D.text3,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: D.font,
            fontSize: 15.5,
            lineHeight: 1.65,
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── CoreWishBanner ───────────────────────────── */

export function CoreWishBanner({ data }: { data: CoreWishData | undefined }) {
  if (!data || !data.text) {
    return (
      <div
        style={{
          background: D.dark,
          borderRadius: BANNER_RADIUS,
          padding: "22px 24px",
          color: "#fff",
          fontFamily: D.font,
          fontStyle: "italic",
          fontSize: 14,
          opacity: 0.75,
          textAlign: "center",
        }}
      >
        가장 깊은 마음은 다음 대화에서 더 만나볼게요.
      </div>
    );
  }

  const showVol = !!data.vol_label;
  // text가 두 문장이면 두 번째 문장만 accent+italic으로.
  const sentences = splitTwoSentences(data.text);
  return (
    <div>
    <div
      style={{
        background: D.dark,
        borderRadius: BANNER_RADIUS,
        padding: "26px 28px",
        color: "#fff",
        display: "grid",
        gridTemplateColumns: showVol ? "44px 1fr auto" : "44px 1fr",
        alignItems: "center",
        gap: 18,
      }}
    >
      <HeartIcon />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: D.mono,
            fontSize: 9.5,
            fontWeight: 600,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          결국 이 모든 마음의 가장 깊은 곳 · CORE WISH
        </div>
        <div
          style={{
            fontFamily: D.font,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.3,
            fontSize: "clamp(20px, 3.4vw, 28px)",
          }}
        >
          {sentences[0]}
          {sentences[1] && (
            <>
              {" "}
              <em
                style={{
                  color: D.accent,
                  fontStyle: "italic",
                  fontWeight: 700,
                }}
              >
                {sentences[1]}
              </em>
            </>
          )}
        </div>
      </div>
      {showVol && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 2,
            fontFamily: D.mono,
            fontSize: 9,
            fontWeight: 500,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          <div>기분 리포트</div>
          <div>{data.vol_label}</div>
          <div>해석 · 해소</div>
        </div>
      )}
    </div>

    {/* 배너 아래 풀어쓴 친절한 설명 */}
    {data.comment && (
      <p
        style={{
          margin: "16px 4px 0",
          fontFamily: D.font,
          fontSize: 14.5,
          color: D.text,
          lineHeight: 1.7,
        }}
      >
        {data.comment}
      </p>
    )}
    </div>
  );
}

/* ───────────────────────────── 헬퍼 컴포넌트 ───────────────────────────── */

function CardHeader({
  kicker,
  headline,
  eyebrow,
}: {
  kicker: string;
  headline: React.ReactNode;
  eyebrow: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <KickerPill>{kicker}</KickerPill>
      <h3
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: D.font,
          fontSize: "clamp(20px, 2.4vw, 24px)",
          fontWeight: 700,
          color: D.ink,
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        {headline}
      </h3>
      <span
        style={{
          fontFamily: D.mono,
          fontSize: TS.micro,
          fontWeight: 600,
          color: D.text3,
          letterSpacing: "0.18em",
        }}
      >
        {eyebrow}
      </span>
    </div>
  );
}

function KickerPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: D.accent,
        color: "#fff",
        fontFamily: D.font,
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 6,
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </span>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: D.mono,
          fontSize: TS.micro,
          fontWeight: 600,
          color: D.text3,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        — {label}
      </div>
      {children}
    </div>
  );
}

/**
 * 카드 하단 상담사 코멘트. 상단에 얇은 구분선 + "상담사의 한마디" 라벨,
 * 그 아래 따뜻한 코멘트 본문. accent=true면 진심 카드용으로 살짝 강조.
 */
function CounselorComment({ text, accent }: { text: string; accent?: boolean }) {
  return (
    <div
      style={{
        marginTop: 18,
        paddingTop: 16,
        borderTop: `1px solid ${accent ? D.accentSoft : D.hair2}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: D.accent,
            display: "inline-block",
          }}
          aria-hidden
        />
        <span
          style={{
            fontFamily: D.mono,
            fontSize: TS.micro,
            fontWeight: 600,
            color: D.text3,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          상담사의 한마디
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: D.font,
          fontSize: 14.5,
          color: D.text,
          lineHeight: 1.75,
        }}
      >
        {text}
      </p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: D.hair3,
        color: D.text,
        fontFamily: D.font,
        fontSize: 12.5,
        fontWeight: 600,
        padding: "6px 12px",
        borderRadius: 14,
        lineHeight: 1.3,
      }}
    >
      {children}
    </span>
  );
}

function KeywordChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: D.accentSoft,
        color: D.accent,
        fontFamily: D.font,
        fontSize: 13,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 6,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function EmotionBar({ label, intensity }: { label: string; intensity: number }) {
  const pct = Math.max(0, Math.min(100, intensity));
  return (
    <div
      style={{
        background: D.hair3,
        borderRadius: 10,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          fontFamily: D.font,
          fontSize: 13,
          fontWeight: 600,
          color: D.ink,
          lineHeight: 1.35,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          height: 5,
          background: D.hair,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: D.ink,
            borderRadius: 3,
            transition: "width 0.6s ease-out",
          }}
        />
      </div>
    </div>
  );
}

/** 몸 신호 옆에 놓이는 원형 게이지 (장식·강도 시각화). */
function CircleGauge() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
      <circle
        cx="14"
        cy="14"
        r="11"
        fill="none"
        stroke={D.hair}
        strokeWidth="2.5"
      />
      <circle
        cx="14"
        cy="14"
        r="11"
        fill="none"
        stroke={D.accent}
        strokeWidth="2.5"
        strokeDasharray={`${2 * Math.PI * 11 * 0.65} ${2 * Math.PI * 11}`}
        strokeDashoffset={2 * Math.PI * 11 * 0.25}
        strokeLinecap="round"
        transform="rotate(-90 14 14)"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill={D.accent}
      aria-hidden
    >
      <path d="M12 21s-7.5-4.5-9.5-9.2C1 8 3 4.5 6.5 4.5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.5 0 5.5 3.5 4 7.3C19.5 16.5 12 21 12 21z" />
    </svg>
  );
}

function FallbackCard({
  kicker,
  headline,
}: {
  kicker: string;
  headline: string;
}) {
  return (
    <article
      style={{
        border: `1px solid ${D.hair}`,
        borderRadius: CARD_RADIUS,
        background: D.paper,
        padding: 22,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
      >
        <KickerPill>{kicker}</KickerPill>
        <h3
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: D.font,
            fontSize: 20,
            fontWeight: 700,
            color: D.ink,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {headline}
        </h3>
      </div>
      <p
        style={{
          marginTop: 14,
          fontFamily: D.font,
          fontSize: 14,
          color: D.text2,
          fontStyle: "italic",
          lineHeight: 1.6,
        }}
      >
        아직 정리 중이에요. 다음 단계로 이동해도 괜찮아요.
      </p>
    </article>
  );
}

function splitTwoSentences(text: string): [string, string?] {
  // 마침표 + 공백 또는 끝으로 분리. 첫 두 문장만 살림.
  const parts = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (parts.length === 0) return [text];
  if (parts.length === 1) return [parts[0]];
  return [parts[0], parts.slice(1).join(" ")];
}
