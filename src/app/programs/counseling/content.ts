/**
 * 기분 심리상담소 상세페이지(랜딩) 카피 데이터.
 *
 * 디자인 핸드오프(design_handoff_counseling_detail)의 카피를 정본으로 정리.
 * 콘텐츠와 스타일(컴포넌트)을 분리해 수정 비용을 낮춘다.
 *
 * ⚠️ 플레이스홀더(실데이터 교체 필요):
 *   - COUNSELOR: 실제 상담사 이름·사진·약력
 *   - TESTIMONIALS: 실제 후기 확보 전 예시 페르소나
 */

/* ── 가격 ───────────────────────────────────────────── */
export const TRIAL_PRICE = 129_000;
export const PACKAGE_PRICE = 792_000;
export const PACKAGE_PER_SESSION = 99_000;

/* ── 카카오톡 채널 ───────────────────────────────────────
   검색용 아이디(gibunstudio)가 아니라 공개 채널 URL(밑줄 코드)을 써야 열린다. */
export const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_WTDxfX";

/* 프로그램 목록(뒤로가기) 경로 */
export const PROGRAMS_HREF = "/";

/* ── 02. NEED — 롤링 체크 ───────────────────────────── */
export const ROLLING_CHECKS: string[] = [
  "남들은 칭찬하는데, 그 칭찬이 믿기지 않는다",
  "주변에서는 다 “쉬어라”고 하는데, 쉬면 오히려 불안하다",
  "GPT한테 물어봐도 영혼 없는 위로뿐이다",
  "상담을 받아도 매번 같은 얘기만 반복하게 된다",
];

/* ── 03. WHY GIBUN — Before/After 비교 ────────────────── */
export const CMP_BEFORE_HEAD = "상담받으면, 그걸로 끝";
export const CMP_BEFORE: string[] = [
  "매번 같은 얘기만 반복하게 돼요",
  "상담이 끝나면 남는 게 없어요",
  "검사 따로, 상담 따로 — 비용이 부담돼요",
  "상담사마다 방식이 달라 신뢰가 안 가요",
];
export const CMP_AFTER_HEAD = "상담이, 데이터로 쌓여요";
/* a: 강조(<strong>) 구간, b: 나머지 */
export const CMP_AFTER: { a: string; b: string }[] = [
  { a: "8회 구조화 커리큘럼", b: "으로 끝까지 이어져요" },
  { a: "사전 질문지 + 사후 리포트", b: "가 손에 남아요" },
  { a: "유료 검사·해석까지", b: " 한 가격에 포함돼요" },
  { a: "1급 상담사가 표준 심리검사", b: "로 진행해요" },
];

/* ── 05. 8회차 커리큘럼 (★ 페이지의 심장) ─────────────────── */
export const TOTAL_SESSIONS = 8;
export interface CurriculumStep {
  step: number;
  title: string;
  desc: string;
}
export interface CurriculumPhase {
  phase: string;
  label: string;
  caption: string;
  steps: CurriculumStep[];
}
export const CURRICULUM: CurriculumPhase[] = [
  {
    phase: "PHASE 1",
    label: "진단과 분석",
    caption: "지금의 나를 데이터로 마주합니다",
    steps: [
      {
        step: 1,
        title: "자가진단 테스트",
        desc: "유료 검사 및 셀프 진단, 문장 완성 검사 등 사전에 검사를 실시합니다.",
      },
      {
        step: 2,
        title: "자동사고·내면가족 탐색",
        desc: "반복되는 자동적 사고를 포착하고, 내 안의 여러 마음(Parts)을 처음으로 들여다봅니다.",
      },
      {
        step: 3,
        title: "나를 구성하는 Part 탐색",
        desc: "각 Part가 언제·왜 작동하는지, 어떤 역할을 맡아 나를 보호해 왔는지 깊이 탐색합니다.",
      },
      {
        step: 4,
        title: "핵심 신념 테스트",
        desc: "행동과 감정의 뿌리가 되는 핵심 신념을 검사로 확인하고, 어디서 비롯됐는지 추적합니다.",
      },
    ],
  },
  {
    phase: "PHASE 2",
    label: "탐색과 통찰",
    caption: "패턴의 이유를 이해하고, 다음 행동을 그립니다",
    steps: [
      {
        step: 5,
        title: "긍정 의도 알아차리기",
        desc: "나를 힘들게 한 패턴조차 사실은 나를 지키려던 의도였음을 발견하고 화해합니다.",
      },
      {
        step: 6,
        title: "강점 분석",
        desc: "검사와 대화 결과를 토대로 내가 가진 자원과 강점을 객관적으로 정리합니다.",
      },
      {
        step: 7,
        title: "Part들의 조율·실천법",
        desc: "충돌하던 마음들을 조율하고, 일상에서 바로 쓸 수 있는 실천법을 함께 설계합니다.",
      },
      {
        step: 8,
        title: "상담 종결·전체 리뷰",
        desc: "8회 여정을 종합 리포트로 정리하고, 앞으로 나아갈 방향을 함께 그리며 마무리합니다.",
      },
    ],
  },
];

