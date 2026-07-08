"use client";

/**
 * /minds 리포트 아웃트로 — "서서히 전환되는" 시퀀스 (콰이엇 에디토리얼).
 *
 *   ① 개념: 한 사람 안엔 여러 마음이 산다           (MindsConceptCard)
 *   ② 배역: 리더~추방자 다섯 배역 설명               (MindsRolesCard)
 *   ③ 당신의 무대: 지금 활동 중인 마음들 (배역표 티저) (MindsActiveStageCard)
 *   ──────── 판매 3장 (모든 CTA → 결제 모달, ₩19,900) ────────
 *   장1 분석 완료 + 잠긴 배역표                       (MindsPricingCard)
 *   장2 그 외 카테고리 미리보기 + 후기                (MindsCategoryReviewCard)
 *   장3 왜 알아야 하나 + 달라지는 것 (합본)           (MindsWhyBenefitCard)
 *
 * 판매 3장 서사: "분석은 이미 끝났다(접시 덮개만 닫힘) → 사이드 메뉴까지 한가득 +
 * 실사용 후기 → 왜 열어봐야 하는지". 결제(가격)는 버튼이 아니라 결제 모달에서 노출되고,
 * 카드 CTA는 "지금 바로 분석 열어보기"로 통일한다(구매감 대신 분석감).
 *
 * 톤 규칙(feedback_workbook_soft_language): 비판단적 표현. 잠긴 배역 배정(누가
 * 리더인지)은 무료 화면에 내려보내지 않는다 — 라벨·설명만 노출하고 배정은 잠금.
 */

import { useEffect, type ReactNode } from "react";
import { trackMindsFunnel } from "@/lib/minds/track";
import { CardShell, CardKicker } from "./MindsCardShell";
import { M, COLUMN, Hr, dispStyle, leadStyle, ctaStyle, IcLock } from "./quiet-editorial";
import { ROLE_SLOTS, type CharacterView } from "@/lib/minds/characters";
import { MINDS_RELATIONSHIP_PRICE, MINDS_RELATIONSHIP_ORIGINAL_PRICE } from "@/lib/minds/relationship-constants";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

const headline = { ...dispStyle, fontSize: 28, fontWeight: 700 } as const;
const para = { ...leadStyle, fontSize: 15 } as const;

/**
 * 페이월(프라이싱) 및 이후 카드에 항상 따라붙는 결제 CTA — 스크롤과 무관하게 화면
 * 하단에 압정처럼 고정되는 스티키 바. (MindsLanding 의 고정 CTA 와 동일한 패턴)
 *
 * 캐러셀이 mode="wait" 라 현재 보이는 카드 한 장만 DOM 에 존재하므로, 각 결제 카드가
 * 자기 바를 들고 있어도 화면엔 항상 하나만 뜬다. 뷰포트 기준 fixed + 카드와 같은
 * 448px(COLUMN) 중앙 폭. 바깥 래퍼는 pointerEvents:none 이라 투명한 페이드 영역으로는
 * 뒤 글자를 만질 수 있고, 클릭은 버튼에만 걸린다. 위쪽 투명→종이색 그라데이션으로
 * 지나가는 글자가 자연스럽게 사라진다.
 *
 * 카드 본문 끝에는 <CtaSpacer/> 를 둬, 마지막 줄이 이 바에 가리지 않게 여백을 비운다.
 * 가격은 여기서 노출하지 않는다 — 클릭 시 뜨는 결제 모달에서 ₩19,900 을 보여준다.
 */
