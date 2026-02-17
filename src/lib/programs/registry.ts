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
      "유튜브 알고리즘으로 나의 기질·성격·감성을 분석하고, 나에게 맞는 파트너 유형을 추천해 드립니다. 무료 티저 확인 후 디테일한 리포트를 받아보세요.",
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
      "1급 심리상담사가 당신의 리포트를 기반으로 반복되는 패턴의 근본 원인을 함께 찾아드립니다.",
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
    description: "가치관 월드컵, 유형 검사, 맞춤 직업 추천까지. 온라인 활동지로 진짜 내가 원하는 것을 발견하세요.",
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
      "어른에게도 금쪽 코끼리가 필요합니다. 고민을 털어놓으면, 그 아래 숨겨진 정서·믿음·자동 사고를 분석해 리포트로 드려요.",
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
