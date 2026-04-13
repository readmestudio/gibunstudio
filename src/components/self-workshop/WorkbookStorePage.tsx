"use client";

import { useState, useRef } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { WORKBOOK_CATALOG, type WorkbookInfo } from "@/lib/self-workshop/workbook-catalog";
import { NotifyButton } from "@/components/NotifyButton";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "https://pay.nicepay.co.kr/v1/js/";

/* ──────────────────────────────────────────────
   갤러리 카드 컴포넌트
   ────────────────────────────────────────────── */
function WorkbookGalleryCard({
  workbook,
  isActive,
  onClick,
}: {
  workbook: WorkbookInfo;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 w-[200px] md:w-[240px] snap-start rounded-2xl border-2 p-5 text-left transition-all ${
        isActive
          ? "border-[var(--foreground)] shadow-[4px_4px_0_var(--foreground)]"
          : "border-[var(--foreground)]/30 hover:border-[var(--foreground)]"
      } ${workbook.comingSoon ? "opacity-60" : ""}`}
    >
      {/* 일러스트 */}
      <div className="flex items-center justify-center h-32 mb-4">
        <Image
          src={`/doodles/${workbook.illustration}.svg`}
          alt={workbook.title}
          width={80}
          height={80}
          className="w-20 h-20 opacity-70"
        />
      </div>
      {/* 제목 + 부제 */}
      <h3 className="text-base font-bold text-[var(--foreground)]">
        {workbook.title}
      </h3>
      <p className="mt-1 text-sm text-[var(--foreground)]/60">
        {workbook.subtitle}
      </p>
      {workbook.comingSoon && (
        <span className="mt-2 inline-block text-xs text-[var(--foreground)]/40">
          coming soon
        </span>
      )}
    </button>
  );
}

/* ──────────────────────────────────────────────
   메인 WorkbookStorePage
   ────────────────────────────────────────────── */
export function WorkbookStorePage() {
  const [activeId, setActiveId] = useState(WORKBOOK_CATALOG[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = WORKBOOK_CATALOG.find((w) => w.id === activeId)!;

  function scrollLeft() {
    scrollRef.current?.scrollBy({ left: -260, behavior: "smooth" });
  }
  function scrollRight() {
    scrollRef.current?.scrollBy({ left: 260, behavior: "smooth" });
  }

  function handleCardPayment(workbook: WorkbookInfo) {
    if (workbook.comingSoon) return;
    if (!NICEPAY_CLIENT_ID) {
      alert("결제 모듈이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!window.AUTHNICE) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsSubmitting(true);

    const orderId = `${workbook.slug.toUpperCase()}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    window.AUTHNICE.requestPay({
      clientId: NICEPAY_CLIENT_ID,
      method: "card",
      orderId,
      amount: workbook.price,
      goodsName: `마음 챙김 워크북 - ${workbook.title}`,
      returnUrl: `${window.location.origin}/payment/self-workshop/complete`,
      fnError: (result: { errorMsg: string }) => {
        console.error("NicePay 에러:", result);
        alert(`결제 오류: ${result.errorMsg}`);
        setIsSubmitting(false);
      },
    });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* NicePay SDK */}
      {NICEPAY_CLIENT_ID && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
          onReady={() => setSdkLoaded(true)}
        />
      )}

      {/* 페이지 헤더 */}
      <div className="px-4 pt-16 pb-8 text-center">
        <h1 className="text-3xl font-bold text-[var(--foreground)] md:text-4xl">
          마음 챙김 워크북
        </h1>
        <p className="mt-3 text-base text-[var(--foreground)]/70">
          나의 마음 패턴을 이해하고, 스스로 대처법을 찾아가는 셀프 워크북
        </p>
      </div>

      {/* 갤러리 헤더 */}
      <div className="mx-auto max-w-2xl px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            워크북 둘러보기
          </h2>
          <div className="hidden md:flex gap-2">
            <button
              onClick={scrollLeft}
              className="w-8 h-8 rounded-full border-2 border-[var(--foreground)] flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-colors"
              aria-label="이전"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              onClick={scrollRight}
              className="w-8 h-8 rounded-full border-2 border-[var(--foreground)] flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-colors"
              aria-label="다음"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        {/* 가로 스크롤 갤러리 */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide"
        >
          {WORKBOOK_CATALOG.map((wb) => (
            <WorkbookGalleryCard
              key={wb.id}
              workbook={wb}
              isActive={activeId === wb.id}
              onClick={() => setActiveId(wb.id)}
            />
          ))}
        </div>
      </div>

      {/* 상세 콘텐츠 */}
      <div key={activeId} className="mx-auto max-w-xl px-4 py-12">
        {/* 타이틀 영역 */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl">
            {active.title}
          </h2>
          <p className="mt-2 text-base text-[var(--foreground)]/60">
            {active.subtitle}
          </p>
          <div className="mx-auto mt-4 h-[3px] w-8 bg-[var(--foreground)]/30 rounded-full" />
        </div>

        {/* 설명 */}
        <p className="text-sm leading-relaxed text-[var(--foreground)]/80 text-center mb-10">
          {active.description}
        </p>

        {/* 포함 내용 카드 */}
        <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6 mb-6">
          <p className="text-sm text-[var(--foreground)]/60 mb-1">결제 금액</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">
            {active.price.toLocaleString()}원
          </p>

          <ul className="mt-5 space-y-2.5">
            {active.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-[var(--foreground)]/80"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--foreground)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-[var(--foreground)]/50">
            <span>소요 시간: {active.estimatedMinutes}</span>
            <span>컨텐츠 조회 기간: 결제 후 90일</span>
          </div>
        </div>

        {/* CTA */}
        {active.comingSoon ? (
          <div className="text-center">
            <NotifyButton programId={active.id} programTitle={`마음 챙김 워크북 - ${active.title}`} />
            <p className="mt-3 text-xs text-[var(--foreground)]/50">
              오픈 시 알림을 받으실 수 있어요
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleCardPayment(active)}
              disabled={isSubmitting || (!!NICEPAY_CLIENT_ID && !sdkLoaded)}
              className="w-full rounded-xl border-2 border-[var(--foreground)] bg-white px-6 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "결제 진행 중..."
                : NICEPAY_CLIENT_ID && !sdkLoaded
                  ? "결제 모듈 로딩 중..."
                  : "구매하기"}
            </button>
            <p className="mt-3 text-center text-xs text-[var(--foreground)]/50">
              결제는 NicePay를 통해 안전하게 처리됩니다.
            </p>
          </>
        )}

        {/* 돌아가기 */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--foreground)]/60 underline hover:text-[var(--foreground)]"
          >
            돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
