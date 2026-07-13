"use client";

/**
 * Inner Child — adaptive test UI (ENGLISH · ink-orange dark).
 *
 * 한국어 InnerChildTest.tsx 의 영어판. 로직(적응형 출제·상위2영역·채점입력 형태)은 동일하고
 * 표시 문자열만 영어(en/questions)로 갈아끼웠다. 채점 ID(S1·D01·G1·SCT…)는 한국어와 동일하므로
 * 서버 채점(computeScore, 한국어 questions 기반)이 그대로 맞물린다.
 *
 * 위기 필터는 한국어(detectCrisis) + 영어(detectCrisisEn) OR 로 잡는다.
 */

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  SCREENING_ITEMS,
  COMMON_ITEM,
  DRILLDOWN_BY_AREA,
  GUARDIAN_ITEMS,
  SCT_ITEMS,
  SCALE_LABELS,
  SCALE_MAX,
  TIME_FRAME_NOTICE,
  DISCLAIMER,
  SCT_GUIDE,
  SCT_TRANSITION,
  CHAPTER_LABELS,
  AREA_SIGNAL,
  INTERSTITIAL_TO_DRILLDOWN,
  INTERSTITIAL_TO_GUARDIAN,
  DRILLDOWN_SCALE_LABELS,
  GUARDIAN_SCENE_INTRO,
} from "@/lib/minds/inner-child/en/questions";
import { scoreAreas, type ScoreInput } from "@/lib/minds/inner-child/scoring";
import { detectCrisis } from "@/lib/minds/inner-child/crisis-words";
import { detectCrisisEn } from "@/lib/minds/inner-child/en/crisis-words";
import type { GuardianType, ScaleValue, SctAnswers } from "@/lib/minds/inner-child/types";

/* ─── ink-orange tokens ─── */
const INK = {
  backdrop: "#050506",
  shell: "#0A0A0B",
  surface: "#141519",
  surface2: "#16171b",
  border2: "#2a2b30",
  accent: "#FF5A1F",
  accent2: "#FF8A4C",
  grad: "linear-gradient(135deg,#FF5A1F 0%,#FF8A4C 50%,#FFB68A 100%)",
  white: "#fff",
  t9: "rgba(255,255,255,.9)",
  t7: "rgba(255,255,255,.7)",
  t62: "rgba(255,255,255,.62)",
  t55: "rgba(255,255,255,.55)",
  t5: "rgba(255,255,255,.5)",
  t48: "rgba(255,255,255,.48)",
  t42: "rgba(255,255,255,.42)",
  t4: "rgba(255,255,255,.4)",
  t32: "rgba(255,255,255,.32)",
  t2: "rgba(255,255,255,.2)",
  line: "rgba(255,255,255,.1)",
  font: "'Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif",
  display: "'Inter','Pretendard',-apple-system,system-ui,sans-serif",
  mono: "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace",
};

const qTitleStyle: CSSProperties = {
  fontFamily: INK.font,
  fontSize: 26,
  fontWeight: 800,
  lineHeight: 1.34,
  letterSpacing: "-0.03em",
  color: INK.white,
  margin: 0,
};
const nextBtnStyle: CSSProperties = {
  width: "100%",
  padding: 20,
  borderRadius: 16,
  background: INK.white,
  color: INK.shell,
  border: `1px solid ${INK.white}`,
  fontFamily: INK.font,
  fontWeight: 800,
  fontSize: 16,
  cursor: "pointer",
};

type Chapter = 1 | 2 | 3;

type Step =
  | { kind: "scale"; part: "screening" | "common"; id: string; text: string; chapter: 1 }
  | { kind: "slider"; id: string; text: string; chapter: 2 }
  | { kind: "choice"; id: string; prompt: string; options: { value: GuardianType; text: string }[]; chapter: 2 }
  | { kind: "sct"; id: string; slot: keyof SctAnswers; text: string; chapter: 3 }
  | { kind: "interstitial"; id: string; chapter: Chapter; kicker: string; lines: string[]; cta: string };

