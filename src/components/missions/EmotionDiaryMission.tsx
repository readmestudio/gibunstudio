"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

type Props = {
  day: number;
  maxStep: number;
  onSubmit?: (messages: Message[]) => void;
  submitted?: boolean;
};

export function EmotionDiaryMission({ day, maxStep, onSubmit, submitted = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading || submitted) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/emotion-diary/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          currentStep,
          day,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const assistantMessage: Message = { role: "assistant", content: data.content };
      setMessages((prev) => [...prev, assistantMessage]);
      if (currentStep < maxStep) setCurrentStep((s) => s + 1);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해 주세요.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setStarted(true);
    setLoading(true);
    try {
      const res = await fetch("/api/emotion-diary/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "시작할게요." }],
          currentStep: 1,
          day,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages([
        { role: "user", content: "시작할게요." },
        { role: "assistant", content: data.content },
      ]);
    } catch (err) {
      setMessages([
        { role: "user", content: "시작할게요." },
        {
          role: "assistant",
          content: "오늘 감정이 강하게 움직였던 순간을 이야기해 주세요.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const finishDiary = () => {
    if (messages.length > 0) onSubmit?.(messages);
  };

  if (submitted) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
        <p className="font-medium text-green-800">오늘의 감정일기를 마쳤어요</p>
        <p className="mt-2 text-sm text-green-700">
          내일 미션과 감정일기에서 알아볼 것에 대해 안내해 드릴게요.
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="space-y-6">
        <p className="text-[var(--foreground)]/80">
          매일 대화를 통해 감정일기를 작성하며 내가 자주 느끼는 감정, 자동 사고, 핵심 신념을 파악해요.
          오늘은 {maxStep}단계까지 진행합니다.
        </p>
        <button
          type="button"
          onClick={handleStart}
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "시작 중..." : "감정일기 시작하기"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-[var(--border)] bg-white p-4">
        <p className="text-sm text-[var(--foreground)]/60">
          {currentStep} / {maxStep} 단계
        </p>
      </div>

      <div className="flex max-h-96 flex-col gap-4 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                m.role === "user"
                  ? "bg-[var(--accent)] text-[var(--foreground)]"
                  : "bg-white border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-white border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)]/60">
              입력 중...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || submitted}
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 disabled:bg-[var(--surface)]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || submitted}
          className="rounded-lg bg-[var(--accent)] px-6 py-2 font-semibold text-[var(--foreground)] disabled:opacity-50 hover:bg-[var(--accent-hover)]"
        >
          전송
        </button>
      </form>

      {currentStep >= maxStep && (
        <button
          type="button"
          onClick={finishDiary}
          className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
        >
          오늘 감정일기 마치기
        </button>
      )}
    </div>
  );
}