/* ── 06. 왜 GPT로는 안 되나 ─────────────────────────────── */
export const GPT_REASONS: { title: string; desc: string }[] = [
  {
    title: "영혼 없는 위로뿐입니다",
    desc: "그럴듯한 문장은 만들어도, 당신의 맥락을 진짜로 이해하진 못합니다.",
  },
  {
    title: "탐색 없이, 바로 솔루션을 줍니다",
    desc: "충분히 묻고 들여다보는 과정 없이 결론부터 제시합니다. 정작 중요한 변화는 그 탐색의 과정에서 일어납니다.",
  },
  {
    title: "상담심리학·상담기법을 학습시키긴 어렵습니다",
    desc: "개인이 GPT에게 상담심리학 이론과 수년간 축적된 임상 기법을 온전히 학습시키는 것은 현실적으로 불가능합니다. 검증된 프레임워크 없이는 조언의 깊이가 달라집니다.",
  },
  {
    title: "검증된 진단·검사를 대신할 수 없습니다",
    desc: "MMPI·TCI 같은 표준 심리검사와 전문 해석은 자격을 갖춘 사람 상담사만 가능합니다.",
  },
];

/* ── 07. 상담사 소개 ──────────────────────────────────────
   확인 필요: 실제 상담사 이름·사진·약력으로 교체. */
export const COUNSELOR = {
  roleBadge: "심리 상담사",
  name: "김연지",
  lede: "상담 심리학 석사, 12년의 임상 경험을 가진 1급 심리상담사가 진단부터 해석, 상담까지 모두 함께합니다.",
  intro:
    "진단으로 끝나지 않고, 당신이 스스로를 이해하고 다시 나아갈 수 있을 때까지 함께합니다.",
  photo: "/counseling/counselor.png",
  quals: [
    "상담심리사 1급 (한국상담심리학회)",
    "임상심리사 1급 (한국산업인력공단)",
    "청소년상담사 2급 (여성가족부)",
    "트라우마전문상담사 (한국트라우마연구교육원)",
  ],
};

/* ── 08. 가격 / 오퍼 ────────────────────────────────── */
export interface OfferPlan {
  id: string;
  /** 결제 페이지(/payment/counseling/[type]) 로 쓸 COUNSELING_TYPES id */
  payType: string;
  tag: string; // 영문 라벨 (TRIAL / 8-SESSION PACKAGE)
  sessions: number; // 회차 수 (1 / 8) — 카드 상단에 크게 표기
  sessionKo: string; // 회차 성격 한글 라벨 (체험 상담 / 정규 커리큘럼)
  meta: string; // 모노 메타 라인
  price: number;
  priceNote: string;
  recommended?: boolean;
  recBadge?: string;
  cta: string;
  includes: string[];
}
export const OFFER_PLANS: OfferPlan[] = [
  {
    id: "trial",
    payType: "trial",
    tag: "TRIAL",
    sessions: 1,
    sessionKo: "체험 상담",
    meta: "50분 · Zoom 화상 상담",
    price: TRIAL_PRICE,
    priceNote: "유료 검사·해석 포함 · 1회 체험",
    cta: "1회 체험 신청하기",
    includes: [
      "유료 심리검사 (MMPI·TCI 등) 실시",
      "검사 결과 전문 해석 상담",
      "1급 심리상담사 50분 1:1 화상 상담",
      "사전 질문지 + 사후 리포트",
    ],
  },
  {
    id: "package",
    payType: "package-8",
    tag: "8-SESSION PACKAGE",
    sessions: 8,
    sessionKo: "정규 커리큘럼",
    meta: "주 1회 · 회당 50분 Zoom 화상 상담",
    price: PACKAGE_PRICE,
    priceNote: "회당 99,000원 — 1회 체험가보다 30,000원 저렴",
    recommended: true,
    recBadge: "추천 · 커리큘럼 완주",
    cta: "8회 패키지 시작하기",
    includes: [
      "8회차 구조화 커리큘럼 전체 진행",
      "유료 심리검사 (MMPI·TCI 등) + 전문 해석",
      "매 회차 사전 질문지 + 사후 리포트 + 심층 분석",
      "8회 종합 리포트 (전체 여정 정리)",
      "회당 99,000원 — 1회 체험가 대비 23% 할인",
    ],
  },
];

/* ── 08. 받게 되는 것 (WHAT YOU KEEP) ───────────────────── */
export const KEEPS: { title: string; desc: string }[] = [
  { title: "상담 사전 질문지", desc: "매 회차 전, 오늘 다룰 주제를 미리 정리합니다." },
  { title: "진단 검사", desc: "MMPI·TCI 등 유료 검사를 포함해 객관적으로 진단합니다." },
  { title: "검사 해석 상담", desc: "검사 결과를 전문 상담사가 직접 풀어 드립니다." },
  {
    title: "사후 리포트 + 심층 분석",
    desc: "매 회차가 끝나면 기록과 분석이 손에 남습니다.",
  },
];

