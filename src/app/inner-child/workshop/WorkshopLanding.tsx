"use client";

/**
 * 워크샵 랜딩 본문 — 디자인 핸드오프(innerchild-A-final.html) 기반 + 사용자 수정 반영.
 *
 * 다크 "타이포 브루탈리즘" 상세페이지. 마퀴만 최상단 풀블리드 흰 배너, 그 외 모든
 * 섹션은 하나의 좁은 중앙 컬럼(.container, 520px)에 담아 좌우 기준선을 통일한다.
 * STATEMENT 는 일러스트(가로 크롭) + 불투명 다크 패널 위 텍스트(컬럼 내부, 스택).
 * 16유형은 실제 일러스트를 4개씩 4장 슬라이드(캐러셀). 카피는 존댓말(해요체).
 *
 * 버튼 배선(핵심, 변경 없음):
 *  - HERO .cta / CLOSE .btnGhost → #pricing 스무스 스크롤만(픽셀 발화 없음).
 *  - PRICE .btnBuy → ① WorkshopCTAClick 픽셀 ② 로그인 게이트 ③ 결제 모달.
 *  - 로그인 복귀 시 ?checkout=1 표식으로 모달 자동 재개.
 */

import { Suspense, useEffect, useRef, useState, type UIEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackMetaCustom } from "@/lib/meta-pixel";
import { createClient } from "@/lib/supabase/client";
import { WorkshopCheckoutModal } from "@/components/minds/inner-child/workshop/WorkshopCheckoutModal";
import { WORKSHOP_PRICE } from "@/lib/minds/relationship-constants";
import styles from "./WorkshopLanding.module.css";

/**
 * 16유형 — [이름, 일러스트 스키마 파일명, 한 줄 특징]. 파일: /inner-child/types/<schema>.png.
 * 이름은 핸드오프 카피, 스키마는 핸드오프 괄호 도식명 → 기존 힉스필드 일러스트 매핑.
 * 특징은 각 심리도식의 핵심 감정을 해요체 한 줄로(카드 하단 노출).
 */
const INNER_CHILD_TYPES: ReadonlyArray<readonly [string, string, string]> = [
  ["문 앞에서 기다리는 아이", "abandonment", "소중한 사람이 곧 떠날 것 같아 늘 마음을 졸여요."],
  ["허기진 아이", "emotional_deprivation", "내 마음을 알아주는 사람은 없다고 느껴요."],
  ["숨어버린 아이", "defectiveness_shame", "진짜 나를 보면 실망할까 봐 자꾸 숨어요."],
  ["채찍 든 아이", "unrelenting_standards", "아무리 잘해도 늘 부족하게만 느껴져요."],
  ["너무 일찍 어른이 된 아이", "self_sacrifice", "내 필요보다 남을 먼저 챙기다 지쳐요."],
  ["등을 벽에 붙인 아이", "mistrust_abuse", "사람은 결국 나를 이용하거나 상처 준다고 믿어요."],
  ["창밖의 아이", "social_isolation", "어디에도 속하지 못한 것 같아 겉돌아요."],
  ["손을 놓지 못하는 아이", "dependence_incompetence", "혼자서는 해낼 수 없을 것 같아 불안해요."],
  ["떨고 있는 아이", "vulnerability_harm", "언제 나쁜 일이 닥칠지 몰라 늘 긴장해요."],
  ["그림자 아이", "enmeshment", "나와 남의 경계가 흐릿해 내 마음을 잘 몰라요."],
  ["주저앉은 아이", "failure", "나는 남들보다 뒤처진다고 느껴요."],
  ["고개 숙인 아이", "subjugation", "내 의견을 말하면 관계가 깨질까 봐 참아요."],
  ["왕관 쓴 아이", "entitlement", "규칙보다 내가 먼저여야 마음이 놓여요."],
  ["무대 위의 아이", "approval_seeking", "인정받아야만 내 가치가 증명되는 것 같아요."],
  ["걱정을 끌어안은 아이", "negativity_pessimism", "잘 될 일도 잘못될까 봐 먼저 걱정해요."],
  ["얼어붙은 아이", "emotional_inhibition", "감정을 드러내면 안 될 것 같아 꾹 눌러요."],
];