const PREFIX_STEPS: Step[] = [
  ...SCREENING_ITEMS.map((s): Step => ({ kind: "scale", part: "screening", id: s.id, text: s.text, chapter: 1 })),
  { kind: "scale", part: "common", id: COMMON_ITEM.id, text: COMMON_ITEM.text, chapter: 1 },
];

const EMPTY_SCT: SctAnswers = {
  childhood_self: "",
  inner_voice: "",
  family_rule: "",
  regression_trigger: "",
  escape_behavior: "",
};

const AFFECT_IDS = new Set(["S1", "S3", "S5", "S7"]);

/** 한·영 위기 신호 결합 판정. */
function anyCrisis(texts: Array<string | undefined | null>): boolean {
  return detectCrisis(texts) || detectCrisisEn(texts);
}

/** Top-scoring screening item text (for the interstitial echo). Affect slot wins ties. */
function topScreeningText(screening: Record<string, ScaleValue>): string {
  let best: { id: string; v: number; text: string } | null = null;
  for (const item of SCREENING_ITEMS) {
    const v = screening[item.id] ?? 0;
    const better = !best || v > best.v || (v === best.v && AFFECT_IDS.has(item.id) && !AFFECT_IDS.has(best.id));
    if (better) best = { id: item.id, v, text: item.text };
  }
  return best?.text ?? "";
}

export function InnerChildEnTest({
  onComplete,
  skipIntro = false,
}: {
  onComplete: (input: ScoreInput) => void;
  skipIntro?: boolean;
}) {
  const [started, setStarted] = useState(skipIntro);
  const [crisis, setCrisis] = useState(false);
  const [steps, setSteps] = useState<Step[]>(PREFIX_STEPS);
  const [idx, setIdx] = useState(0);

  const [screening, setScreening] = useState<Record<string, ScaleValue>>({});
  const [common, setCommon] = useState<ScaleValue | undefined>(undefined);
  const [drilldown, setDrilldown] = useState<Record<string, ScaleValue>>({});
  const [guardian, setGuardian] = useState<Record<string, GuardianType>>({});
  const [sct, setSct] = useState<SctAnswers>(EMPTY_SCT);

  const advance = () => setIdx((i) => i + 1);

  const finalize = (sctFinal: SctAnswers) => {
    if (
      anyCrisis([sctFinal.childhood_self, sctFinal.inner_voice, sctFinal.family_rule, sctFinal.regression_trigger, sctFinal.escape_behavior])
    ) {
      setCrisis(true);
      return;
    }
    onComplete({ screening, common: common!, drilldown, guardian, sct: sctFinal });
  };

  /** After common C1: compute top-2 areas → append interstitials, drilldown, guardian, SCT. */
  const appendAdaptiveSteps = (screeningNow: Record<string, ScaleValue>) => {
    const { topAreas } = scoreAreas(screeningNow);
    const echo = topScreeningText(screeningNow);

    const inter1: Step = {
      kind: "interstitial",
      id: "I1",
      chapter: 2,
      kicker: "Reading your answers",
      lines: [
        echo
          ? `I read through what you left, one by one. Your heart seemed to linger longest on — "${echo}"`
          : "I read through what you left, one by one.",
        AREA_SIGNAL[topAreas[0]],
        INTERSTITIAL_TO_DRILLDOWN,
      ].filter(Boolean),
      cta: "Continue",
    };
    const drillSteps: Step[] = topAreas.flatMap((area) =>
      DRILLDOWN_BY_AREA[area].map((d): Step => ({ kind: "slider", id: d.id, text: d.text, chapter: 2 })),
    );
    const inter2: Step = { kind: "interstitial", id: "I2", chapter: 2, kicker: "Changing direction", lines: [INTERSTITIAL_TO_GUARDIAN], cta: "Continue" };
    const guardSteps: Step[] = GUARDIAN_ITEMS.map((g): Step => ({
      kind: "choice",
      id: g.id,
      prompt: g.prompt,
      options: g.options.map((o) => ({ value: o.value, text: o.text })),
      chapter: 2,
    }));
    const inter3: Step = { kind: "interstitial", id: "I3", chapter: 3, kicker: "The last chapter", lines: [SCT_TRANSITION], cta: "Continue" };
    const sctSteps: Step[] = SCT_ITEMS.map((s): Step => ({ kind: "sct", id: s.id, slot: s.slot, text: s.text, chapter: 3 }));

    setSteps((prev) => [...prev, inter1, ...drillSteps, inter2, ...guardSteps, inter3, ...sctSteps]);
  };

  const answerScale = (step: Extract<Step, { kind: "scale" }>, value: ScaleValue) => {
    if (step.part === "screening") setScreening((p) => ({ ...p, [step.id]: value }));
    else {
      setCommon(value);
      appendAdaptiveSteps(screening);
    }
    advance();
  };
  const answerSlider = (step: Extract<Step, { kind: "slider" }>, value: ScaleValue) => {
    setDrilldown((p) => ({ ...p, [step.id]: value }));
    advance();
  };
  const answerChoice = (step: Extract<Step, { kind: "choice" }>, value: GuardianType) => {
    setGuardian((p) => ({ ...p, [step.id]: value }));
    advance();
  };
  const answerSct = (step: Extract<Step, { kind: "sct" }>, value: string) => {
    const next = { ...sct, [step.slot]: value };
    setSct(next);
    if (idx + 1 >= steps.length) finalize(next);
    else advance();
  };

  // ── render ──
  if (crisis) return <CrisisScreen />;
  if (!started) return <Shell><IntroScreen onStart={() => setStarted(true)} /></Shell>;

  const step = steps[idx];
  const chapter = step.chapter;
  const isQuestion = step.kind !== "interstitial";
  const chapterQuestions = steps.filter((s) => s.kind !== "interstitial" && s.chapter === chapter);
  const answeredInChapter = steps.slice(0, idx).filter((s) => s.kind !== "interstitial" && s.chapter === chapter).length;

  return (
    <Shell>
      <ProgressHead chapter={chapter} position={isQuestion ? answeredInChapter + 1 : undefined} total={chapterQuestions.length} />
      <div key={step.id} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", animation: "svqRise .4s cubic-bezier(0.22,1,0.36,1)" }}>
        {step.kind === "scale" && (
          <CircleScale text={step.text} showInfo={chapter === 1 && idx === 0} onAnswer={(v) => answerScale(step, v)} />
        )}
        {step.kind === "slider" && <BlockScale text={step.text} onAnswer={(v) => answerSlider(step, v)} />}
        {step.kind === "choice" && <ChoiceQuestion prompt={step.prompt} options={step.options} onAnswer={(v) => answerChoice(step, v)} />}
        {step.kind === "sct" && <SentenceComplete text={step.text} onAnswer={(v) => answerSct(step, v)} />}
        {step.kind === "interstitial" && <Interstitial kicker={step.kicker} lines={step.lines} cta={step.cta} onNext={advance} />}
      </div>
    </Shell>
  );
}

