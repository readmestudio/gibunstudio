"use client";

import type { ReactNode } from "react";
import { useWorkshopNotify } from "./WorkshopNotifyContext";

interface Props {
  className?: string;
  children: ReactNode;
  /** 신청 완료 후 노출할 라벨 (기본: "알림 신청 완료 ✓") */
  doneChildren?: ReactNode;
}

/**
 * /payment/self-workshop 의 모든 알림 신청 CTA 가 공유하는 버튼.
 *
 * 위치별로 디자인이 다르므로 className 으로 스타일을 외부 주입한다 —
 * 동작(로그인 라우팅 / 자동 등록 / 신청 완료 라벨 / 토스트)은 컨텍스트에서 일괄 처리.
 */
export function WorkshopNotifyButton({
  className,
  children,
  doneChildren,
}: Props) {
  const { registered, pending, requestNotify } = useWorkshopNotify();

  const label = registered ? (doneChildren ?? "알림 신청 완료 ✓") : children;

  return (
    <button
      type="button"
      onClick={requestNotify}
      disabled={pending || registered}
      className={className}
      aria-label={
        typeof label === "string" ? label : "워크북 출시 알림 신청"
      }
    >
      {pending && !registered ? "신청 중…" : label}
    </button>
  );
}
