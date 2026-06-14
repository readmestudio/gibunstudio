/**
 * 감정 색 블렌딩 — "매일, 한 칸씩" 캘린더의 핵심.
 *
 * report-redesign 핸드오프(감정 캘린더.html)의 `meshLayers()`를 그대로 옮긴
 * 순수 모듈. DOM 의존 없음 → 서버 컴포넌트(셀 SSR)와 클라이언트(모달) 양쪽에서 import.
 *
 * 블렌딩 규칙:
 *   · 감정  → 색상(HUE)      : 9개 감정마다 고정 HSL.
 *   · 강도  → 채도(SAT)      : emotion_intensity 가 높을수록 선명.
 *   · 컨디션 → 밝기(LIGHT)   : (energy + motivation)/2 가 높을수록 환함.
 *   · 신체  → 질감(GRAIN)    : body_signs 개수만큼 노이즈를 더 얹음.
 *
 * 정해진 점수표가 아니라 "그날의 결을 닮은 색 한 칸"을 만드는 게 목적.
 */

import type { DailyScan } from "./types";

export type EmotionColor = { h: number; s: number; l: number; en: string };

/** MIND_SPILL_EMOTIONS 9종과 1:1 대응되는 색상 맵. */
export const EMOTION_COLORS: Record<string, EmotionColor> = {
  기쁨: { h: 38, s: 92, l: 72, en: "JOY" },
  평온: { h: 214, s: 72, l: 78, en: "CALM" },
  불안: { h: 266, s: 60, l: 76, en: "ANXIOUS" },
  초조: { h: 292, s: 52, l: 76, en: "RESTLESS" },
  압박감: { h: 14, s: 92, l: 73, en: "PRESSURE" },
  슬픔: { h: 226, s: 64, l: 75, en: "SADNESS" },
  피로: { h: 274, s: 30, l: 76, en: "FATIGUE" },
  분노: { h: 5, s: 86, l: 70, en: "ANGER" },
  외로움: { h: 234, s: 48, l: 74, en: "LONELY" },
};

export const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));

/** 색 블렌딩에 필요한 최소 입력 — DailyScan 에서 추출한 정규화 값. */
export type ScanColorInput = {
  emotions: string[];
  /** 1~10. */
  intensity: number;
  /** 0~10. */
  energy: number;
  /** 0~10 (motivation). */
  drive: number;
  /** body_signs 라벨. */
  body: string[];
};

/**
 * DailyScan → ScanColorInput. 누락값은 중립(5)·평온으로 폴백.
 * intensity 는 emotion_intensity 우선, 없으면 감정별 강도 평균.
 */
export function toScanColorInput(scan: DailyScan): ScanColorInput {
  const intensities = scan.emotion_intensities ?? {};
  const intVals = Object.values(intensities).filter(
    (v): v is number => typeof v === "number"
  );
  const intensity =
    scan.emotion_intensity ??
    (intVals.length ? intVals.reduce((a, b) => a + b, 0) / intVals.length : 5);
  return {
    emotions: scan.emotions ?? [],
    intensity: clamp(intensity, 0, 10),
    energy: clamp(scan.energy ?? 5, 0, 10),
    drive: clamp(scan.motivation ?? 5, 0, 10),
    body: scan.body_signs ?? [],
  };
}

/** 감정 → 칸 안에서 쓰는 단색 hsl 문자열 (라벨 점·모달 칩). */
export function emotionHsl(name: string): string | null {
  const c = EMOTION_COLORS[name];
  return c ? `hsl(${c.h} ${c.s}% ${c.l}%)` : null;
}

export type MeshResult = { bg: string; avgL: number };

/**
 * 그날의 색 — 여러 radial-gradient 를 겹친 mesh gradient CSS 문자열.
 * avgL < 60 이면 어두운 칸(흰 글씨 변형)으로 취급.
 */
export function meshLayers(d: ScanColorInput): MeshResult {
  const cols = d.emotions
    .map((e) => EMOTION_COLORS[e])
    .filter((c): c is EmotionColor => Boolean(c));
  if (!cols.length) cols.push(EMOTION_COLORS["평온"]);

  const satMul = 0.62 + (d.intensity / 10) * 0.55; // 강도 → 채도
  const energy = (d.energy + d.drive) / 2; // 컨디션
  const lShift = (energy - 5) * 1.7; // 컨디션 → 밝기

  const pos: Array<[number, number]> = [
    [20, 22],
    [80, 26],
    [28, 82],
    [78, 80],
    [50, 50],
  ];

  const layers: string[] = [
    `radial-gradient(72% 58% at 76% 12%, hsl(42 60% 97% / 0.66) 0%, transparent 56%)`,
  ];

  let work: EmotionColor[] = cols.slice();
  if (work.length === 1) {
    // 단일 감정 → 그라디언트가 살도록 부드러운 형제색 1개 추가.
    const c = work[0];
    work = [
      c,
      {
        h: (c.h + 18) % 360,
        s: clamp(c.s - 12, 18, 98),
        l: clamp(c.l + 6, 55, 92),
        en: c.en,
      },
    ];
  }

  work.forEach((c, i) => {
    const p = pos[i % pos.length];
    const s = clamp(c.s * satMul, 16, 98);
    const l = clamp(c.l + lShift, 50, 93);
    layers.push(
      `radial-gradient(96% 92% at ${p[0]}% ${p[1]}%, hsl(${c.h} ${s}% ${l}% / 0.95) 0%, hsl(${c.h} ${s}% ${l}% / 0) 62%)`
    );
  });

  const base = cols[0];
  const bs = clamp(base.s * satMul * 0.55, 14, 70);
  const bl = clamp(base.l + lShift + 7, 64, 95);
  layers.push(`hsl(${base.h} ${bs}% ${bl}%)`);

  const avgL = clamp(
    cols.reduce((a, c) => a + c.l, 0) / cols.length + lShift,
    40,
    95
  );
  return { bg: layers.join(", "), avgL };
}

/** 신체 신호 개수 → grain(노이즈) 강도. */
export function grainFor(d: ScanColorInput): number {
  return clamp(0.06 + d.body.length * 0.05, 0.06, 0.34);
}

/** 범례 스와치 배경 — 감정 1종을 작은 mesh 로 보여줌. */
export function swatchBg(name: string): string {
  const c = EMOTION_COLORS[name];
  if (!c) return "var(--ms-bg-2)";
  return [
    `radial-gradient(80% 80% at 30% 25%, hsl(${c.h} ${c.s}% ${clamp(
      c.l + 8,
      55,
      92
    )}%) 0%, transparent 60%)`,
    `radial-gradient(90% 90% at 80% 90%, hsl(${(c.h + 16) % 360} ${c.s}% ${
      c.l - 4
    }%) 0%, transparent 60%)`,
    `hsl(${c.h} ${clamp(c.s * 0.6, 20, 70)}% ${clamp(c.l + 6, 64, 92)}%)`,
  ].join(", ");
}

/** 비어있는 날(미작성) 모달 헤더용 중립 배경. */
export const EMPTY_MODAL_BG =
  "radial-gradient(120% 120% at 30% 20%, #EFE7F4, transparent 60%), radial-gradient(120% 120% at 80% 90%, #E4DCEC, transparent 60%), #F2ECF2";
