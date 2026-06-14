"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DailyEntryPatch } from "@/lib/mind-spill/types";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Daily Entry 자동 저장.
 *   · 500ms debounce
 *   · 페이지 hide 시 keepalive flush (탭 닫혀도 마지막 변경 전송)
 *   · 인플라이트 동시 호출 직렬화
 */
export function useEntryAutosave(entryId: string | null) {
  const [state, setState] = useState<SaveState>("idle");

  const pendingRef = useRef<DailyEntryPatch>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef<Promise<void> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(async () => {
    if (!entryId) return;
    if (Object.keys(pendingRef.current).length === 0) return;
    if (inflightRef.current) await inflightRef.current;

    const patch = pendingRef.current;
    pendingRef.current = {};
    setState("saving");

    const run = (async () => {
      try {
        const res = await fetch("/api/mind-spill/entry", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: entryId, patch }),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);

        if (Object.keys(pendingRef.current).length > 0) {
          setState("saving");
          queueMicrotask(() => doSave());
          return;
        }
        setState("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setState("idle"), 1500);
      } catch {
        pendingRef.current = { ...patch, ...pendingRef.current };
        setState("error");
      }
    })();

    inflightRef.current = run.finally(() => {
      inflightRef.current = null;
    });
  }, [entryId]);

  const queueSave = useCallback(
    (patch: DailyEntryPatch) => {
      pendingRef.current = { ...pendingRef.current, ...patch };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        doSave();
      }, 500);
    },
    [doSave]
  );

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await doSave();
    // doSave 는 in-flight 전송을 시작만 하고 반환하므로, 실제 완료까지 대기.
    if (inflightRef.current) await inflightRef.current;
  }, [doSave]);

  useEffect(() => {
    const onHide = () => {
      if (Object.keys(pendingRef.current).length === 0 || !entryId) return;
      const patch = pendingRef.current;
      pendingRef.current = {};
      try {
        fetch("/api/mind-spill/entry", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: entryId, patch }),
          keepalive: true,
        });
      } catch {
        // best-effort — 페이지 종료 직전이라 응답 처리 불가.
      }
    };
    const visHandler = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    document.addEventListener("visibilitychange", visHandler);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", visHandler);
      window.removeEventListener("pagehide", onHide);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, [entryId]);

  return { state, queueSave, flush };
}
