"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  WAITLIST_WORKBOOKS,
  PURCHASE_TYPE_OPTIONS,
  CONCERN_OPTIONS,
  JOB_OPTIONS,
  YEARS_OPTIONS,
  COUNSELING_EXPERIENCE_OPTIONS,
  COUNSELING_REASON_OPTIONS,
  DESIRED_START_OPTIONS,
  GOAL_OPTIONS,
  type ChoiceOption,
} from "@/lib/waitlist/constants";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-lg border-2 border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 transition-colors focus:border-[var(--foreground)] focus:outline-none";

// 번호 + 라벨 + (선택)힌트를 일관된 톤으로 감싸는 질문 래퍼.
function Field({
  index,
  label,
  hint,
  required,
  children,
}: {
  index: number;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[var(--border)] pt-8">
      <div className="mb-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm text-[var(--foreground)]/40">
            {String(index).padStart(2, "0")}
          </span>
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {label}
            {required && <span className="ml-1 text-[var(--wb-accent)]">*</span>}
          </h2>
        </div>
        {hint && (
          <p className="mt-1.5 pl-8 text-sm text-[var(--foreground)]/55">{hint}</p>
        )}
      </div>
      <div className="pl-0 sm:pl-8">{children}</div>
    </section>
  );
}

// "기타"가 선택됐을 때 나타나는 직접 입력 칸.
function EtcInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="기타 내용을 직접 입력해주세요"
      className={`${inputClass} mt-2.5`}
      autoFocus
    />
  );
}

// 복수 선택 — 체크박스 목록. etcId 가 선택되면 직접 입력 칸을 노출.
function CheckboxGroup({
  options,
  selected,
  onToggle,
  etcId = "etc",
  etcValue = "",
  onEtcChange,
}: {
  options: ChoiceOption[];
  selected: string[];
  onToggle: (id: string) => void;
  etcId?: string;
  etcValue?: string;
  onEtcChange?: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {options.map((opt) => {
        const on = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            aria-pressed={on}
            className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
              on
                ? "border-[var(--foreground)] bg-[var(--surface)]"
                : "border-[var(--border)] hover:border-[var(--border-dark)]"
            }`}
          >
            <span
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                on
                  ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                  : "border-[var(--border-dark)]"
              }`}
            >
              {on && <CheckIcon />}
            </span>
            <span className="font-medium text-[var(--foreground)]">
              {opt.label}
            </span>
          </button>
        );
      })}
      {onEtcChange && selected.includes(etcId) && (
        <EtcInput value={etcValue} onChange={onEtcChange} />
      )}
    </div>
  );
}

