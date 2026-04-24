export interface Essay {
  slug: string;
  title: string;
  preview: string;
  publishedAt: string;
  illustration?: string;
  body?: string;
}

export const ESSAYS: Essay[] = [
  {
    slug: "joy-sorrow-beautiful-mind",
    title: "기쁨, 슬픔, 아름다운 마음",
    preview: "기쁨 다음에 찾아오는 슬픔까지가 아름다운 마음이다.",
    publishedAt: "2026-04-24",
    body: `지난 9월과 올해 3월, 아기를 낳고 6개월 만에 엄마와 아빠를 모두 떠나보냈다. 나에게 무슨 일이 일어난 것인지 받아들일 틈도 없이 숨 가쁘게 달려왔다. 매일 아기는 무서운 속도로 자랐고, 해야 할 일은 끊임없이 쏟아졌다. 그 일들을 하나씩 해치우다 보면 어느새 저녁이었다. 슬픔이 슬픔인지도, 기쁨이 기쁨인지도 모른 채 이어지는 시간들이었다.

주변 사람들도 나의 안부를 묻고 위로하려다가, 생각보다 씩씩하게 살아가는 내 모습에 적잖이 당황하다가 안도하며 응원을 남기고 돌아갔다. 그래서인지 나는 스스로도 위로가 필요 없는 상태라고 여겼던 것 같다. 그러던 지난 4월, 악뮤가 컴백했고, 그때 이찬혁의 인터뷰에서 예상치 못한 위로를 받았다.

타이틀 곡인 '기쁨, 슬픔, 아름다운 마음'에 대한 곡 설명을 덧붙이며 그는 이렇게 말한다.

"결국 기쁨과 슬픔은 병렬적으로 일어나는 사건이 아니라 서로가 서로를 품고 있는 하나의 경험인 것이다.

달이 초승달일 때에도 보이지 않는 나머지 부분은 늘 어둠으로 함께 존재하는 것처럼 기쁨과 슬픔은 언제나 함께 존재한다.

왜 인생은 빛으로만 채워질 수 없을까. 왜 삶은 빛 뒤에 그림자를, 기쁨 뒤에 슬픔을 패키지로 준비해뒀을까 삶이 야속하기도 하다.

아마도 슬픔을 원수처럼 밀어내지 않고 함께 살아가는 법을 배울 때, 비로소 진짜 성장이 일어나기 때문일 것이다."

나는 지금 슬픔과 함께 있다. 내가 부모의 상실이 슬픈 이유는 그들과 함께했던 나의 삶이 기뻤기 때문이다. 기쁨이 사라진 자리에는 슬픔이 머물다가, 또 다른 기쁨이 찾아오면 자리를 내어주기를 반복할 것이다.

나에게 기쁨을 선물해준 부모님께 감사한 마음으로, 나는 이 슬픔을 오래 품어보려 한다. 그렇게 품고 또 품다 보면, 언젠가 이 모든 시간은 하나의 아름다운 돌처럼 남아 있을 것이다.`,
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
