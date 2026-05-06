"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PROGRAM_TYPE = "self-workshop";
const NOTIFY_INTENT_KEY = "notify";
const NOTIFY_INTENT_VALUE = "workshop";
const RETURN_PATH = "/payment/self-workshop";

type ToastTone = "success" | "info" | "error";

interface WorkshopNotifyContextValue {
  /** 이미 신청 완료한 사용자 → 버튼 라벨을 "신청 완료" 로 바꾸기 위함 */
  registered: boolean;
  /** 등록 진행중(재진입 시 자동 등록 또는 클릭 직후) — 버튼 disable 용 */
  pending: boolean;
  /** 알림 신청 트리거. 미로그인 사용자는 카카오 로그인 페이지로 보낸다. */
  requestNotify: () => Promise<void>;
}

const WorkshopNotifyContext = createContext<WorkshopNotifyContextValue | null>(
  null
);

export function useWorkshopNotify() {
  const ctx = useContext(WorkshopNotifyContext);
  if (!ctx) {
    throw new Error(
      "useWorkshopNotify must be used inside <WorkshopNotifyProvider>"
    );
  }
  return ctx;
}

export function WorkshopNotifyProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [registered, setRegistered] = useState(false);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<{ tone: ToastTone; text: string } | null>(
    null
  );
  // 자동 등록 진입 신호 — `?notify=workshop` 감지 시 true 로 전환
  const [autoIntent, setAutoIntent] = useState(false);
  // 자동 등록을 한 번만 트리거하기 위한 가드 (StrictMode 이중 effect 방어)
  const autoRegisteredRef = useRef(false);

  const showToast = useCallback((tone: ToastTone, text: string) => {
    setToast({ tone, text });
    window.setTimeout(() => setToast(null), 4500);
  }, []);

  const performRegister = useCallback(
    async (
      mode: "manual" | "auto"
    ): Promise<"success" | "already" | "error"> => {
      setPending(true);
      try {
        const res = await fetch("/api/open-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ program_type: PROGRAM_TYPE }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          alreadyRegistered?: boolean;
          error?: string;
        };
        if (!res.ok || !data.success) {
          throw new Error(data.error ?? "알림 신청에 실패했습니다.");
        }
        setRegistered(true);
        if (data.alreadyRegistered) {
          // 자동 트리거에서 "이미 신청됨"은 토스트를 띄우지 않는다 — 새로고침마다 뜨는 노이즈 방지
          if (mode === "manual") {
            showToast("info", "이미 알림 신청이 완료된 상태예요.");
          }
          return "already";
        }
        showToast(
          "success",
          "알림 신청이 완료됐어요. 정식 오픈 시 가장 먼저 알려드릴게요."
        );
        return "success";
      } catch (err) {
        showToast(
          "error",
          err instanceof Error ? err.message : "알림 신청에 실패했습니다."
        );
        return "error";
      } finally {
        setPending(false);
      }
    },
    [showToast]
  );

  // 1) 페이지 마운트 시 — 본인 신청 여부 1회 조회 (로그인 사용자만 의미 있음)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/open-notify?program=${encodeURIComponent(PROGRAM_TYPE)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { registered?: boolean };
        if (!cancelled && data.registered) setRegistered(true);
      } catch {
        // 조회 실패는 조용히 무시 — 사용자가 다시 누르면 idempotent 처리됨
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) 카카오 OAuth 콜백 후 자동 등록 트리거 (autoIntent 는 SearchParamsBridge 가 켠다)
  useEffect(() => {
    if (!autoIntent) return;
    if (autoRegisteredRef.current) return;
    autoRegisteredRef.current = true;

    (async () => {
      await performRegister("auto");
      // 의도 파라미터 제거 — 새로고침 시 다시 트리거되는 것을 막음
      router.replace(RETURN_PATH);
    })();
  }, [autoIntent, performRegister, router]);

  const requestNotify = useCallback(async () => {
    if (pending) return;

    // 로그인 여부 확인
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await performRegister("manual");
      return;
    }

    // 미로그인 → 카카오 로그인 페이지로. 콜백 후 ?notify=workshop 으로 돌아옴.
    const next = `${RETURN_PATH}?${NOTIFY_INTENT_KEY}=${NOTIFY_INTENT_VALUE}`;
    router.push(`/login?next=${encodeURIComponent(next)}`);
  }, [pending, performRegister, router]);

  return (
    <WorkshopNotifyContext.Provider
      value={{ registered, pending, requestNotify }}
    >
      {/*
        useSearchParams 는 prerender 시 Suspense 바운더리를 요구한다 (Next.js 16).
        검색 파라미터를 읽는 부분만 분리해서 Suspense 안쪽에 둔다 — 본 트리는
        그대로 SSR/SSG 되고, 자동 등록 트리거는 클라이언트 hydration 직후 동작.
      */}
      <Suspense fallback={null}>
        <SearchParamsBridge
          intentKey={NOTIFY_INTENT_KEY}
          intentValue={NOTIFY_INTENT_VALUE}
          onIntent={() => setAutoIntent(true)}
        />
      </Suspense>
      {children}
      <WorkshopNotifyToast toast={toast} onDismiss={() => setToast(null)} />
    </WorkshopNotifyContext.Provider>
  );
}

/**
 * `?notify=workshop` 같은 의도 파라미터만 감지해서 콜백을 호출하는 얇은 다리.
 * 렌더 산출물은 없다 — 부모(Provider)의 state 만 바꾼다.
 */
function SearchParamsBridge({
  intentKey,
  intentValue,
  onIntent,
}: {
  intentKey: string;
  intentValue: string;
  onIntent: () => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get(intentKey) === intentValue) onIntent();
  }, [searchParams, intentKey, intentValue, onIntent]);
  return null;
}

/**
 * 화면 하단에 떠 있는 토스트 — 신청 완료 / 이미 신청됨 / 에러 표시.
 * 4.5초 뒤 자동 사라짐.
 */
function WorkshopNotifyToast({
  toast,
  onDismiss,
}: {
  toast: { tone: ToastTone; text: string } | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  const toneClass =
    toast.tone === "success"
      ? "lr-toast-success"
      : toast.tone === "error"
        ? "lr-toast-error"
        : "lr-toast-info";

  return (
    <div className={`lr-toast ${toneClass}`} role="status" aria-live="polite">
      <span className="lr-toast-text">{toast.text}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="lr-toast-close"
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  );
}
