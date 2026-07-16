"use client";

/**
 * 내면 아이 — 결과 스크롤(시네마틱 서사 + 잠금 카드). 판매 페이지.
 *
 * ★ 개편 이력 (2026-07-16, 청월당 레퍼런스):
 *   1차: 무료가 8섹션을 다 보여준 뒤 결제를 물었다 → 전환 0.
 *   2차: 무료를 '유형 진단 + 훅'까지로 좁힘.
 *   3차: 유형 이름·측정 지표마저 유료로(순수 판매 페이지) → 전환 여전히 0.
 *   4차(현재): **청월당식 서사↔카드 교대.** 유형 이름·얼굴·게이지·장면을 무료로 공개하고,
 *     각 카드는 "정보 공개 → + 이런 풀이를 더 해드려요(편익 체크리스트)"로 잠근다.
 *     서사는 밤하늘 배경 위 중앙정렬 텍스트가 한 문장씩 여러 화면에 흐르는 시네마틱.
 *     근거: `.claude/refs/cheongwoldang/PLAN.md` §9 + 메모리 project_cheongwoldang_reference.
 *
 * 무료로 공개(정적 데이터 — LLM 불필요):
 *   - 마음의 지형: score.areas (4영역 게이지, 완전 공개)
 *   - 유형 공개: card.child_name / one_liner / 선명한 일러스트
 *   - 자동적 사고: card.auto_thoughts (3개 공개, core_belief 는 빈칸)
 *   - 지킴이: guardian.label / card.surface_reaction (guardian_cost 는 빈칸)
 *   - 두 번째 아이: secondary_children[0] 블러 일러스트
 *   - 서사 개인화: free.portrait (유일한 LLM 생성 / 폴백 staticPortrait)
 * 잠금 뒤(유료 소구): 원인·해석·성장법. 편익으로 번역해 카피(feedback_benefit_translation_copy).
 *   ⚠️ 유료 소구 실값(core_belief 해석·guardian_cost 등)은 DOM 텍스트로 넣지 않는다(빈칸=더미).
 *
 * 결제 배선(보존): 가격/스티키 CTA → 공용 MindsCheckoutModal(funnel=INNER_CHILD_FUNNEL).
 *   카카오 로그인 복귀 시 ?checkout=1 표식으로 결제 모달 자동 재개(/minds 패턴).
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DISCLAIMER } from "@/lib/minds/inner-child/questions";
import { reportPricing } from "@/lib/minds/price-experiment";
import { MindsCheckoutModal } from "@/components/minds/MindsCheckoutModal";
import { INNER_CHILD_FUNNEL } from "@/lib/minds/funnel-config";
import { innerChildIllustration } from "@/lib/minds/inner-child/type-cards";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { trackMindsFunnel } from "@/lib/minds/track";
import type { FreeReportGenerated, TypeCard } from "@/lib/minds/inner-child/report-types";
import type { ScoreResult, AreaId, AreaScore } from "@/lib/minds/inner-child/types";

const AREA_LABEL: Record<AreaId, string> = {
  disconnection: "단절",
  impaired_autonomy: "자율성",
  other_directedness: "타인중심",
  overvigilance: "과잉경계",
};

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/**
 * portrait 정적 폴백 — 생성 훅이 없을 때(LLM 실패·구버전 블롭·프리뷰). 유저 응답을 되풀이하지
 * 않는 게 원칙(고정 리포트 인상 방지)이라 SCT 를 인용하지 않는다. core_belief 만 쓴다.
 */
function staticPortrait(card: TypeCard): string {
  return `남들에겐 사소해 보이는 순간에, 유독 당신만 먼저 반응하게 되는 때가 있죠. 마음 깊은 곳에 '${card.core_belief}'는 믿음이 자리 잡고 있어서, 이 아이는 그 순간을 그냥 지나치지 못하거든요.`;
}