/* 리포트 플립 캐러셀 이미지.
   확인 필요: 실제 산출물 이미지로 교체(현재는 워크북 리포트 스크린샷). */
export const REPORT_PAGES: { src: string; cap: string }[] = [
  { src: "/counseling/report/p1.png", cap: "01 · 감정 스캔" },
  { src: "/counseling/report/p2.png", cap: "02 · 머릿속 비우기" },
  { src: "/counseling/report/p3.png", cap: "03 · 인지 분석" },
  { src: "/counseling/report/p4.png", cap: "04 · 강점 발견" },
  { src: "/counseling/report/p5.png", cap: "05 · 종합 리포트" },
];

/* ── 09. 후기 ────────────────────────────────────────────
   확인 필요: 실제 후기 확보 전, 예시 페르소나로 구성. */
export interface Testimonial {
  trigger: string; // 트리거 문장(굵게)
  body: string; // 본문
  who: string; // 이름(가명)
  meta: string; // 나이 · 직업
  plan: string; // 이용 플랜 배지
}
export const TESTIMONIALS: Testimonial[] = [
  {
    trigger: "연차가 쌓일수록 잘해야 한다는 압박만 커졌어요",
    body: "팀에서는 에이스라고 불렸지만, 정작 저는 칭찬을 한 번도 믿어본 적이 없었어요. 늘 다음 성과로 증명해야 한다는 생각뿐이었죠. 8회 동안 제 자동사고와 핵심 신념을 하나씩 들여다보니, ‘성과가 곧 내 가치’라는 믿음이 어릴 때 어디서 생겼는지 보이더라고요. 지금은 일을 못 놓는 게 아니라, 안 놓아도 괜찮은 날을 스스로 고를 수 있게 됐어요.",
    who: "이서연",
    meta: "33세 · 콘텐츠 마케터",
    plan: "8회 패키지 완주",
  },
  {
    trigger: "번아웃인데 GPT한테 털어놓는 게 전부였어요",
    body: "처음엔 사람한테 말하는 게 부담스러워서 AI한테만 고민을 적었어요. 그런데 매번 비슷한 위로만 돌아오고, 다음 날이면 어제 한 얘기를 기억 못 하니까 제자리였죠. 체험 상담을 받아보고 바로 패키지로 바꿨어요. 지난 회차를 기억하고 이어주니까, 처음으로 ‘쌓여간다’는 느낌을 받았습니다. 검사 결과를 같이 해석해준 회차가 특히 좋았어요.",
    who: "정민호",
    meta: "29세 · 백엔드 개발자",
    plan: "1회 체험 → 8회 전환",
  },
  {
    trigger: "쉬라는 말을 들으면 오히려 불안했어요",
    body: "주변에서 다들 좀 쉬라고 하는데, 막상 쉬면 죄책감이 들고 더 불안했어요. 멈추는 법을 배우려고 상담을 시작한 건데, 알고 보니 제가 진짜 원했던 건 쉬는 법이 아니라 무너지지 않고 계속 나아갈 힘이더라고요. 매 회차 사후 리포트가 손에 남아서, 상담이 끝난 지금도 가끔 꺼내 봅니다. 저를 설명하는 언어가 생긴 게 가장 큰 변화예요.",
    who: "한지우",
    meta: "38세 · 스타트업 팀장",
    plan: "8회 패키지 완주",
  },
];

/* ── 11. FAQ ─────────────────────────────────────────── */
export const COUNSELING_FAQ: { question: string; answer: string }[] = [
  {
    question: "상담은 어떻게 진행되나요?",
    answer:
      "한국상담심리학회 1급 심리상담사와 Zoom 화상으로 1:1 진행합니다. 1회 50분 기준이며, 8회 패키지는 진단부터 종결까지 구조화된 커리큘럼을 따라갑니다.",
  },
  {
    question: "1회만 받아봐도 되나요?",
    answer:
      "네. 1회 체험(129,000원)으로 먼저 경험해 보신 뒤 8회 패키지로 이어가실 수 있습니다.",
  },
  {
    question: "검사 비용이 따로 드나요?",
    answer:
      "아니요. MMPI·TCI 등 유료 검사와 전문 해석 비용이 상담료에 모두 포함되어 있습니다.",
  },
  {
    question: "환불은 어떻게 되나요?",
    answer:
      "상담 진행 전에는 전액 환불, 상담 진행 후에는 환불이 어렵습니다. 자세한 내용은 이용약관을 따릅니다.",
  },
  {
    question: "상담 내용은 비밀이 보장되나요?",
    answer:
      "상담 내용은 관련 법령과 상담 윤리에 따라 철저히 비밀이 보장됩니다.",
  },
];
