import { AddictionCycleDiagram } from "@/components/self-workshop/AddictionCycleDiagram";

/**
 * 악순환 메커니즘 섹션
 *
 * 세이지라이트 배경의 풀폭 섹션. 중앙에 6-노드 순환 다이어그램을 배치해
 * "왜 반복되는가"에 대한 구조적 이해를 제공.
 *
 * 페이지 좌우 끝까지 배경이 닿도록 이 섹션 자체를 외부 max-width 컨테이너
 * 밖에 배치해야 함.
 */
export function AddictionCycleSection() {
  return (
    <section className="w-full bg-[var(--surface)] py-20 border-y border-[var(--border)]">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-[var(--foreground)] break-keep">
          당신을 지치게 하는 &apos;성취 중독의 악순환&apos;
        </h2>
        <p className="mt-4 text-center text-sm sm:text-base text-[var(--foreground)]/60 break-keep">
          이 고리를 끊지 않으면, 아무리 성과를 내도 마음은 편해지지 않습니다.
        </p>

        <div className="mt-14">
          <AddictionCycleDiagram />
        </div>
      </div>
    </section>
  );
}
