"use client";

/**
 * 내면 아이 상담 진단 — 응시자 검사 화면 (SPEC §6 흐름).
 *
 * 인트로/동의 → Part A(8문항×9페이지, ITEM_ORDER 고정) → Part B(3문항 3지선다)
 * → Part C(SCT 문항당 1화면) → 제출 → 완료 화면.
 *
 * ⚠️ 점수·유형·crisis 여부는 유저에게 절대 미노출 (해석은 세션의 가치).
 * 자동 임시저장: localStorage `intake_progress_{token}` (새로고침/이탈 후 복원).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PART_A_BY_ID,
  PART_A_INSTRUCTION,
  PART_B_INSTRUCTION,
  PART_B_QUESTIONS,
  PART_C_INSTRUCTION,
  PART_C_QUESTIONS,
  SCALE_LABELS,
  SCALE_MAX,
  SCALE_MIN,
} from "@/lib/intake/questions";
import { ITEM_ORDER } from "@/lib/intake/item-order";
import type {
  GuardianType,
  PartAAnswers,
  PartBAnswers,
  PartCAnswers,
  ScaleValue,
} from "@/lib/intake/types";

/** 검사 단계. */
type Step = "intro" | "a" | "b" | "c" | "done";

/** Part A 페이지 구성 (8문항 × 9페이지 = 72). */
const A_PAGE_SIZE = 8;
const A_PAGE_COUNT = Math.ceil(ITEM_ORDER.length / A_PAGE_SIZE); // 9

/** 리커트 응답값 배열 (1~6). */
const SCALE_VALUES: ScaleValue[] = Array.from(
  { length: SCALE_MAX - SCALE_MIN + 1 },
  (_, i) => (SCALE_MIN + i) as ScaleValue,
);

/** Part C 최소 입력 길이. */
const C_MIN_LENGTH = 2;

/** 인트로 안내 문구 (핸드오프 §7-3 — 원문 그대로, 창작 금지). */
const INTRO_NOTICES = [
  "본 검사는 기분 스튜디오가 심리도식 이론에 근거해 자체 개발한 자기이해 도구입니다. 의학적 진단이나 표준화 심리검사를 대체하지 않습니다.",
  "응답 내용은 담당 상담사의 세션 준비 목적으로만 사용되며, 상담 윤리에 따라 비밀이 보장됩니다.",
  "정답은 없습니다. 최근 2년의 나를 기준으로, 느끼는 그대로 답해주세요.",
] as const;

/** 개인정보 수집·이용 동의 문구 (§7-3: 수집 항목 + 보유 기간 명시). */
const CONSENT_TEXT =
  "개인정보 수집·이용에 동의합니다. (수집 항목: 표시명, 응답 내용 / 보유 기간: 상담 종료 후 1년, 이후 파기)";

/** localStorage 임시저장 형태. */
interface SavedProgress {
  step: Step;
  aPage: number;
  cIndex: number;
  partA: PartAAnswers;
  partB: Partial<PartBAnswers>;
  partC: Partial<PartCAnswers>;
  timings: { a_started_at?: string; a_submitted_at?: string };
}

/** 공통 버튼 클래스 (모노톤 — 검정 테두리, 화이트 배경). */
const BTN_PRIMARY =
  "w-full rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-6 py-3.5 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-30";
const BTN_SECONDARY =
  "rounded-xl border-2 border-[var(--foreground)] bg-white px-5 py-3.5 text-sm font-bold text-[var(--foreground)]";

