"use client";

/**
 * Step 4 마무리 — 내면 파츠맵(관계 지도) 시각화.
 *
 * 유저가 보고한 답변에서 캐릭터화된 여러 마음을 SVG 관계 지도로 그린다.
 * - 리더(지금 가장 앞에 나서는 마음): 상단 중앙, accent 링으로 강조.
 * - 나머지 마음: 하단에 가로로 분산.
 * - 갈등(서로 자주 부딪치는 두 마음): 점선 + 번개 마크 (색이 아닌 *형태*로 강조 → 모노톤 규칙).
 *
 * IFS 용어 금지: "리더/갈등/부분" 대신 "지금 가장 앞에 나서는 마음",
 * "서로 자주 부딪치는 두 마음" 같은 자연어 라벨만 노출.
 */

import type { ReactNode } from "react";
import {
  Body,
  D,
  Headline,
  Mono,
  SectionHeader,
} from "@/components/self-workshop/clinical-report/v3-shared";
import type { PartsMap } from "@/lib/self-workshop/core-belief-excavation";

interface NodePos {
  id: string;
  cx: number;
  cy: number;
  isLeader: boolean;
}

const NODE_W = 104;
const NODE_H = 46;
const VB_H = 300;
const LEADER_Y = 66;
const OTHERS_Y = 226;

/**
 * 노드 좌표 배치(순수 함수). 리더는 상단 중앙, 나머지는 하단 한 줄에 균등 분산.
 * viewBox 폭은 나머지 마음 개수에 따라 가변.
 */
function layoutNodes(
  parts: PartsMap["parts"],
  leaderId: string
): { positions: NodePos[]; vbWidth: number } {
  const leader = parts.find((p) => p.id === leaderId) ?? parts[0];
  const others = parts.filter((p) => p.id !== leader.id);

  const vbWidth = Math.max(360, others.length * 128);
  const positions: NodePos[] = [
    { id: leader.id, cx: vbWidth / 2, cy: LEADER_Y, isLeader: true },
  ];

  const margin = NODE_W / 2 + 16;
  others.forEach((p, i) => {
    let cx: number;
    if (others.length === 1) {
      cx = vbWidth / 2;
    } else {
      const span = vbWidth - margin * 2;
      cx = margin + (span * i) / (others.length - 1);
    }
    positions.push({ id: p.id, cx, cy: OTHERS_Y, isLeader: false });
  });

  return { positions, vbWidth };
}

