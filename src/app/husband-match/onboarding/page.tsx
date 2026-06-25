import { redirect } from 'next/navigation';

// 온보딩 화면 제거 — 곧장 정보 입력 단계로 이동시킨다.
// (랜딩/대시보드 CTA는 이미 birth-info로 직행하지만, 기존 링크·북마크 대비 안전망)
export default function OnboardingPage() {
  redirect('/husband-match/birth-info');
}
