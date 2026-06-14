"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function PartTwoFill({
  wb,
  onPatch,
  dailyMode = false,
}: Props & { dailyMode?: boolean }) {
  return (
    <>
      <FactCheckStep wb={wb} onPatch={onPatch} />
      <ControlStep wb={wb} onPatch={onPatch} />
      <ActionStep wb={wb} onPatch={onPatch} />
      <StrengthsStep wb={wb} onPatch={onPatch} dailyMode={dailyMode} />
    </>
  );
}

/* ============= iv. Fact vs Thought ============= */

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
    if (flag === null) delete next[id];
    else next[id] = flag;
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

  const classified = factCount + thoughtCount;
  const factPct = classified ? (factCount / classified) * 100 : 0;
  const thinkPct = classified ? (thoughtCount / classified) * 100 : 0;

  return (
    <section className="ms-w-sec">
      <div className="ms-w-sec-head">
        <div className="ix">iv. — sort</div>
        <div>
          <h3>사실인가, 생각인가</h3>
          <p className="desc">
            통제권을 나누기 전에 먼저 분류합니다. 사실(실제로 일어났거나 일어날 일)과
            생각(아직 일어나지 않은 해석·추측)을 구분해두면 다음 단계가 명확해져요.
            &quot;불안하다&quot; 같은 감정·신체 상태는 그 자체로 사실이에요.
          </p>
        </div>
        <div className="tag">
          <span>FACT vs THOUGHT</span>
          <span>{checkableBd.length} 항목</span>
        </div>
      </div>

      {checkableBd.length === 0 && todosCount === 0 ? (
        <div className="ms-w-ctrl-empty">
          비우기에서 Brain Dump를 먼저 적어주세요.
        </div>
      ) : checkableBd.length === 0 ? (
        <div className="ms-w-ft-note">
          <span className="lbl">분류할 항목이 없어요</span>
          Brain Dump의 <b>반복되는 생각</b> · <b>불편한 생각</b>에 적은 내용만
          사실/생각으로 나눕니다. 할 일(to-do)은 자명한 사실이라 다음 단계로
          자동 넘어갔어요{todosCount > 0 && ` (${todosCount}개)`}.
        </div>
      ) : (
        <>
          <div className="ms-w-ft-summary">
            <div className="v fact">
              {factCount}
              <span className="k">사실</span>
            </div>
            <div className="v thought">
              {thoughtCount}
              <span className="k">생각</span>
            </div>
            <div className="v un">
              {unsetCount}
              <span className="k">미분류</span>
            </div>
            <div className="ratio">
              <i className="f-fact" style={{ width: `${factPct}%` }} />
              <i className="f-think" style={{ width: `${thinkPct}%` }} />
            </div>
          </div>

          {todosCount > 0 && (
            <p
              style={{
                fontFamily: "var(--ms-font-mono)",
                fontSize: 11,
                color: "var(--ms-ink-3)",
                margin: "0 0 14px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              할 일 {todosCount}개는 자명한 사실 — 다음 단계로 자동 이동
            </p>
          )}

          <div className="ms-w-ft-list">
            {checkableBd.map((b, i) => {
              const flag = factCheck[b.id] ?? null;
              const cls =
                flag === "fact"
                  ? "ms-w-ft-item fact"
                  : flag === "thought"
                  ? "ms-w-ft-item thought"
                  : "ms-w-ft-item";
              return (
                <div key={b.id} className={cls}>
                  <span className="ln">{String(i + 1).padStart(2, "0")}</span>
                  <span className="txt">{b.text}</span>
                  <div className="ms-w-ft-pills">
                    <button
                      type="button"
                      className={`ms-w-ft-pill${flag === "fact" ? " on-fact" : ""}`}
                      onClick={() => setFlag(b.id, flag === "fact" ? null : "fact")}
                      aria-pressed={flag === "fact"}
                    >
                      사실
                    </button>
                    <button
                      type="button"
                      className={`ms-w-ft-pill${
                        flag === "thought" ? " on-thought" : ""
                      }`}
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
            <div className="ms-w-ft-note">
              <span className="lbl">생각으로 표시한 {thoughtCount}개</span>
              이 항목들은 아직 검증되지 않은 해석에 가까울 수 있어요. 정말 사실인지,
              다른 가능성은 없는지 한 번 더 살펴봐 주세요.
            </div>
          )}

          {(factCount > 0 || todosCount > 0) && (
            <a href="#part-two-control" className="ms-next-step">
              <div className="ms-next-step-meta">
                <span className="ms-next-step-eyebrow">
                  NEXT — v. 통제권으로 나누기
                </span>
                <span className="ms-next-step-title">
                  이제 생각이 아닌 <b>사실</b>에 집중해봐요.
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

/* ============= v. Control Split ============= */

function ControlStep({ wb, onPatch }: Props) {
  const classification = wb.classification ?? {
    controllable: [],
    influenceable: [],
    uncontrollable: [],
    fact_check: {},
  };
  const factCheck = classification.fact_check ?? {};

  const allBd = [
    ...wb.brain_dump.recurring.filter((b) => factCheck[b.id] === "fact"),
    ...wb.brain_dump.discomfort.filter((b) => factCheck[b.id] === "fact"),
    ...wb.brain_dump.todos,
  ].filter((b) => b.text.trim().length > 0);

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
      influenceable: [],
      uncontrollable: baseUncontrollable,
      fact_check: classification.fact_check,
    };
    if (b === "controllable") cleaned.controllable = [...baseControllable, id];
    if (b === "uncontrollable")
      cleaned.uncontrollable = [...baseUncontrollable, id];
    onPatch({ classification: cleaned });
  }

  const canItems = allBd.filter((b) => mergedControllable.includes(b.id));
  const cantItems = allBd.filter((b) =>
    classification.uncontrollable?.includes(b.id)
  );
  const unsorted = allBd.filter((b) => bucketOf(b.id) === null);

  return (
    <section className="ms-w-sec" id="part-two-control" style={{ scrollMarginTop: 64 }}>
      <div className="ms-w-sec-head">
        <div className="ix">v. — split</div>
        <div>
          <h3>통제권으로 나눕니다</h3>
          <p className="desc">
            앞에서 <b>사실</b>로 표시한 항목만 여기로 옵니다. 두 가지로 분류해주세요.
            이 분류만으로도 머릿속의 무게가 절반으로 줄어듭니다.
          </p>
        </div>
        <div className="tag">
          <span>CONTROL</span>
          <span>{allBd.length} 항목</span>
        </div>
      </div>

      <div className="ms-w-ctrl-intro">
        <div className="ms-w-ctrl-card a">
          <div className="ck">A — I CAN</div>
          <h6>내가 할 수 있는 것</h6>
          <p>
            직접 행동을 바꾸거나, 상황에 입력을 보낼 수 있는 영역. 결과 100%를
            결정 못 해도 한 걸음은 둘 수 있는 것들.
          </p>
          <div className="big">A</div>
        </div>
        <div className="ms-w-ctrl-card b">
          <div className="ck">B — LET BE</div>
          <h6>통제할 수 없는 것</h6>
          <p>
            외부에서 결정되거나, 감정·신체 상태처럼 직접 바꿀 수 없는 영역.
            받아들이거나 잠시 놓아두는 게 답인 것들.
          </p>
          <div className="big">B</div>
        </div>
      </div>

      {allBd.length === 0 ? (
        <div className="ms-w-ctrl-empty">
          아직 <b>사실</b>로 표시한 항목이 없어요. iv. 단계에서 먼저 사실/생각을
          나눠주세요.
        </div>
      ) : (
        <>
          {unsorted.length > 0 && (
            <div className="ms-w-ctrl-block">
              <div className="ch">
                <div className="title">
                  분류 대기 <span className="en">UNSORTED</span>
                </div>
                <div className="ct">{unsorted.length}</div>
              </div>
              {unsorted.map((b, i) => (
                <CtrlRow
                  key={b.id}
                  n={i + 1}
                  text={b.text}
                  bucket={null}
                  onSet={(bk) => setBucket(b.id, bk)}
                />
              ))}
            </div>
          )}

          <div className="ms-w-ctrl-block can">
            <div className="ch">
              <div className="title">
                내가 할 수 있는 것 <span className="en">I CAN</span>
              </div>
              <div className="ct">{canItems.length}</div>
            </div>
            {canItems.length === 0 ? (
              <div className="ms-w-ctrl-empty">아직 없음</div>
            ) : (
              canItems.map((b, i) => (
                <CtrlRow
                  key={b.id}
                  n={i + 1}
                  text={b.text}
                  bucket="controllable"
                  onSet={(bk) => setBucket(b.id, bk)}
                />
              ))
            )}
          </div>

          <div className="ms-w-ctrl-block cant">
            <div className="ch">
              <div className="title">
                통제할 수 없는 것 <span className="en">LET BE</span>
              </div>
              <div className="ct acc-wrap">
                <span className="acc">{cantItems.length}</span>
              </div>
            </div>
            {cantItems.length === 0 ? (
              <div className="ms-w-ctrl-empty">아직 없음</div>
            ) : (
              cantItems.map((b, i) => (
                <CtrlRow
                  key={b.id}
                  n={i + 1}
                  text={b.text}
                  bucket="uncontrollable"
                  onSet={(bk) => setBucket(b.id, bk)}
                />
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}

function CtrlRow({
  n,
  text,
  bucket,
  onSet,
}: {
  n: number;
  text: string;
  bucket: SimpleBucket | null;
  onSet: (b: SimpleBucket | null) => void;
}) {
  return (
    <div className="ms-w-ctrl-row">
      <span className="ln">{String(n).padStart(2, "0")}</span>
      <span className="txt">{text}</span>
      <div className="ms-w-ft-pills">
        <button
          type="button"
          className={`ms-w-ft-pill${bucket === "controllable" ? " on-fact" : ""}`}
          onClick={() =>
            onSet(bucket === "controllable" ? null : "controllable")
          }
          aria-pressed={bucket === "controllable"}
        >
          A · 가능
        </button>
        <button
          type="button"
          className={`ms-w-ft-pill${
            bucket === "uncontrollable" ? " on-thought" : ""
          }`}
          onClick={() =>
            onSet(bucket === "uncontrollable" ? null : "uncontrollable")
          }
          aria-pressed={bucket === "uncontrollable"}
        >
          B · 통제불가
        </button>
      </div>
    </div>
  );
}

/* ============= vi. Action Design ============= */

function ActionStep({ wb, onPatch }: Props) {
  const actions = wb.actions ?? [];
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
    <section className="ms-w-sec">
      <div className="ms-w-sec-head">
        <div className="ix">vi. — act</div>
        <div>
          <h3>다음 한 걸음을 설계합니다</h3>
          <p className="desc">
            통제 가능한 항목 중 1–3개를 고르세요. 욕심내면 실패합니다. 시작은
            24시간 안에 둘 수 있는 가장 작은 한 걸음으로.
          </p>
        </div>
        <div className="tag">
          <span>ACTION</span>
          <span>{actions.length} 카드</span>
        </div>
      </div>

      <div className="ms-w-act-grid">
        {actions.map((a, idx) => (
          <div className="ms-w-act-card" key={a.id}>
            <div className="ah">
              <div>
                <div className="lbl">ACTION {String(idx + 1).padStart(2, "0")}</div>
                <div className="title">{a.goal.trim() || "행동 설계"}</div>
              </div>
              <button
                type="button"
                className="ms-w-act-del"
                onClick={() => remove(a.id)}
              >
                삭제
              </button>
            </div>
            <div className="ms-w-act-fields">
              <div className="ms-w-act-field">
                <div className="k">대상</div>
                {controllableIds.length === 0 ? (
                  <div className="v" style={{ color: "var(--ms-ink-4)", fontSize: 14 }}>
                    통제 가능 항목(A) 없음
                  </div>
                ) : (
                  <select
                    className="ms-w-act-input"
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
              <div className="ms-w-act-field span-2">
                <div className="k">원하는 결과 · Goal</div>
                <input
                  className="ms-w-act-input"
                  type="text"
                  value={a.goal}
                  onChange={(e) => update(a.id, { goal: e.target.value })}
                  placeholder="가까운 시간 안에 도달하고 싶은 모습"
                />
              </div>
              <div className="ms-w-act-field span-2">
                <div className="k">가장 작은 첫걸음 · First step</div>
                <input
                  className="ms-w-act-input"
                  type="text"
                  value={a.first_step}
                  onChange={(e) => update(a.id, { first_step: e.target.value })}
                  placeholder="가장 작게 시작할 수 있는 한 가지"
                />
              </div>
              <div className="ms-w-act-field">
                <div className="k">언제</div>
                <input
                  className="ms-w-act-input"
                  type="text"
                  value={a.when}
                  onChange={(e) => update(a.id, { when: e.target.value })}
                  placeholder="목/오전/퇴근 후"
                />
              </div>
              <div className="ms-w-act-field">
                <div className="k">어디서</div>
                <input
                  className="ms-w-act-input"
                  type="text"
                  value={a.where}
                  onChange={(e) => update(a.id, { where: e.target.value })}
                  placeholder="책상/카페/방"
                />
              </div>
              <div className="ms-w-act-field span-2">
                <div className="k">안 되면 · If-then</div>
                <input
                  className="ms-w-act-input"
                  type="text"
                  value={a.if_then}
                  onChange={(e) => update(a.id, { if_then: e.target.value })}
                  placeholder="이때 시도할 다른 방법 — 예: 30분 못 내면 5분만이라도"
                />
              </div>
            </div>
          </div>
        ))}

        {actions.length < 5 && (
          <button type="button" className="ms-w-act-add" onClick={add}>
            + 액션 카드 추가
          </button>
        )}
      </div>
    </section>
  );
}

/* ============= vii. Strengths / Moments ============= */

function StrengthsStep({
  wb,
  onPatch,
  dailyMode = false,
}: Props & { dailyMode?: boolean }) {
  const router = useRouter();
  const moments = wb.moments ?? [];
  const report = wb.strengths_report;

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

  return (
    <section className="ms-w-sec">
      <div className="ms-w-sec-head">
        <div className="ix">vii. — keep</div>
        <div>
          <h3>좋았던 순간에서, 강점을 발견합니다</h3>
          <p className="desc">
            부정적인 것만 다루면 마음이 무거워집니다. 좋았던 순간을 적어두면, 그
            안에서 당신이 한 행동과 드러난 강점을 다시 발견할 수 있어요.
          </p>
        </div>
        <div className="tag">
          <span>STRENGTHS</span>
          <span>{moments.length} 모먼트</span>
        </div>
      </div>

      {moments.length === 0 && (
        <div className="ms-w-ctrl-empty" style={{ marginBottom: 12 }}>
          좋았던 순간이 떠올랐다면 아래 버튼으로 모먼트를 추가해보세요.
        </div>
      )}

      <div className="ms-w-str-grid">
        {moments.map((m, idx) => (
          <StrCard
            key={m.id}
            num={idx + 1}
            moment={m}
            onUpdate={(p) => update(m.id, p)}
            onRemove={() => remove(m.id)}
          />
        ))}
      </div>

      <button
        type="button"
        className="ms-w-act-add"
        style={{ marginTop: 12 }}
        onClick={add}
      >
        + 모먼트 추가
      </button>

      {/* 강점 종합 코멘트 — 주간 워크북(레거시) 전용. 데일리는 DailyWrapUp 사용. */}
      {!dailyMode && writtenCount > 0 && (
        <div className="ms-strengths-cta" style={{ marginTop: 32 }}>
          {!hasAnyLLMResult ? (
            <div className="ms-mirror-cta">
              <button
                type="button"
                className="ms-btn-ink"
                onClick={() => router.push("/dashboard/mind-spill")}
              >
                심층 분석 받기 →
              </button>
              <p className="ms-mirror-cta-hint">
                체크인 3일치가 모이면, 상담사가 반복 패턴과 당신만의 강점을 짚어
                종합 리포트(₩4,900) 한 통으로 정리해 드려요.
              </p>
            </div>
          ) : (
            <div className="ms-strengths-narrative">
              <div className="ms-strengths-narrative-head">
                <span className="ms-mono" style={{ color: "var(--ms-accent)" }}>
                  상담사 코멘트
                </span>
              </div>
              <p
                className="ms-strengths-narrative-body"
                dangerouslySetInnerHTML={{ __html: report!.narrative }}
              />
              <CoachReportCta wb={wb} onPatch={onPatch} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function StrCard({
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
  return (
    <div className="ms-w-str-card">
      <button type="button" className="ms-w-str-del" onClick={onRemove}>
        삭제
      </button>
      <div className="ms-w-str-head">
        <span className="sn">{String(num).padStart(2, "0")}</span>
        <input
          className="ms-w-str-input"
          type="text"
          value={moment.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="최근 좋았던 순간 — 한 줄 제목"
        />
      </div>

      <div className="ms-w-str-why">
        <div className="k">좋았던 경험</div>
        <textarea
          className="ms-w-str-textarea"
          value={moment.experience}
          onChange={(e) => onUpdate({ experience: e.target.value })}
          placeholder="어떤 상황이었고 무엇을 했나요? 결과보다 과정을 적어주세요."
          rows={2}
          onInput={(e) => {
            const ta = e.currentTarget;
            ta.style.height = "auto";
            ta.style.height = `${ta.scrollHeight}px`;
          }}
        />
      </div>

      <div className="ms-w-str-why">
        <div className="k">좋았던 이유 · WHY</div>
        <textarea
          className="ms-w-str-textarea"
          value={moment.reason ?? ""}
          onChange={(e) => onUpdate({ reason: e.target.value })}
          placeholder="이 순간이 왜 좋았는지 — 안도감, 뿌듯함, 연결감 등 떠오르는 대로."
          rows={2}
          onInput={(e) => {
            const ta = e.currentTarget;
            ta.style.height = "auto";
            ta.style.height = `${ta.scrollHeight}px`;
          }}
        />
      </div>

      {moment.strengths && moment.strengths.length > 0 && (
        <div className="ms-w-str-tags">
          {moment.strengths.map((s, i) => (
            <span className="t" key={i}>
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============= 리포트 보러가기 CTA (레거시) ============= */

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
      onPatch({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ coach_note: data.coach_note, prescriptions: data.prescriptions } as any),
      });
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
