import type { Metadata } from "next";
import { MindsFlow } from "@/components/minds/MindsFlow";

/**
 * /minds — 무료 "마음 확인" 공개 깔때기 (비로그인).
 *
 * 유료 워크북 Step 3·4의 "내 안의 마음 찾기"를 축약해 무료로 공개하는 상위 깔때기.
 * 이메일/카카오로 가벼운 리드만 받고, 마음 *리스트 + 각 소개*까지 무료로 보여준 뒤,
 * 관계도·리더·갈등은 워크북(주) / 상담(보조) 결제로 전환한다.
 *
 * 골격 단계: 상태머신 + 목 데이터로 끝까지 클릭되는 흐름. 백엔드(공개 parts-map
 * API·리드 저장)는 다음 단계에서 배선.
 */

export const metadata: Metadata = {
  title: "내 안엔 몇 명이 살고 있을까 | GIBUN",
  description:
    "일·성취 앞에서 흔들리는 순간, 내 안에선 여러 마음이 동시에 말을 건넵니다. 3분이면 내 안에 사는 마음들을 만나볼 수 있어요. (무료)",
};

export default function MindsPage() {
  return (
    <main className="min-h-screen" style={{ background: "#F7F4EE" }}>
      <MindsFlow />
    </main>
  );
}