export function InnerChildSalesPage({
  card,
  score,
  free,
  footerExtra,
  leadId,
  concern,
}: {
  card: TypeCard;
  /** 채점 결과. 지형(areas)·두 번째 아이(secondary_children)·지킴이 렌더에 쓴다. 없으면 해당 카드 생략. */
  score?: ScoreResult | null;
  /** 생성 훅. portrait 만 읽는다. 없으면 정적 폴백. */
  free?: FreeReportGenerated | null;
  footerExtra?: ReactNode;
  /** 결제·픽셀에 쓰는 leadId(무료 테스트 리드). */
  leadId?: string;
  /** 고민 자유서술(텍스트). 있으면 '고민 카드'에서 그대로 되돌려준다(개인화 증거). */
  concern?: string;
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pricing = reportPricing(leadId);
  const portrait = free?.portrait?.trim() || staticPortrait(card);
  const secondChild = score?.secondary_children?.[0] ?? null;
  // 고민 카드 — 쓴 텍스트를 그대로 되돌려준다. LLM 불필요(무료는 되돌려주기까지).
  const concernText = concern?.trim() || null;

  useEffect(() => {
    trackMindsFunnel("reached_paywall", INNER_CHILD_FUNNEL);
  }, []);

  const openCheckout = () => {
    trackMetaEvent("InitiateCheckout", {
      content_name: "inner_child_full",
      value: pricing.price,
      currency: "KRW",
    });
    trackMindsFunnel("checkout_click", INNER_CHILD_FUNNEL);
    setCheckoutOpen(true);
  };

  // 카카오 로그인 복귀 자동 재개 — ?checkout=1 표식이 있으면 결제 모달을 다시 연다.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "1") return;
    const url = window.location.pathname + window.location.hash;
    window.history.replaceState(null, "", url);
    const id = window.setTimeout(() => setCheckoutOpen(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  // 모션: 서사 화면에 별 레이어 주입 + 스크롤 진입 fade + 별 패럴럭스. reduced-motion 정지.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scenes = Array.from(root.querySelectorAll<HTMLElement>(".ic-scene"));
    const starEls: HTMLElement[] = [];
    scenes.forEach((s) => {
      const d = document.createElement("div");
      d.className = "ic-stars";
      s.insertBefore(d, s.firstChild);
      starEls.push(d);
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          e.target.querySelectorAll<HTMLElement>(".ic-fill").forEach((f) => {
            f.style.width = (f.getAttribute("data-w") || "0") + "%";
          });
          io.unobserve(e.target);
        });
      },
      { threshold: 0.16 },
    );
    root.querySelectorAll(".ic-anim").forEach((el) => io.observe(el));

    let onScroll: (() => void) | null = null;
    if (!reduce && scenes.length) {
      let ticking = false;
      const run = () => {
        const vh = window.innerHeight;
        scenes.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -60 || r.top > vh + 60) return;
          const progress = (r.top + r.height / 2 - vh / 2) / vh;
          starEls[i].style.transform = `translateY(${(progress * 46).toFixed(1)}px)`;
        });
        ticking = false;
      };
      onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(run);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      run();
    }

    return () => {
      io.disconnect();
      if (onScroll) window.removeEventListener("scroll", onScroll);
      starEls.forEach((d) => d.remove());
    };
  }, []);

  const src = innerChildIllustration(card.schema_id);
  const secondSrc = secondChild ? innerChildIllustration(secondChild.schema_id) : null;
  const areaRows = score
    ? (Object.entries(score.areas) as [AreaId, AreaScore][]).sort(
        (a, b) => a[1].rank - b[1].rank,
      )
    : [];
  const areaMax = Math.max(1, ...areaRows.map(([, v]) => v.score));

  return (
    <div className="ic-root" ref={rootRef}>
      <style>{CSS}</style>

      {/* ── 오프닝 시네마틱 (한 문장씩) ── */}
      <section className="ic-scene ic-tall ic-anim">
        <div className="ic-inner">
          <p className="ic-eyebrow ic-line">분석 완료</p>
          <p className="ic-big ic-line ic-d1">
            당신이 방금 남긴 <b>24개의 대답</b>,
          </p>
          <p className="ic-big ic-line ic-d2">하나도 흘리지 않았어요.</p>
        </div>
        <span className="ic-scrollhint"><ArrowDown /></span>
      </section>

      <section className="ic-scene ic-anim">
        <div className="ic-inner">
          <p className="ic-line">당신의 대답을 하나하나 따라가다 보니,</p>
          <p className="ic-line ic-d1">마음 안쪽에 <b>아이</b>가 하나 앉아 있었어요.</p>
        </div>
        <span className="ic-scrollhint"><ArrowDown /></span>
      </section>

      <section className="ic-scene ic-anim">
        <div className="ic-inner">
          <p className="ic-line">오래전부터 거기 있었는데,</p>
          <p className="ic-line ic-d1">그동안 아무도 이름을 불러주지 않았대요.</p>
        </div>
      </section>

      {/* ── 개인화 훅 (portrait) ── */}
      <div className="ic-cardwrap ic-anim">
        <div className="ic-card">
          <p className="ic-eyebrow2">당신의 이야기</p>
          <p className="ic-portrait">{portrait}</p>
        </div>
      </div>

      {/* ── 마음의 지형 (무료·전체 공개) ── */}
      {areaRows.length > 0 && (
        <>
          <section className="ic-scene ic-short ic-anim">
            <div className="ic-inner">
              <p className="ic-line">먼저, 당신 마음이 어디로 기울어 있는지<br />가만히 들여다볼게요.</p>
            </div>
          </section>
          <div className="ic-cardwrap ic-anim">
            <div className="ic-card">
              <div className="ic-center"><span className="ic-free">무료 · 전체 공개</span></div>
              <h2 className="ic-h2">당신 마음의 지형</h2>
              <p className="ic-muted ic-center ic-small" style={{ marginBottom: 20 }}>
                네 갈래 중 어디에 마음이 쏠려 있는지, 당신 응답 그대로.
              </p>
              <div className="ic-map">
                {areaRows.map(([area, v], i) => (
                  <div className="ic-row" key={area}>
                    <span className="ic-rl">{AREA_LABEL[area]}</span>
                    <span className="ic-track">
                      <span
                        className={"ic-fill" + (i > 1 ? " ic-dim" : "")}
                        data-w={String(Math.max(14, Math.round((v.score / areaMax) * 100)))}
                      />
                    </span>
                    <span className="ic-rv">{v.score}</span>
                  </div>
                ))}
              </div>
              <p className="ic-small ic-muted ic-center" style={{ marginTop: 20 }}>
                가장 크게 대답한 곳은 <b className="ic-ink">{AREA_LABEL[areaRows[0][0]]}</b> 쪽이에요.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── 유형 공개 (이름·얼굴 무료 + 잠금) ── */}
      <section className="ic-scene ic-short ic-anim">
        <div className="ic-inner">
          <p className="ic-line">그 갈래 안에서도,</p>
          <p className="ic-line ic-d1">유난히 크게 대답한 아이가 하나 있었어요.</p>
        </div>
      </section>
      <section className="ic-scene ic-short ic-anim">
        <div className="ic-inner">
          <p className="ic-big ic-line">이 아이한테는 이미<br /><b>이름</b>이 있더라고요.</p>
        </div>
        <span className="ic-scrollhint"><ArrowDown /></span>
      </section>

      <div className="ic-cardwrap ic-anim">
        <div className="ic-card ic-reveal">
          <span className="ic-free">이름과 얼굴은 무료</span>
          {src ? (
            <img className="ic-avatar" src={src} alt={card.child_name} draggable={false} />
          ) : (
            <div className="ic-avatar" style={{ background: "#2a2a2e" }} />
          )}
          <p className="ic-name">{card.child_name}</p>
          <p className="ic-muted" style={{ margin: "0 4px" }}>{card.one_liner}</p>
          <Lockbox
            checks={[
              <>왜 유독 나만 <b>이렇게 반응하는지</b></>,
              <>이 마음이 <b>지켜준 것</b>과 앞으로 살릴 강점</>,
              <>관계에서 <b>덜 흔들리며</b> 지내는 법</>,
              <>이 아이가 <b>편안해지는 순간</b></>,
            ]}
          />
        </div>
      </div>

      {/* ── 고민 카드 (고민 칩 반영, 정적 개인화) ── */}
      {concernText && (
        <>
          <section className="ic-scene ic-anim">
            <div className="ic-inner">
              <p className="ic-line">그리고 마지막에 남긴</p>
              <p className="ic-big ic-line ic-d1"><b>그 고민,</b><br />그냥 지나칠 수 없죠.</p>
              <p className="ic-hint ic-line ic-d2">이 아이와 어떻게 연결되는지 따라가 볼게요</p>
            </div>
            <span className="ic-scrollhint"><ArrowDown /></span>
          </section>
          <div className="ic-cardwrap ic-anim">
            <div className="ic-card">
              <div className="ic-center"><span className="ic-worry">당신이 남긴 고민</span></div>
              <blockquote className="ic-concern-quote">“{concernText}”</blockquote>
              <p className="ic-muted ic-center" style={{ margin: "16px 0 0", fontSize: 15.5, lineHeight: 1.8 }}>
                이 고민을 그냥 지나치지 못하는 건, 우연이 아니라 <b className="ic-ink">이 아이 때문</b>일지 몰라요.
              </p>
              <p className="ic-fillsent ic-center">
                이 고민 뒤에서 진짜 걸리는 건<br />
                <span className="ic-blank"><span>●●●●●●</span></span> 이에요.
              </p>
              <Lockbox
                checks={[
                  <>이 고민이 <b>이 아이와 어떻게 연결</b>되는지</>,
                  <>그 자리에서 <b>덜 휘둘리는</b> 법</>,
                  <>이 마음이 오히려 <b>강점이 되는</b> 순간</>,
                ]}
              />
            </div>
          </div>
        </>
      )}

      {/* ── 자동적 사고 (3개 공개 + 빈칸 + 잠금) ── */}
      {card.auto_thoughts?.length > 0 && (
        <>
          <section className="ic-scene ic-short ic-anim">
            <div className="ic-inner">
              <p className="ic-line">이 아이가 깨어나면, 머릿속엔</p>
              <p className="ic-big ic-line ic-d1">거의 <b>똑같은 생각</b>이<br />자동으로 켜져요.</p>
            </div>
          </section>
          <div className="ic-cardwrap ic-anim">
            <div className="ic-card">
              <div className="ic-center"><span className="ic-free">생각은 그대로 공개</span></div>
              <h2 className="ic-h2">당신이 자주 하는 생각</h2>
              <div className="ic-thoughts">
                {card.auto_thoughts.slice(0, 3).map((t, i) => (
                  <div className="ic-thought" key={i}>{t}</div>
                ))}
              </div>
              <p className="ic-fillsent ic-center">
                세 문장은 달라 보여도, 뿌리는<br />
                <span className="ic-blank"><span>●●●●●●●</span></span> 하나예요.
              </p>
              <Lockbox
                checks={[
                  <>왜 자꾸 <b>같은 생각에 빠지는지</b></>,
                  <>그 생각을 <b>믿지 않아도 되는</b> 이유</>,
                  <>생각이 나를 흔들 때 <b>빠져나오는</b> 법</>,
                ]}
              />
            </div>
          </div>
        </>
      )}

      {/* ── 반복 고리 (3단계 공개, 4·5 잠금) ── */}
      <section className="ic-scene ic-short ic-anim">
        <div className="ic-inner">
          <p className="ic-line">이 생각들은 아무 데서나 튀어나오는 게 아니에요.</p>
          <p className="ic-big ic-line ic-d1">매번 <b>똑같은 길</b>을 돌거든요.</p>
        </div>
      </section>
      <div className="ic-cardwrap ic-anim">
        <div className="ic-card">
          <div className="ic-center"><span className="ic-free">앞 세 칸은 무료</span></div>
          <h2 className="ic-h2">같은 상처가 도는 길</h2>
          <div className="ic-loop">
            <LoopStep n="1" t="신호" d="마음이 걸리는 순간이 생긴다" />
            <LoopStep n="2" t="해석" d="최악을 먼저 가정한다" />
            <LoopStep n="3" t="행동" d="확인하거나, 먼저 물러난다" />
            <LoopStep n="4" t="돌아오는 결과" d="그 행동이 남기는 것, 그리고 나에게 돌아오는 것" locked />
            <LoopStep n="5" t="굳어지는 믿음" d="고리가 끝날 때마다 아이가 다시 확인받는 그 문장" locked />
          </div>
          <Lockbox
            checks={[
              <>이 반복이 <b>어떻게 끝나는지</b></>,
              <>같은 자리로 <b>다시 안 돌아오는</b> 법</>,
              <>이 고리를 끊고 <b>한 걸음 나아가는</b> 법</>,
            ]}
          />
        </div>
      </div>

      {/* ── 지킴이 (정체 공개 + 빈칸 + 잠금) ── */}
      {score?.guardian && (
        <>
          <section className="ic-scene ic-anim">
            <div className="ic-inner">
              <p className="ic-line">그런데 이 아이는, 사실</p>
              <p className="ic-big ic-line ic-d1">당신을 <b>지키려고</b><br />이 모든 걸 해온 거예요.</p>
            </div>
          </section>
          <div className="ic-cardwrap ic-anim">
            <div className="ic-card">
              <div className="ic-center"><span className="ic-free">지킴이 정체는 공개</span></div>
              <h2 className="ic-h2">이 아이를 지켜온 것</h2>
              <div className="ic-gname"><span className="ic-badge">{score.guardian.label}</span></div>
              {card.surface_reaction && (
                <p className="ic-muted ic-center ic-small" style={{ margin: "10px 0 0" }}>
                  겉으로는 <b className="ic-ink">{card.surface_reaction}</b> 모습으로 나타나요.
                </p>
              )}
              <p className="ic-fillsent ic-center" style={{ marginTop: 14 }}>
                이 지킴이가 당신 대신 조용히 치른 값은<br />
                <span className="ic-blank"><span>●●●●●●</span></span> 이에요.
              </p>
              <Lockbox
                checks={[
                  <>이 방어가 <b>대신 내준 것</b></>,
                  <>애쓰지 않아도 <b>안전해지는</b> 법</>,
                  <>나를 지키는 <b>더 편한 방식</b></>,
                ]}
              />
            </div>
          </div>
        </>
      )}

      {/* ── 시작일 뿐 (강) ── */}
      <section className="ic-scene ic-tall ic-anim">
        <div className="ic-inner">
          <p className="ic-big ic-line">그리고 여기까지는…</p>
          <p className="ic-big ic-line ic-d1">그저 <b>시작</b>일 뿐이에요.</p>
          <p className="ic-line ic-d2" style={{ marginTop: 22 }}>
            당신 안엔 아직 얼굴을<br />안 보여준 게 더 있거든요.
          </p>
        </div>
        <span className="ic-scrollhint"><ArrowDown /></span>
      </section>

      {/* ── 예고 티저 레일 ── */}
      <div className="ic-teaser ic-anim">
        <div className="ic-th"><p>리포트에서 이어지는 것들</p><p className="ic-sub">→ 옆으로 넘겨보세요</p></div>
        <div className="ic-rail">
          <TeaserCard t={<>이 아이의<br />전체 구조</>} d="이름 뒤에 숨은 형성 배경과 세 영역 발현" />
          <TeaserCard t={<>두 번째<br />아이</>} d="얼굴을 가린 또 하나의 아이와 둘의 관계" />
          <TeaserCard t={<>이 아이와<br />잘 지내는 법</>} d="관계에서·혼자일 때·마음속 실천" />
          <TeaserCard t={<>마무리<br />편지</>} d="오늘의 내가 그 아이에게 건네는 말" />
        </div>
      </div>

      {/* ── 두 번째 아이 (블러 + 잠금) ── */}
      {secondChild && (
        <div className="ic-cardwrap ic-anim">
          <div className="ic-card ic-second">
            <div className="ic-swrap">
              {secondSrc ? (
                <img src={secondSrc} alt="" aria-hidden draggable={false} />
              ) : (
                <div style={{ width: "100%", height: "100%", borderRadius: 999, background: "#2a2a2e" }} />
              )}
              <span className="ic-lk"><LockIcon size={40} /></span>
            </div>
            <h2 className="ic-h2">두 번째 아이는,<br />아직 얼굴을 가리고 있어요</h2>
            <Lockbox
              center
              checks={[
                <>두 번째 아이의 <b>이름과 얼굴</b></>,
                <>두 마음이 부딪힐 때 <b>나를 다루는</b> 법</>,
                <>어떤 날은 왜 <b>완전히 다른 내가</b> 되는지</>,
              ]}
            />
          </div>
        </div>
      )}

      {/* ── 마무리 서사 ── */}
      <section className="ic-scene ic-tall ic-anim">
        <div className="ic-inner">
          <p className="ic-line">이 아이는 당신을 오래 지켜온 아이예요.</p>
          <p className="ic-line ic-d1">없애야 할 아이가 아니라,<br />이제 <b>이름을 불러줄</b> 아이죠.</p>
          {card.reparenting_line && (
            <p className="ic-voice ic-line ic-d2" style={{ marginTop: 28 }}>“{card.reparenting_line}”</p>
          )}
        </div>
      </section>

      {/* ── 가격 (자미두수식 계산표) ── */}
      <div className="ic-cardwrap ic-anim">
        <h2 className="ic-center" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.34, letterSpacing: "-0.01em" }}>
          가려둔 곳까지,<br />끝까지 만나볼까요?
        </h2>
        <p className="ic-muted ic-center" style={{ margin: "10px 0 18px" }}>
          지금까지 궁금했던 것들이, <b className="ic-ink">그래서 어떻게 나아질지</b>까지 전부 열려요.
        </p>
        <div className="ic-card">
          <p className="ic-prod-title">내면 아이 심층 리포트<span className="ic-prod-sub">14개 이야기</span></p>
          <ul className="ic-toc" style={{ margin: "16px 0 0" }}>
            <li>왜 유독 나만 이런지 — <b>이 마음의 뿌리</b></li>
            <li>이 아이가 <b>처음 생긴 곳</b>과 전체 구조</li>
            <li>반복되는 생각에서 <b>자유로워지는</b> 법</li>
            <li>같은 상처를 <b>끊고 나아가는</b> 법</li>
            <li>관계에서 <b>나를 지키는 더 편한 방식</b></li>
            <li>두 번째 아이까지 만나고, <b>오늘의 나에게 건네는 편지</b></li>
          </ul>
        </div>
        <div className="ic-pricebox">
          <div className="ic-pline"><span>내면 아이 심층 리포트</span><span className="ic-was">{won(pricing.originalPrice)}</span></div>
          <div className="ic-pline">
            <span className="ic-disc-label">특별할인 <span className="ic-pct">{Math.round((1 - pricing.price / pricing.originalPrice) * 100)}%</span></span>
            <span className="ic-minus">−{won(pricing.originalPrice - pricing.price)}</span>
          </div>
          <div className="ic-pdiv" />
          <div className="ic-pline ic-total"><span className="ic-tlabel">최종 결제가</span><span className="ic-final">{won(pricing.price)}</span></div>
        </div>
      </div>

      <p className="ic-disc">기분 리포트 · INNER CHILD REPORT · {DISCLAIMER}</p>
      {footerExtra ? <div className="ic-foot-extra">{footerExtra}</div> : null}
      <div className="ic-foot-space" />

      {/* ── 스티키 CTA ── */}
      <div className="ic-sticky">
        <p className="ic-cap">3초면 열려요 · 링크로 언제든 다시 볼 수 있어요</p>
        <button type="button" className="ic-cta" onClick={openCheckout}>전체 리포트 받아보기 →</button>
      </div>

      <MindsCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        funnel={INNER_CHILD_FUNNEL}
        priceOverride={{ price: pricing.price, originalPrice: pricing.originalPrice }}
      />
    </div>
  );
}

