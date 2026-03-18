'use client';

import { useMemo } from 'react';
import { CardPatternDecoration } from './CardPatternDecoration';

interface HexagonChartData {
  labels: string[];
  values: number[];
}

interface ReportCardProps {
  title: string;
  content: string;
  cardNumber?: number;
  cardType?: 'intro' | 'analysis' | 'result' | 'insight' | 'personality' | 'values' | 'matching';
  metadata?: {
    subtitle?: string;
    tags?: string[];
    highlight?: string;
  };
  hexagonData?: HexagonChartData;
}

// 육각형 차트 컴포넌트 - 검정색 모노톤
function HexagonChart({ data }: { data: HexagonChartData }) {
  const { labels, values } = data;
  const numPoints = 6;
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 100;

  // 각 축의 포인트 계산
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  // 외곽선 (100% 기준)
  const outerPoints = Array.from({ length: numPoints }, (_, i) => getPoint(i, 100));
  const outerPath = outerPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // 중간선 (50% 기준)
  const midPoints = Array.from({ length: numPoints }, (_, i) => getPoint(i, 50));
  const midPath = midPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // 데이터 포인트
  const dataPoints = values.map((v, i) => getPoint(i, v));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // 라벨 위치
  const getLabelPosition = (index: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const radius = maxRadius + 35;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  return (
    <div className="w-full flex justify-center my-6">
      <svg viewBox="0 0 300 300" className="w-full max-w-[280px]">
        {/* 배경 격자 */}
        <path d={outerPath} fill="none" stroke="#e5e5e5" strokeWidth="1" />
        <path d={midPath} fill="none" stroke="#e5e5e5" strokeWidth="1" strokeDasharray="4,4" />

        {/* 축 선 */}
        {outerPoints.map((p, i) => (
          <line key={i} x1={centerX} y1={centerY} x2={p.x} y2={p.y} stroke="#e5e5e5" strokeWidth="1" />
        ))}

        {/* 데이터 영역 - 검정색 모노톤 */}
        <path d={dataPath} fill="rgba(25, 25, 25, 0.1)" stroke="#191919" strokeWidth="2" />

        {/* 데이터 포인트 */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="5" fill="#191919" />
        ))}

        {/* 라벨 */}
        {labels.map((label, i) => {
          const pos = getLabelPosition(i);
          return (
            <text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] fill-[var(--foreground)]/70"
            >
              {label}
            </text>
          );
        })}

        {/* 점수 표시 */}
        {dataPoints.map((p, i) => (
          <text
            key={`score-${i}`}
            x={p.x}
            y={p.y - 12}
            textAnchor="middle"
            className="text-[9px] font-bold fill-[#191919]"
          >
            {values[i]}
          </text>
        ))}
      </svg>
    </div>
  );
}

// "→ " 로 시작하는 줄을 최대 3개 추출 (요약 불렛용)
function extractBullets(content: string): string[] {
  return content
    .split('\n')
    .filter((line) => line.trimStart().startsWith('→ '))
    .slice(0, 3)
    .map((line) => line.trimStart().replace(/^→\s*/, ''));
}

// 본문에서 "→ " 줄을 제거하여 불렛과 중복 방지
function stripBulletLines(content: string): string {
  return content
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('→ '))
    .join('\n');
}

// 콘텐츠를 인트로(첫 섹션 타이틀 이전)와 본문(섹션 타이틀 이후)으로 분리
// 첫 번째 "→ " 줄 바로 위의 **타이틀** 줄을 찾아 그 직전까지가 인트로
function splitIntroAndBody(content: string): { intro: string; body: string } {
  const lines = content.split('\n');
  const firstBulletIdx = lines.findIndex((l) => l.trimStart().startsWith('→ '));
  if (firstBulletIdx <= 0) return { intro: content, body: '' };

  // 첫 번째 → 줄 위쪽으로 올라가며 **타이틀** 줄 찾기
  let splitIdx = firstBulletIdx;
  for (let i = firstBulletIdx - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      splitIdx = i;
      break;
    }
  }

  const intro = lines.slice(0, splitIdx).join('\n').trim();
  const body = lines.slice(splitIdx).join('\n').trim();
  return { intro, body };
}