// 단일 선택 — 라디오 목록. etcId 가 선택되면 직접 입력 칸을 노출.
function RadioGroup({
  options,
  value,
  onChange,
  etcId = "etc",
  etcValue = "",
  onEtcChange,
}: {
  options: ChoiceOption[];
  value: string;
  onChange: (id: string) => void;
  etcId?: string;
  etcValue?: string;
  onEtcChange?: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {options.map((opt) => {
        const on = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(on ? "" : opt.id)}
            aria-pressed={on}
            className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
              on
                ? "border-[var(--foreground)] bg-[var(--surface)]"
                : "border-[var(--border)] hover:border-[var(--border-dark)]"
            }`}
          >
            <span
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                on ? "border-[var(--foreground)]" : "border-[var(--border-dark)]"
              }`}
            >
              {on && (
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--foreground)]" />
              )}
            </span>
            <span className="font-medium text-[var(--foreground)]">
              {opt.label}
            </span>
          </button>
        );
      })}
      {onEtcChange && value === etcId && (
        <EtcInput value={etcValue} onChange={onEtcChange} />
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function WaitlistForm() {
  const router = useRouter();

  // 연락처 (필수)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // 설문
  const [workbooks, setWorkbooks] = useState<string[]>([]);
  const [purchaseType, setPurchaseType] = useState("");
  const [concern, setConcern] = useState<string[]>([]);
  const [job, setJob] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [counselingExperience, setCounselingExperience] = useState("");
  const [counselingReason, setCounselingReason] = useState<string[]>([]);
  const [desiredStart, setDesiredStart] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [inquiry, setInquiry] = useState("");

  // "기타" 직접 입력값 — 질문 key 별로 모아 둔다.
  const [etcDetails, setEtcDetails] = useState<Record<string, string>>({});
  const setEtc = (key: string) => (v: string) =>
    setEtcDetails((prev) => ({ ...prev, [key]: v }));

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // 복수 선택 토글 헬퍼 팩토리.
  const makeToggle =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) =>
      setter((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );

  function fail(msg: string) {
    setErrorMessage(msg);
    setStatus("error");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    // 클라이언트 1차 검증 — 서버에서도 다시 검증한다.
    if (!name.trim()) return fail("이름을 입력해주세요.");
    if (!email.trim()) return fail("이메일을 입력해주세요.");
    if (!phone.trim()) return fail("전화번호를 입력해주세요.");
    if (workbooks.length === 0)
      return fail("대기신청할 워크북을 하나 이상 선택해주세요.");

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          workbooks,
          purchaseType: purchaseType || undefined,
          concern,
          job: job || undefined,
          yearsExperience: yearsExperience || undefined,
          counselingExperience: counselingExperience || undefined,
          counselingReason,
          desiredStart: desiredStart || undefined,
          goals,
          etcDetails,
          inquiry: inquiry.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        fail(data.error ?? "잠시 후 다시 시도해주세요.");
        return;
      }
      // 성공 시 완료 페이지로 이동 — URL(`waitlist/complete`)로 Meta 전환을 잡는다.
      // status 는 success 로 유지해 버튼 비활성 상태로 두고, 그대로 라우팅한다.
      setStatus("success");
      router.push("/waitlist/complete");
    } catch {
      fail("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  // ── 신청 완료 → 완료 페이지(`/waitlist/complete`)로 이동 중 ──
  // 라우팅이 끝나기 전 폼이 깜빡이지 않도록 가벼운 안내만 노출.
  if (status === "success") {
    return (
      <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white px-8 py-16 text-center">
        <p className="text-lg font-semibold text-[var(--foreground)]">
          대기신청이 완료됐어요
        </p>
        <p className="mt-2 text-sm text-[var(--foreground)]/55">
          잠시만요, 안내 페이지로 이동하고 있어요…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── 기본 정보 (상단, 필수) ── */}
      <section className="rounded-2xl border-2 border-[var(--foreground)] bg-[var(--surface)] p-6 sm:p-7">
        <h2 className="text-lg font-bold text-[var(--foreground)]">기본 정보</h2>
        <p className="mt-1 text-sm text-[var(--foreground)]/55">
          워크북이 준비되면 이 연락처로 가장 먼저 안내드려요.
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
              이름 <span className="text-[var(--wb-accent)]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="이름 또는 호칭"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
              이메일 <span className="text-[var(--wb-accent)]">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="test@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
              전화번호 <span className="text-[var(--wb-accent)]">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="010-0000-0000"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* 01. 워크북 선택 (복수) */}
      <Field
        index={1}
        label="어떤 워크북을 기다리고 계신가요?"
        hint="관심 있는 주제를 모두 선택해주세요. (복수 선택 가능)"
        required
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {WAITLIST_WORKBOOKS.map((wb) => {
            const on = workbooks.includes(wb.id);
            return (
              <button
                key={wb.id}
                type="button"
                onClick={() => makeToggle(setWorkbooks)(wb.id)}
                aria-pressed={on}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  on
                    ? "border-[var(--foreground)] bg-[var(--surface)]"
                    : "border-[var(--border)] hover:border-[var(--border-dark)]"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    on
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                      : "border-[var(--border-dark)]"
                  }`}
                >
                  {on && <CheckIcon />}
                </span>
                <span>
                  <span className="block font-semibold text-[var(--foreground)]">
                    {wb.label}
                  </span>
                  <span className="mt-0.5 block text-sm text-[var(--foreground)]/55">
                    {wb.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {workbooks.includes("etc") && (
          <EtcInput value={etcDetails.workbooks ?? ""} onChange={setEtc("workbooks")} />
        )}
      </Field>

      {/* 02. 구매 유형 (단일, 가격 표시) */}
      <Field
        index={2}
        label="어떤 형태로 만나보고 싶으세요?"
        hint="워크북만 받을지, 1:1 심리상담까지 함께할지 선택해주세요."
      >
        <div className="space-y-3">
          {PURCHASE_TYPE_OPTIONS.map((opt) => {
            const on = purchaseType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPurchaseType(on ? "" : opt.id)}
                aria-pressed={on}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  on
                    ? "border-[var(--foreground)] bg-[var(--surface)]"
                    : "border-[var(--border)] hover:border-[var(--border-dark)]"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    on
                      ? "border-[var(--foreground)]"
                      : "border-[var(--border-dark)]"
                  }`}
                >
                  {on && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--foreground)]" />
                  )}
                </span>
                <span className="flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-[var(--foreground)]">
                      {opt.label}
                    </span>
                    {opt.price && (
                      <span className="flex-shrink-0 font-bold text-[var(--foreground)]">
                        {opt.price}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-sm text-[var(--foreground)]/55">
                    {opt.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      {/* 03. 고민 (복수) */}
      <Field
        index={3}
        label="요즘 가장 마음 쓰이는 고민은 무엇인가요?"
        hint="해당하는 것을 모두 선택해주세요. (복수 선택 가능)"
      >
        <CheckboxGroup
          options={CONCERN_OPTIONS}
          selected={concern}
          onToggle={makeToggle(setConcern)}
          etcValue={etcDetails.concern ?? ""}
          onEtcChange={setEtc("concern")}
        />
      </Field>

      {/* 04. 직업 (단일) */}
      <Field index={4} label="어떤 일을 하고 계신가요?">
        <RadioGroup
          options={JOB_OPTIONS}
          value={job}
          onChange={setJob}
          etcValue={etcDetails.job ?? ""}
          onEtcChange={setEtc("job")}
        />
      </Field>

      {/* 05. 연차 (단일) */}
      <Field index={5} label="지금 하시는 일/분야에서 몇 년차이신가요?">
        <RadioGroup
          options={YEARS_OPTIONS}
          value={yearsExperience}
          onChange={setYearsExperience}
        />
      </Field>

      {/* 06. 상담 경험 (단일) */}
      <Field index={6} label="심리상담을 받아본 경험이 있으신가요?">
        <RadioGroup
          options={COUNSELING_EXPERIENCE_OPTIONS}
          value={counselingExperience}
          onChange={setCounselingExperience}
        />
      </Field>

      {/* 07. 상담 지속/중단 이유 (복수) */}
      <Field
        index={7}
        label="상담을 계속했거나, 그만뒀거나, 시작하지 못한 이유가 있다면요?"
        hint="해당하는 것을 모두 선택해주세요. (복수 선택 가능)"
      >
        <CheckboxGroup
          options={COUNSELING_REASON_OPTIONS}
          selected={counselingReason}
          onToggle={makeToggle(setCounselingReason)}
          etcValue={etcDetails.counseling_reason ?? ""}
          onEtcChange={setEtc("counseling_reason")}
        />
      </Field>

      {/* 08. 언제부터 (단일) */}
      <Field index={8} label="언제부터 워크북을 시작하고 싶으세요?">
        <RadioGroup
          options={DESIRED_START_OPTIONS}
          value={desiredStart}
          onChange={setDesiredStart}
        />
      </Field>

      {/* 09. 알고 싶은 내용 (복수) */}
      <Field
        index={9}
        label="워크북·심리상담을 통해 가장 알고 싶은 건 무엇인가요?"
        hint="해당하는 것을 모두 선택해주세요. (복수 선택 가능)"
      >
        <CheckboxGroup
          options={GOAL_OPTIONS}
          selected={goals}
          onToggle={makeToggle(setGoals)}
          etcValue={etcDetails.goals ?? ""}
          onEtcChange={setEtc("goals")}
        />
      </Field>

      {/* 10. 추가 문의 (유일한 주관식, 선택) */}
      <Field
        index={10}
        label="추가로 문의하거나 알려주고 싶은 내용이 있다면 적어주세요 :)"
      >
        <textarea
          value={inquiry}
          onChange={(e) => setInquiry(e.target.value)}
          rows={4}
          placeholder="자유롭게 남겨주세요. (선택)"
          className={`${inputClass} resize-y`}
        />
      </Field>

      {/* 제출 */}
      <div className="border-t border-[var(--border)] pt-8">
        {status === "error" && errorMessage && (
          <p className="mb-4 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-xl bg-[var(--foreground)] px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "submitting" ? "신청 중..." : "대기신청 하기"}
        </button>
        <p className="mt-3 text-center text-xs text-[var(--foreground)]/40">
          제출하신 정보는 워크북 안내와 서비스 개선 목적으로만 사용됩니다.
        </p>
      </div>
    </form>
  );
}
