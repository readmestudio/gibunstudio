/**
 * /inner-child/en/full/[id] — 손으로 쓴 유료(베타) 리포트. 로그인 없이 링크로만 연다.
 *
 * [id] 는 minds_leads 의 leadId(UUID). 이메일 요청 시 서버가 자동 생성해 parts_map.manual_report
 * 에 저장한 리포트를 읽어 낸다(생성 실패 시 운영자 손원고로 대체 — 같은 자리·같은 스키마).
 * 원고가 아직 없는 id 면(생성 중이거나 실패) "준비 중" 안내(추측성 본문을 만들지 않는다).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getManualReport } from "@/lib/minds/inner-child/en/manual-report-store";
import { isManualReportExpired } from "@/lib/minds/inner-child/en/manual-reports";
import { InnerChildEnFullReport } from "@/components/minds/inner-child/en/report/InnerChildEnFullReport";

export const metadata: Metadata = {
  title: "Your Full Inner Child Report · GIBUN",
  robots: { index: false, follow: false },
};

export default async function InnerChildEnFullReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getManualReport(id);

  if (!report) return <NotReadyNotice />;
  // 고객에게 "7일 후 만료"라고 안내하므로 실제로 닫는다(안내만 하고 열어두면 거짓말이 된다).
  if (isManualReportExpired(report)) return <ExpiredNotice />;

  return <InnerChildEnFullReport report={report} />;
}

/**
 * 만료된 링크 — 본인의 심리 리포트라 영구 차단하지 않고 재발급 경로를 준다.
 * (재발급 = 운영자가 scripts/put-en-manual-report.js 를 다시 실행해 expires_at 갱신)
 */
function ExpiredNotice() {
  return (
    <Notice
      title="This link has expired"
      body="Your full report was open for 7 days. If you'd like to read it again, just reply to the email we sent and we'll reopen it for you — your report is still here."
    />
  );
}

/** 원고가 아직 없는 링크 — 깨진 페이지 대신 상태를 정직하게 알린다. */
function NotReadyNotice() {
  return (
    <Notice
      title="This report isn’t ready yet"
      body="Your full report is being generated right now. If you just requested it, give it a minute — we’ll email you the moment it’s ready."
    />
  );
}

/** 리포트가 열리지 않는 모든 경우의 공용 안내(다크 셸 + CTA). */
function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#15120D",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
        fontFamily: "'Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif",
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: 0 }}>
        {title}
      </h1>
      <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7, color: "rgba(237,228,211,.55)", maxWidth: 360 }}>
        {body}
      </p>
      <Link
        href="/inner-child/en"
        style={{
          marginTop: 28,
          display: "inline-block",
          borderRadius: 999,
          background: "linear-gradient(135deg,#A6A2E0 0%,#8B89C4 100%)",
          color: "#211D18",
          padding: "13px 24px",
          fontSize: 14.5,
          fontWeight: 800,
          textDecoration: "none",
        }}
      >
        Back to the inner child test
      </Link>
    </div>
  );
}