function StickyCheckoutBar({
  onCheckout,
  label = "지금 바로 분석 열어보기",
  caption,
}: {
  onCheckout: () => void;
  label?: string;
  caption?: ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40" style={{ pointerEvents: "none" }}>
      <div
        style={{
          maxWidth: COLUMN,
          margin: "0 auto",
          padding: "14px 24px calc(env(safe-area-inset-bottom, 0px) + 16px)",
          background:
            "linear-gradient(180deg, rgba(247,244,238,0) 0%, rgba(247,244,238,0.92) 28%, #F7F4EE 60%)",
        }}
      >
        <button
          type="button"
          onClick={onCheckout}
          style={{
            ...ctaStyle,
            flexDirection: "column",
            gap: 4,
            padding: "15px 20px",
            pointerEvents: "auto",
            boxShadow: "0 8px 28px rgba(16,15,14,0.18)",
          }}
          className="transition-transform active:scale-[0.99]"
        >
          <span style={{ fontSize: 16, fontWeight: 700 }}>{label}</span>
          {/* 런칭 할인 앵커링 — 정가(취소선) → 판매가. 다크 버튼 위라 가독성 확보. */}
          <span style={{ display: "flex", alignItems: "baseline", gap: 7, fontFamily: M.font }}>
            <span style={{ fontSize: 13, opacity: 0.55, textDecoration: "line-through" }}>{won(MINDS_RELATIONSHIP_ORIGINAL_PRICE)}</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{won(MINDS_RELATIONSHIP_PRICE)}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: M.accent }}>런칭 할인</span>
          </span>
        </button>
        {caption && (
          <p style={{ textAlign: "center", margin: "10px 0 0", fontSize: 12, color: M.mute, fontFamily: M.font }}>
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}

/** 스티키 결제 바가 마지막 콘텐츠를 가리지 않도록 카드 본문 끝에 두는 여백. */
function CtaSpacer() {
  return <div aria-hidden style={{ height: 104 }} />;
}

/**
 * 카드 본문을 설명하는 고정 일러스트(도식). 힉스필드로 생성한 손그림 선화.
 * 레이아웃은 고정 — 이미지 경로만 교체하면 된다.
 */
function CardArt({ src, alt, maxW = 300 }: { src: string; alt: string; maxW?: number }) {
  return (
    <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ width: "100%", maxWidth: maxW, height: "auto" }} />
    </div>
  );
}

/**
 * 실사용 후기 블록 — 사회적 증거. 핵심 한 줄을 굵게, 뒤에 풀어쓴 설명.
 * 지금은 고정 샘플(실 후기 DB 연동은 후속). ★ 은 잉크색, 감정은 과장 없이.
 */
function ReviewCard() {
  return (
    <div
      style={{
        marginTop: 26,
        border: `1px solid ${M.line}`,
        borderRadius: 4,
        background: M.paper2,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ color: M.ink, fontSize: 14, letterSpacing: 2 }}>★★★★★</span>
        <span style={{ fontFamily: M.mono, fontSize: 12, color: M.ink2 }}>4.9 / 5.0</span>
      </div>
      <p
        style={{
          margin: "14px 0 0",
          fontSize: 17,
          fontWeight: 700,
          lineHeight: 1.5,
          color: M.ink,
          textAlign: "center",
          fontFamily: M.font,
          letterSpacing: "-0.02em",
        }}
      >
        “성격인 줄 알았는데,
        <br />
        방어기제였어요.”
      </p>
      <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.7, color: M.ink2, textAlign: "center", fontFamily: M.font }}>
        나는 원래 정 없고 차가운 사람인 줄 알았는데, 알고 보니 상처받기 전에 미리 거리를 두는
        마음이더라고요. 미워하던 내 모습에 이름이 붙으니, 비로소 ‘그럴 만했구나’ 끄덕이게 됐어요.
      </p>
      <div style={{ marginTop: 13, textAlign: "center", fontSize: 12, color: M.mute, fontFamily: M.font }}>
        — 이*은 님 · /minds 이용자
      </div>
    </div>
  );
}

/* ───────────────── ⓪ 요약 — 3 배역 + 답변을 한 장으로 (LLM summary) ─────────────────
 *
 * 캐릭터 카드(3장) 다음에 오는, "당신의 마음 속에는 지금 ~한 마음이 크고, 하지만
 * 동시에 ~한 마음도 있어요" 식의 개인화 종합 카드. partsMap.summary 는 유저 답변과
 * 마음들을 LLM 이 종합한 문단이라, 유저마다 다른 카드가 보인다.
 */
