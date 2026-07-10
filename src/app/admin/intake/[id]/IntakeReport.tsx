"use client";

/**
 * 상담사용 분석 리포트 본문 (SPEC §7 = 핸드오프 §7-1 — 9섹션 순서 고정).
 *
 * 1 헤더(+위기/품질 경고) → 2 대표 판정 → 3 18도식 프로파일 차트 → 4 점수 상세 테이블
 * → 5 대표·보조 유형 지식카드 → 6 자동노트 → 7 SCT 원문 전문 → 8 Part A 원응답 부록 → 9 푸터 면책
 *
 * - 차트는 외부 라이브러리 없이 div width% 막대로 직접 렌더 (인쇄 호환).
 * - "PDF 저장"은 window.print — @media print 로 A4 최적화, 관리자 크롬은 print:hidden.
 * - 결과는 상담사 전용. 유저에게 절대 비노출.
 */

import type { IntakeSessionRow } from "@/lib/intake/store";
import type { Band, ChildTypeRef, SchemaScore } from "@/lib/intake/types";
import {
  PART_A_QUESTIONS,
  PART_C_QUESTIONS,
  SCALE_LABELS,
  SCHEMA_CODES,
} from "@/lib/intake/questions";
import { SCHEMA_MAP } from "@/lib/intake/schema-map";
import { TYPE_CARDS } from "@/lib/intake/type-cards";

/** 핸드오프 §7-1-9 면책 문구 — 그대로. 임의 수정 금지. */
const DISCLAIMER =
  "본 검사는 자기이해를 돕기 위한 자체 개발 도구로, 표준화된 심리검사가 아니며 진단 도구가 아닙니다. 해석과 활용은 상담 전문가의 판단을 따릅니다.";

/** low_elevation_profile 안내 문구 (핸드오프 §3-2-5). */
const LOW_ELEVATION_NOTE =
  "전반적으로 도식 활성이 낮은 프로파일. 방어적 응답 또는 실제 안정 가능성, 세션에서 확인 필요";

/** 밴드 라벨·막대 컬러 (모노톤 — high 진한 검정 / medium 회색 / low 옅음). */
const BAND_META: Record<Band, { label: string; barColor: string }> = {
  high: { label: "높음 (강한 활성)", barColor: "#191919" },
  medium: { label: "중간 활성", barColor: "#8a8a8a" },
  low: { label: "낮음", barColor: "#d9d9d9" },
};

