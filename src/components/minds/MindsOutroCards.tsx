"use client";

/**
 * /minds 리포트 아웃트로 — "서서히 전환되는" 6장 시퀀스 (콰이엇 에디토리얼).
 *
 *   ① 개념: 한 사람 안엔 여러 마음이 산다
 *   ② 배역: 리더~추방자 다섯 배역 설명
 *   ③ 이유: 어떤 마음이 그 배역인지 *알아야 하는 이유*
 *   ④ 좋은 점: 배역을 알았을 때 달라지는 것
 *   ⑤ 당신의 무대: 지금 당신 안에서 활동 중인 마음들 (배역표 티저)
 *   ⑥ 페이월: 잠긴 배역표 + 콜아웃 + 워크북 CTA + 할인가
 *
 * 캐릭터로 정든 독자가 한 장씩 넘기며 "내 배역표는?" 궁금증이 차오르도록 설계.
 * 카드 간 전환 애니메이션은 husband-match CardCarousel 이 담당한다.
 *
 * 톤 규칙(feedback_workbook_soft_language): 비판단적 표현. 잠긴 배역 배정(누가
 * 리더인지)은 무료 화면에 내려보내지 않는다 — 라벨·설명만 노출하고 배정은 잠금.
 */

import Link from "next/link";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { CardShell, CardKicker } from "./MindsCardShell";
import { M, Hr, dispStyle, leadStyle, ctaStyle, IcLock } from "./quiet-editorial";
import { ROLE_SLOTS, type CharacterView } from "@/lib/minds/characters";
import {
  WORKSHOP_PRICE,
  WORKSHOP_ORIGINAL_PRICE,
  WORKSHOP_DISCOUNT_PERCENT,
} from "@/lib/self-workshop/landing-data";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

const headline = { ...dispStyle, fontSize: 28, fontWeight: 700 } as const;
const para = { ...leadStyle, fontSize: 15 } as const;

/**
 * 페이월(프라이싱) 이후 카드에 항상 따라붙는 결제 CTA. 누르면 카드 결제 모달을 연다.
 * — "결제 유도 페이지 이후 장에는 항상 결제 버튼이 있어야 한다" 규칙의 구현.
 */
function CheckoutCta({ onCheckout, label = "워크북으로 배역표 열기" }: { onCheckout: () => void; label?: string }) {
  return (
    <div style={{ marginTop: 30 }}>
      <button
        type="button"
        onClick={onCheckout}
        style={{ ...ctaStyle }}
        className="transition-transform active:scale-[0.99]"
      >
        {label} <span style={{ opacity: 0.45 }}>·</span> {won(WORKSHOP_PRICE)}
      </button>
      <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: M.mute, fontFamily: M.font }}>
        지금 만난 마음들을 그대로 이어받아요.
      </p>
    </div>
  );
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

/* ───────────────── ③ 알아야 하는 이유 (페이월 이후) ───────────────── */
export function MindsWhyCard({ onCheckout }: { onCheckout: () => void }) {
  return (
    <CardShell>
      <CardKicker>Why · 왜 알아야 할까요</CardKicker>
      <h2 style={{ ...headline, marginTop: 22, textAlign: "center" }}>
        누가 무대를 끌고 가는지,
        <br />
        알아야 하는 이유
      </h2>
      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
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
        <p style={para}>
          그래서 변화의 첫걸음은 늘 같습니다. 지금 내 무대에 오른 게 어떤 마음인지,
          그 얼굴과 이름부터 또렷이 알아보는 것. 상대가 누구인지 알아야, 비로소
          휘둘림을 멈추고 대화를 시작할 수 있으니까요.
        </p>
      </div>
      <CheckoutCta onCheckout={onCheckout} label="내 무대의 리더부터 확인하기" />
    </CardShell>
  );
}

