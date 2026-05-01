"use client";

/**
 * v3 (Apple-product-page aesthetic) 공유 디자인 모듈.
 *
 * 핸드오프 redesign/diagnosis-report.jsx 기준의 미감을 자가-진단 / 통합 패턴 분석 /
 * 전문 상담사 리포트(Step 2 / Step 5 / Step 9) 세 화면이 함께 사용한다.
 *
 * 사용처:
 *  - WorkshopResultContent.tsx (Step 2)
 *  - WorkshopCognitiveReport.tsx (Step 5)
 *  - WorkshopProfessionalReport.tsx (Step 9)
 *
 * 한 곳에서만 토큰·헬퍼·아톰을 정의하므로 어느 한 화면이 변경되어도 다른 화면이
 * 자동으로 정렬된다.
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

// ───────── DESIGN TOKENS ───────── //
export const D = {
  bg: "#fbfbfd",
  bgAlt: "#f5f5f7",
  ink: "#1d1d1f",
  text: "#1d1d1f",
  text2: "#6e6e73",
  text3: "#86868b",
  text4: "#a1a1a6",
  hair: "#d2d2d7",
  hair2: "#e8e8ed",
  hair3: "#f0f0f3",
  paper: "#ffffff",
  dark: "#0a0a0a",
  darkAlt: "#1a1a1c",
  accent: "#ff5a1f",
  accentSoft: "rgba(255,90,31,0.10)",
  risk: "#e3503e",
  riskSoft: "#fde9e6",
  font: "'Pretendard Variable','Pretendard',system-ui,sans-serif",
  mono: "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace",
} as const;

/** 본문 컨테이너 max-width (가로 패딩 48px 더해 효과적 폭은 COL+96). */
export const COL = 880;

/**
 * Type Scale — Step 2(WorkshopResultContent)의 폰트 위계를 표준화한 토큰.
 * clamp() 기반 반응형 + 메타·캡션은 고정값. 모든 self-workshop step 이 동일한 자(ruler)를
 * 쓰도록 하기 위해 공유한다. (Tailwind text-* 와 inline fontSize 모두에서 참조)
 *
 *   display  : 페이지 메인 디스플레이 ("당신의 패턴" 같은 hero)
 *   h1       : 큰 섹션 타이틀
 *   h2       : 페이지/섹션 헤드라인 (가장 자주 쓰는 큰 글씨)
 *   h3       : 작은 카드 타이틀
 *   lede     : 헤드라인 아래 리드 단락
 *   body     : 본문 (반응형)
 *   bodySm   : 본문 (고정, 보조 텍스트)
 *   caption  : 캡션
 *   meta     : Mono 메타 라벨
 *   micro    : 가장 작은 라벨
 */
export const TS = {
  display: "clamp(40px, 6.4vw, 84px)",
  h1: "clamp(28px, 4.2vw, 56px)",
  h2: "clamp(24px, 3.8vw, 48px)",
  h3: "clamp(20px, 2.2vw, 24px)",
  lede: "clamp(16px, 1.6vw, 20px)",
  body: "clamp(15px, 1.5vw, 18px)",
  bodySm: 14,
  caption: 13,
  meta: 11,
  micro: 10,
} as const;

// ───────── HELPERS ───────── //
export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function smoothstep(a: number, b: number, t: number) {
  const x = clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * LLM body 가 \n\n 단락이면 분할, 아니면 단일 단락 배열로 감싼다.
 * 빈 문자열·null 입력에는 빈 배열을 반환.
 */
export function splitParagraphs(s: string | undefined | null): string[] {
  if (!s) return [];
  const parts = s
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [s.trim()];
}

/** ISO 시각 → "YYYY.MM.DD". 파싱 실패 시 빈 문자열. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
      d.getDate()
    ).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

// ───────── HOOKS ───────── //
/**
 * IntersectionObserver 기반의 한 번-만-발화 in-view 훅.
 * 임계점 진입 시 seen=true 로 영구 토글, observer 정리.
 */
export function useInView<T extends Element>(threshold = 0.18) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

/**
 * rAF 기반 0..1 타임라인 훅.
 * play=true 동안 dur(ms) 에 걸쳐 t 가 0→1 로 증가.
 * loop=true 면 0..1 사이클을 반복, false 면 1 에서 정지.
 * delay 만큼 시작을 미룬다.
 */
export function useTimeline(play: boolean, dur = 2400, delay = 0, loop = false) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!play) return;
    let raf = 0;
    const start = performance.now() + delay;
    function tick(now: number) {
      if (now < start) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const k = (now - start) / dur;
      if (loop) {
        setT(k % 1);
        raf = requestAnimationFrame(tick);
      } else {
        setT(clamp(k, 0, 1));
        if (k < 1) raf = requestAnimationFrame(tick);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [play, dur, delay, loop]);
  return t;
}