export function MindsSummaryCard({ summary, views }: { summary: string; views: CharacterView[] }) {
  const names = views.map((v) => v.name);

  return (
    <CardShell>
      <CardKicker>In Summary · 지금 당신의 마음</CardKicker>
      <h2 style={{ ...headline, marginTop: 20 }}>
        한 장으로 모으면,
        <br />
        이런 마음이에요
      </h2>

      <p style={{ ...para, marginTop: 22, fontSize: 16.5, lineHeight: 1.85, color: M.ink }}>
        {summary}
      </p>

      <div style={{ marginTop: 28 }}>
        <Hr />
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, padding: "22px 0 0" }}>
          {names.map((n, i) => (
            <span
              key={i}
              style={{ padding: "8px 14px", border: `1px solid ${M.line}`, borderRadius: 999, fontSize: 13, fontWeight: 600, color: M.ink2, fontFamily: M.font }}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

/* ───────────────── ① 개념 ───────────────── */
export function MindsConceptCard() {
  return (
    <CardShell>
      <CardKicker>The Theory · 마음의 구조</CardKicker>
      <h2 style={{ ...headline, marginTop: 26, textAlign: "center" }}>
        한 사람 안에는,
        <br />
        여러 마음이 살고 있어요
      </h2>
      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={para}>
          방금 만난 마음들처럼, 우리 안에는 하나의 ‘나’가 아니라 여러 마음이 함께
          살아갑니다. 어떤 마음은 앞에 나서서 무대를 끌고 가고, 어떤 마음은 뒤에서
          조용히 버티죠. 어떤 마음은 위기의 순간에만 갑자기 튀어나오기도 하고요.
        </p>
        <p style={para}>
          여기에 좋은 마음도, 나쁜 마음도 없습니다. 모두 저마다의 방식으로 당신을
          지키려 애쓰는 중이에요. 그리고 이 마음들은 무대 위 배우처럼, 각자 맡은
          ‘배역’이 있습니다.
        </p>
      </div>
      <CardArt src="/minds/guardian-cave.png" alt="한 사람 안에 여러 마음이 함께 사는 모습을 그린 그림" maxW={320} />
    </CardShell>
  );
}

/* ───────────────── ② 다섯 배역 설명 ───────────────── */
export function MindsRolesCard() {
  return (
    <CardShell>
      <CardKicker>The Cast · 다섯 배역</CardKicker>
      <h2 style={{ ...headline, marginTop: 22, textAlign: "center" }}>
        마음들이 맡는
        <br />
        다섯 가지 배역
      </h2>
      <div style={{ marginTop: 24 }}>
        <Hr />
        {ROLE_SLOTS.map((r) => (
          <div
            key={r.key}
            style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "15px 0", borderBottom: `1px solid ${M.line2}` }}
          >
            <span style={{ fontFamily: M.font, fontWeight: 600, fontSize: 16, color: M.ink, flex: "0 0 52px" }}>{r.label}</span>
            <span style={{ fontSize: 13.5, color: M.ink2, lineHeight: 1.55, flex: 1, fontFamily: M.font }}>{r.blurb}</span>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 22, fontSize: 13.5, lineHeight: 1.6, color: M.mute, fontFamily: M.font, textAlign: "center" }}>
        당신의 마음들도, 지금 이 중 어떤 배역을 맡고 있을 거예요.
      </p>
    </CardShell>
  );
}

/* ───────────────── ③ 당신의 무대 (배역표 티저) ───────────────── */
export function MindsActiveStageCard({ views }: { views: CharacterView[] }) {
  const names = views.map((v) => v.name);

  return (
    <CardShell>
      <CardKicker>Your Stage · 지금 당신의 무대</CardKicker>
      <h2 style={{ ...headline, marginTop: 22, textAlign: "center" }}>
        지금, 당신의 무대에
        <br />
        오른 마음들
      </h2>
      <p style={{ ...para, marginTop: 18, textAlign: "center", color: M.ink2 }}>
        오늘 당신이 들려준 이야기 속에서는, 이 마음들이 주로 무대에 오르고 있었어요.
      </p>

      {/* 활동 중인 캐릭터 — 필 */}
      <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
        {names.map((n, i) => (
          <span
            key={i}
            style={{ padding: "8px 14px", border: `1px solid ${M.ink}`, borderRadius: 999, fontSize: 13.5, fontWeight: 600, color: M.ink, fontFamily: M.font }}
          >
            {n}
          </span>
        ))}
      </div>

      {/* 배역표 티저 */}
      <p style={{ ...para, marginTop: 28 }}>
        그런데 — 이 중 누가 당신의 정서를 끌고 가는 <strong style={{ color: M.ink, fontWeight: 600 }}>리더</strong>이고,
        누가 <strong style={{ color: M.ink, fontWeight: 600 }}>빌런</strong>이며, 어떤 상처가{" "}
        <strong style={{ color: M.ink, fontWeight: 600 }}>추방자</strong>로 밀려나 있을까요? 그리고 어떤 두 마음이
        자꾸 부딪치고 있을까요?
      </p>

      <div style={{ marginTop: 24 }}>
        <Hr />
        <p style={{ padding: "20px 0 0", fontSize: 13.5, color: M.mute, fontFamily: M.font, textAlign: "center" }}>
          그 배역표는, 바로 다음 장에서 열어볼 수 있어요.
        </p>
      </div>
    </CardShell>
  );
}

/* ═════════════════ 판매 장1 — 분석 완료 + 잠긴 배역표 ═════════════════ */
export function MindsPricingCard({ onCheckout }: { onCheckout: () => void }) {
  // ② 운영자 슬랙 알림 — 캐러셀은 보이는 카드만 마운트하므로, 이 판매 첫 장이
  // 처음 마운트되는 순간이 곧 "Final 배역표(페이월) 도달". 세션당 1회만 전송된다(track.ts).
  useEffect(() => {
    trackMindsFunnel("reached_paywall");
    // 이탈 리뷰 팝업(ReviewPopup)이 "페이월 도달"을 알도록 신호를 쏜다.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("minds:paywall-reached"));
    }
  }, []);

  return (
    <CardShell>
      {/* 분석 완료 뱃지 (CardKicker 대신) */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "6px 12px",
            border: `1px solid ${M.accent}`,
            borderRadius: 999,
            fontFamily: M.mono,
            fontSize: 10.5,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: M.accent,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: M.accent,
              color: M.paper,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
            }}
          >
            ✓
          </span>
          분석 완료
        </span>
      </div>

      <h2 style={{ ...headline, fontSize: 26, marginTop: 18, textAlign: "center", lineHeight: 1.22 }}>
        당신의 답변을 읽고,
        <br />
        5가지 배역을 모두 분석했어요
      </h2>
      <p style={{ ...para, marginTop: 14, textAlign: "center" }}>
        오늘 들려준 이야기를 바탕으로, 다섯 자리에 각각 어떤 마음이 앉을지 배정을 마쳤어요.
        잠금을 열면 누가 어디에 있는지 보여요.
      </p>

      {/* 잠긴 배역표 */}
      <div style={{ marginTop: 24 }}>
        <Hr />
        {ROLE_SLOTS.map((r) => (
          <div
            key={r.key}
            style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "15px 0", borderBottom: `1px solid ${M.line2}` }}
          >
            <span style={{ fontFamily: M.font, fontWeight: 600, fontSize: 16, color: M.ink, flex: "0 0 52px" }}>{r.label}</span>
            <span style={{ fontSize: 13.5, color: M.ink2, lineHeight: 1.5, flex: 1, fontFamily: M.font }}>{r.blurb}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: M.mute2, flex: "0 0 auto", paddingTop: 1, fontFamily: M.mono }}>
              <IcLock s={13} /> ???
            </span>
          </div>
        ))}
      </div>

      {/* 연속성 콜아웃 */}
      <div style={{ marginTop: 22, background: M.paper2, padding: "18px 20px", borderRadius: 2, fontSize: 13.5, color: M.ink2, lineHeight: 1.7, fontFamily: M.font, borderLeft: `2px solid ${M.accent}` }}>
        지금 만난 마음들을 <b style={{ color: M.ink }}>그대로 이어받아</b> 한 편의 리포트로 배역과 관계를 풀어드려요. 새로 적을 필요 없어요.
      </div>

      <CtaSpacer />
      <StickyCheckoutBar onCheckout={onCheckout} caption="지금 만난 마음들을 그대로 이어받아요." />
    </CardShell>
  );
}

