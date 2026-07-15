/**
 * /inner-child/en/full/[id] — 손으로 쓴 유료(베타) 리포트. 로그인 없이 링크로만 연다.
 *
 * [id] 는 minds_leads 의 leadId(UUID). 영어판은 자동 생성 파이프라인이 없어, 운영자가 쓴
 * 원고를 parts_map.manual_report 에서 읽어 낸다(원고는 개인정보라 코드에 두지 않는다).
 * 원고가 없는 id 면 "아직 준비 중" 안내(추측성 본문을 만들어내지 않는다).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getManualReport } from "@/lib/minds/inner-child/en/manual-reports";
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

  return <InnerChildEnFullReport report={report} />;
}

/** 원고가 아직 없는 링크 — 깨진 페이지 대신 상태를 정직하게 알린다. */
function NotReadyNotice() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#050506",
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
        This report isn&rsquo;t ready yet
      </h1>
      <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,.55)", maxWidth: 340 }}>
        Full reports are written by hand, one at a time. If you requested yours, it&rsquo;s on the way — we&rsquo;ll
        email you the moment it&rsquo;s finished.
      </p>
      <Link
        href="/inner-child/en"
        style={{
          marginTop: 28,
          display: "inline-block",
          borderRadius: 999,
          background: "linear-gradient(135deg,#FF5A1F 0%,#FF8A4C 100%)",
          color: "#0A0A0B",
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
