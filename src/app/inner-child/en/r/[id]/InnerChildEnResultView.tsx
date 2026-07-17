"use client";

/**
 * Saved English inner-child free report view.
 *  - crisis blob: CrisisScreen only (no paywall).
 *  - normal result: English free report (InnerChildEnFreeReport) + copy-link bar.
 *  - missing/broken: friendly notice + restart link (and clears the auto-restore key).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { InnerChildEnFreeReport } from "@/components/minds/inner-child/en/report/InnerChildEnFreeReport";
import { CrisisScreen } from "@/components/minds/inner-child/en/InnerChildEnTest";
import { getEnTypeCard } from "@/lib/minds/inner-child/en/type-cards";
import type { StoredFreeReport } from "@/lib/minds/inner-child/free-report-store";

const KEY = "inner_child_en_lead_id";

const INK = {
  accent2: "#8B89C4",
  grad: "linear-gradient(135deg,#A6A2E0 0%,#8B89C4 100%)",
  surface: "#29241D",
  border: "#3A3228",
  font: "'Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif",
  mono: "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace",
};

export function InnerChildEnResultView({
  leadId,
  blob,
}: {
  leadId: string;
  blob: StoredFreeReport | null;
}) {
  useEffect(() => {
    if (!blob && typeof window !== "undefined") {
      if (localStorage.getItem(KEY) === leadId) localStorage.removeItem(KEY);
    }
  }, [blob, leadId]);

  if (!blob) {
    return (
      <div style={{ minHeight: "100dvh", background: "#15120D", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center", fontFamily: INK.font }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#EDE4D3", letterSpacing: "-0.02em" }}>
          We couldn&rsquo;t find this result
        </h1>
        <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7, color: "rgba(237,228,211,.55)", maxWidth: 340 }}>
          The link may be wrong, or the result may no longer be stored.
        </p>
        <Link
          href="/inner-child/en"
          style={{ marginTop: 28, display: "inline-block", borderRadius: 999, background: INK.grad, color: "#211D18", padding: "13px 24px", fontSize: 14.5, fontWeight: 800, textDecoration: "none" }}
        >
          Start the inner child test
        </Link>
      </div>
    );
  }

  // Crisis response — resources only, no paywall (own full screen).
  if (blob.score_result.crisis_flag) {
    return <CrisisScreen />;
  }

  const card = getEnTypeCard(blob.score_result.primary_child.schema_id);

  if (card) {
    return (
      <InnerChildEnFreeReport
        card={card}
        score={blob.score_result}
        free={blob.free_report}
        concern={blob.concern}
        leadId={leadId}
        footerExtra={
          <div style={{ maxWidth: 440, margin: "0 auto" }}>
            <CopyLinkBar leadId={leadId} />
          </div>
        }
      />
    );
  }

  // Unwritten type — dark notice.
  return (
    <div style={{ minHeight: "100dvh", background: "#15120D", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <h1 style={{ fontFamily: INK.font, fontSize: 26, fontWeight: 800, color: "#EDE4D3", letterSpacing: "-0.03em" }}>
        {blob.score_result.primary_child.child_name}
      </h1>
      <p style={{ fontFamily: INK.font, fontSize: 14, color: "rgba(237,228,211,.6)", marginTop: 12, lineHeight: 1.7 }}>
        The detailed report for this child is on its way. You&rsquo;ll be able to meet it soon.
      </p>
    </div>
  );
}

/** Minimal English copy-link bar — so the reader can reopen or share the result. */
function CopyLinkBar({ leadId }: { leadId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      const url = `${window.location.origin}/inner-child/en/r/${leadId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard 접근 불가 — 조용히 무시.
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "13px 16px",
        borderRadius: 12,
        background: INK.surface,
        border: `1px solid ${INK.border}`,
        color: copied ? INK.accent2 : "rgba(237,228,211,.72)",
        fontFamily: INK.font,
        fontSize: 13.5,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {copied ? "Link copied ✓" : "🔗 Copy link to reopen this result anytime"}
    </button>
  );
}