// 4개씩 4장 슬라이드로 묶는다(16개 한 번에 노출 시 너무 길어짐).
const TYPE_SLIDES: ReadonlyArray<
  ReadonlyArray<readonly [string, string, string]>
> = [
  INNER_CHILD_TYPES.slice(0, 4),
  INNER_CHILD_TYPES.slice(4, 8),
  INNER_CHILD_TYPES.slice(8, 12),
  INNER_CHILD_TYPES.slice(12, 16),
];

// 마퀴 항목 — 2배 복제(translateX(-50%) 무한 루프용).
const MARQUEE_ITEMS = [
  "심리도식 검사",
  "·",
  "1급 상담사 분석",
  "·",
  "90분 1:1 세션",
  "·",
  "종합 리포트",
  "·",
];

// useSearchParams 를 쓰는 본문은 Suspense 바운더리로 감싼다(CLAUDE.md 규칙).
export function WorkshopLanding() {
  return (
    <Suspense fallback={null}>
      <WorkshopLandingInner />
    </Suspense>
  );
}

function WorkshopLandingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  // 히어로 검색창 안에서 롤링될 내면 아이 이름 인덱스
  const [nameIndex, setNameIndex] = useState(0);

  // 로그인 복귀 자동 재개 — /login 게이트를 통과하면 ?checkout=1 로 돌아온다.
  useEffect(() => {
    if (searchParams.get("checkout") !== "1") return;
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.hash
    );
    const id = window.setTimeout(() => setCheckoutOpen(true), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PRICE .btnBuy 전용 — ① 픽셀(리다이렉트 전에 반드시 발화) ② 로그인 게이트 ③ 모달 오픈.
  const onBuyClick = async () => {
    trackMetaCustom("WorkshopCTAClick", {
      content_name: "inner_child_workshop",
      value: WORKSHOP_PRICE,
      currency: "KRW",
    });
    let loggedIn = false;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      loggedIn = !!user;
    } catch {
      /* 확인 실패는 비로그인으로 간주 — /login 게이트로 보낸다. */
    }
    if (!loggedIn) {
      router.push(
        "/login?next=" + encodeURIComponent("/inner-child/workshop?checkout=1")
      );
      return;
    }
    setCheckoutOpen(true);
  };

  // 캐러셀 스크롤 위치 → 활성 슬라이드(도트) 갱신.
  const onCarouselScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeSlide) setActiveSlide(idx);
  };

  // 16유형 캐러셀 자동 재생 — 2.2초마다 다음 슬라이드로 부드럽게(마지막→처음 순환).
  // 사용자가 만지는 동안(pausedRef)엔 멈춰 사용자 스와이프와 다투지 않게 한다.
  const carouselRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    // 모션 최소화 선호 시 자동 재생하지 않는다.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (pausedRef.current || el.clientWidth === 0) return;
      const count = TYPE_SLIDES.length;
      const current = Math.round(el.scrollLeft / el.clientWidth);
      const next = (current + 1) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  // 히어로 검색창 이름 롤링 — 1.9초마다 다음 내면 아이 이름으로.
  useEffect(() => {
    const id = window.setInterval(() => {
      setNameIndex((i) => (i + 1) % INNER_CHILD_TYPES.length);
    }, 1900);
    return () => window.clearInterval(id);
  }, []);

  // 사용자 상호작용 중 자동 재생 일시정지(터치/호버). 터치 종료 후 잠깐 뒤 재개.
  const pauseAutoplay = () => {
    pausedRef.current = true;
  };
  const resumeAutoplaySoon = () => {
    window.setTimeout(() => {
      pausedRef.current = false;
    }, 1200);
  };

  return (
    <>
      <main className={styles.root}>
        {/* 최상단 마퀴 배너 — 흰 배경 + 검정 텍스트(풀블리드) */}
        <div className={styles.marq}>
          <div className={styles.track}>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        </div>

        {/* 모든 섹션을 하나의 중앙 컬럼에 담아 좌우 기준선을 통일한다. */}
        <div className={styles.container}>
          {/* HERO — 모바일 세로 한 화면 꽉 차게(카피 위 · 가치 스택 아래) */}
          <section className={`${styles.hero} ${styles.pad}`}>
            <div className={styles.heroTop}>
              <p className={styles.kick}>1:1 ONLINE PSYCHOLOGY WORKSHOP</p>
              <p className={styles.heroLead}>전문 심리 상담사와 함께하는</p>
              <h1 className={styles.disp}>
                1:1 내면 아이
                <br />
                <span className={styles.or}>온라인 워크샵</span>
              </h1>
              <p className={styles.heroSub}>
                누구나 마음 속에 추방된 아이가 산다.
              </p>
            </div>
            {/* 내면 아이 이름이 하나씩 롤링되는 검색창(모션) */}
            <div className={styles.heroSearchWrap}>
              <div className={styles.heroSearch}>
                <svg
                  className={styles.searchIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21" y2="21" />
                </svg>
                <span className={styles.searchRoll}>
                  <span key={nameIndex} className={styles.searchName}>
                    {INNER_CHILD_TYPES[nameIndex][0]}
                  </span>
                </span>
                <span className={styles.searchCaret} aria-hidden="true" />
              </div>
              <p className={styles.heroSearchHint}>
                내 안엔 어떤 아이가 살고 있을까요?
              </p>
            </div>
            <div className={styles.heroBottom}>
              <ul className={styles.heroChecks}>
                <li>심리도식 검사 80문항 + 문장완성검사</li>
                <li>1급 상담사의 사전 채점 · 분석</li>
                <li>90분 1:1 심층 세션 (Zoom)</li>
                <li>나만을 위한 종합 분석 리포트</li>
              </ul>
              <div className={styles.heroPrice}>
                <span className={styles.heroPriceLabel}>이 모든 걸, 단 한 번에</span>
                <span className={styles.heroPriceAmt}>
                  99,000<span className={styles.won}>원</span>
                </span>
              </div>
            </div>
          </section>

          {/* PROBLEM */}
          <section className={styles.pad}>
            <p className={styles.kick}>THE PATTERN</p>
            <h2 className={styles.h2} style={{ margin: "16px 0 10px" }}>
              분명 어른인데
              <br />왜 자꾸 <span className={styles.or}>그때의 나</span>로
              <br />
              돌아갈까요
            </h2>
            <p className={styles.lead} style={{ marginBottom: "28px" }}>
              혹시 이런 순간들, 익숙하지 않으세요?
            </p>
            <div className={styles.prob}>
              <span className={styles.n}>01</span>
              <div>
                <h3>철렁, 하고 내려앉는 마음</h3>
                <p>
                  연락이 조금만 늦어도 마음이 철렁 내려앉고, 관계가 좋아질수록
                  오히려 불안해져요. &quot;언젠가 떠나지 않을까&quot; 하는 마음이
                  자꾸만 올라오고요.
                </p>
              </div>
            </div>
            <div className={styles.prob}>
              <span className={styles.n}>02</span>
              <div>
                <h3>거절하지 못하는 밤</h3>
                <p>
                  부탁을 거절하지 못해 다 맞춰주고, 돌아서서 혼자 억울해해요. 내
                  마음보다 상대의 기분이 늘 먼저인 것 같고요.
                </p>
              </div>
            </div>
            <div className={styles.prob}>
              <span className={styles.n}>03</span>
              <div>
                <h3>멈추지 않는 목소리</h3>
                <p>
                  충분히 해냈는데도 &quot;아직 부족해&quot;라는 목소리가 멈추질
                  않아요. 잠깐 쉬는 순간에도 마음이 편하지 않고요.
                </p>
              </div>
            </div>
          </section>

          {/* STATEMENT — 일러스트(가로 크롭) + 불투명 다크 패널 위 텍스트 */}
          <section className={`${styles.stmt} ${styles.pad}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.stmtImg}
              src="/inner-child/workshop/statement-bg.png"
              alt="무릎을 안고 홀로 앉아 있는 내면 아이 일러스트"
            />
            <div className={styles.stmtPanel}>
              <span className={styles.k}>NOT WEAKNESS</span>
              <h2 className={styles.h2}>
                의지가 약해서가
                <br />
                아니에요.
                <br />
                <span className={styles.or}>그때의 아이가</span>
                <br />
                반응하고 있었어요.
              </h2>
              <p className={styles.stmtBody}>
                심리학은 이 반복을 성격 탓으로 보지 않아요. 어린 시절 마음에
                새겨진 회로 — 이걸 <b>심리도식(schema)</b>이라고 불러요. 내면
                아이는 그 도식을 짊어진 채 마음 안쪽으로 밀려난 &lsquo;나의
                일부&rsquo;예요. 없애야 할 존재가 아니라,{" "}
                <b>아직 아무도 제대로 돌봐준 적 없는</b> 아이랍니다. 그 아이를
                알아봐 주는 것만으로도, 반복은 조금씩 느슨해지기 시작해요.
              </p>
            </div>
          </section>

          {/* 16 TYPES — 4장 슬라이드 캐러셀 */}
          <section className={styles.pad}>
            <p className={styles.kick}>16 INNER CHILDREN</p>
            <h2 className={styles.h2} style={{ margin: "16px 0 6px" }}>
              내 안의 아이는
              <br />
              16가지 얼굴을 해요
            </h2>
            <p className={styles.body}>
              18가지 심리도식이, 지금 내 안의 아이가 어떤 모습인지 알려줘요.
              검사를 통해 당신에게 가장 크게 자리 잡은 아이가 누구인지
              만나보세요.
            </p>

            <div
              ref={carouselRef}
              className={styles.carousel}
              onScroll={onCarouselScroll}
              onMouseEnter={pauseAutoplay}
              onMouseLeave={resumeAutoplaySoon}
              onTouchStart={pauseAutoplay}
              onTouchEnd={resumeAutoplaySoon}
            >
              {TYPE_SLIDES.map((slide, si) => (
                <div key={si} className={styles.slide}>
                  <div className={styles.slideGrid}>
                    {slide.map(([name, schema, desc], ci) => {
                      const num = si * 4 + ci + 1;
                      return (
                        <div key={schema} className={styles.tc}>
                          <div className={styles.tn}>
                            {String(num).padStart(2, "0")}
                          </div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className={styles.tcImg}
                            src={`/inner-child/types/${schema}.png`}
                            alt={name}
                            loading="lazy"
                          />
                          <div className={styles.nm}>{name}</div>
                          <p className={styles.td}>{desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.dots}>
              {TYPE_SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${
                    i === activeSlide ? styles.dotActive : ""
                  }`}
                />
              ))}
            </div>
            <p className={styles.swipeHint}>← 좌우로 넘겨보세요 →</p>
          </section>

          {/* DEFINE — 서비스 정의 밴드(16유형 → PROCESS 사이) */}
          <section className={`${styles.define} ${styles.pad}`}>
            <p className={styles.kick}>WHAT IT IS</p>
            <h2 className={styles.defTitle}>
              1급 심리 상담사와 내면 아이를 만나는
              <br />
              <span className={styles.or}>1:1 내면 아이 워크샵</span>(온라인)
            </h2>
            <p className={styles.defSub}>
              내면 아이 유형 진단부터 해석,
              <br />
              원인과 솔루션 도출까지 한국 상담심리학회 1급 심리상담사와 90분간
              진행됩니다
            </p>
          </section>

          {/* PROCESS — 고스트 넘버 카드 */}
          <section className={styles.pad}>
            <p className={styles.kick}>PROCESS / 측정 · 분석 · 대면</p>
            <p className={styles.lead}>세 단계로, 차근차근 함께 해요.</p>
            <div style={{ height: "18px" }} />
            <div className={styles.step} data-n="1">
              <span className={styles.sn}>STEP 1 · 온라인 15분</span>
              <h3>심리도식 검사</h3>
              <p>
                80문항 검사와 문장완성검사로, 내 안의 18가지 심리도식을
                측정해요. 객관식 점수만으로는 잡히지 않는 마음의 맥락까지 함께
                살펴봐요. 집에서 편하게, 15분이면 충분해요.
              </p>
            </div>
            <div className={styles.step} data-n="2">
              <span className={styles.sn}>STEP 2 · 세션 전</span>
              <h3>상담사 사전 분석</h3>
              <p>
                12년 경력의 1급 상담사가 세션 전에 검사 결과를 직접 채점하고
                꼼꼼히 분석해요. 덕분에 90분 전부를, 오롯이 당신의 이야기에 쓸
                수 있어요.
              </p>
            </div>
            <div className={styles.step} data-n="3">
              <span className={styles.sn}>STEP 3 · Zoom 90분</span>
              <h3>1:1 심층 세션</h3>
              <p>
                결과를 읽어주기만 하는 자리가 아니에요. 내 패턴이 어떻게
                만들어졌는지 함께 그려보고, 재양육 기법으로 그 아이를 다독이는 첫
                걸음까지 함께 해요.
              </p>
            </div>
          </section>

          {/* COUNSELOR */}
          <section className={styles.pad}>
            <p className={styles.kick}>COUNSELOR</p>
            <div className={styles.csImg}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/inner-child/workshop/counselor.jpg" alt="김연지 상담사" />
            </div>
            <h2 className={styles.csname}>김연지</h2>
            <p className={styles.body}>
              상담심리학 석사 · 12년 임상 경력. 검사 해석부터 90분 세션,
              리포트까지 <b style={{ color: "#fff" }}>처음부터 끝까지 한 사람이</b>{" "}
              함께해요. 여러 사람에게 흩어지지 않고, 당신의 이야기를 끝까지
              기억하는 한 명의 상담사예요.
            </p>
            <ul className={styles.certs}>
              <li>
                <b>상담심리사 1급</b>
                <span>한국상담심리학회</span>
              </li>
              <li>
                <b>임상심리사 1급</b>
                <span>한국산업인력공단</span>
              </li>
              <li>
                <b>청소년상담사 2급</b>
                <span>여성가족부</span>
              </li>
              <li>
                <b>트라우마전문상담사</b>
                <span>한국트라우마연구교육원</span>
              </li>
            </ul>
          </section>

          {/* PRICE — 다크 카드(가독성) · 중앙 정렬 · 오렌지 액센트 */}
          <section className={styles.pad} id="pricing">
            <div className={styles.priceCard}>
              <span className={styles.priceKick}>ALL-IN-ONE</span>
              <h2 className={styles.priceTitle}>내면 아이 찾기 워크샵</h2>
              <ul className={styles.priceChecks}>
                <li>심리도식 검사 80문항 + 문장완성검사</li>
                <li>1급 상담사의 사전 채점 · 분석</li>
                <li>90분 1:1 심층 세션 (Zoom)</li>
                <li>나만을 위한 종합 분석 리포트</li>
              </ul>
              <span className={styles.priceAmtLabel}>
                검사부터 리포트까지, 하나로 담았어요
              </span>
              <div className={styles.priceAmt}>
                99,000<span className={styles.won}>원</span>
              </div>
              <p className={styles.priceNote}>
                결제 즉시 검사지 링크를 보내드려요 · 매달 진행 인원은 소수로
                제한돼요
              </p>
            </div>
          </section>

          {/* AFTER PAYMENT — 결제 후 진행 6단계 타임라인(신뢰·불안 해소) */}
          <section className={styles.pad}>
            <p className={styles.kick}>AFTER PAYMENT</p>
            <h2 className={styles.h2} style={{ margin: "16px 0 8px" }}>
              결제 후,
              <br />
              이렇게 진행돼요
            </h2>
            <p className={styles.lead} style={{ marginBottom: "6px" }}>
              혼자 헤매지 않게, 매니저가 처음부터 끝까지 안내해 드려요.
            </p>
            <ol className={styles.flow}>
              <li className={styles.flowStep}>
                <span className={styles.flowNum}>01</span>
                <div className={styles.flowBody}>
                  <h3>결제하면 검사지가 바로 도착해요</h3>
                  <p>
                    결제가 확인되는 즉시, 카카오톡으로 심리도식 검사지 링크를
                    보내드려요.
                  </p>
                </div>
              </li>
              <li className={styles.flowStep}>
                <span className={styles.flowNum}>02</span>
                <div className={styles.flowBody}>
                  <h3>15분이면 검사 완료</h3>
                  <p>
                    심리도식 검사 80문항 + 문장완성검사를 집에서 편하게 작성해요.
                    15분이면 충분해요.
                  </p>
                </div>
              </li>
              <li className={styles.flowStep}>
                <span className={styles.flowNum}>03</span>
                <div className={styles.flowBody}>
                  <h3>매니저가 일정을 잡아드려요</h3>
                  <p>
                    기분 스튜디오 매니저가 연락해 상담사와의 세션 날짜·시간을 편한
                    때로 조율해요.
                  </p>
                </div>
              </li>
              <li className={styles.flowStep}>
                <span className={styles.flowNum}>04</span>
                <div className={styles.flowBody}>
                  <h3>상담사가 미리 분석해요</h3>
                  <p>
                    1급 상담사가 제출한 검사를 직접 채점하고 꼼꼼히 분석해, 당신만을
                    위한 준비를 마쳐요.
                  </p>
                </div>
              </li>
              <li className={styles.flowStep}>
                <span className={styles.flowNum}>05</span>
                <div className={styles.flowBody}>
                  <h3>세션 당일, 90분을 함께해요</h3>
                  <p>
                    예약한 날 Zoom으로 1:1 심층 세션을 90분간 진행해요.
                  </p>
                </div>
              </li>
              <li className={styles.flowStep}>
                <span className={styles.flowNum}>06</span>
                <div className={styles.flowBody}>
                  <h3>3일 이내 리포트를 보내드려요</h3>
                  <p>
                    세션이 끝나면 3일 안에 종합 분석 리포트를 정리해 전달해
                    드려요.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          {/* CLOSE */}
          <section className={`${styles.close} ${styles.pad}`}>
            <p className={styles.kick}>DON&apos;T STOP BY ITSELF</p>
            <h2 className={styles.disp} style={{ margin: "18px 0" }}>
              패턴은
              <br />
              저절로
              <br />
              멈추지
              <br />
              <span className={styles.or}>않아요</span>
            </h2>
            <p className={styles.body}>
              그 아이는 당신이 찾아올 때까지, 같은 자리에서 같은 신호를 계속
              보낼 거예요. 구조를 알아차리기 전까지는요. 오늘, 그 아이를 만나러
              가보는 건 어떨까요.
            </p>
          </section>

          {/* 법적 고지(브랜드 푸터는 삭제 — 전역 사이트 정보로 대체) */}
          <p className={styles.disc}>
            본 워크샵은 심리도식 이론에 근거해 자체 개발한 검사와 상담 세션으로
            구성된 자기이해 프로그램이며, 의학적 진단과 치료를 대체하지 않아요.
            심리적으로 힘든 순간엔 정신건강위기상담전화(1577-0199)로 연락해
            주세요.
          </p>
        </div>

        {/* 하단 고정 스티키 CTA — 스크롤 내내 따라다니는 주 전환 버튼.
            클릭 = onBuyClick(픽셀 → 로그인 게이트 → 결제 모달). */}
        <button
          type="button"
          className={styles.stickyCta}
          onClick={() => void onBuyClick()}
        >
          <span className={styles.stickyLabel}>1:1 내면 아이 워크샵 신청하기</span>
          <span className={styles.stickyRight}>
            <span className={styles.stickyPrice}>99,000원</span>
            <span className={styles.mono}>→</span>
          </span>
        </button>
      </main>

      {/* 결제 모달 — 다크 스코프(styles.root) 밖에 렌더해 랜딩 스타일이 물들지 않게 한다 */}
      <WorkshopCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  );
}
