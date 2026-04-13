"use client";

import { useState } from "react";
import Script from "next/script";
import Link from "next/link";
import {
  DIMENSIONS,
  DIAGNOSIS_LEVELS,
  type DiagnosisScores,
  type DimensionKey,
} from "@/lib/self-workshop/diagnosis";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "https://pay.nicepay.co.kr/v1/js/";

const WORKSHOP_PRICE = 99000;

interface Props {
  scores?: DiagnosisScores;
}

/* ── 시나리오 데이터 (직장인 3~15년차 페르소나) ── */

const SCENARIO_CARDS: {
  dimensionKey: DimensionKey;
  keyword: string;
  scenario: string;
}[] = [
  {
    dimensionKey: "conditional_self_worth",
    keyword: "자기 가치의 조건화",
    scenario:
      "연봉이 오르거나 좋은 평가를 받아야만 '나 괜찮은 사람이야'라고 느낄 확률이 높아요. 성과 없는 나는 불안하고, 동기들의 승진 소식에 괜히 마음이 무거워질 수 있어요.",
  },
  {
    dimensionKey: "compulsive_striving",
    keyword: "과잉 추동",
    scenario:
      "프로젝트가 끝나면 '다음엔 뭘 해야 하지' 하고 바로 다음 목표를 세우고 있을 확률이 높아요. 주말에 쉬면서도 '이 시간에 자격증이라도 따야 하나' 생각이 자주 들 수 있어요.",
  },
  {
    dimensionKey: "fear_of_failure",
    keyword: "실패 공포 / 완벽주의",
    scenario:
      "회의에서 발표를 잘 마쳤는데, 퇴근길에 '그때 그 말은 왜 했지' 되짚고 있을 확률이 높아요. 작은 실수도 오래 남고, '완벽하지 않으면 의미 없다'는 생각이 습관처럼 따라올 수 있어요.",
  },
  {
    dimensionKey: "emotional_avoidance",
    keyword: "정서적 회피",
    scenario:
      "힘든 일이 있으면 감정을 느끼기보다 야근을 선택할 확률이 높아요. 바쁘면 생각을 안 해도 되니까요. 감정이 올라올 때 '일단 할 일부터 하자'가 자동 반응일 수 있어요.",
  },
];

/* ── 방치 시 결과 경고 ── */

const CONSEQUENCES = [
  {
    title: "만성 번아웃",
    description:
      "매일 최선을 다하는데 '충분하지 않다'는 느낌이 사라지지 않아요. 어느 날 갑자기 아무것도 하기 싫어지는 순간이 찾아옵니다.",
  },
  {
    title: "관계 갈등",
    description:
      "가까운 사람에게 '왜 너는 노력을 안 해?'라는 말이 나오기 시작해요. 나의 기준을 타인에게 강요하게 되고, 관계가 멀어집니다.",
  },
  {
    title: "자기 회의",
    description:
      "이 정도면 됐다고 스스로를 인정하지 못해요. 성과를 쌓아도 '운이 좋았을 뿐'이라는 생각이 반복됩니다.",
  },
  {
    title: "신체 증상",
    description:
      "불면, 만성 피로, 두통, 소화 불량. 몸이 보내는 신호를 무시하다가 건강이 무너지는 경우가 많아요.",
  },
];

function getSignalLevel(score: number) {
  // 25점 만점 기준
  if (score >= 18) {
    return {
      emoji: "\u{1F6A8}", // 🚨
      label: "위험",
      className: "bg-red-100 text-red-700",
      dotClass: "bg-red-500",
    };
  }
  if (score >= 13) {
    return {
      emoji: "\u{26A0}\u{FE0F}", // ⚠️
      label: "주의 필요",
      className: "bg-orange-100 text-orange-700",
      dotClass: "bg-orange-500",
    };
  }
  if (score >= 8) {
    return {
      emoji: "\u{1F7E1}", // 🟡
      label: "주의",
      className: "bg-yellow-100 text-yellow-700",
      dotClass: "bg-yellow-500",
    };
  }
  return {
    emoji: "\u{1F7E2}", // 🟢
    label: "안전",
    className: "bg-green-100 text-green-700",
    dotClass: "bg-green-500",
  };
}

