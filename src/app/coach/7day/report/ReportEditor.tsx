"use client";

import { useState } from "react";
import { REPORT_SECTION_LABELS, type ReportSection } from "@/lib/report/template";

type ReportData = Record<ReportSection, string>;

const INITIAL_REPORT: ReportData = {
  profile: "",
  emotionChart: "",
  frequentThoughts: "",
  coreBeliefs: "",
  originStory: "",
  lifeImpact: "",
  counselorSummary: "",
};

export function ReportEditor() {
  const [userName, setUserName] = useState("");
  const [report, setReport] = useState<ReportData>(INITIAL_REPORT);
  const [loading, setLoading] = useState(false);
  const [rawDataPreview, setRawDataPreview] = useState("{}");

  const generateReport = async () => {
    if (!userName.trim()) return;
    setLoading(true);
    try {
      const rawData = JSON.parse(rawDataPreview || "{}");
      const res = await fetch("/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawData, userName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "리포트 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const updateSection = (key: ReportSection, value: string) => {
    setReport((prev) => ({ ...prev, [key]: value }));
  };

  const handlePublish = () => {
    alert("퍼블리시 기능은 Supabase 연동 후 구현됩니다.");
  };

  return (
    <div className="mt-8 space-y-8">
      <div className="rounded-xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          리포트 생성
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              회원명
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="예: 김지안"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              로우데이터 (JSON)
            </label>
            <textarea
              value={rawDataPreview}
              onChange={(e) => setRawDataPreview(e.target.value)}
              placeholder='{"childhood": [...], "coreBelief": [...], ...}'
              rows={6}
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2 font-mono text-sm text-[var(--foreground)]"
            />
          </div>
          <button
            type="button"
            onClick={generateReport}
            disabled={loading || !userName.trim()}
            className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--foreground)] disabled:opacity-50 hover:bg-[var(--accent-hover)]"
          >
            {loading ? "생성 중..." : "ChatGPT로 리포트 생성"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {(Object.keys(REPORT_SECTION_LABELS) as ReportSection[]).map((key) => (
          <div key={key} className="rounded-xl border border-[var(--border)] bg-white p-6">
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              {REPORT_SECTION_LABELS[key]}
            </h3>
            <textarea
              value={report[key]}
              onChange={(e) => updateSection(key, e.target.value)}
              placeholder={key === "counselorSummary" ? "상담사가 직접 작성하는 영역입니다." : ""}
              rows={key === "profile" ? 2 : 6}
              className="mt-3 w-full rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={handlePublish}
          className="rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
        >
          리포트 퍼블리시
        </button>
      </div>
    </div>
  );
}
