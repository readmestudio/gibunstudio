import { describe, it, expect } from "vitest";
import { isImmersiveRoute } from "./immersive-route";

/**
 * 전역 헤더/푸터 숨김 판정 — Header·Footer 가 이 함수 하나를 공유하므로 조용히 깨지면
 * 영어 퍼널에 한국어 헤더("기분 레터"·"로그인")가 그대로 뜬다(2026-07-17 saju/en 실제 사고).
 */
describe("isImmersiveRoute", () => {
  it("영어 퍼널은 숨긴다 — /inner-child/en 과 하위", () => {
    expect(isImmersiveRoute("/inner-child/en")).toBe(true);
    expect(isImmersiveRoute("/inner-child/en/r/abc-123")).toBe(true);
    expect(isImmersiveRoute("/inner-child/en/full/abc-123")).toBe(true);
  });

  it("영어 퍼널은 숨긴다 — /saju/en 과 하위", () => {
    expect(isImmersiveRoute("/saju/en")).toBe(true);
    expect(isImmersiveRoute("/saju/en/r/e107ef3c-a565-4686-872f-c62e80a257b5")).toBe(true);
  });

  it("워크북 주간 화면은 숨긴다", () => {
    expect(isImmersiveRoute("/dashboard/mind-spill/weekly/2026-07-17")).toBe(true);
  });

  it("한국어 퍼널은 헤더를 노출한다", () => {
    expect(isImmersiveRoute("/inner-child")).toBe(false);
    expect(isImmersiveRoute("/inner-child/r/abc-123")).toBe(false);
    expect(isImmersiveRoute("/saju")).toBe(false);
    expect(isImmersiveRoute("/")).toBe(false);
  });

  it("접두사만 같은 다른 경로를 오탐하지 않는다", () => {
    expect(isImmersiveRoute("/inner-child/english")).toBe(false);
    expect(isImmersiveRoute("/saju/english")).toBe(false);
    expect(isImmersiveRoute("/saju/enterprise")).toBe(false);
  });

  it("pathname 이 없으면 숨기지 않는다", () => {
    expect(isImmersiveRoute(null)).toBe(false);
    expect(isImmersiveRoute("")).toBe(false);
  });
});