export function WorkshopPaymentGate({ scores }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const level = scores
    ? DIAGNOSIS_LEVELS.find((l) => l.level === scores.level)
    : null;

  async function handlePayment() {
    if (!NICEPAY_CLIENT_ID || !window.AUTHNICE) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/payment/workshop/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopType: "achievement-addiction",
          amount: WORKSHOP_PRICE,
        }),
      });

      const data = await res.json();

      if (data.already_purchased) {
        window.location.reload();
        return;
      }

      if (!data.order_id) {
        throw new Error(data.error || "결제 레코드 생성에 실패했습니다");
      }

      window.AUTHNICE.requestPay({
        clientId: NICEPAY_CLIENT_ID,
        method: "card",
        orderId: data.order_id,
        amount: WORKSHOP_PRICE,
        goodsName: "마음 챙김 워크북 - 성취 중독",
        returnUrl: `${window.location.origin}/api/payment/nicepay/return`,
        fnError: (result: { errorMsg: string }) => {
          console.error("NicePay 에러:", result);
          alert(`결제 오류: ${result.errorMsg}`);
          setIsSubmitting(false);
        },
      });
    } catch (err) {
      console.error("결제 시작 오류:", err);
      alert("결제를 시작할 수 없습니다. 잠시 후 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      {/* NicePay SDK */}
      {NICEPAY_CLIENT_ID && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
          onReady={() => setSdkLoaded(true)}
        />
      )}

      {/* ── 1. 총점 + 레벨 ── */}
      {scores && level && (
        <>
          <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-8 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]/50 uppercase tracking-wider">
              나의 진단 결과
            </p>
            <p className="mt-4 text-6xl font-bold text-[var(--foreground)]">
              {scores.total}
              <span className="text-lg font-normal text-[var(--foreground)]/40">
                /100
              </span>
            </p>
            <div className="mt-3 inline-block rounded-full border-2 border-[var(--foreground)] px-4 py-1">
              <span className="text-sm font-semibold">
                Level {scores.level}: {level.name}
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--foreground)]/50">
              {level.keyword}
            </p>
          </div>

          {/* 레벨 설명 */}
          <div className="rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-6">
            <p className="text-sm leading-relaxed text-[var(--foreground)]/80">
              {level.description}
            </p>
          </div>

          {/* ── 2. 영역별 점수 ── */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              영역별 점수
            </h3>
            {DIMENSIONS.map((dim) => {
              const score = scores.dimensions[dim.key];
              const maxScore = 25;
              const percent = (score / maxScore) * 100;
              return (
                <div key={dim.key}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {dim.label}
                    </span>
                    <span className="text-sm font-bold text-[var(--foreground)]">
                      {score}/{maxScore}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[var(--foreground)]/10">
                    <div
                      className="h-full rounded-full bg-[var(--foreground)] transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--foreground)]/50">
                    {dim.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── 3. 시나리오 카드 ── */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              이런 생각을 자주 할 확률이 높아요
            </h3>
            <div className="space-y-3">
              {SCENARIO_CARDS.map((card) => {
                const dimScore = scores.dimensions[card.dimensionKey] ?? 0;
                const signal = getSignalLevel(dimScore);
                return (
                  <div
                    key={card.dimensionKey}
                    className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[var(--foreground)]/50">
                        {card.keyword}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${signal.className}`}
                      >
                        <span className="text-sm">{signal.emoji}</span>
                        {signal.label}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--foreground)]/80">
                      {card.scenario}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── 4. 경고 섹션: 방치하면 이렇게 됩니다 ── */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          이 패턴을 방치하면
        </h3>
        <p className="text-sm text-[var(--foreground)]/60">
          성취 중독은 의지로 해결되지 않습니다. 패턴을 인식하지 못하면 시간이
          지날수록 더 강해져요.
        </p>
        <div className="grid grid-cols-1 gap-3">
          {CONSEQUENCES.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-5"
            >
              <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
                {item.title}
              </p>
              <p className="text-sm leading-relaxed text-[var(--foreground)]/70">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. 해결 가능성 + CTA ── */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          하지만, 패턴을 알면 바꿀 수 있어요
        </h3>
        <p className="text-sm leading-relaxed text-[var(--foreground)]/70">
          이 워크북은 CBT(인지행동치료) 기반으로, 당신의 성취 패턴이 어디서
          시작되고 어떻게 반복되는지를 직접 추적합니다. 패턴을 인식하는 것만으로도
          자동적 사고에서 한 발짝 물러설 수 있어요.
        </p>
      </div>

      {/* 가격 + 포함 내용 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-sm text-[var(--foreground)]/60 mb-1">결제 금액</p>
        <p className="text-3xl font-bold text-[var(--foreground)]">
          {WORKSHOP_PRICE.toLocaleString()}원
        </p>

        <ul className="mt-5 space-y-2.5">
          {FEATURES.map((feature) => (
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
          <span>소요 시간: 65~100분</span>
          <span>컨텐츠 조회 기간: 결제 후 90일</span>
        </div>
      </div>

      {/* 결제 버튼 */}
      <button
        type="button"
        onClick={handlePayment}
        disabled={isSubmitting || (!!NICEPAY_CLIENT_ID && !sdkLoaded)}
        className="w-full rounded-xl border-2 border-[var(--foreground)] bg-white px-6 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "결제 진행 중..."
          : NICEPAY_CLIENT_ID && !sdkLoaded
            ? "결제 모듈 로딩 중..."
            : "워크북 구매하기"}
      </button>
      <p className="text-center text-xs text-[var(--foreground)]/50">
        결제는 NicePay를 통해 안전하게 처리됩니다.
      </p>

      {/* 돌아가기 */}
      <div className="text-center">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--foreground)]/60 underline hover:text-[var(--foreground)]"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </div>
  );
}

const FEATURES = [
  "나의 순환 메커니즘 직접 추적",
  "AI 교차검증으로 숨겨진 패턴 발견",
  "인지 재구조화 · 행동 실험 · 자기 돌봄 워크시트",
  "전체 요약 리포트",
];
