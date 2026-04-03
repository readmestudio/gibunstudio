/**
 * 유저 리뷰 섹션 (Monotone 스타일)
 * 3열 매소너리 레이아웃, 각 열에 2개씩 카드 배치
 */

const TESTIMONIALS = [
  {
    name: "김OO",
    initial: "K",
    review:
      "막연하게 '나를 바꿔야 한다'고만 생각했는데, 리포트를 받고 나니까 뭘 바꿔야 하는지가 구체적으로 보이기 시작했습니다.",
  },
  {
    name: "이OO",
    initial: "L",
    review:
      "가치관 월드컵 하면서 '내가 진짜 원하는 게 이거였어?' 하고 놀랐어요. 막연히 이직을 고민하다가 삶의 방향이 잡혔습니다.",
  },
  {
    name: "박OO",
    initial: "P",
    review:
      "남편과 함께 관계 패턴 상담을 받았는데, 각자의 애착 유형과 핵심 신념이 어디서 부딪히는지 보이더라고요. 감정 싸움 대신 구조를 얘기할 수 있었습니다.",
  },
  {
    name: "최OO",
    initial: "C",
    review:
      "금쪽 상담소에서 고민을 털어놨는데, 제가 왜 같은 패턴에 갇혀 있었는지 자동 사고와 핵심 신념으로 설명해 주더라고요. 소름 돋았습니다.",
  },
  {
    name: "정OO",
    initial: "J",
    review:
      "불안의 뿌리가 핵심 신념에 있다는 걸 리포트에서 처음 봤어요. '내가 왜 이렇게 느끼는지' 드디어 이해가 됐습니다. 그것만으로도 기분이 달라지더라고요.",
  },
  {
    name: "한OO",
    initial: "H",
    review:
      "리포트를 보고 나서 '인식하는 나'와 '실제로 살아가는 나'가 얼마나 다른지 알았어요. 그 간극을 줄여나가는 게 이렇게 기분 좋은 일인 줄 몰랐습니다.",
  },
];

// 3열로 분배
const columns = [
  [TESTIMONIALS[0], TESTIMONIALS[1]],
  [TESTIMONIALS[2], TESTIMONIALS[3]],
  [TESTIMONIALS[4], TESTIMONIALS[5]],
];

export function Testimonials() {
  return (
    <section>
      <div className="container px-5 py-24 mx-auto lg:px-24">
        <div className="flex flex-col w-full mb-12 text-left lg:text-center">
          <h2 className="mb-6 text-4xl font-bold text-[var(--foreground)] md:text-8xl lg:text-6xl">
            &ldquo;나를 알겠다&rdquo;가 된 순간들
          </h2>
          <p className="mx-auto text-lg leading-snug text-[var(--foreground)]/70 lg:w-1/2">
            막연했던 내가, 선명해진 사람들의 이야기예요.
          </p>
        </div>
        <div className="flex flex-wrap -m-4">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="w-full p-4 md:w-1/3">
              {col.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className={`p-6 border border-[var(--border)] shadow-xl rounded-2xl${
                    itemIdx > 0 ? " mt-4" : ""
                  }`}
                >
                  <div className="inline-flex items-center mb-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--foreground)] text-white text-xs font-bold">
                      {item.initial}
                    </span>
                    <span className="flex flex-col flex-grow pl-4">
                      <span className="text-xs uppercase tracking-wide text-[var(--foreground)]/60">
                        {item.name}
                      </span>
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--foreground)]/70">
                    &ldquo;{item.review}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
