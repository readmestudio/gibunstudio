/**
 * Mind Spill — 감정 / 신체 신호 칩 옵션, 결제 가격.
 * source: mind-spill-workbook.html.
 */

/** 워크북 1권당 리포트 열람 결제 금액 (KRW). */
export const MIND_SPILL_REPORT_PRICE = 4900;

/** 결제 상품명 (NicePay goodsName). */
export const MIND_SPILL_REPORT_GOODS_NAME = "Mind Spill 리포트 1권";

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
