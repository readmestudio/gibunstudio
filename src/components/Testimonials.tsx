/**
 * 유저 리뷰 섹션 (Monotone 스타일)
 * 3열 매소너리 레이아웃, 각 열에 2개씩 카드 배치
 */

const TESTIMONIALS = [
  {
    name: "김OO",
    initial: "K",
    review:
      "3년간 상담을 받았는데 매번 같은 얘기를 반복했어요. 여기서 리포트를 받고 나서야 왜 같은 유형에게 끌리는지 패턴이 보이기 시작했습니다.",
  },
  {
    name: "이OO",
    initial: "L",
    review:
      "가치관 월드컵 하면서 '내가 진짜 원하는 게 이거였어?' 하고 놀랐어요. 막연히 이직을 고민하다가 구체적인 방향이 잡혔습니다.",
  },
  {
    name: "박OO",
    initial: "P",
    review:
      "남편과 함께 관계 패턴 상담을 받았는데, 서로가 왜 그 지점에서 항상 싸우는지 구조적으로 이해하게 됐어요. 리포트가 있으니 감정 싸움 대신 패턴을 얘기할 수 있었습니다.",
  },
  {
    name: "최OO",
    initial: "C",
    review:
      "금쪽 상담소에서 연애 고민을 털어놨는데, 제가 계속 회피형한테 끌리는 이유가 자동 사고 때문이라는 리포트가 나왔어요. 소름 돋았습니다.",
  },
  {
    name: "정OO",
    initial: "J",
    review:
      "불안의 뿌리가 핵심 신념에 있다는 걸 리포트에서 처음 봤어요. 상담사분이 이걸 기반으로 상담해 주니까 처음부터 설명 안 해도 되는 게 정말 편했습니다.",
  },
  {
    name: "한OO",
    initial: "H",
    review:
      "다른 상담은 매번 처음부터 제 이야기를 해야 했는데, 여기는 리포트가 먼저 있으니까 상담사분이 저를 이미 이해하고 시작하더라고요. 그 차이가 엄청 컸어요.",
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
          <h2 className="mb-6 text-4xl font-bold tracking-tighter text-[var(--foreground)] md:text-8xl lg:text-6xl">
            패턴을 깬
            <br className="hidden lg:block" />
            사람들의 이야기
          </h2>
          <p className="mx-auto text-lg leading-snug text-[var(--foreground)]/70 lg:w-1/2">
            &ldquo;또 같은 패턴이네&rdquo;에서 &ldquo;이제 알겠다&rdquo;로 바뀐 순간들
          </p>
        </div>
        <div className="flex flex-wrap -m-4">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="w-full p-4 md:w-1/3">
              {col.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className={`p-6 border border-[var(--border)] shadow-xl rounded-3xl${
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