export function PartsRelationshipMap({ partsMap }: { partsMap: PartsMap }) {
  const { parts, leader_id, conflicts, summary } = partsMap;
  const { positions, vbWidth } = layoutNodes(parts, leader_id);
  const posById = new Map(positions.map((p) => [p.id, p]));
  const nameById = new Map(parts.map((p) => [p.id, p.name]));
  const leaderName = nameById.get(leader_id) ?? parts[0]?.name ?? "";

  return (
    <section className="space-y-5">
      <SectionHeader kicker="● 내 안의 마음들" rightLabel="INNER PARTS" accent />
      <Headline size="h3">내 안에는 여러 마음이 살고 있어요</Headline>
      {summary && (
        <Body muted small>
          {summary}
        </Body>
      )}

      {/* ── 관계 지도 SVG ── */}
      <div
        style={{
          marginTop: 8,
          padding: "22px 16px 18px",
          borderRadius: 22,
          background: D.bgAlt,
          border: `1px solid ${D.hair2}`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <Mono size={10} weight={500} color={D.text3} tracking={0.16}>
            FIG · 마음 관계 지도
          </Mono>
        </div>

        <svg
          viewBox={`0 0 ${vbWidth} ${VB_H}`}
          width="100%"
          style={{ display: "block", maxWidth: "100%", height: "auto" }}
          role="img"
          aria-label="내 안의 마음들 관계 지도"
        >
          {/* 갈등 엣지 — 점선 + 번개. 노드보다 먼저 그려 뒤에 깔리게. */}
          {conflicts.map((c, i) => {
            const a = posById.get(c.a);
            const b = posById.get(c.b);
            if (!a || !b) return null;
            const mx = (a.cx + b.cx) / 2;
            const my = (a.cy + b.cy) / 2;
            return (
              <g key={`edge-${i}`}>
                <line
                  x1={a.cx}
                  y1={a.cy}
                  x2={b.cx}
                  y2={b.cy}
                  stroke={D.text3}
                  strokeWidth={1.4}
                  strokeDasharray="4 5"
                />
                <Bolt cx={mx} cy={my} />
              </g>
            );
          })}

          {/* 리더 → 나머지 연결선(은은한 헤어라인, 소속감) */}
          {positions
            .filter((p) => !p.isLeader)
            .map((p) => {
              const leader = posById.get(leader_id);
              if (!leader) return null;
              return (
                <line
                  key={`link-${p.id}`}
                  x1={leader.cx}
                  y1={leader.cy + NODE_H / 2}
                  x2={p.cx}
                  y2={p.cy - NODE_H / 2}
                  stroke={D.hair}
                  strokeWidth={1}
                />
              );
            })}

          {/* 노드 */}
          {positions.map((p) => (
            <PartNode
              key={p.id}
              pos={p}
              name={nameById.get(p.id) ?? ""}
            />
          ))}
        </svg>

        {/* 범례 */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 18,
            marginTop: 10,
            flexWrap: "wrap",
          }}
        >
          <LegendItem>
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                borderRadius: 4,
                border: `2px solid ${D.accent}`,
              }}
            />
            지금 가장 앞에 나서는 마음
          </LegendItem>
          {conflicts.length > 0 && (
            <LegendItem>
              <svg width="22" height="12" aria-hidden>
                <line
                  x1="0"
                  y1="6"
                  x2="22"
                  y2="6"
                  stroke={D.text3}
                  strokeWidth="1.4"
                  strokeDasharray="4 5"
                />
              </svg>
              서로 자주 부딪치는 두 마음
            </LegendItem>
          )}
        </div>
      </div>

      {/* ── 갈등 설명 ── */}
      {conflicts.length > 0 && (
        <div className="space-y-2">
          <Mono size={10} weight={600} color={D.text2} tracking={0.16}>
            ● 서로 자주 부딪치는 마음
          </Mono>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {conflicts.map((c, i) => (
              <li
                key={`cf-${i}`}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "baseline",
                  padding: "8px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${D.hair3}`,
                }}
              >
                <span
                  style={{
                    fontFamily: D.font,
                    fontSize: 14,
                    fontWeight: 600,
                    color: D.ink,
                    whiteSpace: "nowrap",
                  }}
                >
                  {nameById.get(c.a)} <span style={{ color: D.text3 }}>↔</span>{" "}
                  {nameById.get(c.b)}
                </span>
                {c.reason && (
                  <span
                    style={{
                      fontFamily: D.font,
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      color: D.text2,
                    }}
                  >
                    {c.reason}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 파츠 캐릭터 카드 ── */}
      <div className="space-y-3">
        {parts.map((p) => (
          <article
            key={p.id}
            style={{
              border: `1px solid ${p.id === leader_id ? D.ink : D.hair}`,
              borderRadius: 16,
              background: D.paper,
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: D.font,
                  fontSize: 16,
                  fontWeight: 700,
                  color: D.ink,
                }}
              >
                {p.name}
              </span>
              {p.id === leader_id && (
                <span
                  style={{
                    fontFamily: D.mono,
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: D.accent,
                    border: `1px solid ${D.accent}`,
                    borderRadius: 999,
                    padding: "2px 8px",
                  }}
                >
                  지금 앞에 나선 마음
                </span>
              )}
            </div>

            {p.traits.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: p.catchphrase || p.evidence_quote ? 10 : 0,
                }}
              >
                {p.traits.map((t, ti) => (
                  <span
                    key={ti}
                    style={{
                      fontFamily: D.font,
                      fontSize: 12.5,
                      fontWeight: 500,
                      color: D.text2,
                      background: D.bgAlt,
                      borderRadius: 999,
                      padding: "3px 10px",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {p.catchphrase && (
              <p
                style={{
                  margin: "0 0 6px",
                  paddingLeft: 12,
                  borderLeft: `2px solid ${D.accent}`,
                  fontFamily: D.font,
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.5,
                  color: D.ink,
                }}
              >
                &ldquo;{p.catchphrase}&rdquo;
              </p>
            )}

            {p.evidence_quote && (
              <p
                style={{
                  margin: 0,
                  fontFamily: D.font,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: D.text3,
                }}
              >
                내 답에서: &ldquo;{p.evidence_quote}&rdquo;
              </p>
            )}
          </article>
        ))}
      </div>

      <Body muted small style={{ color: D.text3 }}>
        이 마음들은 진단이 아니라, 지금의 나를 비춰보는 하나의 그림이에요.
        {leaderName && ` 지금은 '${leaderName}'이(가) 가장 앞에 나서 있어요.`}
      </Body>
    </section>
  );
}

/* ─────────────────────────── SVG 노드 ─────────────────────────── */

function PartNode({ pos, name }: { pos: NodePos; name: string }) {
  const x = pos.cx - NODE_W / 2;
  const y = pos.cy - NODE_H / 2;
  return (
    <g>
      {/* 리더 강조용 바깥 점선 링 */}
      {pos.isLeader && (
        <rect
          x={x - 6}
          y={y - 6}
          width={NODE_W + 12}
          height={NODE_H + 12}
          rx={16}
          fill="none"
          stroke={D.accent}
          strokeWidth={1.2}
          strokeDasharray="2 4"
          opacity={0.7}
        />
      )}
      <rect
        x={x}
        y={y}
        width={NODE_W}
        height={NODE_H}
        rx={12}
        fill={D.paper}
        stroke={pos.isLeader ? D.accent : D.hair}
        strokeWidth={pos.isLeader ? 2.2 : 1.2}
      />
      <text
        x={pos.cx}
        y={pos.cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: D.font,
          fontSize: 13,
          fontWeight: pos.isLeader ? 700 : 600,
          fill: D.ink,
        }}
      >
        {name}
      </text>
    </g>
  );
}

/** 갈등 엣지 중앙의 손그림 번개 마크 (stroke-only). */
function Bolt({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`} aria-hidden>
      <circle r={11} fill={D.bgAlt} stroke={D.hair2} strokeWidth={1} />
      <path
        d="M1.5 -6 L-3 1 L0.5 1 L-1.5 6 L4 -1 L0.5 -1 Z"
        fill="none"
        stroke={D.ink}
        strokeWidth={1.3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  );
}

function LegendItem({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: D.font,
        fontSize: 12,
        color: D.text2,
      }}
    >
      {children}
    </span>
  );
}
