import { describe, expect, it } from "vitest";
import {
  isManualReportExpired,
  readManualReport,
  type ManualReport,
} from "./manual-reports";

const base: ManualReport = {
  schema_id: "defectiveness_shame",
  child_name: "The Child Who Went into Hiding",
  hook: "hook",
  intro: ["intro"],
  sections: [{ n: "01", title: "T", blocks: [{ kind: "p", text: "body" }] }],
  closing: ["closing"],
};

const NOW = new Date("2026-07-15T00:00:00.000Z");

describe("isManualReportExpired", () => {
  it("만료 시각이 미래면 열어준다", () => {
    const r = { ...base, expires_at: "2026-07-22T00:00:00.000Z" };
    expect(isManualReportExpired(r, NOW)).toBe(false);
  });

  it("만료 시각이 지났으면 닫는다 — 고객에게 7일 만료라고 안내하므로 실제로 닫혀야 한다", () => {
    const r = { ...base, expires_at: "2026-07-14T23:59:59.000Z" };
    expect(isManualReportExpired(r, NOW)).toBe(true);
  });

  it("정확히 만료 시각이면 아직 열려 있다(경계는 열어주는 쪽)", () => {
    const r = { ...base, expires_at: NOW.toISOString() };
    expect(isManualReportExpired(r, NOW)).toBe(false);
  });

  it("expires_at 이 없으면 만료 없음(만료 도입 전 원고 호환)", () => {
    expect(isManualReportExpired(base, NOW)).toBe(false);
  });

  it("expires_at 이 깨진 값이면 만료로 오판하지 않는다", () => {
    const r = { ...base, expires_at: "not-a-date" };
    expect(isManualReportExpired(r, NOW)).toBe(false);
  });
});

describe("readManualReport", () => {
  it("정상 블롭을 읽고 expires_at 을 보존한다", () => {
    const raw = { ...base, expires_at: "2026-07-22T00:00:00.000Z" };
    expect(readManualReport(raw)?.expires_at).toBe("2026-07-22T00:00:00.000Z");
  });

  it("필수 필드가 없으면 null — 깨진 원고를 렌더하지 않는다", () => {
    expect(readManualReport({ ...base, schema_id: "" })).toBeNull();
    expect(readManualReport({ ...base, child_name: "" })).toBeNull();
    expect(readManualReport({ ...base, sections: [] })).toBeNull();
    expect(readManualReport(null)).toBeNull();
    expect(readManualReport("nope")).toBeNull();
  });

  it("expires_at 이 문자열이 아니면 버린다(만료 없음 취급)", () => {
    expect(readManualReport({ ...base, expires_at: 12345 })?.expires_at).toBeUndefined();
  });
});
