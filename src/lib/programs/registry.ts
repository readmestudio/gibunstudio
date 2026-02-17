/**
 * 프로그램 레지스트리
 *
 * 프로그램 추가/삭제/숨김 시 이 파일만 수정하면
 * 홈페이지(ProgramCards)와 대시보드에 자동 반영됩니다.
 */

export interface ProgramDefinition {
  id: string;
  title: string;
  description: string;
  href: string;
  dashboardHref: string;
  showOnHome: boolean;
  showOnDashboard: boolean;
  comingSoon: boolean;
  order: number;
}

export const PROGRAMS: ProgramDefinition[] = [
  {
    id: "husband-match",
    title: "남편상 분석",
    description:
      "YouTube 구독 기반 AI 심리 분석으로 나와 맞는 이상형을 찾아보세요",
    href: "/husband-match/onboarding",
    dashboardHref: "/dashboard",
    showOnHome: true,
    showOnDashboard: true,
    comingSoon: false,
    order: 1,
  },
  {
    id: "counseling",
    title: "1:1 심리 상담 (Zoom)",
    description:
      "1급 심리 상담사와 함께 심리 검사 및 검사 해석, 내면 상담을 진행합니다.",
    href: "/programs/counseling",
    dashboardHref: "/dashboard/counseling",
    showOnHome: true,
    showOnDashboard: true,
    comingSoon: false,
    order: 2,
  },
  {
    id: "self-workshop",
    title: "셀프 워크샵",
    description: "내 인생에 가장 중요한 가치관을 찾는 가치관 월드컵",
    href: "/programs/self-workshop",
    dashboardHref: "/dashboard/self-workshop",
    showOnHome: true,
    showOnDashboard: true,
    comingSoon: true,
    order: 3,
  },
  {
    id: "geumjjok",
    title: "어른들을 위한 금쪽 상담소",
    description:
      "고민이 생길 때마다 고민을 상담받고 분석 리포트를 받아 보세요.",
    href: "#",
    dashboardHref: "#",
    showOnHome: true,
    showOnDashboard: true,
    comingSoon: true,
    order: 4,
  },
  {
    id: "7day",
    title: "7일간의 상담 부트캠프",
    description:
      "7일간 매일 미션을 달성하며 내면 아이 분석 리포트를 받아보세요",
    href: "/programs/7day",
    dashboardHref: "/dashboard/7day",
    showOnHome: false,
    showOnDashboard: false,
    comingSoon: true,
    order: 99,
  },
];

export function getHomePrograms() {
  return PROGRAMS.filter((p) => p.showOnHome).sort(
    (a, b) => a.order - b.order
  );
}

export function getDashboardDiscoverPrograms() {
  return PROGRAMS.filter((p) => p.showOnDashboard && !p.comingSoon).sort(
    (a, b) => a.order - b.order
  );
}

export function getComingSoonPrograms() {
  return PROGRAMS.filter((p) => p.showOnDashboard && p.comingSoon).sort(
    (a, b) => a.order - b.order
  );
}
