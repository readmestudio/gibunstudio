import type { Metadata } from "next";
import { getSavedSaju } from "@/lib/saju/report-store";
import { SajuEnReport } from "@/components/minds/saju/en/SajuEnReport";

/**
 * /saju/en/r/[id] — 발송된 사주 리포트 (로그인 없음, 링크 접근).
 *
 * [id] 는 minds_leads 의 leadId(UUID). 서버에서 admin 으로 parts_map(SajuBlob)을 읽어 렌더한다.
 * 아직 생성 중이면 report=null → "작성 중" 화면(뷰가 분기).
 */

export const metadata: Metadata = {
  title: "Your Korean Saju · GIBUN",
  robots: { index: false, follow: false },
};

export default async function SajuEnReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blob = await getSavedSaju(id);
  return (
    <main className="min-h-screen" style={{ background: "#1C1813" }}>
      <SajuEnReport blob={blob} />
    </main>
  );
}
