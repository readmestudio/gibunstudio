export interface Essay {
  slug: string;
  title: string;
  preview: string;
  publishedAt: string;
  illustration: string;
  body?: string;
}

export const ESSAYS: Essay[] = [
  {
    slug: "rest-mind",
    title: "쉬지 못하는 마음에게",
    preview:
      "잠깐의 멈춤이 왜 이렇게 어려울까요. 쉬는 게 불안한 당신에게 건네는 편지.",
    publishedAt: "2026-04-23",
    illustration: "anchor-storm",
  },
  {
    slug: "compare-success",
    title: "남들의 성공에 조급해지는 마음에게",
    preview:
      "타임라인 속 누군가의 성과가 내 하루를 무너뜨리는 날, 우리에게 필요한 이야기.",
    publishedAt: "2026-04-23",
    illustration: "star-sparkle",
  },
  {
    slug: "perfection-mind",
    title: "완벽해지려는 마음에게",
    preview:
      "조금의 흠도 허락하지 않는 그 마음은, 사실 무엇을 지키고 싶었던 걸까요.",
    publishedAt: "2026-04-23",
    illustration: "mystic-eye",
  },
];

export function getEssayBySlug(slug: string): Essay | undefined {
  return ESSAYS.find((essay) => essay.slug === slug);
}

export function getLatestEssays(count: number): Essay[] {
  return [...ESSAYS]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, count);
}

export function formatEssayDate(iso: string): string {
  return iso.replaceAll("-", ".");
}
