/**
 * 사주 계산 모듈
 * 양력 생년월일시 → 사주팔자(四柱八字) 계산
 * 천간(天干) 10개 + 지지(地支) 12개 → 60갑자 주기
 */

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────

export interface BirthInfo {
  year: number;
  month: number;  // 1-12
  day: number;    // 1-31
  hour?: number;  // 0-23 (null이면 시주 생략)
}

export interface SajuResult {
  fourPillars: {
    year: string;   // 예: "갑자"
    month: string;  // 예: "을축"
    day: string;    // 예: "병인"
    hour: string | null;  // 예: "정묘" or null (시간 모름)
  };
  dayMaster: string;         // 일간 한글 (갑~계)
  dayMasterElement: string;  // 일간 오행 (목/화/토/금/수)
  fiveElements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  dominantElement: string;   // 가장 많은 오행
  weakElement: string;       // 가장 적은 오행
  personality: string;       // 일간 기반 성격 요약
  dayBranch: string;         // 일지 (배우자궁)
  tenGodsGroup?: TenGodsGroup; // 십신 5대 그룹 분포
}

// ─────────────────────────────────────────────
// 천간(天干) & 지지(地支) 데이터
// ─────────────────────────────────────────────

const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;
const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;

type HeavenlyStem = typeof HEAVENLY_STEMS[number];
type EarthlyBranch = typeof EARTHLY_BRANCHES[number];
type FiveElement = '목' | '화' | '토' | '금' | '수';

/** 천간 → 오행 매핑 */
const STEM_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
};

/** 지지 → 오행 매핑 */
const BRANCH_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  '자': '수', '축': '토', '인': '목', '묘': '목',
  '진': '토', '사': '화', '오': '화', '미': '토',
  '신': '금', '유': '금', '술': '토', '해': '수',
};

/** 오행 → 영문 키 매핑 */
const ELEMENT_KEY: Record<FiveElement, keyof SajuResult['fiveElements']> = {
  '목': 'wood', '화': 'fire', '토': 'earth', '금': 'metal', '수': 'water',
};

/** 시간대 → 지지 (12시진) */
const HOUR_BRANCH_MAP: [number, number, EarthlyBranch][] = [
  [23, 1, '자'], [1, 3, '축'], [3, 5, '인'], [5, 7, '묘'],
  [7, 9, '진'], [9, 11, '사'], [11, 13, '오'], [13, 15, '미'],
  [15, 17, '신'], [17, 19, '유'], [19, 21, '술'], [21, 23, '해'],
];

/**
 * 월지 (양력 기준 절기 간이 매핑)
 * 절기 정확한 날짜는 매년 1-2일 차이가 있으나, 간이 매핑으로 처리
 * 입춘(2/4) ~ 경칩(3/6) → 인월, ... , 소한(1/6) ~ 입춘(2/3) → 축월
 */
const MONTH_BRANCH_CUTOFFS: [number, number, number][] = [
  // [월, 절기시작일, 지지인덱스]
  [2, 4, 2],   // 인(寅)월: 2/4 입춘
  [3, 6, 3],   // 묘(卯)월: 3/6 경칩
  [4, 5, 4],   // 진(辰)월: 4/5 청명
  [5, 6, 5],   // 사(巳)월: 5/6 입하
  [6, 6, 6],   // 오(午)월: 6/6 망종
  [7, 7, 7],   // 미(未)월: 7/7 소서
  [8, 7, 8],   // 신(申)월: 8/7 입추
  [9, 8, 9],   // 유(酉)월: 9/8 백로
  [10, 8, 10], // 술(戌)월: 10/8 한로
  [11, 7, 11], // 해(亥)월: 11/7 입동
  [12, 7, 0],  // 자(子)월: 12/7 대설
  [1, 6, 1],   // 축(丑)월: 1/6 소한
];

/**
 * 년간(年干) 기준 월간(月干) 산출표
 * 갑/기년 → 병인월, 을/경년 → 무인월, ...
 */
const YEAR_STEM_TO_MONTH_STEM_BASE: Record<number, number> = {
  0: 2,  // 갑(0), 기(5) → 병(2)인월
  1: 4,  // 을(1), 경(6) → 무(4)인월
  2: 6,  // 병(2), 신(7) → 경(6)인월
  3: 8,  // 정(3), 임(8) → 임(8)인월
  4: 0,  // 무(4), 계(9) → 갑(0)인월
};

/**
 * 일간(日干) 기준 시간(時干) 산출표
 * 갑/기일 → 갑자시, 을/경일 → 병자시, ...
 */
const DAY_STEM_TO_HOUR_STEM_BASE: Record<number, number> = {
  0: 0,  // 갑(0), 기(5) → 갑(0)자시
  1: 2,  // 을(1), 경(6) → 병(2)자시
  2: 4,  // 병(2), 신(7) → 무(4)자시
  3: 6,  // 정(3), 임(8) → 경(6)자시
  4: 8,  // 무(4), 계(9) → 임(8)자시
};

// ─────────────────────────────────────────────
// 일간별 성격 해석
// ─────────────────────────────────────────────

const DAY_MASTER_PERSONALITY: Record<HeavenlyStem, string> = {
  '갑': '큰 나무처럼 곧고 당당한 성격입니다. 리더십이 강하고 정의감이 있으며, 한 번 정한 뜻을 쉽게 굽히지 않는 강직함을 지녔습니다. 성장과 발전을 중요하게 여기며, 남을 돌보려는 마음이 큽니다.',
  '을': '풀이나 꽃처럼 유연하고 적응력이 뛰어난 성격입니다. 부드러운 외면 안에 강한 생명력을 품고 있으며, 환경에 맞춰 유연하게 변화할 줄 압니다. 예술적 감각과 섬세한 감성을 가졌습니다.',
  '병': '태양처럼 밝고 열정적인 성격입니다. 화려하고 따뜻한 에너지로 주변을 밝히며, 자신의 존재감을 자연스럽게 드러냅니다. 솔직하고 개방적이며, 사람들에게 영감을 주는 존재입니다.',
  '정': '촛불처럼 은은하고 따뜻한 성격입니다. 섬세하고 감성적이며, 조용하지만 깊이 있는 내면의 빛을 품고 있습니다. 한 가지에 집중하는 몰입력이 있고, 가까운 사람에게 깊은 사랑을 줍니다.',
  '무': '산이나 대지처럼 듬직하고 안정적인 성격입니다. 포용력이 크고 신뢰감을 주며, 어떤 상황에서도 중심을 잃지 않는 든든함이 있습니다. 현실적이고 실용적인 판단력을 가졌습니다.',
  '기': '논밭의 흙처럼 유연하고 온화한 성격입니다. 겉으로는 부드럽지만 속에는 풍부한 자원을 품고 있으며, 사람을 키우고 지원하는 데 뛰어납니다. 세심하고 배려심이 깊습니다.',
  '경': '철이나 바위처럼 강하고 결단력 있는 성격입니다. 의리가 있고 한 번 맡은 일은 끝까지 해내는 책임감이 강합니다. 정의로움을 중시하며, 불의를 참지 못하는 강한 성격을 가졌습니다.',
  '신': '보석이나 섬세한 금속처럼 날카롭고 예리한 성격입니다. 관찰력이 뛰어나고 완벽주의적인 면이 있으며, 미적 감각이 탁월합니다. 겉으로는 냉정해 보이지만 속은 따뜻합니다.',
  '임': '바다나 큰 강처럼 넓고 자유로운 성격입니다. 지적 호기심이 강하고 다양한 분야에 관심을 가지며, 새로운 지식과 경험을 끊임없이 추구합니다. 포용력이 크고 진취적입니다.',
  '계': '이슬이나 빗물처럼 조용하고 침착한 성격입니다. 직관력이 뛰어나고 감수성이 풍부하며, 겉으로 드러나지 않는 내면의 깊이를 지녔습니다. 생각이 깊고 창의적인 면모가 있습니다.',
};

// ─────────────────────────────────────────────
// 계산 함수
// ─────────────────────────────────────────────

/** 60갑자 문자열 반환 */
function sexagenaryCycle(stemIdx: number, branchIdx: number): string {
  return HEAVENLY_STEMS[stemIdx % 10] + EARTHLY_BRANCHES[branchIdx % 12];
}

/** 년주 계산 (입춘 기준 보정) */
function calcYearPillar(year: number, month: number, day: number): { stem: number; branch: number } {
  // 입춘(2/4) 이전이면 전년도 사용
  let adjustedYear = year;
  if (month < 2 || (month === 2 && day < 4)) {
    adjustedYear -= 1;
  }
  const idx = (adjustedYear - 4) % 60;
  return { stem: idx % 10, branch: idx % 12 };
}