/* ═════════════════ 판매 장2 — 그 외 카테고리 미리보기 + 후기 ═════════════════ */

/** 리포트가 다루는 카테고리(LLM 아님, 고정 목업). 깊이/볼륨을 정직하게 보여준다.
 *  첫 항목은 무료에서 '정체'만 맛본 각 마음의 속마음 — 전체 리포트에서 깊이 풀리는 부분. */
const REPORT_CATEGORIES = [
  { ic: "🎭", name: "각 마음의 진짜 속마음", desc: "원하는 것·자주 삼키는 말·두려움·발동 순간" },
  { ic: "🛡️", name: "자주 쓰는 방어기제", desc: "나도 모르게 꺼내드는 마음의 방패" },
  { ic: "💬", name: "마음의 목소리 TOP 5", desc: "내가 자주 하는 속말·독백" },
  { ic: "⚔️", name: "자꾸 부딪치는 두 마음", desc: "반복되는 갈등 구도와 화해법" },
  { ic: "🌱", name: "나를 위한 맞춤 처방 3", desc: "이런 생각이 들 때, 이렇게 해보세요" },
];

export function MindsCategoryReviewCard({ onCheckout }: { onCheckout: () => void }) {
  return (
    <CardShell>
      <CardKicker>And More · 그 외에도</CardKicker>
      <h2 style={{ ...headline, fontSize: 26, marginTop: 18, textAlign: "center", lineHeight: 1.22 }}>
        아래의 이야기들까지,
        <br />
        모두 나왔어요!
      </h2>
      <p style={{ ...para, marginTop: 14, textAlign: "center" }}>
        배역표만이 아니에요. 당신의 마음을 이렇게 여러 각도에서 풀어드려요.
      </p>

      {/* 카테고리 미리보기 (잠금) */}
      <div style={{ marginTop: 22 }}>
        <Hr />
        {REPORT_CATEGORIES.map((c) => (
          <div
            key={c.name}
            style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${M.line2}` }}
          >
            <span
              style={{
                flex: "0 0 auto",
                width: 34,
                height: 34,
                borderRadius: 8,
                background: M.accentSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              {c.ic}
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontFamily: M.font, fontWeight: 600, fontSize: 15, color: M.ink }}>{c.name}</span>
              <span style={{ display: "block", fontSize: 12.5, color: M.mute, marginTop: 2, fontFamily: M.font }}>{c.desc}</span>
            </span>
            <span style={{ flex: "0 0 auto", color: M.mute2, fontFamily: M.mono, display: "flex", alignItems: "center" }}>
              <IcLock s={13} />
            </span>
          </div>
        ))}
      </div>

      {/* 후기 */}
      <ReviewCard />

      <CtaSpacer />
      <StickyCheckoutBar onCheckout={onCheckout} caption="결제 후 바로 리포트를 만들어 드려요 · NicePay 안전결제" />
    </CardShell>
  );
}

/* ═════════════════ 판매 장3 — 왜 알아야 하나 + 달라지는 것 (합본) ═════════════════ */
export function MindsWhyBenefitCard({ onCheckout }: { onCheckout: () => void }) {
  return (
    <CardShell>
      <CardKicker>Why · 왜 알아야 할까요</CardKicker>
      <h2 style={{ ...headline, fontSize: 26, marginTop: 18, textAlign: "center", lineHeight: 1.22 }}>
        누가 무대를 끌고 가는지,
        <br />
        알아야 하는 이유
      </h2>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={para}>
          같은 상황에서도, 누가 무대에 오르느냐에 따라 내 반응이 완전히 달라지기
          때문이에요. 빌런이 무대를 잡으면 한없이 나를 깎아내리고, 추방자가
          올라오면 오래된 상처가 다시 욱신거리죠.
        </p>
        <p style={para}>
          누가 언제 나서는지를 모르면, 나는 늘 ‘왜 또 이러지’ 하며 휘둘릴 수밖에
          없습니다. 매번 같은 자리에서 넘어지면서도, 그게 어떤 마음의 발이 걸린
          건지조차 모른 채로요.
        </p>
      </div>

      <p style={{ fontFamily: M.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: M.accent, textAlign: "center", margin: "26px 0 0" }}>
        — 그래서, 배역을 알면 —
      </p>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={para}>
          ‘아, 지금은 빌런이 나섰구나’ 하고 한 발짝 떨어져 바라볼 수 있게 됩니다.
          휘둘리는 대신 선택할 수 있고, 다그치는 대신 다독일 수 있게 돼요.
        </p>
        <p style={para}>
          마음의 지도를 손에 쥐는 순간, 비로소 내 마음의 주도권이 나에게 돌아옵니다.
          더 이상 마음에 끌려다니지 않고, 내가 무대의 감독이 되는 거예요.
        </p>
      </div>

      <CtaSpacer />
      <StickyCheckoutBar onCheckout={onCheckout} caption="지금 만난 마음들을 그대로 이어받아요." />
    </CardShell>
  );
}