// ───────────────────────── shell ─────────────────────────

function Shell({ children }: { children: ReactNode }) {
  return (
    <div style={{ height: "100dvh", boxSizing: "border-box", background: INK.backdrop, display: "flex", justifyContent: "center", padding: "12px", fontFamily: INK.font }}>
      <style>{`
        @keyframes svqRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .svq-scroll::-webkit-scrollbar{width:0;height:0}
        .svq-next{transition:background .2s ease,color .2s ease,border-color .2s ease}
        .svq-next:hover{background:#FF5A1F!important;color:#fff!important;border-color:#FF5A1F!important}
        .svq-opt{transition:border-color .15s ease,background .15s ease,transform .15s ease}
        .svq-opt:hover{border-color:rgba(255,138,76,.55)!important;background:#181a1f!important;transform:translateY(-1px)}
        .svq-circ{transition:border-color .15s ease,color .15s ease,transform .15s ease}
        .svq-circ:hover{border-color:#FF8A4C!important;color:#FF8A4C!important;transform:scale(1.06)}
        .svq-block{transition:border-color .15s ease,transform .15s ease}
        .svq-block:hover{border-color:rgba(255,138,76,.5)!important;transform:translateY(-2px)}
      `}</style>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          width: "100%",
          maxWidth: 440,
          background: INK.shell,
          border: `1px solid #26272c`,
          borderRadius: 26,
          boxShadow: "0 40px 90px -40px rgba(255,90,31,.4)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 6%, #000, transparent 60%)",
            maskImage: "radial-gradient(ellipse at 50% 6%, #000, transparent 60%)",
          }}
        />
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(56% 34% at 50% 0%, rgba(255,90,31,.18), transparent 68%)" }} />

        <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "22px 24px 26px" }}>
          <Breadcrumb />
          {children}
        </div>
      </div>
    </div>
  );
}