/** 'YYYY.MM.DD HH:mm' (KST). */
function fmtDateTime(iso: string | null): string {
  if (!iso) return "–";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** 섹션 공통 래퍼 — 번호 + 제목. */
function Section({
  no,
  title,
  children,
}: {
  no: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 break-inside-avoid-page">
      <h2 className="mb-3 border-b-2 border-[var(--foreground)] pb-2 text-lg font-bold text-[var(--foreground)]">
        {no}. {title}
      </h2>
      {children}
    </section>
  );
}

/** 판정 유형 요약 한 줄 (이름 + 도식명 + mean). */
function ChildLine({ child, tag }: { child: ChildTypeRef; tag?: string }) {
  return (
    <p className="text-sm text-[var(--foreground)]">
      {tag && (
        <span className="mr-2 inline-block rounded-full border border-[var(--foreground)] px-2 py-0.5 text-[11px] font-bold">
          {tag}
        </span>
      )}
      <span className="text-base font-bold">{child.child_name}</span>
      <span className="ml-2 text-[var(--foreground)]/60">
        {child.schema_code} {child.schema_name} · {child.area} · mean{" "}
        <span className="tabular-nums font-semibold text-[var(--foreground)]">
          {child.mean.toFixed(2)}
        </span>
      </span>
    </p>
  );
}

/** 16유형 지식카드 1장 — TYPE_CARDS 데이터 전체 주입 (문구 그대로). */
function TypeCardBlock({ childId, roleLabel }: { childId: string; roleLabel: string }) {
  const card = TYPE_CARDS[childId];
  if (!card) return null;

  return (
    <div className="mb-4 break-inside-avoid rounded-2xl border-2 border-[var(--foreground)] bg-white px-6 py-5 last:mb-0">
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <span className="rounded-full border border-[var(--foreground)] px-2 py-0.5 text-[11px] font-bold text-[var(--foreground)]">
          {roleLabel}
        </span>
        <h3 className="text-lg font-bold text-[var(--foreground)]">
          {card.child_name}
        </h3>
        <span className="text-xs text-[var(--foreground)]/55">
          {card.schema_code} {card.schema_name}
        </span>
      </div>
      <p className="mb-3 text-sm text-[var(--foreground)]/80">{card.one_line}</p>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="font-semibold text-[var(--foreground)]/60">핵심신념</dt>
          <dd className="text-[var(--foreground)]">{card.core_belief}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--foreground)]/60">내면의 목소리</dt>
          <dd className="text-[var(--foreground)]">{card.inner_voice}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--foreground)]/60">특징</dt>
          <dd className="text-[var(--foreground)]">{card.traits}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--foreground)]/60">활성화 트리거</dt>
          <dd className="text-[var(--foreground)]">{card.triggers}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--foreground)]/60">대처 발현</dt>
          <dd className="text-[var(--foreground)]">
            <ul className="mt-1 space-y-0.5">
              <li>
                <span className="font-semibold">굴복</span> — {card.coping.surrender}
              </li>
              <li>
                <span className="font-semibold">회피</span> — {card.coping.avoidance}
              </li>
              <li>
                <span className="font-semibold">과잉보상</span> —{" "}
                {card.coping.overcompensation}
              </li>
            </ul>
          </dd>
        </div>
        {card.special_note && (
          <div>
            <dt className="font-semibold text-[var(--foreground)]/60">특수 노트</dt>
            <dd className="text-[var(--foreground)]">{card.special_note}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export default function IntakeReport({ session }: { session: IntakeSessionRow }) {
  const { responses, result } = session;

  // 미완료 세션 — 리포트 없음 안내만.
  if (!responses || !result) {
    return (
      <div className="rounded-2xl border-2 border-[var(--foreground)]/15 bg-white px-6 py-16 text-center">
        <p className="text-lg font-bold text-[var(--foreground)]">
          아직 검사 미완료
        </p>
        <p className="mt-2 text-sm text-[var(--foreground)]/60">
          {session.display_name} 님이 검사를 제출하면 이 화면에 상담사 리포트가
          생성됩니다. (현재 상태: {session.status})
        </p>
      </div>
    );
  }

  // 지식카드 대상: 공동대표(있으면 전체) → primary → secondary 순, child_id 중복 제거.
  const cardRefs: { child: ChildTypeRef; role: string }[] = [];
  const seen = new Set<string>();
  const pushCard = (child: ChildTypeRef, role: string) => {
    if (seen.has(child.child_id)) return;
    seen.add(child.child_id);
    cardRefs.push({ child, role });
  };
  if (result.co_primary && result.co_primary.length > 0) {
    result.co_primary.forEach((c) => pushCard(c, "공동대표"));
  } else {
    pushCard(result.primary_child, "대표");
  }
  result.secondary_children.forEach((c, i) => pushCard(c, `보조 ${i + 1}`));

  // 크리시스 매칭 SCT 문항 집합 (섹션 7 강조용).
  const crisisItems = new Set((result.crisis_hits ?? []).map((h) => h.item));

  // 차트·테이블은 채점 산출물의 mean 내림차순 정렬을 그대로 사용.
  const scores: SchemaScore[] = result.schema_scores;
  const scoreByCode = new Map(scores.map((s) => [s.code, s]));

  return (
    <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white px-8 py-8 print:rounded-none print:border-0 print:px-0 print:py-0">
      {/* 인쇄 최적화 (A4) — 배경색·막대 컬러 보존 */}
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          .intake-report, .intake-report * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="intake-report">
        {/* 인쇄/PDF 저장 버튼 — 인쇄물에는 미포함 */}
        <div className="mb-6 flex justify-end print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-85"
          >
            인쇄 / PDF 저장
          </button>
        </div>

        {/* ── 1. 헤더 ───────────────────────────────────────────── */}
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
            내면 아이 상담 진단 — 상담사용 분석 리포트 (intake_v1)
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)]">
            {session.display_name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--foreground)]/65">
            <span>
              검사 완료:{" "}
              <span className="tabular-nums">{fmtDateTime(session.completed_at)}</span>
            </span>
            <span>
              세션 예정일:{" "}
              <span className="tabular-nums">{session.session_date ?? "–"}</span>
            </span>
            {session.memo && <span>메모: {session.memo}</span>}
          </div>

          {/* 위기 경고 박스 — 안전 신호이므로 예외적으로 붉은 계열 */}
          {result.crisis_flag && (
            <div className="mt-4 rounded-xl border-2 border-red-500 bg-red-50 px-5 py-4">
              <p className="text-sm font-bold text-red-700">
                자·타해 위기 신호 감지 — 세션 시작 시 안전 확인을 최우선으로
                진행하고, 필요 시 전문기관 연계를 안내하세요.
              </p>
              {(result.crisis_hits ?? []).length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-red-700">
                  {(result.crisis_hits ?? []).map((h) => (
                    <li key={h.item}>
                      <span className="font-semibold">{h.item}</span> — “{h.text}”
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 응답 품질 주의 박스 (모노톤 회색) */}
          {result.quality_flag && (
            <div className="mt-3 rounded-xl border-2 border-[var(--foreground)]/25 bg-[var(--foreground)]/5 px-5 py-3">
              <p className="text-sm font-semibold text-[var(--foreground)]/70">
                응답 품질 주의 — 일률 응답(straight-lining) 또는 지나치게 짧은
                응답 시간이 의심됩니다. 점수 해석에 유의하세요.
              </p>
            </div>
          )}
        </header>

        {/* ── 2. 대표 판정 ──────────────────────────────────────── */}
        <Section no={2} title="대표 판정">
          <div className="space-y-3 rounded-xl border border-[var(--foreground)]/15 px-5 py-4">
            {result.co_primary && result.co_primary.length > 0 ? (
              <>
                {result.co_primary.map((c) => (
                  <ChildLine key={c.child_id} child={c} tag="공동대표" />
                ))}
                <p className="text-xs text-[var(--foreground)]/55">
                  mean·high_response_count 완전 동률 — 세션에서 상담사가 확정하세요.
                </p>
              </>
            ) : (
              <ChildLine child={result.primary_child} tag="대표" />
            )}
            {result.secondary_children.map((c, i) => (
              <ChildLine key={c.child_id} child={c} tag={`보조 ${i + 1}`} />
            ))}
            <p className="border-t border-[var(--foreground)]/10 pt-3 text-sm text-[var(--foreground)]">
              <span className="mr-2 inline-block rounded-full border border-[var(--foreground)] px-2 py-0.5 text-[11px] font-bold">
                지킴이
              </span>
              <span className="font-bold">{result.guardian.label}</span>
              <span className="ml-2 text-[var(--foreground)]/55">
                (P1~P3 응답: {result.guardian.answers.join(" / ")})
              </span>
            </p>
            {result.low_elevation_profile && (
              <p className="rounded-lg border border-[var(--foreground)]/20 bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)]/70">
                {LOW_ELEVATION_NOTE}
              </p>
            )}
          </div>
        </Section>

        {/* ── 3. 18도식 프로파일 차트 ──────────────────────────── */}
        <Section no={3} title="18개 도식 프로파일 (mean 내림차순)">
          <div className="space-y-1.5">
            {scores.map((s) => {
              const entry = SCHEMA_MAP[s.code];
              const meta = BAND_META[s.band];
              const widthPct = (s.mean / 6) * 100;
              return (
                <div key={s.code} className="flex items-center gap-3">
                  <span className="w-52 shrink-0 truncate text-xs text-[var(--foreground)]">
                    <span className="tabular-nums text-[var(--foreground)]/45">
                      {s.code}
                    </span>{" "}
                    {entry.schema_name}
                    {s.is_auxiliary && (
                      <span className="ml-1 rounded border border-[var(--foreground)]/30 px-1 text-[10px] font-semibold text-[var(--foreground)]/50">
                        보조
                      </span>
                    )}
                  </span>
                  <div className="h-4 flex-1 rounded-sm border border-[var(--foreground)]/15 bg-white">
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: meta.barColor,
                        // 보조 지표는 옅게 + 점선 테두리로 구분
                        opacity: s.is_auxiliary ? 0.55 : 1,
                        outline: s.is_auxiliary ? "1px dashed #191919" : undefined,
                        outlineOffset: s.is_auxiliary ? "-1px" : undefined,
                      }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-[var(--foreground)]">
                    {s.mean.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-[var(--foreground)]/50">
            밴드: 높음 mean ≥ 4.50 (진한 막대) · 중간 3.50 ≤ mean &lt; 4.50 (회색) ·
            낮음 mean &lt; 3.50 (옅음) / 점선 막대 = 보조 지표(S15·S18, 유형 판정
            제외)
          </p>
        </Section>

        {/* ── 4. 점수 상세 테이블 ──────────────────────────────── */}
        <Section no={4} title="점수 상세">
          <div className="overflow-x-auto rounded-xl border border-[var(--foreground)]/15">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--foreground)]/15 text-left text-[11px] uppercase tracking-wider text-[var(--foreground)]/40">
                  <th className="px-3 py-2 font-semibold">코드</th>
                  <th className="px-3 py-2 font-semibold">도식명</th>
                  <th className="px-3 py-2 text-right font-semibold">mean</th>
                  <th className="px-3 py-2 text-right font-semibold">5점 이상 응답</th>
                  <th className="px-3 py-2 font-semibold">밴드</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s) => {
                  const entry = SCHEMA_MAP[s.code];
                  return (
                    <tr
                      key={s.code}
                      className="border-b border-[var(--foreground)]/5 last:border-0"
                    >
                      <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-[var(--foreground)]/55">
                        {s.code}
                      </td>
                      <td className="px-3 py-1.5 text-[var(--foreground)]">
                        {entry.schema_name}
                        {s.is_auxiliary && (
                          <span className="ml-1.5 rounded border border-[var(--foreground)]/30 px-1 text-[10px] font-semibold text-[var(--foreground)]/50">
                            보조
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-3 py-1.5 text-right tabular-nums ${
                          s.band === "high"
                            ? "font-bold text-[var(--foreground)]"
                            : "text-[var(--foreground)]/75"
                        }`}
                      >
                        {s.mean.toFixed(2)}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[var(--foreground)]/75">
                        {s.high_response_count} / 4
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-[var(--foreground)]/75">
                        {BAND_META[s.band].label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── 5. 대표·보조 유형 지식카드 ───────────────────────── */}
        <Section no={5} title="대표·보조 유형 지식 카드">
          {cardRefs.map(({ child, role }) => (
            <TypeCardBlock key={child.child_id} childId={child.child_id} roleLabel={role} />
          ))}
        </Section>

        {/* ── 6. 자동 노트 ─────────────────────────────────────── */}
        <Section no={6} title="자동 노트 (보조 지표 규칙)">
          {result.auto_notes.length === 0 ? (
            <p className="text-sm text-[var(--foreground)]/50">해당 없음</p>
          ) : (
            <ul className="space-y-2">
              {result.auto_notes.map((n) => (
                <li
                  key={n.code}
                  className="rounded-xl border border-[var(--foreground)]/20 bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]"
                >
                  <span className="mr-2 rounded border border-[var(--foreground)]/30 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--foreground)]/55">
                    {n.code}
                  </span>
                  {n.text}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ── 7. SCT 원문 전문 ─────────────────────────────────── */}
        <Section no={7} title="문장완성검사(SCT) 원문 전문">
          <p className="mb-3 text-xs text-[var(--foreground)]/50">
            응답 원문 그대로 — 편집·요약 없음. 붉은 표시 = 위기 키워드 매칭 문항.
          </p>
          <div className="space-y-3">
            {PART_C_QUESTIONS.map((q) => {
              const isCrisis = crisisItems.has(q.item_id);
              const answer = responses.partC?.[q.item_id] ?? "";
              return (
                <div
                  key={q.item_id}
                  className={`rounded-xl border px-4 py-3 ${
                    isCrisis
                      ? "border-2 border-red-500 bg-red-50"
                      : "border-[var(--foreground)]/15 bg-white"
                  }`}
                >
                  <p className="text-xs font-semibold text-[var(--foreground)]/55">
                    {q.item_id}. {q.text}
                    {isCrisis && (
                      <span className="ml-2 rounded-full border border-red-500 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        위기 키워드
                      </span>
                    )}
                  </p>
                  <p
                    className={`mt-1 whitespace-pre-wrap text-sm ${
                      isCrisis ? "font-semibold text-red-800" : "text-[var(--foreground)]"
                    }`}
                  >
                    {answer || <span className="text-[var(--foreground)]/30">(무응답)</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── 8. Part A 원응답 부록 ────────────────────────────── */}
        <Section no={8} title="Part A 원응답 부록 (도식별 그룹)">
          <p className="mb-3 text-xs text-[var(--foreground)]/50">
            세션에서 개별 문항 응답을 인용할 수 있도록 문항 전문과 응답값을
            도식별로 정리했습니다.
          </p>
          <div className="space-y-4">
            {SCHEMA_CODES.map((code) => {
              const entry = SCHEMA_MAP[code];
              const score = scoreByCode.get(code);
              const items = PART_A_QUESTIONS.filter((q) => q.schema_code === code);
              return (
                <div
                  key={code}
                  className="break-inside-avoid rounded-xl border border-[var(--foreground)]/15"
                >
                  <div className="flex flex-wrap items-baseline gap-2 border-b border-[var(--foreground)]/10 bg-[var(--surface)] px-4 py-2">
                    <span className="text-sm font-bold text-[var(--foreground)]">
                      {code} {entry.schema_name}
                    </span>
                    {entry.is_auxiliary && (
                      <span className="rounded border border-[var(--foreground)]/30 px-1 text-[10px] font-semibold text-[var(--foreground)]/50">
                        보조
                      </span>
                    )}
                    {score && (
                      <span className="text-xs tabular-nums text-[var(--foreground)]/55">
                        mean {score.mean.toFixed(2)} · {BAND_META[score.band].label}
                      </span>
                    )}
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {items.map((q) => {
                        const v = responses.partA?.[q.item_id];
                        return (
                          <tr
                            key={q.item_id}
                            className="border-b border-[var(--foreground)]/5 last:border-0"
                          >
                            <td className="w-16 whitespace-nowrap px-4 py-1.5 align-top text-xs tabular-nums text-[var(--foreground)]/45">
                              {q.item_id}
                            </td>
                            <td className="px-2 py-1.5 text-[var(--foreground)]/85">
                              {q.text}
                            </td>
                            <td className="w-40 whitespace-nowrap px-4 py-1.5 text-right align-top">
                              {v != null ? (
                                <>
                                  <span
                                    className={`tabular-nums ${
                                      v >= 5
                                        ? "font-bold text-[var(--foreground)]"
                                        : "text-[var(--foreground)]/75"
                                    }`}
                                  >
                                    {v}
                                  </span>
                                  <span className="ml-1.5 text-[11px] text-[var(--foreground)]/50">
                                    {SCALE_LABELS[v]}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[var(--foreground)]/30">–</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── 9. 푸터 면책 ─────────────────────────────────────── */}
        <footer className="mt-10 border-t-2 border-[var(--foreground)] pt-4">
          <p className="text-xs leading-relaxed text-[var(--foreground)]/60">
            {DISCLAIMER}
          </p>
        </footer>
      </div>
    </div>
  );
}
