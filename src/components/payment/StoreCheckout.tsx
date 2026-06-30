"use client";

/**
 * 통일 결제 페이지(/payment/start)의 클라이언트 본체.
 *
 * 모든 무료 테스트(성취 중독 · minds · 멘탈 헬스/마음 체크)의 마지막 결제 화면이
 * 이 페이지로 모인다. 한 곳에서 워크북 또는 심리상담을 같은 가격으로 구매한다.
 *
 *  - 워크북 ₩49,000 — useWorkshopCheckout(workshop_purchases, 로그인 필요)
 *  - 심리상담 1회 체험 ₩129,000 / 8회 패키지 ₩792,000 — CN-{typeId} NicePay(서버 승인,
 *    로그인 불필요. 결제 후 /payment/counseling/complete 에서 카톡 안내)
 *
 * 결제 모듈은 NicePay 한 곳을 공용으로 쓰며, 워크북 훅과 상담 인라인 결제 모두
 * window.AUTHNICE(동일 SDK)를 사용한다.
 */

import { useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCounselingType } from "@/lib/counseling/types";
import {
  WORKSHOP_PRICE,
  WORKSHOP_ORIGINAL_PRICE,
  WORKSHOP_DISCOUNT_PERCENT,
} from "@/lib/self-workshop/landing-data";
import { KAKAO_CHANNEL_URL } from "@/app/programs/counseling/content";
import { trackMetaEvent } from "@/lib/meta-pixel";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "https://pay.nicepay.co.kr/v1/js/";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

/**
 * 카카오페이 / 네이버페이 두 결제 버튼.
 * NicePay 는 method 가 필수 파라미터(P007)라 항상 명시적으로 넘긴다.
 *  - stacked: 세로 풀폭(워크북). 아니면 가로 2분할(상담 티어).
 */
function PayButtons({
  onKakao,
  onNaver,
  kakaoLoading,
  naverLoading,
  disabled,
  stacked = false,
}: {
  onKakao: () => void;
  onNaver: () => void;
  kakaoLoading: boolean;
  naverLoading: boolean;
  disabled: boolean;
  stacked?: boolean;
}) {
  const block = disabled || kakaoLoading || naverLoading;
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100";
  return (
    <div className={stacked ? "space-y-2" : "grid grid-cols-2 gap-2"}>
      <button
        type="button"
        onClick={onKakao}
        disabled={block}
        className={`${base} bg-[#FEE500] text-[#191919]`}
      >
        {kakaoLoading ? "결제 진행 중…" : "카카오페이 구매"}
      </button>
      <button
        type="button"
        onClick={onNaver}
        disabled={block}
        className={`${base} bg-[#03C75A] text-white`}
      >
        {naverLoading ? "결제 진행 중…" : "네이버페이 구매"}
      </button>
    </div>
  );
}

