/**
 * 성취 중독 순환 패턴 다이어그램
 *
 * 6단계 노드가 원형으로 배치되고 각 노드 사이를 점선 호 + 화살촉으로 연결.
 * 워크북 판매 게이트(WorkshopPaymentGate)와 상세 페이지 악순환 섹션에서 공유.
 */

const ADDICTION_CYCLE = [
  { step: 1, title: "성취 압박", desc: "더 잘해야 한다는 불안" },
  { step: 2, title: "과잉 몰입", desc: "일에 과도하게 집중" },
  { step: 3, title: "일시적 안도", desc: "성과 달성 순간의 만족" },
  { step: 4, title: "공허감", desc: "금세 찾아오는 허무함" },
  { step: 5, title: "자기 의심", desc: "아직 부족하다는 생각" },
  { step: 6, title: "더 큰 목표", desc: "다시 시작되는 압박감" },
];

export function AddictionCycleDiagram() {
  return (
    <div className="relative mx-auto w-full max-w-[360px] aspect-square">
      {/* 중앙 원 */}
      <div className="absolute inset-[25%] rounded-full border-2 border-dashed border-[var(--foreground)]/20" />
      <div className="absolute inset-[35%] rounded-full bg-[var(--surface)] flex items-center justify-center">
        <p className="text-xs font-semibold text-[var(--foreground)]/60 text-center leading-tight px-2">
          성취 중독<br />순환 패턴
        </p>
      </div>

      {/* 순환 노드 6개 — 원형 배치 */}
      {ADDICTION_CYCLE.map((node, i) => {
        const angle = (i * 60 - 90) * (Math.PI / 180);
        const radius = 44;
        const left = 50 + radius * Math.cos(angle);
        const top = 50 + radius * Math.sin(angle);
        return (
          <div
            key={node.step}
            className="absolute flex flex-col items-center"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              transform: "translate(-50%, -50%)",
              width: "90px",
            }}
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-[var(--foreground)] bg-white text-sm font-bold text-[var(--foreground)] mb-1">
              {String(node.step).padStart(2, "0")}
            </span>
            <p className="text-[11px] font-semibold text-[var(--foreground)] text-center leading-tight">
              {node.title}
            </p>
            <p className="text-[9px] text-[var(--foreground)]/50 text-center leading-tight mt-0.5">
              {node.desc}
            </p>
          </div>
        );
      })}

      {/* 화살표 (CSS 원호 표현) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
      >
        {ADDICTION_CYCLE.map((_, i) => {
          const a1 = (i * 60 - 90 + 18) * (Math.PI / 180);
          const a2 = ((i + 1) * 60 - 90 - 18) * (Math.PI / 180);
          const r = 44;
          const x1 = 50 + r * Math.cos(a1);
          const y1 = 50 + r * Math.sin(a1);
          const x2 = 50 + r * Math.cos(a2);
          const y2 = 50 + r * Math.sin(a2);
          return (
            <g key={i}>
              <path
                d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke="var(--foreground)"
                strokeWidth="0.4"
                strokeDasharray="1.2 0.8"
                opacity="0.3"
              />
              {/* 화살촉 */}
              <circle
                cx={x2}
                cy={y2}
                r="0.8"
                fill="var(--foreground)"
                opacity="0.4"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