/* ─────────────── 조각 ─────────────── */

function Lockbox({ checks, center = false }: { checks: ReactNode[]; center?: boolean }) {
  return (
    <div className="ic-lockbox" style={center ? { textAlign: "center" } : undefined}>
      <span className="ic-lock-ico"><LockIcon size={34} /></span>
      <p className="ic-lh">+ 이런 풀이를 더 해드려요!</p>
      <div className="ic-hr" />
      <ul className="ic-checks" style={center ? { maxWidth: 300, margin: "0 auto" } : undefined}>
        {checks.map((c, i) => <li key={i}>{c}</li>)}
      </ul>
    </div>
  );
}

function LoopStep({ n, t, d, locked = false }: { n: string; t: string; d: string; locked?: boolean }) {
  return (
    <div className={"ic-st" + (locked ? " ic-locked" : "")}>
      <span className="ic-dot">{n}</span>
      <div>
        <p className="ic-st-t">{t}</p>
        <p className="ic-st-d">{d}</p>
      </div>
    </div>
  );
}

function TeaserCard({ t, d }: { t: ReactNode; d: string }) {
  return (
    <div className="ic-tcard">
      <span className="ic-tlock"><LockIcon size={18} /></span>
      <p className="ic-tt">{t}</p>
      <p className="ic-td">{d}</p>
    </div>
  );
}