// ───────── ATOMS ───────── //
/** UPPERCASE + JetBrains Mono + tracking 라벨. eyebrow / 메타 표기에 공통 사용. */
export function Mono({
  children,
  size = 11,
  color,
  tracking = 0.16,
  weight = 600,
  upper = true,
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  tracking?: number;
  weight?: number;
  upper?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: D.mono,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: `${tracking}em`,
        textTransform: upper ? "uppercase" : "none",
        color: color || D.text2,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/**
 * 표준 헤드라인. self-workshop 의 가장 큰 페이지 헤드라인은 size="h2" 가 기본.
 * size 만 바꿔서 디스플레이/타이틀 변형으로 사용.
 *
 *   <Headline>오늘 발견한 것들이...</Headline>
 *   <Headline size="h1">큰 섹션 제목</Headline>
 */
export function Headline({
  size = "h2",
  children,
  style,
  className = "",
}: {
  size?: "display" | "h1" | "h2" | "h3";
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <h2
      className={className}
      style={{
        margin: 0,
        fontFamily: D.font,
        fontSize: TS[size],
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: "-0.025em",
        color: D.ink,
        textWrap: "balance",
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

/** 헤드라인 아래 리드 단락. */
export function Lede({
  children,
  style,
  className = "",
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <p
      className={className}
      style={{
        margin: 0,
        fontFamily: D.font,
        fontSize: TS.lede,
        fontWeight: 400,
        lineHeight: 1.55,
        color: D.text2,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

/** 일반 본문 단락. self-workshop 의 모든 안내·해설 본문은 이 사이즈를 기본. */
export function Body({
  children,
  muted = false,
  small = false,
  style,
  className = "",
}: {
  children: ReactNode;
  muted?: boolean;
  small?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <p
      className={className}
      style={{
        margin: 0,
        fontFamily: D.font,
        fontSize: small ? TS.bodySm : TS.body,
        fontWeight: 400,
        lineHeight: 1.7,
        color: muted ? D.text2 : D.ink,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

/**
 * IntersectionObserver 진입 시 1회 fade-up 하는 wrapper.
 * 자식 단위로 stagger 가 필요하면 부모가 delay 를 i*N ms 로 넘겨 사용.
 */
export function Reveal({
  children,
  delay = 0,
  y = 12,
  dur = 700,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  dur?: number;
}) {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity ${dur}ms cubic-bezier(.2,.7,.2,1) ${delay}ms, transform ${dur}ms cubic-bezier(.2,.7,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ───────── EDITORIAL PRIMITIVES ───────── //
// "박스 in 박스" 답답함을 푸는 공유 어휘.
// 시각적 무게는 모노 라벨·얇은 헤어라인·좌측 accent line 으로만 만든다.

/**
 * 좌우 정렬 메타 헤더. `● PART A · TUTORIAL ─────── WARM-UP` 패턴.
 * 박스를 두지 않고 섹션을 구획한다.
 */
export function SectionHeader({
  kicker,
  rightLabel,
  accent = false,
  style,
}: {
  kicker: ReactNode;
  rightLabel?: ReactNode;
  accent?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        ...style,
      }}
    >
      <Mono size={10} weight={600} color={accent ? D.accent : D.text2} tracking={0.18}>
        {kicker}
      </Mono>
      <div style={{ flex: 1, height: 1, background: D.hair2 }} />
      {rightLabel != null && (
        <Mono size={10} weight={500} color={D.text3} tracking={0.16}>
          {rightLabel}
        </Mono>
      )}
    </div>
  );
}

/**
 * 가벼운 회색 컨테이너 + 상단 중앙 `FIG. ...` 라벨.
 * 다이어그램·관계도 같은 시각 묶음에만 쓴다 (섹션 컨테이너로 남용 금지).
 */
export function EditorialFrame({
  id,
  label,
  children,
  style,
}: {
  id?: string;
  label: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      id={id}
      style={{
        marginTop: 24,
        padding: "26px 22px",
        borderRadius: 22,
        background: D.bgAlt,
        border: `1px solid ${D.hair2}`,
        ...style,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <Mono size={10} weight={500} color={D.text3} tracking={0.16}>
          {label}
        </Mono>
      </div>
      {children}
    </div>
  );
}

/**
 * 좌측 2px accent line(옵션) + 좌우 메타 라벨 + 본문 1슬롯.
 * 박스 한 겹만 두며 내부에 또 박스를 두지 않는 게 원칙.
 *
 *   ▎ STEP 01 · 상황                                         SITUATION
 *     본문 ...
 */
export function EditorialItem({
  label,
  kind,
  accent = false,
  emphasized = false,
  children,
  style,
}: {
  label: ReactNode;
  kind?: ReactNode;
  accent?: boolean;
  emphasized?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        border: `1px solid ${emphasized ? D.ink : D.hair}`,
        background: D.paper,
        borderRadius: 16,
        padding: "20px 22px",
        boxShadow: emphasized
          ? "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -12px rgba(255,90,31,0.18)"
          : "none",
        transition: "box-shadow .35s cubic-bezier(.2,.7,.2,1), border-color .2s",
        ...style,
      }}
    >
      {accent && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 18,
            bottom: 18,
            width: 2,
            background: D.accent,
            borderRadius: 2,
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <Mono size={10} weight={600} color={accent ? D.accent : D.text2} tracking={0.16}>
          {accent ? "● " : ""}
          {label}
        </Mono>
        {kind != null && (
          <Mono size={9} weight={500} color={D.text3} tracking={0.16}>
            {kind}
          </Mono>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

/**
 * 좌측 2px accent line + 테두리 없는 input/textarea.
 * focus 시 accent line 이 진해진다.
 *
 * placeholder/value/onChange 등 기본 input 속성을 그대로 받는다.
 */
export function EditorialInput({
  multiline = false,
  rows = 3,
  value,
  onChange,
  placeholder,
  disabled = false,
  maxLength,
  ariaLabel,
  style,
}: {
  multiline?: boolean;
  rows?: number;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  ariaLabel?: string;
  style?: CSSProperties;
}) {
  const [focused, setFocused] = useState(false);

  const sharedStyle: CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: "none",
    outline: "none",
    background: "transparent",
    fontFamily: D.font,
    fontSize: TS.body,
    lineHeight: 1.6,
    color: D.ink,
    padding: "10px 4px 10px 14px",
    resize: multiline ? ("vertical" as const) : ("none" as const),
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "text",
    ...style,
  };

  return (
    <div style={{ position: "relative", marginTop: 6 }}>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 6,
          bottom: 6,
          width: 2,
          background: focused ? D.accent : D.hair,
          borderRadius: 2,
          transition: "background .18s ease",
          pointerEvents: "none",
        }}
      />
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          aria-label={ariaLabel}
          rows={rows}
          style={sharedStyle}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          aria-label={ariaLabel}
          style={sharedStyle}
        />
      )}
    </div>
  );
}

/**
 * `□ SKIPPED · 이 문항은 건너뛸게요` Mono 톤 토글.
 * 박스 in 박스가 되지 않게 일반 button 으로만 둔다.
 */
export function SkipToggle({
  skipped,
  onToggle,
  labelOn = "SKIPPED · 다시 답할게요",
  labelOff = "SKIP · 이 문항은 건너뛸게요",
}: {
  skipped: boolean;
  onToggle: () => void;
  labelOn?: ReactNode;
  labelOff?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        marginTop: 10,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        color: skipped ? D.accent : D.text3,
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 12,
          height: 12,
          border: `1.5px solid ${skipped ? D.accent : D.hair}`,
          borderRadius: 2,
          background: skipped ? D.accent : "transparent",
          transition: "background .15s ease, border-color .15s ease",
        }}
      >
        {skipped && (
          <svg viewBox="0 0 12 12" width="9" height="9" aria-hidden>
            <path
              d="M2.5 6.5l2.2 2.2 4.8-4.8"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <Mono size={10} weight={500} tracking={0.16} color={skipped ? D.accent : D.text3}>
        {skipped ? labelOn : labelOff}
      </Mono>
    </button>
  );
}