/** 월주 계산 */
function calcMonthPillar(year: number, month: number, day: number, yearStem: number): { stem: number; branch: number } {
  // 월지 결정 (절기 기준)
  let branchIdx = 2; // 기본 인월
  for (let i = 0; i < MONTH_BRANCH_CUTOFFS.length; i++) {
    const [m, d, bIdx] = MONTH_BRANCH_CUTOFFS[i];
    const next = MONTH_BRANCH_CUTOFFS[(i + 1) % MONTH_BRANCH_CUTOFFS.length];
    if (month === m && day >= d) {
      branchIdx = bIdx;
    } else if (month === m && day < d && i > 0) {
      // 절기 이전이면 이전 월
      branchIdx = MONTH_BRANCH_CUTOFFS[i - 1]?.[2] ?? 1;
    }
  }

  // 더 정확한 월지 결정
  if (month === 1 && day < 6) branchIdx = 1;       // 축월 (전년 12월 대설~소한 전)
  else if (month === 1) branchIdx = 1;              // 축월 (소한~입춘 전)
  else if (month === 2 && day < 4) branchIdx = 1;   // 축월 (입춘 전)
  else if (month === 2) branchIdx = 2;               // 인월
  else if (month === 3 && day < 6) branchIdx = 2;
  else if (month === 3) branchIdx = 3;
  else if (month === 4 && day < 5) branchIdx = 3;
  else if (month === 4) branchIdx = 4;
  else if (month === 5 && day < 6) branchIdx = 4;
  else if (month === 5) branchIdx = 5;
  else if (month === 6 && day < 6) branchIdx = 5;
  else if (month === 6) branchIdx = 6;
  else if (month === 7 && day < 7) branchIdx = 6;
  else if (month === 7) branchIdx = 7;
  else if (month === 8 && day < 7) branchIdx = 7;
  else if (month === 8) branchIdx = 8;
  else if (month === 9 && day < 8) branchIdx = 8;
  else if (month === 9) branchIdx = 9;
  else if (month === 10 && day < 8) branchIdx = 9;
  else if (month === 10) branchIdx = 10;
  else if (month === 11 && day < 7) branchIdx = 10;
  else if (month === 11) branchIdx = 11;
  else if (month === 12 && day < 7) branchIdx = 11;
  else if (month === 12) branchIdx = 0;

  // 월간 결정: 년간에 따른 기본값 + 월지 오프셋
  const base = YEAR_STEM_TO_MONTH_STEM_BASE[yearStem % 5];
  // 인월(2)이 기준이므로, branchIdx에서 2를 빼서 오프셋 계산
  const offset = (branchIdx - 2 + 12) % 12;
  const stemIdx = (base + offset) % 10;

  return { stem: stemIdx, branch: branchIdx };
}