/* ───────────────── ④ 알았을 때 좋은 점 (페이월 이후) ───────────────── */
export function MindsBenefitCard({ onCheckout }: { onCheckout: () => void }) {
  return (
    <CardShell>
      <CardKicker>What Changes · 달라지는 것</CardKicker>
      <h2 style={{ ...headline, marginTop: 22, textAlign: "center" }}>
        배역을 알면,
        <br />
        이렇게 달라져요
      </h2>
      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={para}>
          ‘아, 지금은 빌런이 나섰구나’ 하고 한 발짝 떨어져 바라볼 수 있게 됩니다.
          휘둘리는 대신 선택할 수 있고, 다그치는 대신 다독일 수 있게 돼요.
        </p>
        <p style={para}>
          마음의 지도를 손에 쥐는 순간, 비로소 내 마음의 주도권이 나에게 돌아옵니다.
          더 이상 마음에 끌려다니지 않고, 내가 무대의 감독이 되는 거예요.
        </p>
        <p style={para}>
          물론 하루아침에 바뀌진 않아요. 하지만 어떤 마음이 언제 나서는지 알아채는
          횟수가 늘수록, 휘둘리는 날보다 다독이는 날이 조금씩 많아집니다. 그렇게
          마음의 주도권은 천천히, 그러나 분명하게 당신에게 옮겨와요.
        </p>
      </div>
      <CheckoutCta onCheckout={onCheckout} label="내 배역표 열고 시작하기" />
    </CardShell>
  );
}

/* ───────────────── ⑤ 당신의 무대 (배역표 티저) ───────────────── */
export function MindsActiveStageCard({ views }: { views: CharacterView[] }) {
  const names = views.map((v) => v.archetype.name);

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

/* ───────────────── ⑥ 페이월 — 잠긴 배역표 + 프라이싱 ───────────────── */
export function MindsPricingCard({ onCheckout }: { onCheckout: () => void }) {
  return (
    <CardShell>
      <CardKicker>Final · 마음 극장의 배역표</CardKicker>
      <h2 style={{ ...headline, marginTop: 18 }}>
        그래서, 우리 마음의
        <br />
        리더와 빌런은 누굴까요?
      </h2>
      <p style={{ ...para, marginTop: 18 }}>
        네 마음은 각자 배역이 있어요. 누가 내 정서를 끌고 가는 리더인지, 누가
        빌런이고 누가 묵묵히 나를 지키는 관리자인지는 워크북에서 확인할 수 있어요.
      </p>

      {/* 잠긴 배역표 */}
      <div style={{ marginTop: 28 }}>
        <Hr />
        {ROLE_SLOTS.map((r) => (
          <div
            key={r.key}
            style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "16px 0", borderBottom: `1px solid ${M.line2}` }}
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
      <div style={{ marginTop: 22, background: M.paper2, padding: "18px 20px", borderRadius: 2, fontSize: 13.5, color: M.ink2, lineHeight: 1.7, fontFamily: M.font }}>
        지금 만난 마음들을 <b style={{ color: M.ink }}>그대로 이어받아</b> 워크북에서 배역과 관계를 풀어가요. 처음부터 다시 적지 않아도 돼요.
      </div>

      {/* CTA + 가격 — 워크북 페이지로 이동하지 않고 카드 결제 모달을 연다 */}
      <button
        type="button"
        onClick={onCheckout}
        style={{ ...ctaStyle, marginTop: 18 }}
        className="transition-transform active:scale-[0.99]"
      >
        워크북으로 배역표 열기 <span style={{ opacity: 0.45 }}>·</span> {won(WORKSHOP_PRICE)}
      </button>
      <p style={{ textAlign: "center", marginTop: 14, fontSize: 12.5, color: M.mute, fontFamily: M.font }}>
        <span style={{ textDecoration: "line-through" }}>{won(WORKSHOP_ORIGINAL_PRICE)}</span> 에서 런칭 할인 {WORKSHOP_DISCOUNT_PERCENT}% 적용가
      </p>

      <Link
        href="/programs/counseling"
        onClick={() =>
          trackMetaEvent("Lead", { content_name: "minds_to_counseling" })
        }
        style={{ display: "block", marginTop: 14, padding: "15px 20px", borderRadius: 2, border: `1px solid ${M.line}`, textAlign: "center", fontSize: 14, fontWeight: 600, color: M.ink, fontFamily: M.font, textDecoration: "none" }}
      >
        혼자보다 함께가 편하다면, 1:1 심리상담 알아보기
      </Link>
    </CardShell>
  );
}