export default function IntakeTestView({
  token,
  displayName,
}: {
  token: string;
  displayName: string;
}) {
  const storageKey = `intake_progress_${token}`;

  const [step, setStep] = useState<Step>("intro");
  const [consent, setConsent] = useState(false);
  const [aPage, setAPage] = useState(0); // 0..8
  const [cIndex, setCIndex] = useState(0); // 0..4
  const [partA, setPartA] = useState<PartAAnswers>({});
  const [partB, setPartB] = useState<Partial<PartBAnswers>>({});
  const [partC, setPartC] = useState<Partial<PartCAnswers>>({});
  const [timings, setTimings] = useState<{
    a_started_at?: string;
    a_submitted_at?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 복원 완료 전 저장 방지 플래그
  const restoredRef = useRef(false);

  // ── 자동 임시저장: 마운트 시 복원 ─────────────────────────────
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as SavedProgress;
        if (saved && typeof saved === "object") {
          if (saved.step && saved.step !== "done") setStep(saved.step);
          if (typeof saved.aPage === "number") {
            setAPage(Math.min(Math.max(saved.aPage, 0), A_PAGE_COUNT - 1));
          }
          if (typeof saved.cIndex === "number") {
            setCIndex(
              Math.min(Math.max(saved.cIndex, 0), PART_C_QUESTIONS.length - 1),
            );
          }
          if (saved.partA && typeof saved.partA === "object") {
            setPartA(saved.partA);
          }
          if (saved.partB && typeof saved.partB === "object") {
            setPartB(saved.partB);
          }
          if (saved.partC && typeof saved.partC === "object") {
            setPartC(saved.partC);
          }
          if (saved.timings && typeof saved.timings === "object") {
            setTimings(saved.timings);
          }
          // 검사 도중 복원이면 동의는 이미 거친 상태
          if (saved.step && saved.step !== "intro") setConsent(true);
        }
      }
    } catch {
      // 저장본 파손 시 처음부터 진행 (치명적이지 않음)
    }
    restoredRef.current = true;
  }, [storageKey]);

  // ── 자동 임시저장: 상태 변경 시 저장 ──────────────────────────
  useEffect(() => {
    if (!restoredRef.current || step === "done") return;
    try {
      const saved: SavedProgress = {
        step,
        aPage,
        cIndex,
        partA,
        partB,
        partC,
        timings,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch {
      // 저장 실패는 무시 (프라이빗 모드 등)
    }
  }, [storageKey, step, aPage, cIndex, partA, partB, partC, timings]);

  // 페이지 전환 시 최상단으로
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, aPage, cIndex]);

  // ── 진행률 (A 72 + B 3 + C 5 = 80문항 기준) ──────────────────
  const totalItems = ITEM_ORDER.length + PART_B_QUESTIONS.length + PART_C_QUESTIONS.length;
  const answeredCount =
    Object.keys(partA).length +
    Object.keys(partB).length +
    PART_C_QUESTIONS.filter(
      (q) => (partC[q.item_id] ?? "").trim().length >= C_MIN_LENGTH,
    ).length;
  const progressPercent = Math.round((answeredCount / totalItems) * 100);

  // ── 단계 전환 핸들러 ─────────────────────────────────────────
  const startTest = useCallback(() => {
    if (!consent) return;
    // Part A 시작 시각 기록 (§3-5 품질 플래그용, 최초 1회만)
    setTimings((prev) =>
      prev.a_started_at ? prev : { ...prev, a_started_at: new Date().toISOString() },
    );
    setStep("a");
  }, [consent]);

  const currentPageItems = ITEM_ORDER.slice(
    aPage * A_PAGE_SIZE,
    (aPage + 1) * A_PAGE_SIZE,
  );
  const isCurrentAPageComplete = currentPageItems.every(
    (id) => partA[id] !== undefined,
  );

  const goNextAPage = useCallback(() => {
    if (!isCurrentAPageComplete) return;
    if (aPage < A_PAGE_COUNT - 1) {
      setAPage(aPage + 1);
    } else {
      // 마지막 페이지 → Part A 완료 시각 기록 (최초 1회만)
      setTimings((prev) =>
        prev.a_submitted_at
          ? prev
          : { ...prev, a_submitted_at: new Date().toISOString() },
      );
      setStep("b");
    }
  }, [aPage, isCurrentAPageComplete]);

  const isPartBComplete = PART_B_QUESTIONS.every(
    (q) => partB[q.item_id] !== undefined,
  );

  const currentCQuestion = PART_C_QUESTIONS[cIndex];
  const currentCValue = partC[currentCQuestion.item_id] ?? "";
  const isCurrentCComplete = currentCValue.trim().length >= C_MIN_LENGTH;

  // ── 제출 ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          partA,
          partB,
          partC,
          timings: {
            ...timings,
            submitted_at: new Date().toISOString(),
          },
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      // 409 = 이미 제출된 세션 → 재제출 불가이므로 완료로 처리
      if (res.status === 409 || (res.ok && json?.ok)) {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          // 무시
        }
        setStep("done");
        return;
      }
      throw new Error(json?.error ?? "제출에 실패했어요.");
    } catch (e) {
      setSubmitError(
        e instanceof Error && e.message
          ? e.message
          : "네트워크 오류로 제출하지 못했어요.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [submitting, token, partA, partB, partC, timings, storageKey]);

  // ── 공통 레이아웃 ────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-white text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-md px-5 pb-16 pt-6">
        {/* 상단 진행률 바 (검사 단계에서만) */}
        {(step === "a" || step === "b" || step === "c") && (
          <div className="mb-6">
            <div className="mb-2 flex items-baseline justify-between text-xs font-bold">
              <span>
                {step === "a" && `Part A · ${aPage + 1} / ${A_PAGE_COUNT} 페이지`}
                {step === "b" && "Part B"}
                {step === "c" &&
                  `Part C · ${cIndex + 1} / ${PART_C_QUESTIONS.length}`}
              </span>
              <span className="text-neutral-500">{progressPercent}%</span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full border-2 border-[var(--foreground)] bg-white"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-[var(--foreground)] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* ── 인트로 / 동의 ── */}
        {step === "intro" && (
          <section className="pt-8">
            <p className="text-xs font-bold tracking-widest text-neutral-500">
              내면 아이 찾기 워크샵 · 사전 검사
            </p>
            <h1 className="mt-3 text-2xl font-bold leading-snug">
              {displayName}님,
              <br />
              세션 전에 마음을 살펴볼게요
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              세 부분으로 이루어진 검사예요. 약 15분이 걸립니다.
            </p>

            <div className="mt-6 rounded-2xl border-2 border-[var(--foreground)] bg-[var(--surface)] p-5">
              <ul className="space-y-2 text-sm leading-relaxed">
                <li className="flex justify-between gap-3">
                  <span className="font-bold">Part A</span>
                  <span className="text-neutral-600">마음 문항 72개 (선택형)</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="font-bold">Part B</span>
                  <span className="text-neutral-600">반응 방식 3문항 (선택형)</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="font-bold">Part C</span>
                  <span className="text-neutral-600">문장 완성 5문항 (자유 서술)</span>
                </li>
              </ul>
            </div>

            <ul className="mt-6 space-y-3">
              {INTRO_NOTICES.map((notice, i) => (
                <li
                  key={i}
                  className="text-xs leading-relaxed text-neutral-600"
                >
                  · {notice}
                </li>
              ))}
            </ul>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-[var(--foreground)] bg-white p-4">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--foreground)]"
              />
              <span className="text-xs leading-relaxed">{CONSENT_TEXT}</span>
            </label>

            <button
              type="button"
              onClick={startTest}
              disabled={!consent}
              className={`${BTN_PRIMARY} mt-6`}
            >
              검사 시작하기
            </button>
          </section>
        )}

        {/* ── Part A: 72문항 리커트 (8문항 × 9페이지) ── */}
        {step === "a" && (
          <section>
            <p className="mb-6 rounded-xl bg-[var(--surface)] p-4 text-xs leading-relaxed text-neutral-600">
              {PART_A_INSTRUCTION}
            </p>

            <div className="space-y-8">
              {currentPageItems.map((itemId, idx) => {
                const question = PART_A_BY_ID[itemId];
                const selected = partA[itemId];
                const questionNumber = aPage * A_PAGE_SIZE + idx + 1;
                return (
                  <fieldset key={itemId}>
                    <legend className="text-base font-bold leading-relaxed">
                      <span className="mr-1.5 text-neutral-400">
                        {questionNumber}.
                      </span>
                      {question.text}
                    </legend>
                    <div className="mt-3 grid grid-cols-6 gap-1.5">
                      {SCALE_VALUES.map((value) => {
                        const isSelected = selected === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={isSelected}
                            aria-label={`${value}점 ${SCALE_LABELS[value]}`}
                            onClick={() =>
                              setPartA((prev) => ({ ...prev, [itemId]: value }))
                            }
                            className={`h-11 rounded-lg text-sm font-bold transition-colors ${
                              isSelected
                                ? "border-2 border-[var(--foreground)] bg-[var(--foreground)] text-white"
                                : "border border-[var(--border)] bg-white text-neutral-400 hover:border-[var(--border-dark)]"
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] text-neutral-500">
                      <span>{SCALE_LABELS[SCALE_MIN]}</span>
                      <span>{SCALE_LABELS[SCALE_MAX]}</span>
                    </div>
                  </fieldset>
                );
              })}
            </div>

            <div className="mt-8 flex gap-3">
              {aPage > 0 && (
                <button
                  type="button"
                  onClick={() => setAPage(aPage - 1)}
                  className={BTN_SECONDARY}
                >
                  이전
                </button>
              )}
              <button
                type="button"
                onClick={goNextAPage}
                disabled={!isCurrentAPageComplete}
                className={BTN_PRIMARY}
              >
                {aPage < A_PAGE_COUNT - 1 ? "다음" : "Part B로"}
              </button>
            </div>
            {!isCurrentAPageComplete && (
              <p className="mt-3 text-center text-xs text-neutral-500">
                모든 문항에 응답하면 다음으로 넘어갈 수 있어요.
              </p>
            )}
          </section>
        )}

        {/* ── Part B: 3문항 3지선다 ── */}
        {step === "b" && (
          <section>
            <p className="mb-6 rounded-xl bg-[var(--surface)] p-4 text-xs leading-relaxed text-neutral-600">
              {PART_B_INSTRUCTION}
            </p>

            <div className="space-y-8">
              {PART_B_QUESTIONS.map((question) => (
                <fieldset key={question.item_id}>
                  <legend className="text-base font-bold leading-relaxed">
                    {question.text}
                  </legend>
                  <div className="mt-3 space-y-2">
                    {question.options.map((option) => {
                      const isSelected =
                        partB[question.item_id] === option.value;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() =>
                            setPartB((prev) => ({
                              ...prev,
                              [question.item_id]: option.value as GuardianType,
                            }))
                          }
                          className={`w-full rounded-xl border-2 border-[var(--foreground)] p-4 text-left text-sm leading-relaxed transition-colors ${
                            isSelected
                              ? "bg-[var(--foreground)] text-white"
                              : "bg-white text-[var(--foreground)]"
                          }`}
                        >
                          {option.text}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setStep("a")}
                className={BTN_SECONDARY}
              >
                이전
              </button>
              <button
                type="button"
                onClick={() => setStep("c")}
                disabled={!isPartBComplete}
                className={BTN_PRIMARY}
              >
                Part C로
              </button>
            </div>
          </section>
        )}

        {/* ── Part C: SCT 문항당 1화면 ── */}
        {step === "c" && (
          <section>
            <p className="mb-6 rounded-xl bg-[var(--surface)] p-4 text-xs leading-relaxed text-neutral-600">
              {PART_C_INSTRUCTION}
            </p>

            <label
              htmlFor={`intake-${currentCQuestion.item_id}`}
              className="block text-lg font-bold leading-relaxed"
            >
              {currentCQuestion.text}
            </label>
            <textarea
              id={`intake-${currentCQuestion.item_id}`}
              value={currentCValue}
              onChange={(e) =>
                setPartC((prev) => ({
                  ...prev,
                  [currentCQuestion.item_id]: e.target.value,
                }))
              }
              rows={5}
              placeholder="떠오르는 대로 적어주세요 (2자 이상)"
              className="mt-4 w-full resize-none rounded-xl border-2 border-[var(--foreground)] bg-white p-4 text-sm leading-relaxed outline-none placeholder:text-neutral-400"
            />

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  cIndex > 0 ? setCIndex(cIndex - 1) : setStep("b")
                }
                className={BTN_SECONDARY}
              >
                이전
              </button>
              {cIndex < PART_C_QUESTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCIndex(cIndex + 1)}
                  disabled={!isCurrentCComplete}
                  className={BTN_PRIMARY}
                >
                  다음
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isCurrentCComplete || submitting}
                  className={BTN_PRIMARY}
                >
                  {submitting ? "제출 중…" : "제출하기"}
                </button>
              )}
            </div>

            {submitError && (
              <div className="mt-4 rounded-xl border-2 border-[var(--foreground)] bg-[var(--surface)] p-4 text-center">
                <p className="text-xs leading-relaxed text-neutral-600">
                  {submitError}
                </p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`${BTN_PRIMARY} mt-3`}
                >
                  다시 제출하기
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── 완료 화면 (점수·유형·crisis 일절 미노출) ── */}
        {step === "done" && (
          <section className="flex min-h-[70vh] flex-col items-center justify-center text-center">
            <div className="w-full rounded-2xl border-2 border-[var(--foreground)] bg-white p-8">
              <h1 className="text-xl font-bold">검사가 완료되었습니다.</h1>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                결과는 상담사 선생님이 세션 전에 직접 분석합니다.
                <br />
                세션에서 만나요.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