/** 일주 계산 (1900-01-01 = 갑자일 기준) */
function calcDayPillar(year: number, month: number, day: number): { stem: number; branch: number } {
  // 1900-01-01은 갑자(甲子)일 = 인덱스 0
  const base = new Date(1900, 0, 1);
  const target = new Date(year, month - 1, day);
  const diffDays = Math.floor((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
  const idx = ((diffDays % 60) + 60) % 60;
  return { stem: idx % 10, branch: idx % 12 };
}

/** 시주 계산 */
function calcHourPillar(hour: number, dayStem: number): { stem: number; branch: number } | null {
  if (hour < 0 || hour > 23) return null;

  // 시지 결정
  let branchIdx: number;
  if (hour === 23 || hour === 0) branchIdx = 0;      // 자시
  else branchIdx = Math.floor((hour + 1) / 2);

  // 시간 결정: 일간 기반
  const base = DAY_STEM_TO_HOUR_STEM_BASE[dayStem % 5];
  const stemIdx = (base + branchIdx) % 10;

  return { stem: stemIdx, branch: branchIdx };
}

/** 오행 분포 계산 */
function countFiveElements(pillars: { stem: number; branch: number }[]): SajuResult['fiveElements'] {
  const counts: SajuResult['fiveElements'] = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  for (const p of pillars) {
    const stemChar = HEAVENLY_STEMS[p.stem % 10];
    const branchChar = EARTHLY_BRANCHES[p.branch % 12];
    const stemEl = STEM_ELEMENT[stemChar];
    const branchEl = BRANCH_ELEMENT[branchChar];
    counts[ELEMENT_KEY[stemEl]]++;
    counts[ELEMENT_KEY[branchEl]]++;
  }

  return counts;
}

// ─────────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────────

/**
 * 양력 생년월일시 → 사주 분석 결과
 */
export function calculateSaju(birth: BirthInfo): SajuResult {
  const { year, month, day, hour } = birth;

  // 1. 년주
  const yearPillar = calcYearPillar(year, month, day);

  // 2. 월주
  const monthPillar = calcMonthPillar(year, month, day, yearPillar.stem);

  // 3. 일주
  const dayPillar = calcDayPillar(year, month, day);

  // 4. 시주 (시간 입력이 있을 때만)
  const hourPillar = hour != null ? calcHourPillar(hour, dayPillar.stem) : null;

  // 5. 사주 문자열
  const fourPillars = {
    year: sexagenaryCycle(yearPillar.stem, yearPillar.branch),
    month: sexagenaryCycle(monthPillar.stem, monthPillar.branch),
    day: sexagenaryCycle(dayPillar.stem, dayPillar.branch),
    hour: hourPillar ? sexagenaryCycle(hourPillar.stem, hourPillar.branch) : null,
  };

  // 6. 일간 (일주의 천간)
  const dayMaster = HEAVENLY_STEMS[dayPillar.stem % 10];
  const dayMasterElement = STEM_ELEMENT[dayMaster];

  // 7. 오행 분포
  const pillarsForCount = [yearPillar, monthPillar, dayPillar];
  if (hourPillar) pillarsForCount.push(hourPillar);
  const fiveElements = countFiveElements(pillarsForCount);

  // 8. 주요/부족 오행
  const elementNames: [keyof SajuResult['fiveElements'], FiveElement][] = [
    ['wood', '목'], ['fire', '화'], ['earth', '토'], ['metal', '금'], ['water', '수'],
  ];
  let maxEl = elementNames[0];
  let minEl = elementNames[0];
  for (const en of elementNames) {
    if (fiveElements[en[0]] > fiveElements[maxEl[0]]) maxEl = en;
    if (fiveElements[en[0]] < fiveElements[minEl[0]]) minEl = en;
  }

  // 9. 일간별 성격
  const personality = DAY_MASTER_PERSONALITY[dayMaster];

  // 10. 일지(배우자궁) 추출
  const dayBranch = fourPillars.day[1];

  // 11. 십신 분포 계산
  const partialResult = {
    fourPillars,
    dayMaster,
    dayMasterElement,
    fiveElements,
    dominantElement: maxEl[1],
    weakElement: minEl[1],
    personality,
    dayBranch,
  } as SajuResult;
  const tenGodsGroup = calculateTenGodsGroup(partialResult);

  return {
    ...partialResult,
    tenGodsGroup,
  };
}

/** 오행 한글명 반환 */
export const FIVE_ELEMENT_NAMES: Record<string, string> = {
  wood: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)',
};

// ─────────────────────────────────────────────
// 별자리 분석 (내부 엔진 — 용어 비노출)
// ─────────────────────────────────────────────

type ZodiacSign = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

/** 양력 월/일 → 서양 별자리 */
function getZodiacSign(month: number, day: number): ZodiacSign {
  const cutoffs: [number, number, ZodiacSign][] = [
    [1, 20, 'capricorn'], [2, 19, 'aquarius'], [3, 20, 'pisces'],
    [4, 20, 'aries'], [5, 21, 'taurus'], [6, 21, 'gemini'],
    [7, 23, 'cancer'], [8, 23, 'leo'], [9, 23, 'virgo'],
    [10, 23, 'libra'], [11, 22, 'scorpio'], [12, 22, 'sagittarius'],
  ];
  for (const [m, d, sign] of cutoffs) {
    if (month === m && day <= d) return sign;
  }
  // 월 내에서 cutoff 이후면 다음 별자리
  const nextSign: Record<number, ZodiacSign> = {
    1: 'aquarius', 2: 'pisces', 3: 'aries', 4: 'taurus',
    5: 'gemini', 6: 'cancer', 7: 'leo', 8: 'virgo',
    9: 'libra', 10: 'scorpio', 11: 'sagittarius', 12: 'capricorn',
  };
  return nextSign[month] || 'capricorn';
}

/** 별자리별 인사이트 — 사주와 겹치지 않는 4차원, 별자리 용어 없이 서술 */
const ZODIAC_INSIGHTS: Record<ZodiacSign, {
  loveLanguage: string;
  communicationStyle: string;
  hiddenFear: string;
  attractionPattern: string;
}> = {
  aries: {
    loveLanguage: '사랑을 표현할 때 주저하지 않고 직접적으로 다가갑니다. "좋아해"라는 말보다 행동이 먼저인 타입으로, 깜짝 이벤트나 갑작스러운 고백을 서슴지 않습니다. 상대방이 자신의 열정에 같은 온도로 반응해줄 때 가장 큰 사랑을 느낍니다.',
    communicationStyle: '핵심부터 말하는 편입니다. 돌려 말하는 것을 답답해하고, 상대방에게도 솔직한 대화를 기대합니다. 갈등 상황에서는 먼저 문제를 제기하는 쪽이지만, 뒤끝 없이 빨리 풀고 싶어 합니다. 침묵으로 일관하는 상대 앞에서 가장 무력해집니다.',
    hiddenFear: '자신이 무시당하거나 존재감이 사라지는 것을 가장 두려워합니다. 관계에서 주도권을 잃으면 불안해지고, "나 없이도 잘 지내는 거 아닌가?"라는 생각에 흔들립니다.',
    attractionPattern: '자신감 있고 당당한 에너지에 본능적으로 끌립니다. 처음 만남에서 눈빛이 흔들리지 않는 사람, 자기 세계가 확고한 사람에게 강한 호기심을 느낍니다. 쉽게 정복되지 않는 사람일수록 더 매력적으로 느낍니다.',
  },
  taurus: {
    loveLanguage: '사랑을 오감으로 표현합니다. 직접 만든 음식, 정성스러운 선물, 따뜻한 포옹 같은 물리적 표현을 통해 마음을 전합니다. 말보다는 함께하는 시간의 질로 사랑을 확인하며, 꾸준하고 변함없는 애정 표현을 가장 소중하게 여깁니다.',
    communicationStyle: '급하게 결론을 내리기보다 충분히 생각한 후 말합니다. 감정적인 대화보다 구체적이고 현실적인 이야기를 선호하며, 약속은 반드시 지킵니다. 갈등 시 바로 반응하지 않고 시간을 가진 후 차분하게 이야기하는 편입니다.',
    hiddenFear: '갑작스러운 변화와 불안정에 대한 깊은 두려움이 있습니다. 익숙한 것을 잃는 것, 예고 없이 관계가 흔들리는 것을 가장 무서워합니다. 겉으로는 담담해 보여도 내면에서는 "이 안정이 깨지면 어쩌지"라는 걱정이 항상 있습니다.',
    attractionPattern: '차분하고 신뢰감 있는 분위기에 끌립니다. 화려하기보다 은은하게 자기만의 매력을 가진 사람, 말보다 행동으로 진심을 보여주는 사람에게 마음이 갑니다. 함께 있으면 편안해지는 사람, 서두르지 않는 사람에게 안전함을 느낍니다.',
  },
  gemini: {
    loveLanguage: '대화로 사랑을 나눕니다. 재미있는 이야기, 깊은 토론, 일상의 소소한 수다가 모두 사랑의 표현입니다. 상대방과 지적으로 교감할 때 가장 큰 친밀감을 느끼고, 매일 새로운 화제로 대화할 수 있는 관계를 꿈꿉니다.',
    communicationStyle: '빠르고 위트 있게 소통합니다. 한 가지 주제에 오래 머무르기보다 다양한 이야기를 오가며, 유머를 섞어 분위기를 밝히는 편입니다. 하지만 정말 깊은 감정 이야기가 나오면 농담으로 넘기려는 습관이 있습니다.',
    hiddenFear: '지루함과 정체에 대한 공포가 있습니다. 관계가 패턴화되고 새로움이 사라지면 숨이 막히는 느낌을 받습니다. "이 사람과 평생 같은 대화만 반복하는 건 아닐까"라는 생각이 불현듯 찾아올 때가 있습니다.',
    attractionPattern: '지적 호기심을 자극하는 사람에게 즉각 반응합니다. 예상치 못한 관점을 던지는 사람, 대화할수록 새로운 면이 드러나는 사람에게 강하게 끌립니다. 미스터리한 내면을 가진 사람일수록 더 알고 싶어집니다.',
  },
  cancer: {
    loveLanguage: '돌봄으로 사랑을 표현합니다. 상대방이 아프면 직접 죽을 끓이고, 힘들어하면 말없이 안아주며, 기념일마다 의미 있는 무언가를 준비합니다. 상대방이 자신의 보살핌을 진심으로 감사해할 때, 그것이 가장 큰 사랑의 확인입니다.',
    communicationStyle: '감정의 온도를 먼저 읽고 말합니다. 상대방의 기분에 맞춰 대화를 조율하며, 공감과 위로를 잘합니다. 하지만 자신이 상처받으면 바로 말하지 못하고, 서운함이 쌓여야 비로소 터뜨립니다. 그래서 상대가 갑작스럽다고 느낄 수 있습니다.',
    hiddenFear: '거절당하고 버림받는 것에 대한 뿌리 깊은 두려움이 있습니다. "내가 이만큼 해줬는데 돌아오는 게 없으면 어쩌지"라는 불안이 마음 깊은 곳에 있습니다. 사랑하는 사람이 자신을 필요로 하지 않게 되는 것이 가장 무서운 시나리오입니다.',
    attractionPattern: '따뜻하고 보호본능을 자극하는 사람에게 끌립니다. 겉은 강해 보이는데 속은 여린 사람, 자신 앞에서만 약한 모습을 보여주는 사람에게 마음이 움직입니다. "내가 이 사람을 지켜줘야 해"라는 감정이 사랑의 시작입니다.',
  },
  leo: {
    loveLanguage: '사랑을 화려하고 아낌없이 표현합니다. 공개적으로 애정을 드러내는 것을 부끄러워하지 않고, 상대방을 자랑스러워하는 마음을 숨기지 않습니다. 하지만 그만큼 상대방으로부터도 특별한 존재로 대우받고 싶어 합니다.',
    communicationStyle: '열정적이고 드라마틱하게 소통합니다. 이야기에 감정을 듬뿍 실어 전달하고, 상대방의 이야기에도 과장된 리액션으로 반응합니다. 하지만 자존심이 상하는 말에는 즉각적으로 방어벽을 세우며, 사과받기 전까지 풀리지 않습니다.',
    hiddenFear: '사랑받지 못하는 자신, 특별하지 않은 자신이 될까 두렵습니다. 겉으로는 자신감이 넘쳐 보이지만, "진짜 나를 보면 실망하지 않을까"라는 불안이 있습니다. 주목받지 못하는 상황에서 자존감이 흔들립니다.',
    attractionPattern: '자신을 진심으로 인정하고 존중하는 사람에게 마음을 엽니다. 아첨이 아닌 진정한 존경의 눈빛을 가진 사람, 자기만의 빛이 있으면서도 상대를 빛나게 해줄 줄 아는 사람에게 끌립니다. 경쟁이 아닌 상호 존중의 관계를 원합니다.',
  },
  virgo: {
    loveLanguage: '디테일한 배려로 사랑을 증명합니다. 상대방이 무심코 한 말을 기억해두었다가 실행하고, 건강을 챙기고, 생활의 불편함을 조용히 해결해줍니다. 거창한 이벤트보다 매일의 작은 정성이 진짜 사랑이라고 믿습니다.',
    communicationStyle: '논리적이고 정확하게 소통합니다. 감정보다 사실에 기반해 대화하며, 조언을 줄 때 구체적이고 실용적입니다. 하지만 이것이 때로 "잔소리"로 들릴 수 있고, 상대방의 감정을 인정하기 전에 해결책부터 제시하는 경향이 있습니다.',
    hiddenFear: '불완전한 자신이 드러나는 것을 두려워합니다. 실수하는 것, 준비되지 않은 상태로 노출되는 것에 대한 깊은 불안이 있습니다. "더 완벽했다면 더 사랑받았을 텐데"라는 생각이 무의식을 지배합니다.',
    attractionPattern: '겉은 자유로운데 속은 깊이 있는 사람에게 끌립니다. 자신과는 다르게 즉흥적이고 여유로운 사람에게 묘한 매력을 느끼면서, 동시에 대화를 나눠보면 생각의 깊이가 있는 사람에게 존경을 품습니다.',
  },
  libra: {
    loveLanguage: '조화로운 분위기를 만들어 사랑을 표현합니다. 함께하는 공간을 아름답게 꾸미고, 둘만의 특별한 문화(카페, 음악, 산책 코스)를 만들어갑니다. 상대방과의 밸런스를 중시하며, 주는 만큼 받는 대등한 관계를 추구합니다.',
    communicationStyle: '부드럽고 외교적으로 소통합니다. 직접적인 충돌을 피하고, 상대방의 기분을 상하지 않게 하면서 자신의 의견을 전달하려 합니다. 하지만 이런 태도가 때로는 우유부단함이나 본심을 숨기는 것으로 비칠 수 있습니다.',
    hiddenFear: '혼자 남겨지는 것, 그리고 관계에서 불공정한 대우를 받는 것을 두려워합니다. 갈등 자체보다 갈등으로 인해 관계가 깨지는 것이 더 무섭습니다. "모든 사람에게 좋은 사람이 되어야 한다"는 압박이 있습니다.',
    attractionPattern: '결단력 있고 자기 확신이 강한 사람에게 끌립니다. 자신이 망설일 때 "이쪽으로 가자"고 손을 잡아주는 사람, 분명한 가치관을 가지면서도 상대를 존중할 줄 아는 사람에게 안정감을 느낍니다.',
  },
  scorpio: {
    loveLanguage: '전부 아니면 전무입니다. 사랑하면 온 마음을 다해 몰입하고, 상대방의 가장 깊은 곳까지 알고 싶어 합니다. 표면적인 관계는 의미가 없으며, 영혼까지 닿는 깊은 유대감을 추구합니다. 비밀을 공유하는 것이 사랑의 증거입니다.',
    communicationStyle: '직관적으로 소통합니다. 상대방이 말하지 않은 것까지 읽어내고, 대화의 이면에 숨겨진 진심을 파악합니다. 거짓말이나 가식을 본능적으로 감지하며, 진솔하지 않은 대화에는 즉시 벽을 세웁니다.',
    hiddenFear: '배신당하는 것, 신뢰가 무너지는 것에 대한 극도의 두려움이 있습니다. 한 번 상처받으면 회복이 오래 걸리고, "다시는 이렇게 깊이 믿지 않겠다"고 다짐하지만 또다시 깊이 빠져드는 자신을 발견합니다.',
    attractionPattern: '깊이가 느껴지는 사람에게 끌립니다. 눈빛에 이야기가 있는 사람, 쉽게 자신을 드러내지 않는 신비로운 사람에게 강렬한 호기심을 느낍니다. 표면적인 매력보다 내면의 진정성이 더 중요합니다.',
  },
  sagittarius: {
    loveLanguage: '함께 새로운 경험을 나누며 사랑을 표현합니다. 여행, 새로운 맛집 탐방, 함께 배우는 취미 등 "경험의 공유"가 곧 사랑입니다. 구속보다는 자유 속에서 서로를 선택하는 관계를 꿈꾸며, 유머로 일상을 밝힙니다.',
    communicationStyle: '솔직하고 직설적입니다. 생각나는 대로 말하는 편이라 때로는 상대방이 준비되지 않은 진실을 던지기도 합니다. 무거운 대화보다 가볍고 유쾌한 톤을 선호하며, 지나치게 감정적인 대화에서는 빠져나오고 싶어 합니다.',
    hiddenFear: '갇히는 것, 가능성이 차단되는 것을 가장 두려워합니다. 한 가지에 영원히 묶이는 것이 숨 막히게 느껴지고, "더 넓은 세상이 있는데 여기에만 머물러야 하나"라는 불안이 있습니다.',
    attractionPattern: '독립적이면서도 함께 모험을 즐길 수 있는 사람에게 끌립니다. 자기만의 세계가 풍부한 사람, 새로운 것에 대한 호기심이 넘치는 사람에게 동지애를 느낍니다. 집착하지 않으면서도 진심을 보여주는 사람이 이상적입니다.',
  },
  capricorn: {
    loveLanguage: '책임감과 헌신으로 사랑을 증명합니다. 말보다 행동, 감정보다 실천을 중시합니다. 상대방의 미래를 함께 설계하고, 경제적·정서적 안정을 위해 묵묵히 노력합니다. 오래 지속되는 관계, 시간이 갈수록 깊어지는 사랑을 믿습니다.',
    communicationStyle: '신중하고 현실적으로 소통합니다. 감정에 휩쓸리지 않고 차분하게 상황을 분석하며, 실질적인 해결책을 제시합니다. 하지만 상대방이 위로를 원할 때도 조언을 하게 되어 "차갑다"는 인상을 줄 수 있습니다.',
    hiddenFear: '실패하는 것, 무능하게 보이는 것에 대한 깊은 두려움이 있습니다. 사랑하는 사람을 제대로 지켜주지 못할까 봐 불안하고, 그래서 더 열심히 일하고 더 많이 준비합니다. "나는 충분한가?"라는 질문이 항상 마음에 있습니다.',
    attractionPattern: '따뜻하고 감성적인 사람에게 끌립니다. 자신이 부족한 감정적 표현을 자연스럽게 해주는 사람, 단단한 자신의 껍질을 부드럽게 녹여주는 사람에게 마음을 엽니다. 신뢰할 수 있으면서도 유연한 사람이 이상적입니다.',
  },
  aquarius: {
    loveLanguage: '정신적 교감으로 사랑을 표현합니다. 함께 세상을 바꿀 아이디어를 나누고, 서로의 독특함을 인정하고 응원합니다. 소유가 아닌 동반자 의식으로 연결되며, "나를 바꾸려 하지 않는 사람"에게 가장 깊은 애정을 느낍니다.',
    communicationStyle: '논리적이면서도 독창적으로 소통합니다. 남들이 생각하지 못한 각도에서 문제를 바라보며, 흥미로운 주제라면 밤새 대화할 수 있습니다. 하지만 감정적으로 밀착되는 대화에서는 약간의 거리를 두려 합니다.',
    hiddenFear: '평범해지는 것, 자기다움을 잃는 것을 두려워합니다. 관계 안에서 자신의 독립성이 사라지는 것이 가장 무섭고, "남들과 같은 삶"을 살게 될까 봐 불안합니다. 동시에 "너무 다른 나를 이해해줄 사람이 있을까"라는 외로움도 있습니다.',
    attractionPattern: '관습에 얽매이지 않는 자유로운 영혼에게 끌립니다. 자기만의 철학이 있는 사람, 눈치 보지 않고 자신의 길을 가는 사람에게 강한 동지애를 느낍니다. 감정적 압박 없이 옆에 있어주는 사람이 가장 편합니다.',
  },
  pisces: {
    loveLanguage: '감정의 깊이로 사랑을 표현합니다. 상대방의 슬픔을 함께 울고, 기쁨을 온몸으로 축하합니다. 시, 음악, 손편지 같은 감성적 표현을 통해 마음을 전하며, 상대방과 하나가 되는 듯한 깊은 공감을 추구합니다.',
    communicationStyle: '직관과 감성으로 소통합니다. 말의 내용보다 말투와 표정에서 진심을 읽어내고, 상대방이 말하지 않은 감정까지 알아챕니다. 하지만 현실적이고 논리적인 대화에서는 당황하거나 회피하는 경향이 있습니다.',
    hiddenFear: '현실에 짓눌리는 것, 꿈꿀 수 있는 공간을 빼앗기는 것을 두려워합니다. 냉혹한 현실이 자신의 이상적인 세계를 부수는 것이 무섭고, "내가 너무 순진한 건 아닐까"라는 자기 의심이 찾아올 때가 있습니다.',
    attractionPattern: '강하면서도 부드러운 사람에게 끌립니다. 현실적인 판단력을 가졌으면서도 감성을 이해하는 사람, 자신의 꿈을 비웃지 않고 함께 상상해줄 수 있는 사람에게 마음을 엽니다. 보호받는 느낌을 주면서도 자유롭게 해주는 사람이 이상적입니다.',
  },
};

// ─────────────────────────────────────────────
// 일지(日支) 배우자궁 인사이트 — 사주 용어 없이
// ─────────────────────────────────────────────

/** 일지(배우자궁)별 관계 인사이트 — 사주 용어 없이 서술 */
const SPOUSE_PALACE_INSIGHTS: Record<EarthlyBranch, {
  partnerDynamic: string;
  relationshipStrength: string;
  relationshipChallenge: string;
}> = {
  '자': {
    partnerDynamic: '파트너와의 관계에서 지적인 교감을 가장 중요하게 여깁니다. 대화가 통하지 않는 관계는 아무리 조건이 좋아도 오래 가지 못합니다. 밤늦게까지 이야기를 나눌 수 있는 사람, 생각의 깊이가 있는 사람에게 진정한 친밀감을 느낍니다.',
    relationshipStrength: '상대방의 감정을 직관적으로 읽어내는 능력이 뛰어납니다. 말하지 않아도 분위기만으로 상대의 기분을 파악하고, 필요한 순간에 적절한 반응을 해줄 수 있습니다.',
    relationshipChallenge: '감정이 깊어질수록 불안해지는 경향이 있습니다. 관계가 너무 가까워지면 오히려 거리를 두려 하고, 이 밀당이 상대방을 혼란스럽게 만들 수 있습니다.',
  },
  '축': {
    partnerDynamic: '관계에서 안정감과 신뢰를 최우선으로 둡니다. 화려한 연애보다 꾸준히 쌓아가는 관계를 선호하며, 시간이 갈수록 깊어지는 사랑을 믿습니다. 상대방의 신뢰를 얻기까지 오래 걸리지만, 한 번 마음을 열면 변함이 없습니다.',
    relationshipStrength: '한결같은 태도로 상대방에게 든든한 안전 기지가 됩니다. 위기 상황에서도 흔들리지 않는 침착함이 있고, 현실적인 문제 해결 능력으로 관계를 지탱합니다.',
    relationshipChallenge: '변화에 대한 저항이 강해서, 관계가 발전하기 위해 필요한 변화도 거부할 수 있습니다. 상대방이 새로운 시도를 제안하면 부담으로 느낄 때가 있습니다.',
  },
  '인': {
    partnerDynamic: '관계 안에서도 성장을 추구합니다. 함께 새로운 것을 배우고 도전하는 파트너를 원하며, 정체된 관계에서는 답답함을 느낍니다. 서로를 자극하고 발전시키는 역동적인 관계를 꿈꿉니다.',
    relationshipStrength: '파트너에게 새로운 세계를 열어줄 수 있는 능력이 있습니다. 용기와 추진력으로 관계를 이끌고, 상대방이 자신의 잠재력을 발견하도록 동기부여합니다.',
    relationshipChallenge: '주도권을 놓기 어렵습니다. 상대방의 속도에 맞추기보다 자신의 페이스대로 밀고 나가려 해서, 파트너가 끌려다니는 느낌을 받을 수 있습니다.',
  },
  '묘': {
    partnerDynamic: '섬세하고 감성적인 교류를 중시합니다. 상대방의 작은 변화도 놓치지 않고 알아차리며, 분위기와 감정의 흐름에 민감합니다. 거친 표현보다 은은하고 세심한 배려를 주고받는 관계를 선호합니다.',
    relationshipStrength: '상대방의 상처를 부드럽게 치유하는 능력이 있습니다. 따뜻한 공감과 섬세한 위로로 파트너의 마음을 녹이며, 함께 있으면 심리적으로 안정되는 분위기를 만듭니다.',
    relationshipChallenge: '너무 민감해서 사소한 말에도 상처받기 쉽습니다. 상대방의 무심한 한마디를 깊이 곱씹고, 그것을 바로 말하지 못해 속으로 쌓아두는 패턴이 있습니다.',
  },
  '진': {
    partnerDynamic: '관계에 대한 큰 비전을 가지고 있습니다. 단순히 연인이 아니라 인생의 동반자, 함께 무언가를 이뤄낼 파트너를 찾습니다. 관계 자체보다 함께 만들어갈 미래에 더 집중하는 경향이 있습니다.',
    relationshipStrength: '포부가 크고 에너지가 넘쳐서 관계에 활력을 불어넣습니다. 어려운 상황에서도 희망을 잃지 않고, 파트너에게 "우리는 더 좋아질 거야"라는 확신을 심어줍니다.',
    relationshipChallenge: '이상이 너무 높아서 현실의 파트너에게 실망하기 쉽습니다. 완벽한 관계를 추구하다 보니, 있는 그대로의 상대방을 수용하는 데 어려움을 겪을 수 있습니다.',
  },
  '사': {
    partnerDynamic: '관계에서 열정과 지적 자극을 동시에 추구합니다. 매력적이고 재능 있는 사람에게 끌리며, 서로에게 영감을 주는 관계를 원합니다. 권태기가 오면 관계의 의미를 근본적으로 재고하는 경향이 있습니다.',
    relationshipStrength: '통찰력이 뛰어나서 관계의 문제를 빠르게 파악하고 해결 방향을 제시합니다. 파트너의 숨겨진 재능을 알아보고 끌어내는 안목이 있습니다.',
    relationshipChallenge: '의심이 많을 수 있습니다. 파트너를 완전히 신뢰하기까지 시간이 걸리고, 작은 모순도 놓치지 않아 상대가 시험받는 느낌을 받을 수 있습니다.',
  },
  '오': {
    partnerDynamic: '열정적이고 감정의 기복이 큰 관계 스타일입니다. 사랑할 때는 온 세상이 빛나지만, 갈등 시에는 감정이 격해질 수 있습니다. 뜨겁고 역동적인 관계를 자연스럽게 만들어가며, 시시한 관계는 견디지 못합니다.',
    relationshipStrength: '사랑에 올인하는 열정이 있습니다. 상대방을 위해서라면 무엇이든 할 수 있는 헌신적인 면이 있고, 관계에 늘 활기와 에너지를 불어넣습니다.',
    relationshipChallenge: '감정에 좌우되어 일관성이 부족할 수 있습니다. 기분이 좋을 때와 나쁠 때의 태도 차이가 커서, 파트너가 당신의 기분을 살피게 될 수 있습니다.',
  },
  '미': {
    partnerDynamic: '관계에서 편안함과 소속감을 가장 중시합니다. 가정적이고 따뜻한 분위기를 만드는 데 뛰어나며, 파트너와 함께하는 일상의 소소한 행복을 소중히 여깁니다. "함께 밥 먹고, 함께 잠드는" 평범한 일상이 곧 사랑입니다.',
    relationshipStrength: '상대방을 있는 그대로 받아들이는 포용력이 있습니다. 판단하지 않고 들어주며, 파트너가 편안하게 자기를 드러낼 수 있는 공간을 만듭니다.',
    relationshipChallenge: '갈등을 피하려는 경향이 강해서 중요한 문제를 덮어둘 수 있습니다. 작은 불만을 표현하지 않고 쌓아두다가 한꺼번에 터뜨릴 위험이 있습니다.',
  },
  '신': {
    partnerDynamic: '관계에서 명확함과 효율을 중시합니다. 애매한 상태를 싫어하고, "우리 사이가 뭐야?"에 대한 분명한 답을 원합니다. 결단력 있게 관계를 진전시키며, 불필요한 감정 소모를 줄이려 합니다.',
    relationshipStrength: '목표 지향적이라 관계의 방향성을 잘 잡습니다. 문제가 생기면 감정에 빠지기보다 해결책을 찾아 움직이며, 약속은 반드시 지키는 신뢰감을 줍니다.',
    relationshipChallenge: '감정적 교류보다 실용적 측면에 치중할 수 있습니다. "왜 그렇게 느꼈는지"보다 "그래서 어떻게 할 건지"에 먼저 집중해서, 파트너가 공감받지 못한다고 느낄 수 있습니다.',
  },
  '유': {
    partnerDynamic: '세련되고 품위 있는 관계를 추구합니다. 감정 표현에도 격이 있어서, 거칠거나 저속한 행동에 즉각 거리를 둡니다. 함께 문화생활을 즐기고, 서로를 존중하는 성숙한 관계를 지향합니다.',
    relationshipStrength: '미적 감각과 분위기를 만드는 능력이 탁월합니다. 특별한 날이 아니어도 일상을 아름답게 연출하며, 파트너에게 "나와 함께하면 삶이 더 우아해진다"는 느낌을 줍니다.',
    relationshipChallenge: '감정을 논리적으로 처리하려는 경향이 있어서 진짜 속마음을 드러내기 어렵습니다. 완벽한 모습만 보여주려다 파트너와의 진정한 교감을 놓칠 수 있습니다.',
  },
  '술': {
    partnerDynamic: '관계에서 충성심과 의리를 가장 중시합니다. 한 번 마음을 준 사람을 끝까지 지키려 하며, 배신은 절대 용서하지 않습니다. 느리지만 확실한 사랑, 검증된 신뢰 위에 쌓는 관계를 추구합니다.',
    relationshipStrength: '위기 상황에서 가장 빛나는 파트너입니다. 어려울 때 도망가지 않고 끝까지 곁을 지키며, 상대방을 위해 자신을 희생하는 것도 서슴지 않습니다.',
    relationshipChallenge: '한 번 마음이 닫히면 다시 열기 매우 어렵습니다. 상처받으면 오랫동안 경계를 풀지 않고, 과거의 실수를 완전히 잊지 못하는 경향이 있습니다.',
  },
  '해': {
    partnerDynamic: '관계에서 정서적 깊이와 영혼의 교감을 추구합니다. 피상적인 만남은 의미가 없고, 서로의 내면을 완전히 이해하는 관계를 꿈꿉니다. 상대방과의 경계가 모호해질 정도로 깊이 연결되고 싶어 합니다.',
    relationshipStrength: '상대방의 감정을 마치 자기 것처럼 느끼는 깊은 공감 능력이 있습니다. 판단 없이 무조건적으로 수용하며, 파트너가 가장 취약한 순간에 가장 따뜻한 존재가 됩니다.',
    relationshipChallenge: '경계가 모호해져서 파트너의 감정에 과도하게 영향받을 수 있습니다. 상대의 기분이 나쁘면 나도 나빠지고, 관계 안에서 자기 자신을 잃을 위험이 있습니다.',
  },
};

// ─────────────────────────────────────────────
// 십신(十神) 분포 분석
// ─────────────────────────────────────────────

/** 십신 5대 그룹 분포 */
export interface TenGodsGroup {
  independence: number;  // 비견+겁재 (비겁)
  expression: number;    // 식신+상관 (식상)
  wealth: number;        // 정재+편재 (재성)
  authority: number;     // 정관+편관 (관성)
  resource: number;      // 정인+편인 (인성)
}

/** 오행 상생 순서: 목→화→토→금→수→목 */
const PRODUCTION_CYCLE: FiveElement[] = ['목', '화', '토', '금', '수'];

/**
 * 일간 기준 다른 오행의 십신 그룹 판별
 * 나와 같은 오행: 비겁(independence)
 * 내가 생하는 오행: 식상(expression)
 * 내가 극하는 오행: 재성(wealth)
 * 나를 극하는 오행: 관성(authority)
 * 나를 생하는 오행: 인성(resource)
 */
function getTenGodGroup(dayMasterElement: FiveElement, targetElement: FiveElement): keyof TenGodsGroup {
  if (dayMasterElement === targetElement) return 'independence';
  const dmIdx = PRODUCTION_CYCLE.indexOf(dayMasterElement);
  const tIdx = PRODUCTION_CYCLE.indexOf(targetElement);
  // 내가 생하는 것: (dmIdx+1)%5
  if (tIdx === (dmIdx + 1) % 5) return 'expression';
  // 내가 극하는 것: (dmIdx+2)%5
  if (tIdx === (dmIdx + 2) % 5) return 'wealth';
  // 나를 극하는 것: (dmIdx+3)%5 (역으로 보면: 나를 극하는 것 = (dmIdx-2+5)%5 아닌가?)
  // 상극: 목→토, 화→금, 토→수, 금→목, 수→화 (2칸 뒤)
  // 나를 극하는 것 = (dmIdx-2+5)%5 = (dmIdx+3)%5
  if (tIdx === (dmIdx + 3) % 5) return 'authority';
  // 나를 생하는 것: (dmIdx-1+5)%5 = (dmIdx+4)%5
  return 'resource';
}

/** 사주 내 모든 글자에서 십신 그룹 분포 계산 */
function calculateTenGodsGroup(result: SajuResult): TenGodsGroup {
  const group: TenGodsGroup = { independence: 0, expression: 0, wealth: 0, authority: 0, resource: 0 };
  const dmElement = result.dayMasterElement as FiveElement;

  // 사주 4개 주(柱)에서 천간+지지 추출 (일간 자신 제외)
  const pillars = [result.fourPillars.year, result.fourPillars.month, result.fourPillars.day, result.fourPillars.hour];
  for (let i = 0; i < pillars.length; i++) {
    const pillar = pillars[i];
    if (!pillar) continue;
    const stem = pillar[0] as HeavenlyStem;
    const branch = pillar[1] as EarthlyBranch;
    // 일주의 천간(일간)은 자기 자신이므로 제외
    if (i === 2) {
      // 일주: 지지만 카운트
      if (BRANCH_ELEMENT[branch]) {
        group[getTenGodGroup(dmElement, BRANCH_ELEMENT[branch])]++;
      }
    } else {
      // 다른 주: 천간 + 지지 모두 카운트
      if (STEM_ELEMENT[stem]) {
        group[getTenGodGroup(dmElement, STEM_ELEMENT[stem])]++;
      }
      if (BRANCH_ELEMENT[branch]) {
        group[getTenGodGroup(dmElement, BRANCH_ELEMENT[branch])]++;
      }
    }
  }
  return group;
}

/** 우세 십신 그룹별 관계 에너지 패턴 인사이트 — 사주 용어 없이 */
function getTenGodsInsight(group: TenGodsGroup): string {
  const entries: [keyof TenGodsGroup, number][] = [
    ['independence', group.independence],
    ['expression', group.expression],
    ['wealth', group.wealth],
    ['authority', group.authority],
    ['resource', group.resource],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  const dominant = entries[0][0];

  const insights: Record<keyof TenGodsGroup, string> = {
    independence: '관계에서 대등함을 추구하는 에너지가 강합니다. 누군가에게 의존하기보다 나란히 걸어가는 관계를 원하며, 자신의 영역과 주체성을 지키는 것이 중요합니다. 파트너와 경쟁심이 생길 수 있지만, 이것이 서로를 성장시키는 동력이 되기도 합니다. 혼자서도 충분히 잘 지낼 수 있지만, 그래서 오히려 "이 사람과 함께하고 싶다"는 선택이 더 의미 있습니다.',
    expression: '감정을 표현하고 창조하는 에너지가 풍부합니다. 관계 안에서 자신의 감성과 생각을 자유롭게 나누고 싶어 하며, 파트너와 함께 무언가를 만들어가는 과정에서 기쁨을 느낍니다. 말로든 행동으로든 자기표현이 활발하고, 때로는 솔직함이 지나쳐 상대방을 당황하게 할 수 있습니다. 하지만 이 에너지는 관계를 정직하고 생동감 있게 만드는 원천입니다.',
    wealth: '현실적이고 실용적인 관계 에너지가 강합니다. 사랑도 중요하지만 함께하는 삶의 구체적인 조건(경제력, 생활 습관, 미래 계획)을 꼼꼼히 따지는 편입니다. 계획적으로 미래를 설계하고 파트너와 함께 안정적인 기반을 쌓아가는 것을 중시합니다. 로맨틱한 면이 부족해 보일 수 있지만, 말보다 행동으로 사랑을 증명하는 든든한 사람입니다.',
    authority: '관계에서 구조와 책임감을 중시하는 에너지가 강합니다. 역할 분담이 명확한 관계를 선호하고, 사회적 기대와 규범 안에서 관계를 유지하려 합니다. 자기관리가 철저하고 파트너에게도 일정한 기준을 요구할 수 있습니다. 안정적이고 예측 가능한 관계를 만들지만, 유연성이 부족할 때가 있습니다.',
    resource: '배움과 돌봄의 에너지가 관계를 지배합니다. 파트너에게서 새로운 것을 배우고 싶고, 동시에 상대방을 보살피고 가르치는 역할을 자연스럽게 맡습니다. 지적인 교감과 정서적 안정감을 동시에 추구하며, 마치 서로의 멘토이자 안식처가 되는 관계를 이상적으로 여깁니다. 의존적이 될 수 있지만, 이것은 깊은 신뢰의 표현입니다.',
  };

  return insights[dominant];
}

// ─────────────────────────────────────────────
// 사주 관계 인사이트 (사주 용어 없이 일상 언어로)
// ─────────────────────────────────────────────

/** 일간별 근본 성격 — 사주 용어 없이 서술 */
const DAY_MASTER_CORE: Record<HeavenlyStem, {
  identity: string;
  innerConflict: string;
  stressResponse: string;
  hiddenHabits: string;
}> = {
  '갑': {
    identity: '사람들이 의지하는 든든한 기둥 같은 존재입니다. 한 번 결심하면 쉽게 흔들리지 않고, 옳다고 믿는 길을 묵묵히 걸어갑니다. 리더 역할을 자연스럽게 맡지만, 그 무게감이 때로는 외로움이 됩니다.',
    innerConflict: '자신의 기준이 높아서 타협하기 어렵습니다. "이게 맞는 건데 왜 아무도 안 따라와?"라는 답답함을 자주 느낍니다. 사람들을 이끌고 싶지만, 동시에 누군가에게 기대고 싶은 마음도 있습니다.',
    stressResponse: '스트레스를 받으면 더 완고해집니다. 평소보다 말수가 줄고, 혼자 문제를 해결하려 합니다. 도움을 요청하는 것을 약함으로 느끼지만, 한계에 다다르면 갑자기 폭발적으로 감정을 토해냅니다.',
    hiddenHabits: '혼자 있을 때 미래 계획을 세우거나 정리정돈을 합니다. 새벽에 생각이 많아져서 잠들기 어려울 때가 있고, 마음을 정리하기 위해 걷거나 운동하는 편입니다.',
  },
  '을': {
    identity: '겉으로는 유연하고 부드럽지만, 안에는 놀라울 정도로 강한 생명력을 품고 있습니다. 어떤 환경에서든 적응하는 능력이 뛰어나고, 사람들 사이에서 자연스럽게 분위기를 맞춥니다. 하지만 그 유연함 때문에 자신의 진짜 욕구를 숨길 때가 많습니다.',
    innerConflict: '남의 감정에 민감해서 거절을 잘 못 합니다. 상대방 기분을 맞추다 보면 정작 자기가 뭘 원하는지 모를 때가 있습니다. "나는 왜 항상 양보만 하지?"라는 생각이 들 때가 있지만, 그래도 또 양보합니다.',
    stressResponse: '스트레스를 받으면 예민해지면서 사소한 것에 상처받습니다. 겉으로는 괜찮은 척하지만 속으로 곱씹고, 혼자 울거나 감정을 일기장이나 메모에 쏟아내는 방식으로 풀기도 합니다.',
    hiddenHabits: '예쁜 것, 감각적인 것에 끌립니다. 인테리어나 옷, 소품을 정리하면서 마음을 정돈하고, 혼자만의 취미(그림, 글, 음악)에 몰두하며 에너지를 충전합니다.',
  },
  '병': {
    identity: '방 안에 들어오면 분위기가 밝아지는 사람입니다. 에너지가 강하고 솔직하며, 자기 감정을 숨기지 못합니다. 좋으면 좋다, 싫으면 싫다 — 이런 직선적인 면이 매력이기도 하고 때로는 상처를 주기도 합니다.',
    innerConflict: '관심받고 싶은 욕구와 자유롭고 싶은 욕구가 충돌합니다. 사람들에게 둘러싸이고 싶지만, 자신만의 시간이 없으면 질식할 것 같습니다. 열정적으로 시작하지만 금방 흥미를 잃는 자신이 싫을 때가 있습니다.',
    stressResponse: '스트레스를 받으면 더 활동적이 됩니다. 무언가를 부수거나 바꾸고 싶어지고, 급격한 변화를 시도합니다. 하지만 그 에너지가 소진되면 갑자기 깊은 무기력에 빠집니다.',
    hiddenHabits: '밤늦게까지 흥미로운 콘텐츠를 파고들거나, 갑자기 새로운 취미를 시작합니다. 주변 사람들에게 먼저 연락하는 편이고, 혼자 있는 시간이 길어지면 불안해합니다.',
  },
  '정': {
    identity: '조용하지만 내면에 깊은 감성의 불꽃을 품고 있습니다. 한 사람에게 깊이 집중하는 타입이며, 신뢰를 쌓기까지 시간이 걸리지만 한 번 마음을 열면 헌신적입니다. 겉으로 드러나지 않는 섬세함과 따뜻함이 매력입니다.',
    innerConflict: '감정이 너무 깊어서 상대방이 그만큼 응해주지 않으면 실망합니다. "나만 이렇게 깊이 느끼는 건 아닐까?" 하는 외로움이 있고, 관계에서 상처받는 것이 두려워 먼저 다가가기를 망설입니다.',
    stressResponse: '스트레스를 받으면 말이 없어지고 혼자만의 세계로 들어갑니다. 겉으로는 아무렇지 않은 척하지만, 머릿속에서 같은 생각을 반복하며 곱씹습니다. 이때 감성적인 콘텐츠(음악, 영화)에 더 몰입합니다.',
    hiddenHabits: '촛불, 향, 조용한 음악 같은 분위기를 즐깁니다. 혼자 카페에 앉아 생각에 잠기거나, 좋아하는 사람의 SNS를 몰래 살펴보기도 합니다. 감정을 글로 쓰면서 정리하는 습관이 있습니다.',
  },
  '무': {
    identity: '사람들이 기대는 존재이지만, 정작 자신은 기댈 곳을 찾지 못합니다. 감정을 속으로 삭이는 경향이 강합니다. "괜찮아"가 입버릇이지만 괜찮지 않을 때가 많습니다. 한 번 마음을 주면 쉽게 거두지 못하고, 관계를 시작하는 데 신중합니다.',
    innerConflict: '성장하고 싶고 새로운 것을 시작하고 싶은데, 동시에 안정도 원합니다. 자기에게 엄격하고 판단력이 날카롭습니다 — "이 정도면 됐지"가 잘 안 됩니다. 감정의 흐름에 맡기는 것이 어렵고, 통제할 수 없는 상황에서 불안합니다.',
    stressResponse: '평소에는 안정감으로 잘 버티지만, 한계를 넘으면 말이 날카로워집니다. 감정을 말로 표현하기보다 행동으로 보여줍니다(청소, 요리, 선물 등). 혼자 있는 시간이 절실하지만, 동시에 외로움을 느낍니다.',
    hiddenHabits: '정리정돈이나 요리처럼 손으로 하는 활동에서 안정감을 찾습니다. 밤에 혼자 생각이 많아지고, 주변 사람들의 안부를 묵묵히 챙기지만 자신의 힘든 점은 잘 이야기하지 않습니다.',
  },
  '기': {
    identity: '겉으로는 온화하고 수수하지만, 내면에는 예상보다 풍부한 감정과 능력이 숨어 있습니다. 사람을 키우고 지원하는 데 뛰어나며, 뒤에서 묵묵히 돌보는 역할을 자주 맡습니다. 배려심이 깊어 주변 사람들이 편안함을 느낍니다.',
    innerConflict: '남을 돌보는 데 익숙하지만, 정작 자기 자신을 돌보는 데는 서투릅니다. "나보다 남이 먼저"가 습관이 되어서, 자기가 원하는 것이 뭔지 잊어버릴 때가 있습니다. 인정받고 싶지만 티를 내지 못합니다.',
    stressResponse: '스트레스를 받으면 더 바빠지려고 합니다. 일이든 집안일이든 뭔가를 하면서 마음을 달래지만, 멈추면 공허함이 밀려옵니다. 가까운 사람에게 은근히 서운함을 드러내지만, 직접적으로 말하지는 못합니다.',
    hiddenHabits: '작은 선물을 준비하거나, 상대방이 좋아하는 음식을 기억하는 등 행동으로 마음을 표현합니다. 혼자 있을 때는 식물 가꾸기, 베이킹 같은 돌봄 활동에서 위안을 찾습니다.',
  },
  '경': {
    identity: '의리가 있고 한 번 맡은 일은 끝까지 해내는 책임감 있는 사람입니다. 겉으로는 차갑고 무뚝뚝해 보이지만, 가까운 사람에게는 한없이 따뜻합니다. 불의를 참지 못하고, 자기 기준에 맞지 않으면 타협하지 않습니다.',
    innerConflict: '강한 모습 뒤에 외로움이 있습니다. "나는 항상 강해야 해"라는 압박감에 시달리고, 약한 모습을 보이는 것을 극도로 꺼립니다. 마음을 열고 싶지만, 상처받을까 두려워 쉽게 열지 못합니다.',
    stressResponse: '스트레스를 받으면 더 날카로워지고 비판적이 됩니다. 주변 사람들에게 차갑게 대할 수 있고, 혼자 운동이나 격렬한 활동으로 풀려 합니다. 감정을 논리로 정리하려 하지만 잘 안 될 때 답답해합니다.',
    hiddenHabits: '혼자 운동하거나 자기계발 콘텐츠를 봅니다. 결단을 내릴 때 오래 고민하지 않고 직감을 따르며, 한 번 결정하면 돌아보지 않습니다. 하지만 밤에 혼자 "그때 그렇게 할 걸" 후회할 때가 있습니다.',
  },
  '신': {
    identity: '관찰력이 뛰어나고 미적 감각이 탁월한 사람입니다. 완벽주의적인 면이 있어서 대충 넘기는 것을 못 합니다. 겉으로는 냉정하고 도도해 보이지만, 마음을 연 사람에게는 한없이 따뜻하고 헌신적입니다.',
    innerConflict: '높은 기준 때문에 자기 자신도 가혹하게 평가합니다. "이 정도로는 부족해"라는 생각이 끊이지 않고, 타인에게도 같은 기준을 적용하다 실망하기 쉽습니다. 완벽하지 않은 자신을 용서하기 어렵습니다.',
    stressResponse: '스트레스를 받으면 예민해지고 사소한 것에 짜증이 납니다. 정리정돈에 집착하거나, 반대로 모든 것을 내팽개치고 무기력해집니다. 감정을 분석하려 하지만, 감정은 논리로 풀리지 않아서 답답합니다.',
    hiddenHabits: '예쁜 물건이나 고급스러운 공간에서 힐링합니다. 디테일에 집착하는 면이 있어서, 사진 한 장도 완벽해야 올릴 수 있습니다. 혼자만의 미적 세계가 있고, 그 영역을 침범받는 것을 싫어합니다.',
  },
  '임': {
    identity: '지적 호기심이 넘치고, 한 곳에 머무르기보다 끊임없이 새로운 것을 탐구하는 사람입니다. 생각이 깊고 대범하며, 큰 그림을 그리는 것을 좋아합니다. 포용력이 커서 다양한 사람들과 어울릴 수 있습니다.',
    innerConflict: '자유롭고 싶은 마음과 누군가에게 깊이 속하고 싶은 마음이 충돌합니다. 관계에서 거리를 두다가도 외로움을 느끼고, 가까워지면 답답함을 느끼는 패턴이 반복됩니다. 많은 것에 관심을 갖지만 깊이 파고드는 것이 어렵습니다.',
    stressResponse: '스트레스를 받으면 도피합니다. 여행, 새로운 취미, 낯선 환경으로 떠나고 싶어집니다. 문제를 직면하기보다 흐름에 맡기려 하고, 현실 도피가 길어지면 중요한 것을 놓칠 수 있습니다.',
    hiddenHabits: '밤에 위키피디아처럼 하나의 주제에서 끝없이 파고드는 인터넷 서핑을 합니다. 여행 계획을 세우거나 새로운 분야를 공부하면서 에너지를 얻고, 반복적인 일상이 계속되면 답답함을 느낍니다.',
  },
  '계': {
    identity: '조용하고 침착하지만, 내면에는 깊은 감수성과 직관력을 지닌 사람입니다. 겉으로 드러나지 않는 내면의 깊이가 있어서, 가까이 다가갈수록 놀라운 사람입니다. 생각이 많고 창의적이며, 남들이 보지 못하는 것을 봅니다.',
    innerConflict: '자기만의 세계가 너무 깊어서 사람들과의 소통에 벽을 느낄 때가 있습니다. "나를 진짜로 이해하는 사람이 있을까?"라는 근본적인 외로움이 있고, 표현하고 싶은데 말로 옮기면 의미가 변해버리는 것 같아 답답합니다.',
    stressResponse: '스트레스를 받으면 더 내면으로 침잠합니다. 사람들과의 교류를 피하고, 혼자만의 상상 세계에 빠집니다. 걱정이 걱정을 낳는 사고 패턴에 빠지기 쉽고, 작은 일도 크게 느껴집니다.',
    hiddenHabits: '밤에 혼자 공상에 잠기거나, 감성적인 콘텐츠(음악, 시, 영화)에 깊이 몰입합니다. 일기나 메모를 쓰는 습관이 있고, 자기 감정을 예술적으로 표현하고 싶어합니다.',
  },
};

/** 부족한 오행별 감정 표현 패턴 — 사주 용어 없이 서술 */
const WEAK_ELEMENT_INSIGHTS: Record<FiveElement, {
  emotionalPattern: string;
  partnerNeed: string;
}> = {
  '목': {
    emotionalPattern: '새로운 시작에 대한 두려움이 있습니다. 변화를 원하면서도 첫 발을 떼기가 어렵고, 결정의 순간에 우유부단해질 수 있습니다. 성장에 대한 갈망은 있지만 현재에 안주하려는 관성이 강합니다. 계획은 많지만 실행으로 옮기는 것이 가장 큰 과제입니다.',
    partnerNeed: '당신을 새로운 세계로 이끌어줄 수 있는 사람, 용기를 불어넣어주는 사람, 함께 성장의 기쁨을 나눌 수 있는 사람이 필요합니다.',
  },
  '화': {
    emotionalPattern: '마음속에 뜨거운 감정이 있어도 밖으로 드러내지 못합니다. "좋아한다"는 말을 먼저 하기 어렵고, 상대방이 "나를 좋아하는 건지 모르겠다"고 느낄 수 있습니다. 열정적인 사람에게 끌리지만, 동시에 그 열정이 부담스럽기도 합니다. 분위기를 밝히고 싶은데, 어떻게 해야 할지 모를 때가 있습니다.',
    partnerNeed: '자신이 서툰 감정 표현을 자연스럽게 해주는 사람, 밝고 활기찬 에너지로 분위기를 이끌어주는 사람, 당신의 단단함 위에서 자유롭게 열정을 펼치는 사람이 필요합니다.',
  },
  '토': {
    emotionalPattern: '마음의 안정감을 찾기 어렵습니다. 이리저리 흔들리기 쉽고, 확신이 부족할 때가 많습니다. 자신의 중심을 잡아줄 무언가를 끊임없이 찾고, 소속감에 대한 갈망이 강합니다. 믿을 수 있는 기반이 없으면 불안합니다.',
    partnerNeed: '흔들리지 않는 안정감을 주는 사람, 일관된 태도로 신뢰를 쌓는 사람, 당신의 마음에 든든한 기반이 되어줄 수 있는 사람이 필요합니다.',
  },
  '금': {
    emotionalPattern: '결단력이 부족하고 우유부단한 면이 있습니다. 여러 선택지 앞에서 고민이 길어지고, 한 번 결정해도 뒤돌아보며 후회합니다. 자기 의견을 확실히 주장하기 어렵고, 타인의 의견에 쉽게 흔들릴 수 있습니다.',
    partnerNeed: '명확한 기준과 결단력을 보여주는 사람, 당신이 고민할 때 방향을 제시해주는 사람, 섬세하면서도 분명한 가치관을 가진 사람이 필요합니다.',
  },
  '수': {
    emotionalPattern: '유연하게 대처하는 것이 어렵습니다. 한 가지 관점에 꽂히면 다른 시각을 받아들이기 힘들고, 예상치 못한 변화에 당황합니다. 직관보다는 논리에 의존하고, 감정의 흐름을 자연스럽게 따라가기보다 분석하려 합니다.',
    partnerNeed: '상황을 유연하게 읽어내는 사람, 당신의 경직됨을 부드럽게 풀어주는 사람, 직관력과 창의적 사고로 새로운 관점을 열어주는 사람이 필요합니다.',
  },
};

/**
 * 사주 + 별자리 기반 관계 인사이트 생성
 * 사주/별자리 용어 없이 일상 언어로 성격을 묘사합니다.
 * LLM 컨텍스트에 삽입되어, 카드 3~8의 깊이 있는 분석을 유도합니다.
 *
 * 14개 섹션: 일간(4) + 부족오행(2) + 배우자궁(3) + 십신(1) + 별자리(4)
 */
export function getSajuRelationshipInsights(result: SajuResult, birthInfo?: BirthInfo): string {
  const core = DAY_MASTER_CORE[result.dayMaster as HeavenlyStem];
  const weak = WEAK_ELEMENT_INSIGHTS[result.weakElement as FiveElement];

  if (!core || !weak) {
    return '';
  }

  let output = `### 성격 심화 분석 (⚠️ 아래 내용은 내부 분석 엔진에서 유추한 것입니다. 카드에는 분석 방법론을 언급하지 말고, 이 사람의 성격으로만 자연스럽게 서술하세요.)

#### 근본 정체성
${core.identity}

#### 내면의 모순
${core.innerConflict}

#### 스트레스 반응
${core.stressResponse}

#### 혼자 있을 때의 습관
${core.hiddenHabits}

#### 감정 표현 패턴 (가장 서투른 영역)
${weak.emotionalPattern}

#### 파트너에게서 채워지길 바라는 것
${weak.partnerNeed}`;

  // 일지 배우자궁 인사이트
  const dayBranch = result.dayBranch as EarthlyBranch;
  const spouse = SPOUSE_PALACE_INSIGHTS[dayBranch];
  if (spouse) {
    output += `

#### 관계 역학
${spouse.partnerDynamic}

#### 관계에서의 강점
${spouse.relationshipStrength}

#### 관계에서의 도전
${spouse.relationshipChallenge}`;
  }

  // 십신 분포 인사이트
  if (result.tenGodsGroup) {
    const tenGodsInsight = getTenGodsInsight(result.tenGodsGroup);
    output += `

#### 관계 에너지 패턴
${tenGodsInsight}`;
  }

  // 별자리 인사이트 (birthInfo가 있을 때만)
  if (birthInfo) {
    const zodiac = getZodiacSign(birthInfo.month, birthInfo.day);
    const zodiacData = ZODIAC_INSIGHTS[zodiac];
    if (zodiacData) {
      output += `

#### 사랑의 언어
${zodiacData.loveLanguage}

#### 소통 방식
${zodiacData.communicationStyle}

#### 숨겨진 두려움
${zodiacData.hiddenFear}

#### 직관적 끌림
${zodiacData.attractionPattern}`;
    }
  }

  return output;
}