// 마크다운 스타일 볼드 처리
function processContent(content: string): string {
  // **텍스트** → <strong>텍스트</strong>
  return content.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--foreground)] font-semibold">$1</strong>');
}

export function ReportCard({
  title,
  content,
  cardNumber,
  cardType = 'analysis',
  metadata,
  hexagonData,
}: ReportCardProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `남편상 분석: ${title}`,
          text: content.substring(0, 200) + '...',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${title}\n\n${content}`);
      alert('카드 내용이 클립보드에 복사되었습니다!');
    }
  };

  // 요약 불렛 추출 (카드 2~8만)
  const showBullets = cardNumber !== undefined && cardNumber >= 2 && cardNumber <= 8;
  const bullets = useMemo(
    () => (showBullets ? extractBullets(content) : []),
    [content, showBullets]
  );

  // 인트로/본문 분리 + 콘텐츠 처리
  const { processedIntro, processedBody } = useMemo(() => {
    if (!showBullets || bullets.length === 0) {
      return { processedIntro: '', processedBody: processContent(content) };
    }
    const { intro, body } = splitIntroAndBody(content);
    return {
      processedIntro: intro ? processContent(intro) : '',
      processedBody: processContent(stripBulletLines(body)),
    };
  }, [content, showBullets, bullets.length]);

  // 카드 2는 육각형 차트 표시
  const showHexagonChart = cardNumber === 2 && hexagonData;

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-[var(--foreground)] overflow-hidden min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="p-8 pb-6 border-b border-[var(--border)] flex-shrink-0">
        {metadata?.subtitle && (
          <p className="text-sm font-medium text-[var(--foreground)]/60 mb-2">
            {metadata.subtitle}
          </p>
        )}
        <h2 className="text-2xl font-bold text-[var(--foreground)] leading-tight">
          {title}
        </h2>
        {metadata?.tags && metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {metadata.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs font-medium bg-[var(--surface)] text-[var(--foreground)]/70 rounded-full border border-[var(--border)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 육각형 차트 (카드 2만) */}
      {showHexagonChart && (
        <div className="px-8 pt-4 flex-shrink-0">
          <HexagonChart data={hexagonData} />
        </div>
      )}

      {/* Content: 인트로 → 불렛 → 본문 */}
      <div className="flex-1 p-8">
        {metadata?.highlight && (
          <div className="mb-6 p-4 bg-[var(--surface)] border-l-4 border-[var(--foreground)] rounded-r">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {metadata.highlight}
            </p>
          </div>
        )}

        {/* 인트로 영역 (불렛이 있을 때만 분리 표시) */}
        {processedIntro && (
          <div className="prose prose-sm max-w-none mb-4">
            <div
              className="text-[var(--foreground)]/80 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: processedIntro }}
            />
          </div>
        )}

        {/* 요약 불렛 (인트로 아래, 본문 위) */}
        {bullets.length > 0 && (
          <div className="mb-5 space-y-1.5">
            {bullets.map((bullet, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--foreground)]/40 flex-shrink-0" />
                <span className="text-sm text-[var(--foreground)]/70">{bullet}</span>
              </div>
            ))}
          </div>
        )}

        {/* 본문 영역 */}
        <div className="prose prose-sm max-w-none">
          <div
            className="text-[var(--foreground)]/80 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: processedBody }}
          />
        </div>
      </div>

      {/* 하단 장식 패턴 */}
      <CardPatternDecoration />

      {/* Footer */}
      <div className="p-6 border-t border-[var(--border)] bg-[var(--surface)]/30 flex-shrink-0">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:underline"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          공유하기
        </button>
      </div>
    </div>
  );
}