export function StoreCheckout({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const router = useRouter();
  const [sdkLoaded, setSdkLoaded] = useState(false);
  // 결제 진행 중인 상담 버튼 키 `${typeId}:${method}` — 버튼 라벨/비활성용.
  const [counselingSubmitting, setCounselingSubmitting] = useState<
    string | null
  >(null);

  const sdkPending = !!NICEPAY_CLIENT_ID && !sdkLoaded;

  // ── 상담 결제 (서버 승인, CN-{typeId}. PurchaseClient 와 동일 패턴) ──
  // method 는 NicePay 필수 파라미터(P007)이므로 카카오페이/네이버페이를 항상 명시한다.
  function startCounselingPayment(typeId: string, method: string) {
    const ct = getCounselingType(typeId);
    if (!ct) return;

    // 상담은 로그인 후에만 결제 가능 — 비로그인은 로그인 페이지로 보낸 뒤 되돌아온다.
    if (!isLoggedIn) {
      alert("로그인 후 상담 결제를 진행해주세요.");
      router.push("/login?redirect=/payment/start");
      return;
    }

    if (!NICEPAY_CLIENT_ID) {
      alert("결제 모듈이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!window.AUTHNICE) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    trackMetaEvent("InitiateCheckout", {
      content_name: `counseling_${ct.id}`,
      value: ct.price,
      currency: "KRW",
    });

    setCounselingSubmitting(`${ct.id}:${method}`);

    const orderId = `CN-${ct.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    window.AUTHNICE.requestPay({
      clientId: NICEPAY_CLIENT_ID,
      method,
      orderId,
      amount: ct.price,
      goodsName: `심리상담 · ${ct.title}`,
      returnUrl: `${window.location.origin}/api/payment/nicepay/return`,
      fnError: (result: { errorMsg: string }) => {
        console.error("NicePay 에러:", result);
        alert(`결제 오류: ${result.errorMsg}`);
        setCounselingSubmitting(null);
      },
    });
  }

  const trial = getCounselingType("trial");
  const pkg = getCounselingType("package-8");

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      {/* NicePay SDK 로드 (워크북·상담 공용) */}
      {NICEPAY_CLIENT_ID && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
          onReady={() => setSdkLoaded(true)}
        />
      )}

      {/* 헤더 */}
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)]/40">
          Workbook &amp; Counseling
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
          워크북 또는 심리상담
        </h1>
        <p className="mt-3 break-keep text-[var(--foreground)]/65">
          혼자 워크북으로 풀어보거나, 1급 심리상담사와 1:1로 함께 들여다보거나.
          <br className="hidden sm:block" />
          어떤 테스트로 오셨든 같은 가격으로 선택할 수 있어요.
        </p>
      </header>

      {/* ── 워크북 ── */}
      <section className="mt-12">
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          혼자 해보기 · 워크북
        </h2>
        <div className="mt-4 rounded-2xl border-2 border-[var(--foreground)] bg-white p-6 shadow-[3px_3px_0_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-bold text-[var(--foreground)]">
                마음 챙김 워크북 — 성취 중독
              </p>
              <p className="mt-1 text-sm text-[var(--foreground)]/65">
                10단계 워크북 전 과정 + 3가지 분석 리포트 + 자기 확언 카드
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="rounded-full bg-[var(--foreground)] px-2.5 py-1 text-xs font-bold text-white">
              -{WORKSHOP_DISCOUNT_PERCENT}%
            </span>
            <span className="text-sm text-[var(--foreground)]/45 line-through">
              {won(WORKSHOP_ORIGINAL_PRICE)}
            </span>
            <span className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {won(WORKSHOP_PRICE)}
            </span>
          </div>

          <div className="mt-5">
            <Link
              href="/waitlist"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[var(--foreground)] bg-[var(--foreground)] px-5 py-3.5 text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.98]"
            >
              대기 신청하고 오픈 알림 받기 →
            </Link>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[var(--foreground)]/45">
            워크북은 정식 오픈을 준비 중이에요. 대기 신청하면 오픈 시
            특별가로 알려드려요.
          </p>
        </div>
      </section>

      {/* ── 심리상담 ── */}
      <section className="mt-12">
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          전문가와 함께 · 1:1 심리상담
        </h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {/* 1회 체험 (결제 유도 기본가) */}
          {trial && (
            <div className="flex flex-col rounded-2xl border-2 border-[var(--foreground)]/12 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/40">
                Trial
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[var(--foreground)]">
                  1
                </span>
                <span className="text-sm font-medium text-[var(--foreground)]/70">
                  회
                </span>
                <span className="ml-1 rounded-full border border-[var(--foreground)]/20 px-2.5 py-0.5 text-xs text-[var(--foreground)]/70">
                  체험 상담
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--foreground)]/55">
                50분 · Zoom 화상 상담
              </p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
                  {trial.price.toLocaleString()}
                </span>
                <span className="text-base text-[var(--foreground)]/70">원</span>
              </div>
              <p className="mt-1 text-xs text-[var(--foreground)]/45">
                유료 검사·해석 포함 · 1회 체험
              </p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {trial.features
                  .filter((f) => f.included)
                  .map((f) => (
                    <li
                      key={f.text}
                      className="flex items-start gap-2 text-sm text-[var(--foreground)]/80"
                    >
                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-[10px] text-white">
                        ✓
                      </span>
                      <span className="break-keep">{f.text}</span>
                    </li>
                  ))}
              </ul>

              <div className="mt-6">
                <PayButtons
                  onKakao={() => startCounselingPayment("trial", "kakaopay")}
                  onNaver={() => startCounselingPayment("trial", "naverpayCard")}
                  kakaoLoading={counselingSubmitting === "trial:kakaopay"}
                  naverLoading={counselingSubmitting === "trial:naverpayCard"}
                  disabled={sdkPending || counselingSubmitting !== null}
                />
              </div>
            </div>
          )}

          {/* 8회 패키지 (추천) */}
          {pkg && (
            <div className="relative flex flex-col rounded-2xl border-2 border-[var(--foreground)] bg-[var(--foreground)] p-6 text-white shadow-[6px_6px_0_var(--foreground)]">
              <span className="absolute -top-3 left-6 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-[var(--foreground)]">
                추천 · 커리큘럼 완주
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                8-Session Package
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold">8</span>
                <span className="text-sm font-medium text-white/70">회</span>
                <span className="ml-1 rounded-full border border-white/25 px-2.5 py-0.5 text-xs text-white/80">
                  정규 커리큘럼
                </span>
              </div>
              <p className="mt-3 text-sm text-white/55">
                주 1회 · 회당 50분 Zoom 화상 상담
              </p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {pkg.price.toLocaleString()}
                </span>
                <span className="text-base text-white/70">원</span>
              </div>
              <p className="mt-1 text-xs text-white/55">
                회당 99,000원 — 1회 체험가보다 30,000원 저렴
              </p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {pkg.features
                  .filter((f) => f.included)
                  .map((f) => (
                    <li
                      key={f.text}
                      className="flex items-start gap-2 text-sm text-white/85"
                    >
                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-white text-[10px] text-[var(--foreground)]">
                        ✓
                      </span>
                      <span className="break-keep">{f.text}</span>
                    </li>
                  ))}
              </ul>

              <div className="mt-6">
                <PayButtons
                  onKakao={() => startCounselingPayment("package-8", "kakaopay")}
                  onNaver={() =>
                    startCounselingPayment("package-8", "naverpayCard")
                  }
                  kakaoLoading={counselingSubmitting === "package-8:kakaopay"}
                  naverLoading={
                    counselingSubmitting === "package-8:naverpayCard"
                  }
                  disabled={sdkPending || counselingSubmitting !== null}
                />
              </div>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-[var(--foreground)]/50">
          유료 검사·해석 비용이 모두 포함된 가격입니다. 검사 따로, 상담 따로
          결제하지 않아도 됩니다.
        </p>
      </section>

      <p className="mt-10 text-center text-xs text-[var(--foreground)]/45">
        결제는 NicePay를 통해 안전하게 처리됩니다.
      </p>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm text-[var(--foreground)]/60 underline hover:text-[var(--foreground)]"
        >
          홈으로 돌아가기
        </Link>
      </div>

      {/* 카카오톡 문의 (플로팅) */}
      <a
        href={KAKAO_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-bold text-[var(--foreground)] shadow-[4px_4px_0_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5"
      >
        <span aria-hidden>💬</span> 카카오톡 문의
      </a>
    </div>
  );
}
