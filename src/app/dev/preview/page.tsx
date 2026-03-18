import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Phase1ReportClient } from '@/app/husband-match/report/[phase1_id]/Phase1ReportClient';
import { Phase2ReportClient } from '@/app/husband-match/deep-report/[phase2_id]/Phase2ReportClient';
import { DevPreviewTabs } from './DevPreviewTabs';

export default function DevPreviewPage() {
  const dataPath = resolve(process.cwd(), 'test-data', 'preview-data.json');

  if (!existsSync(dataPath)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            미리보기 데이터 없음
          </h1>
          <p className="text-[var(--foreground)]/70 mb-6">
            먼저 테스트 스크립트를 실행해주세요:
          </p>
          <code className="block bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 text-sm text-left">
            npx tsx scripts/test-full-pipeline.ts
          </code>
          <p className="text-sm text-[var(--foreground)]/50 mt-4">
            스크립트가 완료되면 이 페이지를 새로고침하세요.
          </p>
        </div>
      </div>
    );
  }

  const raw = readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(raw);

  const phase1Result = data.phase1;
  const phase2Result = {
    ...data.phase2,
    phase1_results: data.phase1,
  };

  return (
    <DevPreviewTabs
      phase1Result={phase1Result}
      phase2Result={phase2Result}
    />
  );
}
