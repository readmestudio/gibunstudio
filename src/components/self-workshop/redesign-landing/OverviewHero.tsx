"use client";


/**
 * 워크북 전반 상세 페이지(`/payment/self-workshop`) 전용 Hero.
 *
 * 톤 가이드:
 * - IFS(내면가족체계) 관점 — "마음 안의 여러 부분"
 * - 과거 원인 분석보다 다음 한 달의 행동에 무게
 * - 힐링/위로보다 다음 시도할 수 있는 대안에 무게
 */
/**
 * 히어로 배경 모자이크에 깔 워크북 실제 화면 캡처들.
 * WorkbookScreenshotSection과 동일한 에셋을 재사용해, 텍스트 뒤로 살짝
 * 비치는 "워크북이 가득한 벽" 같은 분위기를 만든다. (장식용 — aria-hidden)
 *
 * 어두운 배경 캡처(03-loop, 11-cycle)는 다크 히어로와 섞이면 칙칙해져
 * 제외하고, 흰 배경 캡처만 사용해 종이 같은 질감이 은은히 드러나게 한다.
 */
const HERO_BG_SHOTS = [
  "01-self-test",
  "02-diagnosis",
  "05-inner-parts",
  "06-core-wish",
  "07-core-belief",
  "08-keywords",
  "09-cascade",
  "10-cascade-timeline",
  "12-distortions",
  "13-reshape",
].map((name) => `/images/workbook-preview/${name}.png`);

export function OverviewHero() {
  // 히어로 전체 높이를 빈틈 없이 채우려면 타일이 넉넉해야 한다. 특히 세로로
  // 긴 모바일 히어로까지 덮으려면 여유가 필요해, 10장을 7번 이어 붙여 70타일을
  // 깐다. 실제 이미지는 10장이라 브라우저가 캐시해 네트워크 다운로드는 10번뿐.
  // (넘치는 타일은 overflow:hidden으로 잘림)
  const tiles = Array.from({ length: 7 }, () => HERO_BG_SHOTS).flat();

  return (
    <section className="lr-hero lr-hero-dark">
      {/* 텍스트 뒤 캡처 모자이크 — 어두운 오버레이로 가독성 확보 */}
      <div className="lr-hero-shots" aria-hidden>
        <div className="lr-hero-shots-grid">
          {tiles.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${src}-${i}`} src={src} alt="" loading="lazy" />
          ))}
        </div>
      </div>
      <div className="lr-wrap-6 lr-hero-inner">
        <div className="lr-f-up">
          <span className="lr-eyebrow lr-dark">
            <span className="lr-dot" />
            SELF · MINDFULNESS · WORKBOOK
          </span>
        </div>
        <h1 className="lr-f-blur">
          <span className="lr-accent-word">하이퍼포머</span>를 위한
          <br />
          심리 상담 워크북
        </h1>
        <p className="lr-sub lr-f-up lr-d1">
          일은 더 잘하고 싶은데 마음이 따라주지 않을 때,
          <br />
          1급 심리상담사와 명상 디렉터가 만든 워크북으로
          <br />
          당신의 퍼포먼스를 높여보세요
        </p>
        <div className="lr-hero-chips lr-f-up lr-d1">
          <span className="lr-chip">#내면가족체계</span>
          <span className="lr-chip">#셀프심리상담</span>
          <span className="lr-chip">#소프트런칭특가</span>
        </div>
        <div className="lr-hero-cta-row lr-f-up lr-d2">
          <a href="/waitlist" className="lr-cta-pill lr-accent">
            대기자 등록하기
            <span className="lr-arrow">→</span>
          </a>
        </div>
        <div className="lr-scroll-cue">
          <span className="lr-line" />
        </div>
      </div>
    </section>
  );
}

/* ── 제작 비하인드 스토리 박스 (overview 톤) ── */
export function OverviewBigQuestion() {
  return (
    <section className="lr-section-sm">
      <div className="lr-wrap-5">
        <div className="lr-big-q lr-big-story lr-f-up">
          <div className="lr-qmark">&ldquo;</div>
          <span className="lr-story-eyebrow">MAKER&rsquo;S NOTE · 제작 비하인드</span>
          <h3>
            회사가 <em>1조 가치 유니콘</em>이 되어도,
            <br />
            정작 저는 1분도 쉬지 못했습니다
          </h3>
          <div className="lr-story-body">
            <p>
              실리콘밸리 기업에서 5년간 미친 듯이 일했습니다. 회사는 1조 가치의
              유니콘이 되었지만, 정작 저는 기쁘지 않았습니다.
            </p>
            <p>
              회사의 성장 속도에 맞춰 저도 끊임없이 성장해야 할 것 같았고, 마음은
              단 1분도 쉬지 못했습니다. 늘 뭔가를 해야 하는데 하지 않고 있는
              느낌에 시달렸습니다.
            </p>
            <p>
              그때 명상과 IFS 심리 상담 기법을 만났습니다. 저는 엄청난 돈과
              시간을 써가며 터득했지만, 여러분은 한 번에 정답을 찾으시길 바라는
              마음으로 — 한국 심리 상담 협회 1급 상담사와 함께 이 워크북을
              만들었습니다.
            </p>
          </div>
          <div className="lr-footnote">
            심리 상담 워크북은 이 이야기로부터 시작되었습니다.
          </div>
        </div>
      </div>
    </section>
  );
}