function ArrowDown() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

function LockIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x={4} y={10} width={16} height={11} rx={2.5} />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/* ─────────────── CSS (밤하늘 서사 + 크림 카드, 라벤더 포인트) ─────────────── */

const CSS = `
/* 항상 다크 — 판매 페이지는 다크 고정(라이트/OS 자동 대응 없음, 파운더 지시). */
.ic-root{
  --paper:#211D18;--paper-2:#29241D;--ink:#EDE4D3;--pencil:#9A9082;
  --rule:#342D24;--edge:#3A3228;--sage:#A6A2E0;--sage-soft:#322F47;
  --shadow:0 0 0;--lock-veil:33 29 24;
  background:var(--paper);color:var(--ink);
  font-family:'Pretendard',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;
  line-height:1.7;-webkit-font-smoothing:antialiased;
  max-width:440px;margin:0 auto;position:relative;overflow-x:hidden;
}
.ic-root *{box-sizing:border-box;}
.ic-root h2,.ic-root p,.ic-root ul{margin:0;}
.ic-ink{color:var(--ink);}
.ic-muted{color:var(--pencil);}
.ic-small{font-size:13px;}
.ic-center{text-align:center;}
.ic-h2{font-size:24px;line-height:1.34;letter-spacing:-.01em;font-weight:800;text-align:center;text-wrap:balance;}

/* 서사 (밤하늘, 테마 무관 고정) */
.ic-scene{position:relative;min-height:78vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 34px;color:#F1E9DA;overflow:hidden;background:radial-gradient(62% 42% at 50% 20%,rgba(92,88,142,.30),transparent 72%),#1C1813;box-shadow:inset 0 -90px 110px -30px rgba(0,0,0,.72),inset 0 70px 90px -40px rgba(0,0,0,.5);}
.ic-scene.ic-short{min-height:60vh;}
.ic-scene.ic-tall{min-height:92vh;}
.ic-stars{position:absolute;inset:-16% 0;z-index:0;pointer-events:none;will-change:transform;}
.ic-stars::before,.ic-stars::after{content:"";position:absolute;inset:0;}
.ic-stars::before{background:radial-gradient(1.5px 1.5px at 12% 18%,#fff,transparent),radial-gradient(1px 1px at 28% 42%,rgba(255,255,255,.8),transparent),radial-gradient(1.5px 1.5px at 45% 12%,rgba(255,255,255,.9),transparent),radial-gradient(1px 1px at 62% 30%,rgba(255,255,255,.65),transparent),radial-gradient(1.5px 1.5px at 78% 22%,#fff,transparent),radial-gradient(1px 1px at 35% 90%,rgba(255,255,255,.6),transparent);animation:icTw1 4.5s ease-in-out infinite;}
.ic-stars::after{background:radial-gradient(1px 1px at 88% 48%,rgba(255,255,255,.75),transparent),radial-gradient(1px 1px at 18% 68%,rgba(255,255,255,.6),transparent),radial-gradient(1.5px 1.5px at 52% 78%,rgba(255,255,255,.8),transparent),radial-gradient(1px 1px at 72% 88%,rgba(255,255,255,.55),transparent),radial-gradient(1px 1px at 8% 40%,rgba(255,255,255,.5),transparent),radial-gradient(1.5px 1.5px at 92% 14%,#fff,transparent);animation:icTw2 6s ease-in-out infinite;}
@keyframes icTw1{0%,100%{opacity:.95}50%{opacity:.5}}
@keyframes icTw2{0%,100%{opacity:.5}50%{opacity:.95}}
.ic-inner{position:relative;z-index:1;max-width:340px;}
.ic-scene p{font-size:21px;line-height:1.85;font-weight:600;color:#F1E9DA;text-wrap:balance;}
.ic-scene p+p{margin-top:18px;}
.ic-scene p b{color:#fff;font-weight:800;}
.ic-scene .ic-big{font-size:25px;}
.ic-scene .ic-eyebrow{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#9A9DB8;font-weight:700;margin-bottom:22px;}
.ic-scene .ic-hint{margin-top:22px;font-size:12.5px;letter-spacing:.14em;color:#8E93AD;font-weight:700;}
.ic-scene .ic-voice{font-style:italic;color:#B5B1E4;font-size:23px;font-weight:500;line-height:1.7;}
.ic-scrollhint{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);z-index:1;color:#8E93AD;opacity:.8;}
.ic-scrollhint svg{animation:icBob 1.8s ease-in-out infinite;}
@keyframes icBob{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}
.ic-line{opacity:0;transform:translateY(16px);filter:blur(7px);transition:opacity 1s ease,transform 1.1s cubic-bezier(.2,.7,.2,1),filter 1.1s ease;}
.ic-scene.in .ic-line{opacity:1;transform:none;filter:none;}
.ic-scene.in .ic-d1{transition-delay:.3s;}
.ic-scene.in .ic-d2{transition-delay:.75s;}

/* 카드 */
.ic-cardwrap{padding:42px 26px;position:relative;}
.ic-card{background:var(--paper-2);border:1.5px solid var(--edge);border-radius:18px;padding:26px 22px;box-shadow:0 12px 30px -20px rgb(var(--shadow)/.5);}
.ic-eyebrow2{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--pencil);font-weight:700;margin-bottom:12px;text-align:center;}
.ic-portrait{font-size:17px;line-height:1.9;color:var(--ink);white-space:pre-line;}
.ic-free{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:var(--sage);border:1.5px solid var(--sage);border-radius:999px;padding:3px 10px 3px 8px;margin-bottom:8px;}
.ic-free::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--sage);}
.ic-worry{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:var(--sage);background:var(--sage-soft);border-radius:999px;padding:5px 13px 5px 10px;margin-bottom:12px;}
.ic-concern-quote{margin:16px 0 0;padding:16px 18px;background:var(--paper);border:1px solid var(--edge);border-left:3px solid var(--sage);border-radius:4px 12px 12px 4px;font-size:16px;line-height:1.75;font-weight:600;color:var(--ink);white-space:pre-wrap;}
.ic-worry::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--sage);}

.ic-lockbox{border:1.6px dashed var(--sage);border-radius:16px;padding:24px 20px 20px;margin-top:22px;text-align:center;background:rgb(var(--lock-veil)/.5);}
.ic-lock-ico{color:var(--sage);display:block;margin:0 auto 10px;height:34px;}
.ic-lh{font-weight:800;font-size:15.5px;margin-bottom:4px;}
.ic-hr{height:1px;background:var(--edge);margin:15px 2px 17px;}
.ic-checks{list-style:none;text-align:left;display:grid;gap:13px;}
.ic-checks li{position:relative;padding-left:30px;font-size:14.5px;line-height:1.5;}
.ic-checks li::before{content:"";position:absolute;left:0;top:1px;width:19px;height:19px;border-radius:50%;background:var(--sage);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M20 6 9 17l-5-5' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/13px no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M20 6 9 17l-5-5' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/13px no-repeat;}
.ic-checks b{font-weight:700;}

.ic-fillsent{font-size:15.5px;line-height:1.95;margin-top:4px;}
.ic-blank{display:inline-block;border:1.5px solid var(--sage);border-radius:999px;padding:1px 18px;vertical-align:middle;background:var(--sage-soft);}
.ic-blank span{filter:blur(6px);user-select:none;font-weight:700;color:var(--ink);}

.ic-map{display:grid;gap:13px;margin-top:6px;}
.ic-row{display:grid;grid-template-columns:74px 1fr 32px;align-items:center;gap:10px;}
.ic-rl{font-size:13.5px;font-weight:600;}
.ic-track{height:12px;background:var(--rule);border-radius:999px;overflow:hidden;}
.ic-fill{display:block;height:100%;background:var(--sage);border-radius:999px;width:0;transition:width 1.1s cubic-bezier(.2,.7,.2,1);}
.ic-fill.ic-dim{background:var(--edge);}
.ic-rv{font-size:12.5px;font-weight:700;text-align:right;color:var(--pencil);font-variant-numeric:tabular-nums;}

.ic-reveal{text-align:center;}
.ic-avatar{width:168px;height:168px;border-radius:50%;object-fit:cover;border:3px solid var(--paper);box-shadow:0 0 0 2px var(--sage),0 14px 30px -12px rgb(var(--shadow)/.5);margin:6px 0 18px;}
.ic-name{font-size:27px;font-weight:800;letter-spacing:-.01em;margin-bottom:8px;}

.ic-thoughts{display:grid;gap:11px;margin:16px 0 4px;}
.ic-thought{background:var(--paper);border:1.5px solid var(--edge);border-radius:16px 16px 16px 4px;padding:12px 15px;font-size:15px;font-weight:600;position:relative;}
.ic-thought::after{content:"\\201D";position:absolute;right:12px;bottom:2px;color:var(--edge);font-size:22px;}

.ic-loop{display:grid;gap:0;margin:16px 0 4px;}
.ic-st{display:grid;grid-template-columns:30px 1fr;gap:12px;padding:0 0 18px;position:relative;}
.ic-st:not(:last-child)::before{content:"";position:absolute;left:14px;top:28px;bottom:-2px;width:2px;background:var(--edge);}
.ic-dot{width:28px;height:28px;border-radius:50%;background:var(--sage);color:#fff;font-weight:800;font-size:12px;display:grid;place-items:center;z-index:1;}
.ic-st-t{font-weight:700;font-size:14.5px;margin:3px 0 3px;}
.ic-st-d{font-size:13px;color:var(--pencil);}
.ic-st.ic-locked .ic-dot{background:var(--edge);color:var(--pencil);}
.ic-st.ic-locked .ic-st-t,.ic-st.ic-locked .ic-st-d{filter:blur(5px);user-select:none;}

.ic-gname{display:flex;align-items:center;gap:10px;margin:6px 0 4px;justify-content:center;}
.ic-badge{font-size:12.5px;font-weight:800;color:var(--paper);background:var(--ink);border-radius:8px;padding:5px 12px;}

.ic-second{text-align:center;}
.ic-swrap{position:relative;width:150px;height:150px;margin:6px auto 16px;}
.ic-swrap img{width:100%;height:100%;border-radius:50%;object-fit:cover;filter:blur(11px) saturate(.7);transform:scale(1.15);}
.ic-lk{position:absolute;inset:0;display:grid;place-items:center;color:var(--sage);}

.ic-teaser{padding:40px 0 44px;background:#1C1813;position:relative;overflow:hidden;}
.ic-teaser::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(1px 1px at 20% 30%,rgba(255,255,255,.6),transparent),radial-gradient(1.5px 1.5px at 70% 20%,#fff,transparent),radial-gradient(1px 1px at 85% 60%,rgba(255,255,255,.5),transparent),radial-gradient(1px 1px at 40% 75%,rgba(255,255,255,.5),transparent);}
.ic-th{text-align:center;padding:0 26px 18px;position:relative;z-index:1;}
.ic-th p{font-size:20px;font-weight:800;color:#F1E9DA;}
.ic-th .ic-sub{font-size:13px;color:#9096B0;font-weight:600;margin-top:6px;}
.ic-rail{display:flex;gap:14px;overflow-x:auto;padding:6px 26px 14px;scroll-snap-type:x mandatory;scrollbar-width:none;position:relative;z-index:1;}
.ic-rail::-webkit-scrollbar{display:none;}
.ic-tcard{flex:0 0 150px;scroll-snap-align:center;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.14);border-radius:14px;padding:18px 15px;min-height:148px;position:relative;color:#F1E9DA;}
.ic-tlock{position:absolute;top:12px;right:12px;color:var(--sage);opacity:.9;}
.ic-tt{font-weight:800;font-size:15px;margin:26px 0 8px;}
.ic-td{font-size:12.5px;color:#A79E8E;filter:blur(2.5px);}

.ic-prod-title{font-weight:800;font-size:16px;text-align:center;}
.ic-prod-sub{color:var(--pencil);font-weight:600;font-size:13px;margin-left:8px;}
.ic-toc{list-style:none;display:grid;gap:10px;}
.ic-toc li{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;}
.ic-toc li::before{content:"";margin-top:7px;width:5px;height:5px;border-radius:50%;background:var(--sage);flex:none;}
.ic-pricebox{margin-top:20px;padding:4px 4px 0;}
.ic-pline{display:flex;justify-content:space-between;align-items:center;font-size:15px;padding:8px 2px;}
.ic-was{color:var(--pencil);text-decoration:line-through;font-variant-numeric:tabular-nums;}
.ic-disc-label{color:var(--sage);font-weight:700;display:inline-flex;align-items:center;gap:8px;}
.ic-pct{background:var(--sage);color:#fff;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800;}
.ic-minus{color:var(--sage);font-weight:800;font-variant-numeric:tabular-nums;}
.ic-pdiv{height:1.5px;background:var(--edge);margin:8px 0;}
.ic-total{padding-top:12px;}
.ic-tlabel{font-weight:800;font-size:16px;}
.ic-final{font-size:30px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;}

.ic-disc{font-size:11.5px;color:var(--pencil);line-height:1.6;padding:26px 26px 10px;text-align:center;}
.ic-foot-extra{padding:0 26px;}
.ic-foot-space{height:104px;}

.ic-sticky{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:440px;z-index:60;background:linear-gradient(180deg,transparent,var(--paper) 30%);padding:30px 26px calc(18px + env(safe-area-inset-bottom,0px));}
.ic-cap{text-align:center;font-size:12px;color:var(--pencil);margin-bottom:10px;}
.ic-cta{display:block;width:100%;text-align:center;cursor:pointer;background:var(--ink);color:var(--paper);border:none;border-radius:14px;font-size:16.5px;font-weight:800;padding:17px;font-family:inherit;}

.ic-anim{opacity:0;transform:translateY(22px) scale(.985);transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.2,1);}
.ic-anim.in{opacity:1;transform:none;}
@media (prefers-reduced-motion:reduce){
  .ic-anim,.ic-line{opacity:1;transform:none;filter:none;transition:none;}
  .ic-fill{transition:none;}
  .ic-scrollhint svg,.ic-stars::before,.ic-stars::after{animation:none;}
  .ic-stars{transform:none!important;}
}
`;
