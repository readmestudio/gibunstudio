/**
 * 유저 리뷰 섹션 (Monotone 스타일)
 * 3열 매소너리 레이아웃, 각 열에 2개씩 카드 배치
 */

const TESTIMONIALS = [
  {
    name: "김OO",
    initial: "K",
    review:
      "남편상 분석 결과를 보고 놀랐어요. 제가 왜 그런 사람에게 끌리는지 이해하게 됐습니다.",
  },
  {
    name: "이OO",
    initial: "L",
    review:
      "상담사 선생님이 리포트를 정말 꼼꼼하게 해석해 주셔서, 혼자서는 보지 못했던 부분을 발견할 수 있었어요.",
  },
  {
    name: "박OO",
    initial: "P",
    review:
      "남편과 함께 관계 해석 상담을 받았는데, 서로의 상처를 이해하게 된 계기가 되었습니다. 커플 분들께 강추합니다.",
  },
  {
    name: "최OO",
    initial: "C",
    review:
      "심리검사 패키지가 가성비 최고였어요. 검사 결과를 전문가가 직접 설명해주니 이해도가 완전히 달랐습니다.",
  },
  {
    name: "정OO",
    initial: "J",
    review:
      "불안이 심해서 상담을 시작했는데, 그 뿌리가 어린 시절에 있다는 걸 알게 되었어요. 진작 시작할 걸 그랬습니다.",
  },
  {
    name: "한OO",
    initial: "H",
    review:
      "Zoom으로 편하게 상담받을 수 있어서 좋았고, 무엇보다 상담사분의 따뜻한 공감이 인상적이었어요.",
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
            실제 참여자들의
            <br className="hidden lg:block" />
            이야기입니다.
          </h2>
          <p className="mx-auto text-lg leading-snug text-[var(--foreground)]/70 lg:w-1/2">
            기분 스튜디오와 함께한 분들의 솔직한 후기
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