function Breadcrumb() {
  return (
    <div style={{ flex: "0 0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoMark />
          <span style={{ fontFamily: INK.display, fontWeight: 800, fontSize: 13, letterSpacing: "-0.02em", color: INK.white }}>GIBUN Test</span>
        </div>
        <span style={{ fontFamily: INK.mono, fontSize: 10.5, color: INK.t42 }}>free report preview</span>
      </div>
      <div style={{ height: 1, background: INK.line, margin: "16px 0 20px" }} />
    </div>
  );
}

function LogoMark() {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 14, height: 14, borderRadius: 999, background: "linear-gradient(135deg,#FF5A1F,#FF8A4C,#FFB68A)" }}>
      <span style={{ position: "absolute", inset: 3.5, borderRadius: 999, background: INK.shell }} />
    </span>
  );
}

function ProgressHead({ chapter, position, total }: { chapter: Chapter; position?: number; total: number }) {
  const fill = total ? (position != null ? (position - 1) / total : 0) : 0;
  return (
    <div style={{ flex: "0 0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontFamily: INK.mono, fontSize: 12, fontWeight: 600, color: INK.t7 }}>
          <b style={{ color: INK.accent }}>Part {chapter}</b> · {CHAPTER_LABELS[chapter]}
        </span>
        {position != null && <span style={{ fontFamily: INK.mono, fontSize: 12, color: INK.t4 }}>{position} / {total}</span>}
      </div>
      <div style={{ display: "flex", gap: 7, marginBottom: 34 }}>
        {([1, 2, 3] as Chapter[]).map((c) => {
          const pct = c < chapter ? 1 : c === chapter ? fill : 0;
          return (
            <div key={c} style={{ flex: 1, height: 5, borderRadius: 3, background: INK.line, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.round(pct * 100)}%`, background: INK.grad, transition: "width .4s ease" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────── screens ─────────────────────────

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4 }}>
        <span style={{ width: 5, height: 5, borderRadius: 999, background: INK.accent }} />
        <span style={{ fontFamily: INK.mono, fontWeight: 600, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: INK.accent2 }}>Find your inner child</span>
      </div>
      <h1 style={{ fontFamily: INK.display, fontSize: 30, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.035em", color: INK.white, margin: "14px 0 0" }}>
        Which child inside you
        <br />
        reacts the loudest right now?
      </h1>
      <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.75, color: INK.t62, margin: "16px 0 0" }}>
        There are moments when the same situation shakes you unusually hard. At the root of that reaction is an old inner child.
        Across three chapters, we&rsquo;ll find the child reacting the loudest in you right now.
      </p>
      <InfoBox />
      <div style={{ flex: 1 }} />
      <button type="button" className="svq-next" onClick={onStart} style={nextBtnStyle}>Start the test →</button>
    </div>
  );
}

function InfoBox() {
  return (
    <div style={{ marginTop: 22, padding: "18px 20px", background: INK.surface, border: `1px solid ${INK.border2}`, borderRadius: 14 }}>
      <p style={{ fontFamily: INK.font, fontSize: 14.5, fontWeight: 700, color: INK.white, margin: 0 }}>{TIME_FRAME_NOTICE}</p>
      <p style={{ fontFamily: INK.font, fontSize: 12.5, lineHeight: 1.6, color: INK.t5, margin: "8px 0 0" }}>{DISCLAIMER}</p>
    </div>
  );
}

function Interstitial({ kicker, lines, cta, onNext }: { kicker: string; lines: string[]; cta: string; onNext: () => void }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ marginTop: 6 }}>
        <span style={{ fontFamily: INK.font, fontSize: 13, fontWeight: 600, color: INK.accent }}>{kicker}</span>
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 18 }}>
        {lines.map((l, i) => {
          const em = lines.length > 1 && i === lines.length - 1;
          return (
            <p
              key={i}
              style={{
                fontFamily: INK.font,
                fontSize: em ? 18 : 16,
                fontWeight: em ? 700 : 400,
                lineHeight: em ? 1.66 : 1.8,
                color: em ? INK.white : INK.t62,
                margin: 0,
              }}
            >
              {l}
            </p>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <button type="button" className="svq-next" onClick={onNext} style={nextBtnStyle}>{cta} →</button>
    </div>
  );
}

function CircleScale({ text, showInfo, onAnswer }: { text: string; showInfo: boolean; onAnswer: (v: ScaleValue) => void }) {
  return (
    <div>
      {showInfo && <div style={{ marginBottom: 26 }}><InfoBox /></div>}
      <p style={qTitleStyle}>{text}</p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 30 }}>
        {Array.from({ length: SCALE_MAX }, (_, i) => (i + 1) as ScaleValue).map((v) => (
          <button
            key={v}
            type="button"
            className="svq-circ"
            onClick={() => onAnswer(v)}
            aria-label={`${v}`}
            style={{
              flex: 1,
              aspectRatio: "1",
              maxWidth: 58,
              borderRadius: "50%",
              border: `1.5px solid ${INK.t2}`,
              background: "transparent",
              color: INK.t5,
              fontFamily: INK.mono,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        <span style={{ fontFamily: INK.font, fontSize: 12.5, color: INK.t48 }}>{SCALE_LABELS.min}</span>
        <span style={{ fontFamily: INK.font, fontSize: 12.5, color: INK.t7, fontWeight: 700 }}>{SCALE_LABELS.max}</span>
      </div>
    </div>
  );
}

function BlockScale({ text, onAnswer }: { text: string; onAnswer: (v: ScaleValue) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div>
      <p style={qTitleStyle}>{text}</p>
      <div style={{ display: "flex", gap: 9, marginTop: 30 }} onMouseLeave={() => setHover(0)}>
        {Array.from({ length: SCALE_MAX }, (_, i) => (i + 1) as ScaleValue).map((v) => (
          <button
            key={v}
            type="button"
            className="svq-block"
            onMouseEnter={() => setHover(v)}
            onClick={() => onAnswer(v)}
            aria-label={`level ${v}`}
            style={{
              flex: 1,
              height: 64,
              borderRadius: 12,
              background: v <= hover ? INK.grad : INK.surface2,
              border: `1px solid ${v <= hover ? "transparent" : INK.border2}`,
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        <span style={{ fontFamily: INK.font, fontSize: 12.5, color: INK.t48 }}>{DRILLDOWN_SCALE_LABELS.min}</span>
        <span style={{ fontFamily: INK.font, fontSize: 12.5, color: INK.t7, fontWeight: 700 }}>{DRILLDOWN_SCALE_LABELS.max}</span>
      </div>
    </div>
  );
}

function ChoiceQuestion({ prompt, options, onAnswer }: { prompt: string; options: { value: GuardianType; text: string }[]; onAnswer: (v: GuardianType) => void }) {
  return (
    <div>
      <p style={{ fontFamily: INK.font, fontSize: 13, fontWeight: 600, color: INK.accent, margin: "0 0 14px" }}>{GUARDIAN_SCENE_INTRO}</p>
      <p style={qTitleStyle}>{prompt}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 30 }}>
        {options.map((o, i) => (
          <button
            key={o.value}
            type="button"
            className="svq-opt"
            onClick={() => onAnswer(o.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 15,
              textAlign: "left",
              padding: 20,
              borderRadius: 16,
              background: INK.surface,
              border: `1px solid ${INK.border2}`,
              color: INK.t9,
              fontFamily: INK.font,
              fontSize: 15.5,
              fontWeight: 500,
              lineHeight: 1.5,
              cursor: "pointer",
            }}
          >
            <span style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 8, border: `1px solid ${INK.t2}`, fontFamily: INK.mono, fontSize: 12, fontWeight: 600, color: INK.t55 }}>
              {String.fromCharCode(65 + i)}
            </span>
            <span>{o.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SentenceComplete({ text, onAnswer }: { text: string; onAnswer: (v: string) => void }) {
  const [value, setValue] = useState("");
  const parts = text.split("______");
  const inline = parts.length === 2;
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <p style={{ fontFamily: INK.font, fontSize: 13, color: INK.t5, margin: 0 }}>{SCT_GUIDE}</p>
      {inline ? (
        <p style={{ fontFamily: INK.font, fontSize: 27, fontWeight: 800, lineHeight: 1.5, letterSpacing: "-0.025em", color: INK.white, margin: "18px 0 0" }}>
          {parts[0]}
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="……"
            style={{
              minWidth: 120,
              width: `${Math.max(6, value.length + 2)}ch`,
              maxWidth: "100%",
              padding: "2px 8px",
              margin: "0 2px",
              border: 0,
              borderBottom: `2px solid ${INK.accent}`,
              background: "transparent",
              fontFamily: INK.font,
              fontWeight: 800,
              fontSize: 27,
              color: INK.accent2,
              textAlign: "center",
              caretColor: INK.accent,
              outline: "none",
            }}
          />
          {parts[1]}
        </p>
      ) : (
        <>
          <p style={{ fontFamily: INK.font, fontSize: 24, fontWeight: 800, lineHeight: 1.5, letterSpacing: "-0.02em", color: INK.white, margin: "18px 0 0" }}>{text}</p>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={2}
            placeholder="Write freely here"
            style={{
              width: "100%",
              marginTop: 18,
              padding: "14px 16px",
              borderRadius: 12,
              border: `1px solid ${INK.border2}`,
              background: INK.surface,
              fontFamily: INK.font,
              fontSize: 16,
              color: INK.white,
              resize: "vertical",
              outline: "none",
            }}
          />
        </>
      )}
      <div style={{ flex: 1, minHeight: 20 }} />
      <button type="button" className="svq-next" onClick={() => onAnswer(value.trim())} style={nextBtnStyle}>Next →</button>
    </div>
  );
}

/** Crisis screen — reused by the result page (crisis blob) too, so exported. International resources. */
export function CrisisScreen() {
  return (
    <Shell>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: INK.accent }} />
          <span style={{ fontFamily: INK.mono, fontWeight: 600, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: INK.accent2 }}>Let&rsquo;s pause here, together</span>
        </div>
        <h1 style={{ fontFamily: INK.display, fontSize: 26, fontWeight: 800, lineHeight: 1.3, letterSpacing: "-0.03em", color: INK.white, margin: "14px 0 0" }}>It sounds like you&rsquo;re carrying a lot right now.</h1>
        <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.75, color: INK.t62, margin: "16px 0 0" }}>
          From what you shared, your heart seemed to feel very heavy. Rather than a test, right now it matters more to talk with
          someone who can be there for you straight away.
        </p>
        <div style={{ height: 1, background: INK.line, margin: "22px 0" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ContactRow label="US · Suicide & Crisis Lifeline" value="988 (call or text)" />
          <ContactRow label="UK & ROI · Samaritans" value="116 123" />
          <ContactRow label="Crisis Text Line (US/UK/CA)" value="text HOME to 741741" />
          <ContactRow label="Anywhere · emergency" value="your local emergency number" />
        </div>
        <p style={{ fontFamily: INK.font, fontSize: 12.5, color: INK.t5, margin: "22px 0 0" }}>
          You don&rsquo;t have to carry this alone. These lines are free, and someone is there any time — day or night.
          If you&rsquo;re not in these regions, findahelpline.com lists a service near you.
        </p>
      </div>
    </Shell>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <span style={{ fontFamily: INK.font, fontSize: 14.5, color: INK.t9 }}>{label}</span>
      <span style={{ fontFamily: INK.mono, fontSize: 14, color: INK.accent2, textAlign: "right" }}>{value}</span>
    </div>
  );
}
