"use client";

import { useState } from "react";

/* ============================================================
 * PricingSection — 워크북 단독 vs 워크북+상담 비교 2단
 * ============================================================ */
/** 두 플랜 공통: 워크북 전 과정에 포함되는 것 */
const WORKBOOK_INCLUDED = [
  "진단 테스트 (Likert 5점 척도 20문항)",
  "진단 결과 리포트 (4영역 위험군 분석)",
  "실습 (CBT 5영역 · 하향 화살표 · 대안 사고 · 근거 모으기)",
  "자동사고 / 핵심 신념 분석 리포트 (인지 Cascade)",
  "종합 가이드 리포트 + 자기 확언 카드",
];

export function PricingSection() {
  return (
    <section className="lr-section" id="price">
      <div className="lr-wrap-5">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            PRICING
          </span>
          <h2 className="lr-f-up lr-d1">
            워크북만, 또는
            <br />
            <em>심리 상담까지 함께</em>
          </h2>
          <p className="lr-lede lr-f-up lr-d2">
            혼자 워크북으로 시작하거나, 1급 심리 상담사의 1:1 상담까지 함께
            받을 수 있어요. 포함되는 것을 비교해 보세요.
          </p>
        </div>
        <div className="lr-price-grid">
          {/* 플랜 ①: 워크북 단독 */}
          <div className="lr-price-card lr-f-up">
            <div className="lr-ptag">WORKBOOK ONLY</div>
            <h3>상담 워크북</h3>
            <div className="lr-big-price lr-big-price-ink">₩49,000</div>
            <p className="lr-pdesc">
              10단계 워크북 전 과정과 3가지 분석 리포트, 자기 확언 카드까지
              영구 보관.
            </p>
            <div className="lr-pcheck-list">
              {WORKBOOK_INCLUDED.map((c) => (
                <div className="lr-pcl-row" key={c}>
                  <span className="lr-pcl-mark">✓</span>
                  {c}
                </div>
              ))}
            </div>
            <a className="lr-cta-pill lr-cta-ghost" href="/waitlist">
              워크북만 대기신청하기
              <span className="lr-arrow">→</span>
            </a>
          </div>

          {/* 플랜 ②: 워크북 + 심리 상담 (강조) */}
          <div className="lr-price-card lr-dark lr-f-up lr-d1">
            <div className="lr-badge">BEST · 심리 상담 포함</div>
            <div className="lr-ptag">WORKBOOK + 1:1 상담</div>
            <h3>워크북 + 심리 상담</h3>

            {/* 구성 가치 분해 — 정가가 199,000원임을 한눈에 */}
            <div className="lr-value-rows">
              <div className="lr-value-row">
                <span className="lr-vr-label">
                  상담 워크북
                  <small>10단계 전 과정 + 리포트 3종</small>
                </span>
                <span className="lr-vr-price">₩49,000</span>
              </div>
              <div className="lr-value-row">
                <span className="lr-vr-label">
                  1:1 심리 상담
                  <small>1급 상담사 · Zoom 1회</small>
                </span>
                <span className="lr-vr-price">₩150,000</span>
              </div>
              <div className="lr-value-row lr-value-sum">
                <span className="lr-vr-label">정가 합계</span>
                <span className="lr-vr-price lr-vr-strike">₩199,000</span>
              </div>
            </div>

            {/* 묶음 할인가 — 큰 숫자는 이 하나만 */}
            <div className="lr-bundle-price">
              <span className="lr-bundle-label">묶음가로 함께 받으면</span>
              <div className="lr-bundle-row">
                <div className="lr-big-price">₩129,000</div>
                <span className="lr-save-tag">₩70,000 할인</span>
              </div>
            </div>

            {/* 상담 하이라이트 박스 — 가격 없이 '무엇을 받는지'만 */}
            <div className="lr-counsel-box">
              <div className="lr-counsel-head">
                <span className="lr-counsel-icon">＋</span>
                <b>한국상담심리학회 상담심리사 1급</b> 1:1 상담 포함
              </div>
              <p className="lr-counsel-desc">
                자격을 갖춘 1급 심리 상담사가 직접 <b>줌(Zoom)</b>으로 진행하는
                1:1 상담 1회. 워크북 결과를 바탕으로 더 깊이 들여다봅니다.
              </p>
            </div>

            <a className="lr-cta-pill" href="/waitlist">
              상담까지 함께 대기신청하기
              <span className="lr-arrow">→</span>
            </a>
          </div>
        </div>
        <div className="lr-price-foot lr-f-up">
          현재 소수의 인원으로 소프트 런칭 후 고도화하고 있어요.
          <br />
          추후 판매가 오픈되면 알림을 보내드릴게요.
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * PrivacySection — 검정 보안 배너
 * ============================================================ */
export function PrivacySection() {
  return (
    <section className="lr-section-sm">
      <div className="lr-wrap-4">
        <div className="lr-privacy-banner lr-f-up">
          <div className="lr-lock">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 018 0v3" strokeLinecap="round" />
            </svg>
          </div>
          <h3>
            속 깊은 이야기를 모두 토해내도
            <br />
            <em>유출 걱정은 마세요</em>
          </h3>
          <div className="lr-pchip">
            <span className="lr-pchip-inner">
              본인 외 누구도 열람할 수 없도록 설계
            </span>
          </div>
          <div className="lr-hr" />
          <div className="lr-ptech-list">
            <div className="lr-pt-row">
              <span className="lr-ptm">✓</span>
              <div>
                <b>Row Level Security</b>DB 권한 분리 — 본인 계정만 자기 데이터
                read/write
              </div>
            </div>
            <div className="lr-pt-row">
              <span className="lr-ptm">✓</span>
              <div>
                <b>HTTPS 전송 암호화</b>클라이언트 ↔ 서버 모든 통신 TLS 암호화
              </div>
            </div>
            <div className="lr-pt-row">
              <span className="lr-ptm">✓</span>
              <div>
                <b>Authenticated Session</b>인증된 본인 세션만 워크북 데이터
                접근 가능
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * TestimonialsSection — 4명 후기
 * ============================================================ */
const TESTIS = [
  {
    name: "지현 님",
    meta: "34세 · 직장인 8년차",
    tag: "성취 중독",
    before:
      "성과가 안 나오면 내 존재 자체가 부정당하는 느낌이었어요. 주말에도 일 생각이 안 놓여서, 쉬면 오히려 불안했습니다.",
    during:
      "패턴 찾기 단계에서 제가 완벽주의와 정서적 회피가 둘 다 높다는 걸 알게 됐어요. 핵심 믿음이 “쓸모 있어야만 받아들여진다”라는 것까지 내려갔을 때 눈물이 났습니다.",
    now:
      "상담을 받은 것도 아닌데 “기분 마사지”를 받은 느낌이에요. 쓰는 과정 자체가 저를 정리해줬습니다.",
  },
  {
    name: "민수 님",
    meta: "31세 · 직장인 5년차",
    tag: "성취 중독",
    before:
      "사직서를 세 번이나 쓰다 지웠습니다. 회사 때문이라고 생각했는데, 실제론 그 감정이 어디서 오는지조차 몰랐어요.",
    during:
      "인지 오류 분석에서 제 반응이 대부분 흑백 사고와 파국화라는 걸 확인했습니다. 대처 계획 단계에서 DO & DON'T를 직접 써보니, 월요일에 실전으로 써볼 게 생겼더라고요.",
    now: "문제는 회사가 아니라 제 자동적 사고였어요. 같은 상황인데 지금은 전혀 다르게 보입니다.",
  },
  {
    name: "서연 님",
    meta: "37세 · 직장인 12년차",
    tag: "성취 중독",
    before:
      "실력은 있는데 성과가 실력만큼 안 나오는 느낌이었어요. 에너지의 절반 이상이 마음을 다스리는 데 쓰이고 있었던 거죠.",
    during:
      "요약 리포트에서 제가 한 페이지짜리 “내 설명서”를 받은 느낌이었어요. 무엇이 저를 흔드는지, 그럴 때 뭘 해야 하는지가 한 장에 정리돼 있었습니다.",
    now: "분기 평가에서 처음 상위 고과를 받았어요. 실력이 갑자기 는 게 아니라, 원래 제 실력이 나오기 시작한 겁니다.",
  },
  {
    name: "준혁 님",
    meta: "29세 · 직장인 4년차",
    tag: "성취 중독",
    before:
      "주변에서는 잘 지내는 것 같다고 했지만 속으로는 늘 쫓기고 있었어요. 얼굴에 피로가 먼저 드러났습니다.",
    during:
      "핵심 믿음 탐색 단계가 가장 인상 깊었어요. 제가 계속 밀어붙이는 이유가 “멈추면 뒤처진다”라는 단 한 문장 때문이었다는 걸 알게 됐습니다.",
    now:
      "요즘 주변에서 “얼굴 좋아졌다”는 얘기를 자주 들어요. 제 안의 압박 구조를 풀어낸 이후로 몸도 같이 편해진 것 같습니다.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="lr-section">
      <div className="lr-wrap-4">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            REVIEWS
          </span>
          <h2 className="lr-f-up lr-d1">
            먼저 해본 분들의 <em>후기</em>
          </h2>
          <p className="lr-lede lr-f-up lr-d2">
            심리 상담 워크북을 통해 변화된 후기를 만나 보세요
          </p>
        </div>
        <div className="lr-testi-grid">
          {TESTIS.map((t, i) => (
            <div
              className="lr-testi-card lr-f-up"
              key={t.name}
              style={{ transitionDelay: `${(i % 2) * 0.12}s` }}
            >
              <div className="lr-th-row">
                <div>
                  <div className="lr-th-name">{t.name}</div>
                  <div className="lr-th-meta">{t.meta}</div>
                </div>
                <div className="lr-th-tag">{t.tag}</div>
              </div>
              <div className="lr-tblock">
                <div className="lr-tlabel">시작 전</div>
                <div className="lr-tbody">{t.before}</div>
              </div>
              <div className="lr-tblock">
                <div className="lr-tlabel">진행 중 변화</div>
                <div className="lr-tbody">{t.during}</div>
              </div>
              <div className="lr-tblock">
                <div className="lr-tlabel lr-now">현재</div>
                <div className="lr-tbody lr-bold">{t.now}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="lr-faq-foot">
          * 후기는 본인 동의 하에 닉네임·일부 표현을 다듬어 게재했습니다.
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * CreatorSection — 창작자 스토리
 * (overview 페이지에서는 제작 비하인드 박스와 중복되어 미사용.
 *  성취 중독 상세 RedesignLandingPage에서만 렌더링)
 * ============================================================ */
export function CreatorSection() {
  return (
    <section className="lr-section">
      <div className="lr-wrap-3">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            FROM THE MAKER
          </span>
          <h2 className="lr-f-up lr-d1">
            퍼포먼스를 잘 내기 위해선 <em>마음이 먼저</em>였습니다
          </h2>
        </div>
        <div className="lr-creator-box lr-f-up">
          <p>
            저는 10년간 스타트업, 실리콘밸리 스타트업에서 일했습니다. 매년
            높아지는 기대치와 업무 강도 속에서, 정작 어려웠던 건 업무 자체가
            아니라 그 안에서 밀려오는 압박감, 스트레스, 불안감을 다스리는
            일이었습니다.
          </p>
          <p>
            비싼 심리 상담도 받아보고, 명상 리트릿도 떠나봤습니다. 그런데 모든
            게 그때뿐이었습니다. 결국 저 스스로 마음의 문제를 들여다보고 해결할
            수 있어야 했습니다. 그 도구를 만들고 싶었습니다.
          </p>
          <p className="lr-highlight">
            <em>심리 상담 워크북은 그렇게 시작됐습니다.</em>
          </p>
          <p>
            심리 상담 워크북은 실습을 통해 문제 상황을 발견하고, 인지행동
            이론에 따라 분석함으로써 그 함정에서 빠져나오는 법을 배울 수
            있습니다. 이 워크북이 퍼포먼스의 한계를 없애고, 새로운 세계를
            열어주는 문이 되길 바랍니다.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * FaqSection — 한 번에 하나만 펼침
 * ============================================================ */
const FAQS = [
  {
    q: "심리 상담을 받아본 적 없는데 혼자 할 수 있나요?",
    a: "네, 상담 경험이 없어도 따라갈 수 있도록 설계되어 있습니다. 전문가가 할 법한 질문이 순서대로 준비되어 있고, 예시와 작성 가이드가 단계마다 붙어 있어요.",
  },
  {
    q: "우울증/불안장애 진단을 받은 사람도 사용할 수 있나요?",
    a: "심리 상담 워크북은 치료 목적이 아니며, 스스로의 마음을 이해하고 대처하는 도구입니다. 이미 진단을 받으셨다면 전문의·상담사 상담과 병행해서 사용해 주세요.",
  },
  {
    q: "워크북 완성까지 얼마나 걸리나요?",
    a: "한 번에 몰아서 하면 약 65~100분 정도 걸립니다. 중간에 저장하고 며칠에 걸쳐 진행해도 괜찮아요. 콘텐츠 조회 기간은 결제 후 90일입니다.",
  },
  {
    q: "효과가 없으면 환불되나요?",
    a: "1단계 진단을 시작하기 전까지는 전액 환불이 가능합니다. 진단 이후에는 디지털 콘텐츠 특성상 환불이 제한될 수 있어요.",
  },
  {
    q: "다 쓴 후에 재구매 없이 다시 쓸 수 있나요?",
    a: "결제 후 90일 동안은 언제든 다시 열어 내용을 확인하고 재작성할 수 있습니다.",
  },
  {
    q: "전문가 상담은 꼭 받아야 하나요?",
    a: "꼭 받으실 필요는 없어요. 워크북만으로도 진단 → 실습 → 대처까지 완결됩니다.",
  },
  {
    q: "개인정보(내가 쓴 내용)는 어디에도 공유되지 않나요?",
    a: "작성하신 워크북 내용은 본인만 열람할 수 있도록 저장됩니다. 홍보·마케팅에 활용되지 않으며, 제3자에게 제공되지 않아요.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section className="lr-section" id="faq">
      <div className="lr-wrap-3">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            FAQ
          </span>
          <h2 className="lr-f-up lr-d1">
            자주 묻는 <em>질문</em>
          </h2>
        </div>
        <div className="lr-faq-list">
          {FAQS.map((f, i) => (
            <div
              className={`lr-faq-item ${open === i ? "lr-open" : ""}`}
              key={f.q}
            >
              <button
                className="lr-faq-q"
                onClick={() => setOpen(open === i ? -1 : i)}
                type="button"
              >
                <span>Q. {f.q}</span>
                <svg
                  className="lr-chev"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="lr-faq-a">
                <div className="lr-faq-a-inner">{f.a}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="lr-faq-foot">
          * 심리 상담 워크북은 치료 목적이 아니며, 진단을 받은 경우 전문의
          상담을 병행하시길 권합니다.
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * FinalCTA — 검정 큰 카드
 * ============================================================ */
export function FinalCTA() {
  return (
    <section className="lr-section-sm">
      <div className="lr-wrap-5">
        <div className="lr-final-cta lr-f-up">
          <div className="lr-grid-bg" />
          <span className="lr-eyebrow lr-dark">
            <span className="lr-dot" />
            JOIN THE WAITLIST
          </span>
          <h2>
            마음을 챙겨야
            <br />
            <em>퍼포먼스가 따라옵니다</em>
          </h2>
          <p className="lr-sub">
            정식 오픈 시 알림과 함께 얼리 액세스 특별가를 보내드릴게요.
          </p>
          <a href="/waitlist" className="lr-cta-pill lr-invert">
            대기자 등록하고 할인받기
            <span className="lr-arrow">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
