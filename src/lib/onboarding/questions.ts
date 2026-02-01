import type { BasicEmotion } from "./emotion-mapping";

export type QuestionChoice = {
  text: string;
  emotion: BasicEmotion;
};

export type Question = {
  id: number;
  text: string;
  choices: QuestionChoice[];
};

export const ONBOARDING_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "요즘의 나는, 나를 스스로 ______ 사람이라고 느낀다.",
    choices: [
      { text: "요즘은 기분이 비교적 가볍고 올라오는 편이다", emotion: "joy" },
      { text: "요즘은 사람과의 연결이나 믿음이 중요하게 느껴진다", emotion: "trust" },
      { text: "요즘은 긴장하거나 조심스러운 순간이 많다", emotion: "fear" },
      { text: "요즘은 다음을 대비하고 준비하는 생각이 자주 든다", emotion: "anticipation" },
    ],
  },
  {
    id: 2,
    text: "요즘 사람들과 함께 있을 때 나는 주로 ______ 상태다.",
    choices: [
      { text: "마음이 따뜻해지거나 편해진다", emotion: "trust" },
      { text: "에너지가 올라가고 들뜨기 쉽다", emotion: "joy" },
      { text: "불편한 점이 먼저 눈에 띈다", emotion: "disgust" },
      { text: "경계하거나 긴장하게 된다", emotion: "fear" },
    ],
  },
  {
    id: 3,
    text: "요즘 문제가 생기면, 내 머릿속에는 보통 ______ 생각이 먼저 스친다.",
    choices: [
      { text: '"다음엔 이렇게 대비해야겠다"', emotion: "anticipation" },
      { text: '"이게 더 커지면 어떡하지"', emotion: "fear" },
      { text: '"왜 이런 일이 반복되지"', emotion: "anger" },
      { text: '"역시 기대하지 말 걸"', emotion: "sadness" },
    ],
  },
  {
    id: 4,
    text: "요즘 아무 일도 없을 때의 나는 대체로 ______.",
    choices: [
      { text: "조용히 가라앉아 있는 편이다", emotion: "sadness" },
      { text: "자극이 없으면 멍해지거나 집중이 깨진다", emotion: "surprise" },
      { text: "비교적 편안하거나 만족스럽다", emotion: "joy" },
      { text: "이유 없는 불만/찜찜함이 있다", emotion: "disgust" },
    ],
  },
  {
    id: 5,
    text: "요즘 나는 사람이나 상황을 볼 때 ______ 기준이 더 예민해졌다.",
    choices: [
      { text: "믿을 수 있는지", emotion: "trust" },
      { text: "위험하지 않은지", emotion: "fear" },
      { text: "선을 넘지 않았는지/부당하지 않은지", emotion: "anger" },
      { text: "앞으로 어떻게 될지/가능성이 있는지", emotion: "anticipation" },
    ],
  },
  {
    id: 6,
    text: "요즘 감정이 올라올 때 나는 스스로를 ______ 느낀다.",
    choices: [
      { text: "쉽게 놀라고 흔들린다", emotion: "surprise" },
      { text: "쉽게 지치고 무거워진다", emotion: "sadness" },
      { text: "참기 어렵고 날카로워진다", emotion: "anger" },
      { text: "깊이 느끼고 오래 남는다", emotion: "trust" },
    ],
  },
  {
    id: 7,
    text: "요즘 좋은 일이 생겼을 때 나는 ______ 쪽에 더 가깝다.",
    choices: [
      { text: '"더 해보고 싶다" 에너지가 난다', emotion: "joy" },
      { text: '"이 흐름이 계속될까?" 불안이 스친다', emotion: "fear" },
      { text: '"좋아, 이제 다음을 준비하자"가 떠오른다', emotion: "anticipation" },
      { text: '"누군가와 나누고 싶다"가 먼저 든다', emotion: "trust" },
    ],
  },
  {
    id: 8,
    text: "요즘 예상치 못한 일이 생기면 나는 ______ 반응이 더 잦다.",
    choices: [
      { text: "잠깐 멈칫하고 머리가 하얘진다", emotion: "surprise" },
      { text: "최악의 경우를 먼저 떠올린다", emotion: "fear" },
      { text: "다음 대안을 바로 찾는다", emotion: "anticipation" },
      { text: "짜증/분노가 먼저 치밀어 오른다", emotion: "anger" },
    ],
  },
  {
    id: 9,
    text: "요즘 누군가 내 기준을 어겼을 때 나는 ______ 느낌이 먼저 든다.",
    choices: [
      { text: '"선을 넘었네" 분노가 올라온다', emotion: "anger" },
      { text: '"왜 저래…" 거부감이 든다', emotion: "disgust" },
      { text: '"관계가 틀어질까" 걱정된다', emotion: "fear" },
      { text: '"그래도 이해해보자"가 든다', emotion: "trust" },
    ],
  },
  {
    id: 10,
    text: "요즘 나에게 자주 남는 감정의 잔향은 ______ 쪽이다.",
    choices: [
      { text: "설렘/관심/기대 같은 앞으로의 느낌", emotion: "anticipation" },
      { text: "허탈/공허/우울 같은 아래로 가라앉는 느낌", emotion: "sadness" },
      { text: "불쾌/미움/실망 같은 거리감의 느낌", emotion: "disgust" },
      { text: "기쁨/감사/만족 같은 올라오는 느낌", emotion: "joy" },
    ],
  },
  {
    id: 11,
    text: "요즘 나는 나 자신에게 ______ 말을 자주 한다.",
    choices: [
      { text: '"괜찮아, 잘하고 있어"', emotion: "joy" },
      { text: '"조심해야 해"', emotion: "fear" },
      { text: '"이건 아니잖아"', emotion: "anger" },
      { text: '"사람을 믿어보자"', emotion: "trust" },
    ],
  },
  {
    id: 12,
    text: "요즘 내가 가장 바라는 건 ______ 에 가깝다.",
    choices: [
      { text: "마음이 편안해지는 안정", emotion: "trust" },
      { text: "불안이 줄어드는 안전", emotion: "fear" },
      { text: "막힌 게 뚫리는 해소/정리", emotion: "disgust" },
      { text: "다시 앞으로 나아가는 추진력", emotion: "anticipation" },
    ],
  },
];
