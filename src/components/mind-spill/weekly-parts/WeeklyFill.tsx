"use client";

import { useState } from "react";
import type {
  Action,
  Classification,
  Moment,
  Workbook,
  WorkbookPatch,
} from "@/lib/mind-spill/types";

type Props = { wb: Workbook; onPatch: (p: WorkbookPatch) => void };
type SimpleBucket = "controllable" | "uncontrollable";

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function PartTwoFill({ wb, onPatch }: Props) {
  return (
    <>
      <FactCheckStep wb={wb} onPatch={onPatch} />
      <ControlStep wb={wb} onPatch={onPatch} />
      <ActionStep wb={wb} onPatch={onPatch} />
      <StrengthsStep wb={wb} onPatch={onPatch} />
    </>
  );
}

/* ============= iv. Fact Check (사실/생각) =============
 *
 * Brain Dump 의 세 카테고리 중 fact/thought 분류가 의미 있는 것은
 *   - recurring   (자주 떠오른 생각)
 *   - discomfort  (불편하게 만든 생각)
 * todos 는 자명한 사실(할 일)이라 이 단계에서는 보여주지 않고,
 * ControlStep 에 자동으로 사실로 들어간다.
 */

function FactCheckStep({ wb, onPatch }: Props) {
  const checkableBd = [
    ...wb.brain_dump.recurring,
    ...wb.brain_dump.discomfort,
  ].filter((b) => b.text.trim().length > 0);
  const todosCount = (wb.brain_dump.todos ?? []).filter(
    (b) => b.text.trim().length > 0
  ).length;

  const classification = wb.classification ?? {
    controllable: [],
    influenceable: [],
    uncontrollable: [],
    fact_check: {},
  };
  const factCheck = classification.fact_check ?? {};

  function setFlag(id: string, flag: "fact" | "thought" | null) {
    const next: Record<string, "fact" | "thought"> = { ...factCheck };
    if (flag === null) {
      delete next[id];
    } else {
      next[id] = flag;
    }
    // 생각으로 바뀌면 통제권 분류에서 자동 제거.
    let cleaned = classification;
    if (flag !== "fact") {
      cleaned = {
        ...classification,
        controllable: (classification.controllable ?? []).filter((x) => x !== id),
        influenceable: (classification.influenceable ?? []).filter((x) => x !== id),
        uncontrollable: (classification.uncontrollable ?? []).filter((x) => x !== id),
      };
    }
    onPatch({ classification: { ...cleaned, fact_check: next } });
  }

  const factCount = checkableBd.filter((b) => factCheck[b.id] === "fact").length;
  const thoughtCount = checkableBd.filter(
    (b) => factCheck[b.id] === "thought"
  ).length;
  const unsetCount = checkableBd.length - factCount - thoughtCount;

  return (
    <section className="ms-step" style={{ borderTop: "none", paddingTop: 0 }}>
      <div className="ms-step-header">
        <div className="ms-step-num">iv.</div>
        <h2 className="ms-step-title">사실인가, 생각인가</h2>
      </div>
      <p className="ms-step-intro">
        통제권을 나누기 전에 먼저 한 번 분류합니다. 사실(실제로 일어났거나 일어날 일)과
        생각(아직 일어나지 않은 해석·추측)을 구분해두면, 다음 단계가 훨씬 명확해집니다.
        <br />
        <span style={{ color: "var(--ms-ink-3)", fontSize: 13 }}>
          &quot;불안하다&quot; 처럼 감정·신체 상태는 그 자체로 사실이에요 — 생각이 아니라
          지금 내가 겪는 일.
        </span>
      </p>

      {checkableBd.length === 0 && todosCount === 0 ? (
        <div className="ms-ctrl-empty">
          비우기에서 Brain Dump를 먼저 적어주세요.
        </div>
      ) : (
        <>
          {checkableBd.length === 0 ? (
            <div className="ms-thought-note" style={{ marginTop: 0 }}>
              <div className="ms-mono" style={{ color: "var(--ms-ink-2)" }}>
                분류할 항목이 없어요
              </div>
              <p>
                Brain Dump 의 &lt;recurring&gt; · &lt;discomfort&gt; 에 적은
                내용만 사실/생각으로 나눕니다. 할 일(to-do)은 자명한 사실이라
                다음 단계로 자동 넘어갔어요{todosCount > 0 && ` (${todosCount}개)`}.
              </p>
            </div>
          ) : (
            <>
              <div className="ms-fact-meta">
                <span>
                  <span className="dot" style={{ background: "var(--ms-ink)" }} />{" "}
                  사실 {factCount}
                </span>
                <span>
                  <span
                    className="dot"
                    style={{ background: "var(--ms-accent)" }}
                  />{" "}
                  생각 {thoughtCount}
                </span>
                <span>
                  <span
                    className="dot"
                    style={{ background: "var(--ms-ink-4)" }}
                  />{" "}
                  미분류 {unsetCount}
                </span>
              </div>

              {todosCount > 0 && (
                <p
                  className="ms-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ms-ink-3)",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  할 일 {todosCount}개는 자명한 사실 — 다음 단계로 자동 이동
                </p>
              )}

              <div className="ms-fact-list">
                {checkableBd.map((b) => {
              const flag = factCheck[b.id] ?? null;
              return (
                <div
                  key={b.id}
                  className={`ms-fact-item ${
                    flag === "fact"
                      ? "is-fact"
                      : flag === "thought"
                        ? "is-thought"
                        : ""
                  }`}
                >
                  <span className="ms-bd-badge">BD</span>
                  <span className="ms-fact-text">{b.text}</span>
                  <div className="ms-fact-buttons">
                    <button
                      type="button"
                      className={`ms-ctrl-btn ${flag === "fact" ? "active" : ""}`}
                      onClick={() =>
                        setFlag(b.id, flag === "fact" ? null : "fact")
                      }
                      aria-pressed={flag === "fact"}
                    >
                      사실
                    </button>
                    <button
                      type="button"
                      className={`ms-ctrl-btn ${flag === "thought" ? "active" : ""}`}
                      onClick={() =>
                        setFlag(b.id, flag === "thought" ? null : "thought")
                      }
                      aria-pressed={flag === "thought"}
                    >
                      생각
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

              {thoughtCount > 0 && (
                <div className="ms-thought-note">
                  <div className="ms-mono" style={{ color: "var(--ms-accent)" }}>
                    생각으로 표시한 {thoughtCount}개
                  </div>
                  <p>
                    이 항목들은 아직 검증되지 않은 해석에 가까울 수 있어요.
                    iii. 거울 리포트의 <b>인지 오류</b> 와 <b>생각의 전환</b> 을
                    함께 다시 살펴봐 주세요.
                  </p>
                </div>
              )}
            </>
          )}

          {/* 다음 단계 CTA — 사실에 집중 */}
          {(factCount > 0 || todosCount > 0) && (
            <a href="#part-two-control" className="ms-next-step">
              <div className="ms-next-step-meta">
                <span className="ms-next-step-eyebrow">
                  NEXT — v. 통제권으로 나누기
                </span>
                <span className="ms-next-step-title">
                  이제 생각이 아닌 <b>사실</b> 에 집중해봐요.
                  <br />
                  사실인 것들을 더 가볍게 만들어가는 게 다음 단계예요.
                </span>
              </div>
              <span className="ms-next-step-arrow">↓</span>
            </a>
          )}
        </>
      )}
    </section>
  );
}

/* ============= v. Control Classification (사실만) =============
 *
 * 두 가지로 단순화:
 *   A. 내가 할 수 있는 것 (직접 행동 + 영향 줄 수 있음)  ← 이전 controllable+influenceable
 *   B. 내가 통제할 수 없는 것 (외부 사건 + 감정·신체 상태)  ← 이전 uncontrollable
 *
 * DB의 influenceable 컬럼은 비워 유지(이전 데이터 호환). 새로 들어오는 분류는
 * controllable 또는 uncontrollable 둘 중 하나만.
 */

function ControlStep({ wb, onPatch }: Props) {
  const classification = wb.classification ?? {
    controllable: [],
    influenceable: [],
    uncontrollable: [],
    fact_check: {},
  };
  const factCheck = classification.fact_check ?? {};

  // 통제권 분류 대상:
  //   - recurring/discomfort: 사용자가 "사실"로 표시한 것만
  //   - todos: 자명한 사실(할 일)이라 자동 포함
  const allBd = [
    ...wb.brain_dump.recurring.filter((b) => factCheck[b.id] === "fact"),
    ...wb.brain_dump.discomfort.filter((b) => factCheck[b.id] === "fact"),
    ...wb.brain_dump.todos,
  ].filter((b) => b.text.trim().length > 0);

  // released 토글은 Closing 의 02. 내려놓은 것들에서 처리 — 여기선 분류만.

  // 이전 데이터의 influenceable 은 controllable 로 자동 마이그레이션해서 표시.
  // (DB 갱신은 다음 분류 변경 시 함께 처리)
  const mergedControllable = Array.from(
    new Set([
      ...(classification.controllable ?? []),
      ...(classification.influenceable ?? []),
    ])
  );

  function bucketOf(id: string): SimpleBucket | null {
    if (mergedControllable.includes(id)) return "controllable";
    if (classification.uncontrollable?.includes(id)) return "uncontrollable";
    return null;
  }
  function setBucket(id: string, b: SimpleBucket | null) {
    const baseControllable = mergedControllable.filter((x) => x !== id);
    const baseUncontrollable = (classification.uncontrollable ?? []).filter(
      (x) => x !== id
    );
    const cleaned: Classification = {
      controllable: baseControllable,
      influenceable: [], // 더 이상 사용 안 함
      uncontrollable: baseUncontrollable,
      fact_check: classification.fact_check,
    };
    if (b === "controllable") cleaned.controllable = [...baseControllable, id];
    if (b === "uncontrollable") cleaned.uncontrollable = [...baseUncontrollable, id];
    onPatch({ classification: cleaned });
  }

  const groups: Array<{
    bucket: SimpleBucket;
    klass: string;
    name: string;
    tag: string;
    desc: string;
    items: typeof allBd;
  }> = [
    {
      bucket: "controllable",
      klass: "a",
      name: "A. 내가 할 수 있는 것",
      tag: "— I can",
      desc:
        "내가 직접 행동을 바꾸거나, 상황에 입력을 보낼 수 있는 영역. " +
        "결과 100%를 결정 못 해도, 한 걸음은 둘 수 있는 것들.",
      items: allBd.filter((b) => mergedControllable.includes(b.id)),
    },
    {
      bucket: "uncontrollable",
      klass: "b",
      name: "B. 내가 통제할 수 없는 것",
      tag: "— let be",
      desc:
        "외부에서 결정되거나, 감정·신체 상태처럼 직접 바꿀 수 없는 영역. " +
        "받아들이거나 잠시 놓아두는 게 답인 것들. \"불안하다\"·\"어깨가 결린다\" 같은 것도 여기.",
      items: allBd.filter((b) =>
        classification.uncontrollable?.includes(b.id)
      ),
    },
  ];

  const unclassified = allBd.filter((b) => bucketOf(b.id) === null);

  return (
    <section
      id="part-two-control"
      className="ms-step"
      style={{ scrollMarginTop: 64 }}
    >
      <div className="ms-step-header">
        <div className="ms-step-num">v.</div>
        <h2 className="ms-step-title">통제권으로 나눕니다</h2>
      </div>
      <p className="ms-step-intro">
        앞에서 <b>사실</b> 로 표시한 항목만 여기로 옵니다. 두 가지로 분류해주세요.
        이 분류만으로도 머릿속의 무게가 절반으로 줄어듭니다.
      </p>

      {/* A/B 의미 안내 */}
      <div className="ms-bucket-guide">
        <div className="ms-bucket-guide-item a">
          <div className="ms-bucket-guide-letter">A</div>
          <div>
            <div className="ms-bucket-guide-name">내가 할 수 있는 것</div>
            <div className="ms-bucket-guide-desc">
              직접 행동을 바꾸거나, 상황에 입력을 보낼 수 있는 영역.
              결과 100%를 결정 못 해도 한 걸음은 둘 수 있는 것들.
            </div>
          </div>
        </div>
        <div className="ms-bucket-guide-item b">
          <div className="ms-bucket-guide-letter">B</div>
          <div>
            <div className="ms-bucket-guide-name">내가 통제할 수 없는 것</div>
            <div className="ms-bucket-guide-desc">
              외부에서 결정되거나, 감정·신체 상태처럼 직접 바꿀 수 없는 영역.
              받아들이거나 잠시 놓아두는 게 답인 것들.
            </div>
          </div>
        </div>
      </div>

      {allBd.length === 0 ? (
        <div className="ms-ctrl-empty">
          아직 <b>사실</b> 로 표시한 항목이 없어요. iv. 단계에서 먼저 사실/생각을
          나눠주세요.
        </div>
      ) : (
        <div className="ms-ctrl-grid">
          {unclassified.length > 0 && (
            <div className="ms-ctrl-box">
              <div className="ms-ctrl-head">
                <div className="name">
                  분류 대기 <span className="tag">— unsorted</span>
                </div>
                <div className="count">{unclassified.length}</div>
              </div>
              <p className="ms-ctrl-desc">A · B 중에 하나를 골라주세요.</p>
              <div className="ms-ctrl-items">
                {unclassified.map((b) => (
                  <BdRow
                    key={b.id}
                    text={b.text}
                    currentBucket={null}
                    onSetBucket={(bk) => setBucket(b.id, bk)}
                  />
                ))}
              </div>
            </div>
          )}

          {groups.map((g) => (
            <div className={`ms-ctrl-box ${g.klass}`} key={g.bucket}>
              <div className="ms-ctrl-head">
                <div className="name">
                  {g.name} <span className="tag">{g.tag}</span>
                </div>
                <div className="count">{g.items.length}</div>
              </div>
              <p className="ms-ctrl-desc">{g.desc}</p>
              <div className="ms-ctrl-items">
                {g.items.length === 0 ? (
                  <div className="ms-ctrl-empty">아직 없음</div>
                ) : (
                  g.items.map((b) => (
                    <BdRow
                      key={b.id}
                      text={b.text}
                      currentBucket={g.bucket}
                      onSetBucket={(bk) => setBucket(b.id, bk)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BdRow({
  text,
  currentBucket,
  onSetBucket,
}: {
  text: string;
  currentBucket: SimpleBucket | null;
  onSetBucket: (b: SimpleBucket | null) => void;
}) {
  return (
    <div className="ms-ctrl-item">
      <span className="ms-bd-badge">BD</span>
      <span className="text">{text}</span>
      <div className="ms-ctrl-buttons">
        {(
          [
            ["controllable", "A · 할 수 있는 것"],
            ["uncontrollable", "B · 통제할 수 없는 것"],
          ] as const
        ).map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={`ms-ctrl-btn ${currentBucket === key ? "active" : ""}`}
            onClick={() => onSetBucket(currentBucket === key ? null : key)}
            aria-pressed={currentBucket === key}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============= v. Action Design ============= */

function ActionStep({ wb, onPatch }: Props) {
  const actions = wb.actions ?? [];
  // ControlStep 과 동일한 통합 규칙 — 옛 influenceable 항목도 controllable 로 합침.
  const controllableIds = Array.from(
    new Set([
      ...(wb.classification?.controllable ?? []),
      ...(wb.classification?.influenceable ?? []),
    ])
  );
  const allBd = [
    ...wb.brain_dump.recurring,
    ...wb.brain_dump.discomfort,
    ...wb.brain_dump.todos,
  ];
  const bdText = (id: string | null) =>
    id ? allBd.find((b) => b.id === id)?.text ?? "(삭제된 항목)" : "";

  function add() {
    const targetId =
      controllableIds.find((id) => !actions.some((a) => a.target_bd_id === id)) ??
      controllableIds[0] ??
      null;
    onPatch({
      actions: [
        ...actions,
        {
          id: makeId("act"),
          target_bd_id: targetId,
          goal: "",
          first_step: "",
          when: "",
          where: "",
          if_then: "",
          completed: false,
        },
      ],
    });
  }
  function update(id: string, p: Partial<Action>) {
    onPatch({ actions: actions.map((a) => (a.id === id ? { ...a, ...p } : a)) });
  }
  function remove(id: string) {
    onPatch({ actions: actions.filter((a) => a.id !== id) });
  }

  return (
    <section className="ms-step">
      <div className="ms-step-header">
        <div className="ms-step-num">vi.</div>
        <h2 className="ms-step-title">할 수 있는 행동을 설계합니다</h2>
      </div>
      <p className="ms-step-intro">
        통제 가능한 항목 중 1–3개를 고르세요. 욕심내면 실패합니다. 시작은 24시간 안에.
      </p>

      {actions.map((a, idx) => (
        <div className="ms-action-card" key={a.id}>
          <div className="ms-action-card-num">
            action {String(idx + 1).padStart(2, "0")}
          </div>
          <button
            type="button"
            className="ms-action-card-del"
            onClick={() => remove(a.id)}
          >
            삭제
          </button>

          <div className="ms-action-target">
            <span className="ms-bd-badge">BD</span>
            {controllableIds.length === 0 ? (
              <span style={{ flex: 1, color: "var(--ms-ink-3)" }}>
                통제 가능 항목(A)이 없어요. iv. 단계에서 분류해주세요.
              </span>
            ) : (
              <select
                value={a.target_bd_id ?? ""}
                onChange={(e) =>
                  update(a.id, { target_bd_id: e.target.value || null })
                }
                aria-label="대상 BD 항목"
              >
                <option value="">— 선택</option>
                {controllableIds.map((id) => (
                  <option key={id} value={id}>
                    {bdText(id)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="ms-grow-grid">
            <div className="ms-grow-field">
              <label>
                <span className="num">G.</span>
                원하는 결과 — Goal
              </label>
              <input
                className="ms-grow-input"
                type="text"
                value={a.goal}
                onChange={(e) => update(a.id, { goal: e.target.value })}
                placeholder="가까운 시간 안에 도달하고 싶은 모습"
              />
            </div>
            <div className="ms-grow-field">
              <label>
                <span className="num">R.</span>
                가장 작은 첫걸음 — first step
              </label>
              <input
                className="ms-grow-input"
                type="text"
                value={a.first_step}
                onChange={(e) => update(a.id, { first_step: e.target.value })}
                placeholder="가장 작게 시작할 수 있는 한 가지"
              />
            </div>
            <div className="ms-grow-row">
              <div className="ms-grow-field">
                <label>
                  <span className="num">W.</span>
                  언제
                </label>
                <input
                  className="ms-grow-input"
                  type="text"
                  value={a.when}
                  onChange={(e) => update(a.id, { when: e.target.value })}
                  placeholder="목/오전/퇴근 후"
                />
              </div>
              <div className="ms-grow-field">
                <label>
                  <span className="num">W.</span>
                  어디서
                </label>
                <input
                  className="ms-grow-input"
                  type="text"
                  value={a.where}
                  onChange={(e) => update(a.id, { where: e.target.value })}
                  placeholder="책상/카페/방"
                />
              </div>
            </div>
            <div className="ms-grow-field">
              <label>
                <span className="num">If.</span>
                이 방법이 안 되면
              </label>
              <input
                className="ms-grow-input"
                type="text"
                value={a.if_then}
                onChange={(e) => update(a.id, { if_then: e.target.value })}
                placeholder="이때 시도할 다른 방법 — 예: 30분 못 내면 5분만이라도 앉는다"
              />
            </div>
          </div>
        </div>
      ))}

      {actions.length < 5 && (
        <button type="button" className="ms-bd-add" onClick={add}>
          + 액션 카드 추가
        </button>
      )}
    </section>
  );
}

/* ============= vi. Strengths / Moments ============= */

function StrengthsStep({ wb, onPatch }: Props) {
  const moments = wb.moments ?? [];

  // LLM 강점 분석 트리거
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  // 서버 응답으로 받은 strengths_report 의 클라이언트 캐시
  // (workbook PATCH 자동저장 대상이 아니라서 별도 상태로 보유).
  const [localReport, setLocalReport] = useState(wb.strengths_report);
  const report = localReport ?? wb.strengths_report;

  // 분석할 가치 있는 모먼트 있는지
  const writtenCount = moments.filter(
    (m) =>
      m.title.trim().length > 0 ||
      m.experience.trim().length > 0 ||
      (m.reason ?? "").trim().length > 0
  ).length;
  const hasAnyLLMResult = !!report?.narrative;

  function update(id: string, p: Partial<Moment>) {
    onPatch({ moments: moments.map((m) => (m.id === id ? { ...m, ...p } : m)) });
  }
  function remove(id: string) {
    onPatch({ moments: moments.filter((m) => m.id !== id) });
  }
  function add() {
    onPatch({
      moments: [
        ...moments,
        {
          id: makeId("mmt"),
          title: "",
          experience: "",
          reason: "",
          actions: [],
          strengths: [],
        },
      ],
    });
  }

  async function analyze() {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/mind-spill/strengths-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workbookId: wb.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAnalyzeError(data?.error ?? "분석 중 문제가 생겼어요.");
        return;
      }
      // 서버가 갱신한 moments 를 그대로 patch.
      if (Array.isArray(data?.moments)) {
        onPatch({ moments: data.moments });
      }
      if (data?.strengths_report) {
        setLocalReport(data.strengths_report);
      }
    } catch (e) {
      console.error(e);
      setAnalyzeError("네트워크 오류가 발생했어요.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <section className="ms-step">
      <div className="ms-step-header">
        <div className="ms-step-num">vii.</div>
        <h2 className="ms-step-title">좋았던 순간에서, 강점을 발견합니다</h2>
      </div>
      <p className="ms-step-intro">
        부정적인 것만 다루면 워크북이 무거워집니다. 좋았던 순간을 적어두면, 그 안에서
        당신이 한 행동과 드러난 강점은 상담사가 한 발 떨어져 짚어줍니다.
      </p>

      {moments.length === 0 && (
        <div className="ms-ctrl-empty" style={{ marginBottom: 12 }}>
          좋았던 순간이 떠올랐다면 아래 버튼으로 모먼트를 추가해보세요.
        </div>
      )}

      {moments.map((m, idx) => (
        <MomentCard
          key={m.id}
          num={idx + 1}
          moment={m}
          onUpdate={(p) => update(m.id, p)}
          onRemove={() => remove(m.id)}
        />
      ))}

      <button type="button" className="ms-bd-add" onClick={add}>
        + 모먼트 추가
      </button>

      {/* 강점 발견 CTA + 종합 코멘트 */}
      {writtenCount > 0 && (
        <div className="ms-strengths-cta" style={{ marginTop: 32 }}>
          {!hasAnyLLMResult ? (
            <div className="ms-mirror-cta">
              <button
                type="button"
                className="ms-btn-ink"
                onClick={analyze}
                disabled={analyzing}
              >
                {analyzing ? "강점 찾는 중…" : "내 강점 발견하기 →"}
              </button>
              <p className="ms-mirror-cta-hint">
                적은 모먼트들을 상담사가 읽고, 키워드와 함께 당신이 한 행동과 드러난
                강점을 짚어줍니다. 약 10~30초 소요.
              </p>
              {analyzeError && (
                <div className="ms-mirror-error">{analyzeError}</div>
              )}
            </div>
          ) : (
            <div className="ms-strengths-narrative">
              <div className="ms-strengths-narrative-head">
                <span className="ms-mono" style={{ color: "var(--ms-accent)" }}>
                  상담사 코멘트
                </span>
                <button
                  type="button"
                  className="ms-btn-ghost"
                  onClick={analyze}
                  disabled={analyzing}
                >
                  {analyzing ? "다시 분석 중…" : "다시 분석 ↻"}
                </button>
              </div>
              <p
                className="ms-strengths-narrative-body"
                dangerouslySetInnerHTML={{ __html: report!.narrative }}
              />
              {analyzeError && (
                <div className="ms-mirror-error">{analyzeError}</div>
              )}

              {/* 리포트 보러가기 CTA */}
              <CoachReportCta wb={wb} onPatch={onPatch} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ============= 리포트 보러가기 CTA ============= */

function CoachReportCta({
  wb,
  onPatch,
}: {
  wb: Workbook;
  onPatch: (p: WorkbookPatch) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasReport = !!wb.coach_note;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mind-spill/coach-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workbookId: wb.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "리포트 생성 중 문제가 생겼어요.");
        return;
      }
      // workbook.coach_note / prescriptions 갱신을 상위 state 에 알림.
      // (WorkbookPatch 화이트리스트에는 없지만, 로컬 state 갱신을 위해 untyped 로 넘김)
      onPatch({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ coach_note: data.coach_note, prescriptions: data.prescriptions } as any),
      });
      // Closing 영역으로 부드럽게 이동.
      // coach_note 가 갱신되면 영역이 새로 마운트되므로 두 번의 RAF 로 안전하게.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const target = document.querySelector(".ms-closing-report");
          if (target instanceof HTMLElement) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      });
    } catch (e) {
      console.error(e);
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ms-coach-cta">
      <div className="ms-coach-cta-text">
        이제 지금까지 써내려간 생각과 마음을, 한 장의 리포트로 정리해볼게요.
      </div>
      <button
        type="button"
        className="ms-btn-ink"
        onClick={generate}
        disabled={loading}
      >
        {loading
          ? "리포트 만드는 중…"
          : hasReport
            ? "리포트 다시 보기 →"
            : "리포트 보러가기 →"}
      </button>
      {error && <div className="ms-mirror-error">{error}</div>}
    </div>
  );
}

function MomentCard({
  num,
  moment,
  onUpdate,
  onRemove,
}: {
  num: number;
  moment: Moment;
  onUpdate: (p: Partial<Moment>) => void;
  onRemove: () => void;
}) {
  // LLM 분석 결과(actions, strengths)는 카드에서는 숨김 — 종합 코멘트로만 표시.

  return (
    <div className="ms-moment">
      <button type="button" className="ms-moment-del" onClick={onRemove}>
        삭제
      </button>
      <div className="ms-moment-head">
        <span className="ms-moment-num">{String(num).padStart(2, "0")}.</span>
        <input
          className="ms-moment-title"
          type="text"
          value={moment.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="최근 좋았던 순간 — 한 줄 제목"
        />
      </div>

      <span className="ms-moment-label">좋았던 경험</span>
      <textarea
        className="ms-moment-body"
        value={moment.experience}
        onChange={(e) => onUpdate({ experience: e.target.value })}
        placeholder="어떤 상황이었고 무엇을 했나요? 결과보다 과정을 적어주세요."
        rows={2}
      />

      <span className="ms-moment-label">좋았던 이유</span>
      <textarea
        className="ms-moment-body"
        value={moment.reason ?? ""}
        onChange={(e) => onUpdate({ reason: e.target.value })}
        placeholder="이 순간이 왜 좋았는지 — 안도감, 뿌듯함, 연결감 등 떠오르는 대로."
        rows={2}
      />
    </div>
  );
}
