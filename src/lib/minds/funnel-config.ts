/**
 * 퍼널 설정 객체 — /minds 와 /inner-child 가 *갈라지는 지점*만 응집한 클라이언트 안전 상수.
 *
 * 공용 조각(랜딩·로딩·결제모달·인증게이트·결제 훅)은 이 객체 하나만 받아 동작을 바꾼다.
 * 기본값(MINDS_FUNNEL)은 현행 /minds 하드코딩 값을 *그대로 옮겨 담은 것*이라, prop 을
 * 주지 않으면 /minds 는 바이트 단위로 지금과 동일하게 작동한다(무회귀).
 *
 * ⚠️ 서버 의존성 금지 — 클라이언트 컴포넌트에서 안전하게 import 할 수 있어야 한다.
 *   (여기서 import 하는 storage / relationship-constants 도 순수 상수 모듈이다.)
 */

import { MINDS_LEAD_STORAGE_KEY } from "@/lib/minds/storage";
import {
  MINDS_RELATIONSHIP_GOODS_NAME,
  MINDS_RELATIONSHIP_PRICE,
  MINDS_RELATIONSHIP_ORIGINAL_PRICE,
  INNER_CHILD_PRICE,
  INNER_CHILD_ORIGINAL_PRICE,
} from "@/lib/minds/relationship-constants";

export interface MindsFunnelConfig {
  variant: "minds" | "inner_child";
  /** 분석 완료 리드 id 를 저장하는 localStorage 키(퍼널당 분리 → 교차복원 방지). */
  leadStorageKey: string;
  /** 무료 결과 페이지 베이스 경로. "/minds/r" | "/inner-child/r" */
  freeReportBase: string;
  /** 유료 리포트 페이지 베이스 경로. "/minds/relationship" | "/inner-child/full" */
  paidReportBase: string;
  /** 결제 create 라우트 payload → orderId prefix 결정. */
  product: "relationship" | "inner_child";
  /** 실제 판매가(원) — 결제창 금액·표시가. 서버 검증은 product 로 재확인한다. */
  price: number;
  /** 표시용 정가(원) — 할인 앵커링(취소선)에만 쓴다. */
  originalPrice: number;
  /** NicePay 결제창·영수증 상품명. */
  goodsName: string;
  /** 결제 모달의 상품 설명 블록(제목·리드문·포함 목록)만 갈라진다. */
  checkoutCopy: { title: string; lead: string; includes: string[] };
}

/** 현행 /minds 값 전부 — 기본값. 이동만 있고 변경은 없다. */
export const MINDS_FUNNEL: MindsFunnelConfig = {
  variant: "minds",
  leadStorageKey: MINDS_LEAD_STORAGE_KEY, // "minds_lead_id"
  freeReportBase: "/minds/r",
  paidReportBase: "/minds/relationship",
  product: "relationship",
  price: MINDS_RELATIONSHIP_PRICE,
  originalPrice: MINDS_RELATIONSHIP_ORIGINAL_PRICE,
  goodsName: MINDS_RELATIONSHIP_GOODS_NAME,
  checkoutCopy: {
    title: "다섯 배역과 그 관계 해설 받기",
    lead: "지금 만난 마음들을 그대로 이어받아, 누가 리더·빌런인지 배역표와 두 마음이 부딪치는 관계까지 한 편의 리포트로 풀어드려요.",
    includes: [
      "누가 리더·빌런·난봉꾼·관리자·추방자인지 5배역 배역표",
      "자꾸 부딪치는 두 마음의 갈등 구도 + 화해법",
      "자주 쓰는 방어기제 · 마음의 목소리 TOP 5 · 맞춤 처방",
    ],
  },
};

/** 내면 아이 퍼널. 저장키·경로·상품명·모달 카피가 다섯 배역과 갈라진다. */
export const INNER_CHILD_FUNNEL: MindsFunnelConfig = {
  variant: "inner_child",
  leadStorageKey: "inner_child_lead_id", // /minds 의 "minds_lead_id" 와 분리
  freeReportBase: "/inner-child/r",
  paidReportBase: "/inner-child/full",
  product: "inner_child",
  price: INNER_CHILD_PRICE,
  originalPrice: INNER_CHILD_ORIGINAL_PRICE,
  goodsName: "내면 아이 심층 리포트",
  // 잠금 목차 4약속(lockSection)과 톤 일치 — 파는 물건이 달라 반드시 갈라진다.
  checkoutCopy: {
    title: "이 아이의 전체 구조를 여는 심층 리포트",
    lead: "당신의 응답으로 재구성한 전체 구조를 약 5,000자 분량의 심층 리포트로 받아요.",
    includes: [
      "방어 시스템의 정체 — 나를 지키며 무엇을 대가로 가져가는지",
      "같은 상처가 반복되는 구조 — 나만의 반복 루프 한 장",
      "두 번째 아이의 신호 — 먼저 반응하는 또 하나의 아이",
      "정말 원했던 것 + 지금 내가 줄 수 있는 재양육 실행법",
    ],
  },
};
