"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkbookPatch } from "@/lib/mind-spill/types";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * 주간 워크북 자동 저장. 일일과 동일한 패턴.
 * 500ms debounce, optimistic, keepalive flush.
 */
export function useWeeklyAutosave(workbookId: string | null) {
  const [state, setState] = useState<SaveState>("idle");

  const pendingRef = useRef<WorkbookPatch>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef<Promise<void> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(async () => {
    if (!workbookId) return;
    if (Object.keys(pendingRef.current).length === 0) return;
    if (inflightRef.current) await inflightRef.current;

    const patch = pendingRef.current;
    pendingRef.current = {};
    setState("saving");

    const run = (async () => {
      try {
        const res = await fetch("/api/mind-spill/weekly", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: workbookId, patch }),
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
  }, [workbookId]);

  const queueSave = useCallback(
    (patch: WorkbookPatch) => {
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
  }, [doSave]);

  useEffect(() => {
    const onHide = () => {
      if (Object.keys(pendingRef.current).length === 0 || !workbookId) return;
      const patch = pendingRef.current;
      pendingRef.current = {};
      try {
        fetch("/api/mind-spill/weekly", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: workbookId, patch }),
          keepalive: true,
        });
      } catch {
        // best-effort
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
  }, [workbookId]);

  return { state, queueSave, flush };
}
