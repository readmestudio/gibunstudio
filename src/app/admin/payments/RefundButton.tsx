"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 관리자 환불 버튼.
 *
 * 기존 코치용 환불 라우트(POST /api/payment/nicepay/cancel)를 그대로 호출한다.
 * 이 페이지는 관리자(ADMIN_EMAILS) 로그인 세션이므로 쿠키가 자동 동봉되고,
 * 라우트가 관리자 권한도 허용하도록 확장돼 있다.
 *
 * ⚠️ 실제 라이브 결제 취소(환불)는 되돌릴 수 없다 → prompt(사유)+confirm 2단계 확인.
 */
export default function RefundButton({
  type,
  paymentId,
  label,
  amount,
}: {
  type: string;
  paymentId: string;
  label: string;
  amount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleRefund() {
    const won = `₩${amount.toLocaleString()}`;
    const reason = window.prompt(
      `환불 사유를 입력하세요.\n(${label} ${won} — NicePay 취소 내역에 남습니다)`,
      "고객 요청 환불"
    );
    if (reason === null) return; // 사용자가 취소
    const trimmed = reason.trim();
    if (!trimmed) {
      setMsg({ ok: false, text: "환불 사유를 입력해야 합니다." });
      return;
    }
    if (
      !window.confirm(
        `정말 환불하시겠어요?\n\n${label} ${won}\n\n실제 카드 취소가 이뤄지며 되돌릴 수 없습니다.`
      )
    )
      return;

    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/payment/nicepay/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, paymentId, reason: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ ok: true, text: data.message ?? "환불이 완료되었습니다." });
        // 목록의 status 를 최신화 (refunded 로 바뀜)
        router.refresh();
      } else {
        setMsg({ ok: false, text: data.error ?? "환불에 실패했습니다." });
      }
    } catch {
      setMsg({ ok: false, text: "네트워크 오류로 환불하지 못했습니다." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleRefund}
        disabled={busy}
        className="rounded-full border-2 border-red-500 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-40"
      >
        {busy ? "환불 처리 중…" : "환불"}
      </button>
      {msg && (
        <span
          className={`text-[11px] ${
            msg.ok ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {msg.text}
        </span>
      )}
    </div>
  );
}
