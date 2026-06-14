/**
 * Mind Spill — 감정 / 신체 신호 칩 옵션, 결제 가격.
 * source: mind-spill-workbook.html.
 */

/** 워크북 1권당 리포트 열람 결제 금액 (KRW). */
export const MIND_SPILL_REPORT_PRICE = 4900;

/** 결제 상품명 (NicePay goodsName). */
export const MIND_SPILL_REPORT_GOODS_NAME = "Mind Spill 리포트 1권";

/* ========== 데일리 분석 ("오늘 하루 정리하기") ========== */

/** 월 단위 무료 횟수. 매월(달력 월) 자동 리셋. 초과분은 구독 필요. */
export const MIND_SPILL_DAILY_FREE_QUOTA = 3;

/**
 * 데일리 무제한 월 구독가 (KRW). 종합 리포트(₩4,900)와 별개 상품.
 */
export const MIND_SPILL_DAILY_SUB_PRICE = 9900;

/** 데일리 구독 결제 상품명 (NicePay goodsName). */
export const MIND_SPILL_DAILY_SUB_GOODS_NAME = "Mind Spill 데일리 구독 (월)";

/** 1회 구독으로 부여되는 이용 기간(일). 자동 갱신(빌링키)은 후속. */
export const MIND_SPILL_DAILY_SUB_DAYS = 31;

export const MIND_SPILL_EMOTIONS = [
  "불안",
  "초조",
  "압박감",
  "슬픔",
  "피로",
  "분노",
  "외로움",
  "기쁨",
  "평온",
] as const;

export const MIND_SPILL_BODY_SIGNS = [
  "어깨 결림",
  "두통",
  "위 불편함",
  "가슴 답답",
  "턱 긴장",
  "손 떨림",
  "눈 피로",
  "없음",
] as const;
