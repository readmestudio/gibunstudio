import type { SajuChart } from "./types";

/**
 * 유료 사주 리포트(영어). 판매 페이지 목차 8항목 + 여는 초상 + 닫는 편지.
 * 전부 LLM 생성 필드이며, 계산된 명반(SajuChart)만을 근거로 쓴다.
 */
export interface SajuReport {
  /** 여는 초상 — 이 명반이 말하는 사람 */
  portrait: string;
  /** 01 내 명반 이해하기 (사주 + 자미 나란히) */
  chart_reading: string;
  /** 02 대인관계운 */
  relationships: string;
  /** 03 직업운 */
  work: string;
  /** 04 재물운 */
  wealth: string;
  /** 05 연애운 */
  love: string;
  /** 06 10년 대운 */
  cycles: string;
  /** 07 행운의 시기 · 조심할 시기 */
  timing: string;
  /** 08 당신의 고민에 대한 답 */
  concern_answer: string;
  /** 닫는 편지 */
  closing: string;
}

export const SAJU_REPORT_FIELDS: ReadonlyArray<keyof SajuReport> = [
  "portrait",
  "chart_reading",
  "relationships",
  "work",
  "wealth",
  "love",
  "cycles",
  "timing",
  "concern_answer",
  "closing",
];

/** 리포트 섹션 표시 메타(영문) — 뷰와 목차가 공유한다. */
export const SAJU_SECTIONS: ReadonlyArray<{
  key: keyof SajuReport;
  no: string;
  title: string;
  sub?: string;
}> = [
  { key: "chart_reading", no: "01", title: "Reading your chart", sub: "Four Pillars and Purple Star, side by side" },
  { key: "relationships", no: "02", title: "People & relationships" },
  { key: "work", no: "03", title: "Work & calling" },
  { key: "wealth", no: "04", title: "Money & wealth" },
  { key: "love", no: "05", title: "Love" },
  { key: "cycles", no: "06", title: "Your ten-year cycles" },
  { key: "timing", no: "07", title: "Times to move · times to wait" },
  { key: "concern_answer", no: "08", title: "What you asked about" },
];

/** minds_leads.parts_map 에 저장하는 사주 블롭 */
export interface SajuBlob {
  test_version: "saju-v1";
  chart: SajuChart;
  /** 온보딩에서 고른 고민 키 (없으면 null) */
  concern: string | null;
  report: SajuReport | null;
}
