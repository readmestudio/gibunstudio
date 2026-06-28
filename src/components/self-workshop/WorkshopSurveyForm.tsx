"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SURVEY_CONCERN_OPTIONS } from "@/lib/self-workshop/survey";

/**
 * 워크북 맞춤 제작 설문 폼.
 *
 * 결제(confirmed) 회원이 이름/연락처/나이/직업/고민(객관식)/해결받고 싶은 부분(주관식)을
 * 입력 → POST /api/self-workshop/survey 로 제출. 성공 시 제작 안내(generating)로 이동.
 */

const inputClass =
  "w-full rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 transition-colors focus:border-[var(--foreground)] focus:outline-none";

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
      {children}
      {required && <span className="ml-1 text-[var(--foreground)]/40">*</span>}
    </label>
  );
}

export function WorkshopSurveyForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [job, setJob] = useState("");
  const [concernIds, setConcernIds] = useState<string[]>([]);
  const [etcOn, setEtcOn] = useState(false);
  const [concernEtc, setConcernEtc] = useState("");
  const [goal, setGoal] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleConcern = (id: string) => {
    setConcernIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("이름을 입력해주세요.");
    if (!phone.trim()) return setError("연락처를 입력해주세요.");
    if (!age.trim()) return setError("나이를 입력해주세요.");
    if (!job.trim()) return setError("직업을 입력해주세요.");
    if (concernIds.length === 0 && !(etcOn && concernEtc.trim()))
      return setError("고민을 하나 이상 선택해주세요.");
    if (etcOn && !concernEtc.trim())
      return setError("기타 고민을 입력해주세요.");
    if (!goal.trim())
      return setError("워크북으로 해결받고 싶은 부분을 입력해주세요.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/self-workshop/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          age: age.trim(),
          job: job.trim(),
          concernIds,
          concernEtc: etcOn ? concernEtc.trim() : "",
          goal: goal.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(
          data.error ?? "제출에 실패했어요. 잠시 후 다시 시도해주세요."
        );
      }
      router.push("/dashboard/self-workshop/generating");
    } catch (err) {
      setError(err instanceof Error ? err.message : "제출에 실패했어요.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 이름 */}
      <div>
        <FieldLabel required>이름</FieldLabel>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          className={inputClass}
        />
      </div>

      {/* 연락처 */}
      <div>
        <FieldLabel required>연락처</FieldLabel>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="010-0000-0000"
          className={inputClass}
        />
      </div>

      {/* 나이 */}
      <div>
        <FieldLabel required>나이</FieldLabel>
        <input
          type="text"
          inputMode="numeric"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="예: 32"
          className={inputClass}
        />
      </div>

      {/* 직업 */}
      <div>
        <FieldLabel required>직업</FieldLabel>
        <input
          type="text"
          value={job}
          onChange={(e) => setJob(e.target.value)}
          placeholder="예: 마케터, 간호사, 프리랜서"
          className={inputClass}
        />
      </div>

      {/* 고민 (객관식 다중선택 + 기타 주관식) */}
      <div>
        <FieldLabel required>요즘 마음 쓰이는 고민</FieldLabel>
        <p className="mb-3 -mt-1 text-xs text-[var(--foreground)]/50">
          해당되는 고민을 모두 골라주세요. (여러 개 선택 가능)
        </p>
        <div className="flex flex-wrap gap-2">
          {SURVEY_CONCERN_OPTIONS.map((opt) => {
            const on = concernIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleConcern(opt.id)}
                aria-pressed={on}
                className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                  on
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                    : "border-[var(--foreground)]/15 text-[var(--foreground)] hover:border-[var(--foreground)]/40"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
          {/* 기타 토글 칩 */}
          <button
            type="button"
            onClick={() => setEtcOn((v) => !v)}
            aria-pressed={etcOn}
            className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
              etcOn
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                : "border-[var(--foreground)]/15 text-[var(--foreground)] hover:border-[var(--foreground)]/40"
            }`}
          >
            기타
          </button>
        </div>
        {etcOn && (
          <input
            type="text"
            value={concernEtc}
            onChange={(e) => setConcernEtc(e.target.value)}
            placeholder="그 밖에 마음 쓰이는 고민을 자유롭게 적어주세요"
            className={`${inputClass} mt-3`}
          />
        )}
      </div>

      {/* 해결받고 싶은 부분 (주관식) */}
      <div>
        <FieldLabel required>워크북을 통해 해결받고 싶은 부분</FieldLabel>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={5}
          placeholder="어떤 변화를 바라시는지, 어떤 상황이 가장 힘든지 편하게 적어주세요. 자세할수록 더 잘 맞는 워크북을 만들어 드릴 수 있어요."
          className={`${inputClass} resize-none leading-relaxed`}
        />
      </div>

      {/* 제작 시작·환불 안내 */}
      <div className="rounded-lg border-2 border-[var(--foreground)]/10 bg-[var(--surface)] p-4 text-left">
        <p className="break-keep text-sm leading-relaxed text-[var(--foreground)]/70">
          설문을 제출해주시면 익일 영업 시간부터 워크북 제작을 시작해요.
        </p>
        <p className="mt-1.5 break-keep text-sm font-semibold leading-relaxed text-[var(--foreground)]">
          설문 제출 이후에는 환불이 어렵습니다.
        </p>
      </div>

      {error && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "제출 중…" : "설문 제출하기"}
      </button>

      <p className="text-center text-xs leading-relaxed text-[var(--foreground)]/45">
        입력하신 정보는 워크북 제작과 전달 안내에만 사용돼요.
      </p>
    </form>
  );
}
