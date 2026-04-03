/**
 * 카테고리별 대표 유튜브 채널 (배우자 추천용)
 *
 * 배우자 타입의 idealVector에서 TCI 역산 → 추정 구독 카테고리 TOP 3을 뽑고,
 * 각 카테고리에 해당하는 대표 채널을 매핑합니다.
 *
 * "내 남편은 이런 채널 보는 사람이래" — 인스타 바이럴 콘텐츠용
 */

import type { YouTubeCategory } from './youtube-categories';

export const RECOMMENDED_CHANNELS: Record<YouTubeCategory, string[]> = {
  entertainment: ['문명특급', '네고왕', '놀면뭐하니'],
  vlog: ['곽튜브', '빠니보틀', '원지의하루'],
  music: ['딩고뮤직', '스튜디오 슬로우', 'COLORS'],
  gaming: ['우왁굳', '침착맨', '풍월량'],
  food: ['백종원', '승우아빠', '소프'],
  beauty: ['이사배', '포니', '레오제이'],
  education: ['세바시', '체인지그라운드', '김미경TV'],
  news: ['슈카월드', '삼프로TV', 'JTBC News'],
  tech: ['잇섭', 'EO', '노마드 코더'],
  sports: ['피지컬갤러리', '김종국 GYM', '운동뚱'],
  pets: ['크림히어로즈', '하루아루TV', '김메주와 고양이들'],
  kids: ['핑크퐁', '캐리와 장난감 친구들', '보람튜브'],
  asmr: ['Hongyu ASMR', 'Dana ASMR', 'miniyu'],
  finance: ['신사임당', '부읽남', '월급쟁이부자들TV'],
  travel: ['곽튜브', '빠니보틀', '트래블튜브'],
  other: ['TEDx Talks', '사물궁이', '과학쿠키'],
};

/** 카테고리별 한 줄 설명 (배우자 채널 소개 멘트용) */
export const CATEGORY_DESCRIPTIONS: Record<YouTubeCategory, string> = {
  entertainment: '웃음과 에너지가 넘치는 콘텐츠를 찾는 사람',
  vlog: '일상의 소소함에서 의미를 발견하는 사람',
  music: '감정을 음악으로 풀어내는 사람',
  gaming: '몰입과 전략을 즐기는 사람',
  food: '맛있는 것 앞에서 행복해지는 사람',
  beauty: '자기 표현에 진심인 사람',
  education: '배우는 것 자체가 즐거운 사람',
  news: '세상이 어떻게 돌아가는지 궁금한 사람',
  tech: '새로운 기술에 눈이 반짝이는 사람',
  sports: '몸을 움직이며 한계를 시험하는 사람',
  pets: '작은 생명에 마음이 무너지는 사람',
  kids: '아이의 세계를 함께 탐험하는 사람',
  asmr: '조용한 자극으로 마음을 다스리는 사람',
  finance: '숫자로 미래를 설계하는 사람',
  travel: '낯선 곳에서 자기를 발견하는 사람',
  other: '틀에 얽매이지 않는 호기심의 소유자',
};
