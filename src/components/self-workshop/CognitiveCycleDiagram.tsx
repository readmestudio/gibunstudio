interface Node {
  stage: string;
  label: string;
}

interface Props {
  nodes: Node[];
  centerLabel: string;
}

export function CognitiveCycleDiagram({ nodes, centerLabel }: Props) {
  const n = Math.max(3, Math.min(nodes.length, 8));
  const visibleNodes = nodes.slice(0, n);
  const cx = 200;
  const cy = 200;
  const R = 134; // 배치 반지름
  const r = 42; // 노드 반지름 (라벨 잘림 방지 위해 확대)
  const angleOffset = Math.asin((r + 6) / R); // 호가 노드에 파묻히지 않도록

  const centers = visibleNodes.map((_, i) => {
    const a = (i * 2 * Math.PI) / n - Math.PI / 2;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), angle: a };
  });

  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full max-w-md mx-auto block"
      role="img"
      aria-label="반복되는 흐름 다이어그램"
    >
      <defs>
        <marker
          id="cycle-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--foreground)" />
        </marker>
      </defs>

      {centers.map((p, i) => {
        const next = centers[(i + 1) % n];
        const a1 = p.angle + angleOffset;
        const a2 = next.angle - angleOffset;
        const sx = cx + R * Math.cos(a1);
        const sy = cy + R * Math.sin(a1);
        const ex = cx + R * Math.cos(a2);
        const ey = cy + R * Math.sin(a2);
        return (
          <path
            key={`arc-${i}`}
            d={`M ${sx} ${sy} A ${R} ${R} 0 0 1 ${ex} ${ey}`}
            fill="none"
            stroke="var(--foreground)"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            markerEnd="url(#cycle-arrow)"
          />
        );
      })}

      {centers.map((p, i) => {
        const label = visibleNodes[i].label;
        const lines = wrapLabel(label, 5); // 줄당 5글자
        return (
          <g key={`node-${i}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill="white"
              stroke="var(--foreground)"
              strokeWidth="2"
            />
            <text
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="var(--foreground)"
            >
              {lines.map((line, j) => (
                <tspan
                  key={j}
                  x={p.x}
                  y={p.y + (j - (lines.length - 1) / 2) * 13 + 4}
                >
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}

      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="var(--foreground)"
      >
        {centerLabel}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontSize="10"
        fill="var(--foreground)"
        opacity="0.55"
      >
        반복되는 흐름
      </text>
    </svg>
  );
}

function wrapLabel(text: string, maxPerLine: number): string[] {
  const cleaned = text.trim();
  if (cleaned.length <= maxPerLine) return [cleaned];

  // 공백·중점·쉼표 기준으로 우선 나눔
  const breakRegex = /[\s·,/]/;
  let breakIdx = -1;
  for (let i = Math.min(maxPerLine, cleaned.length - 1); i > 0; i--) {
    if (breakRegex.test(cleaned[i])) {
      breakIdx = i;
      break;
    }
  }

  if (breakIdx > 0) {
    const first = cleaned.slice(0, breakIdx).trim();
    const rest = cleaned.slice(breakIdx + 1).trim();
    if (rest.length <= maxPerLine) return [first, rest];
    return [first, rest.slice(0, Math.max(1, maxPerLine - 1)) + "…"];
  }

  // 적절한 분리 지점이 없으면 강제 분할
  if (cleaned.length <= maxPerLine * 2) {
    return [cleaned.slice(0, maxPerLine), cleaned.slice(maxPerLine)];
  }
  return [
    cleaned.slice(0, maxPerLine),
    cleaned.slice(maxPerLine, maxPerLine * 2 - 1) + "…",
  ];
}
