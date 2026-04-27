import {
  WORKSHOP_SECTIONS,
  WORKSHOP_STEPS,
  type WorkshopSection,
} from "@/lib/self-workshop/diagnosis";
import { AchievementCycleMotion } from "./AchievementCycleMotion";

const SECTION_LABEL_MAP = Object.fromEntries(
  WORKSHOP_SECTIONS.map((s) => [s.section, s.label]),
) as Record<WorkshopSection, string>;

interface PracticeSection {
  section: WorkshopSection;
  title: string;
  description: string;
}

const PRACTICE_STEPS: PracticeSection[] = [
  {
    section: "FIND_OUT",
    title: "내 패턴을 발견하기",
    description:
      "어떤 상황에서 어떤 자동사고가 튀어나오는지부터 시작합니다. 그 위에 얹힌 행동 패턴을 따라가다 보면, 가장 깊은 곳에 자리 잡은 핵심 믿음에 닿게 됩니다. 이 단계에서는 평소 외면해 온 생각도 솔직하게 마주하셔야 해요.",
  },
  {
    section: "DESTROY",
    title: "오래된 믿음을 흔들기",
    description:
      "당연하다고 여겼던 신념을 네 가지 검증 기법으로 다시 살펴봅니다. 같은 상황을 다른 사고로 통과해보면, 자연스럽게 보였던 반응이 사실은 선택지 중 하나였다는 사실이 분명해져요.",
  },
  {
    section: "SOLUTION",
    title: "내 방식의 대처법 만들기",
    description:
      "새 핵심 신념을 다시 쓰고, 같은 상황이 다시 닥쳤을 때 무엇을 하고 무엇을 하지 않을지 직접 설계합니다. 머리로 끝나는 통찰이 아니라, 일상에서 그대로 꺼내 쓸 수 있는 행동 단위까지 내려갑니다.",
  },
];

/** 실습 총 소요 시간 — 운영자가 확정 후 수정 */
const PRACTICE_DURATION = "약 60분";

export function AchievementAddictionExplanation() {
  return (
    <div className="space-y-6">
      {/* [1] 성취 중독 정의 — 3문단 */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          성취 중독이란
        </h3>
        <div className="space-y-3 text-sm leading-relaxed text-[var(--foreground)]/80">
          <p>
            방금 받은 점수와 캐릭터 라인이 낯설지 않으셨을 거예요. 마감을 끝내고
            나면 곧장 다음 마감이 보이고, 발표가 끝나도 박수보다 미흡했던 한 장면이
            먼저 떠오르는 분이라면, 지금 화면에 적힌 결과는 우연한 숫자가 아닙니다.
            이런 반복이 일정 수준을 넘어선 상태를{" "}
            <strong>성취 중독(Achievement Addiction)</strong>이라고 부릅니다.
          </p>
          <p>
            성취 중독은 단순히 부지런하거나 책임감이 강한 것과 다릅니다. 핵심은{" "}
            <strong>자기 가치를 오로지 결과물로만 계산하려는 회로</strong>가 자리
            잡았다는 점이에요. 평가 시즌이나 분기 마감 같은 구간에 평소보다 더 무리하고,
            기대했던 성과가 나와도 만족이 며칠을 못 가고, 아무것도 하지 않는 시간에는
            오히려 불안해진다면, 이 회로가 이미 일상 속에서 작동하고 있다는 신호입니다.
          </p>
          <p>
            이건 의지가 약해서 생기는 일이 아닙니다. 특정 상황이 트리거가 되면
            자동사고가 따라붙고, 그 사고가 익숙한 행동 패턴을 끌어내며, 마지막에는
            오래된 핵심 믿음을 다시 한번 강화시키는 식으로{" "}
            <strong>네 단계가 닫힌 고리</strong>를 만들고 있을 뿐이에요. 이 고리를
            머릿속에서만 인지하는 걸로는 끊어지지 않습니다. 어디서 어떻게 시작되고
            어디서 끝나는지를 직접 풀어봐야 비로소 흐름을 바꿀 수 있습니다.
          </p>
        </div>
      </div>

      {/* [2] 모션 — 자동사고→패턴→핵심믿음 시각화 (다크 톤 예외 영역) */}
      <div className="rounded-xl border-2 border-[#1f2533] bg-[#0a0d14] p-6">
        <h3 className="mb-1.5 text-base font-semibold text-white">
          닫힌 고리는 이렇게 작동해요
        </h3>
        <p className="mb-5 text-sm leading-relaxed text-white/55 break-keep">
          하나의 트리거가 자동사고를 부르고, 익숙한 행동 패턴을 거쳐 핵심 믿음을
          다시 한번 강화합니다. 워크북은 이 흐름을 정확히 같은 순서로 따라가며 끊어냅니다.
        </p>
        <AchievementCycleMotion />
      </div>

      {/* [3] 워크북 진행 — 3단계 로드맵 (FIND OUT / SOFTEN / SOLUTION) */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-[var(--foreground)]">
            워크북은 이렇게 진행됩니다
          </h3>
          <p className="text-sm leading-relaxed text-[var(--foreground)]/80 break-keep">
            앞서 설명드린 닫힌 고리를, 세 개의 섹션을 거치며 순서대로 풀어냅니다.
          </p>
        </div>

        <div className="space-y-0">
          {PRACTICE_STEPS.map((step, i) => {
            const sectionSteps = WORKSHOP_STEPS.filter(
              (ws) => ws.section === step.section,
            );
            return (
              <div key={step.section} className="flex items-start gap-3">
                <div className="flex flex-col items-center self-stretch">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-xs font-bold">
                    {i + 1}
                  </div>
                  {i < PRACTICE_STEPS.length - 1 && (
                    <div className="w-0.5 flex-1 bg-[var(--foreground)]/20" />
                  )}
                </div>
                <div className="pb-6 flex-1 min-w-0">
                  <div className="mb-1 inline-flex items-center rounded-full border border-[var(--foreground)]/30 bg-[var(--surface)] px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] text-[var(--foreground)]/70">
                    {SECTION_LABEL_MAP[step.section]}
                  </div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--foreground)]/65 break-keep">
                    {step.description}
                  </p>

                  {/* 실제 워크북 단계 미리보기 */}
                  <ul className="mt-3 space-y-1.5">
                    {sectionSteps.map((ws) => (
                      <li
                        key={ws.step}
                        className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--foreground)]/30 bg-white text-[11px] font-bold text-[var(--foreground)]/70">
                          {ws.sectionStepNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]/45 truncate">
                            {ws.subtitle}
                          </p>
                          <p className="text-sm font-semibold text-[var(--foreground)]/90 truncate">
                            {ws.title}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-[var(--foreground)]/45 tabular-nums">
                          {ws.estimatedMinutes[0]}~{ws.estimatedMinutes[1]}분
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* [4] 격려 — 안내자의 단정형 톤 */}
      <div className="relative rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <div className="absolute left-0 top-6 h-12 w-1 bg-[var(--foreground)]" />
        <div className="space-y-3 pl-3">
          <div>
            <p className="text-base font-bold text-[var(--foreground)]">
              가벼운 여정은 아닙니다.
            </p>
            <p className="text-base font-bold text-[var(--foreground)]">
              하지만 지금 내린 결정이, 가장 잘한 결정이 됩니다.
            </p>
          </div>
          <div className="space-y-2 text-sm leading-relaxed text-[var(--foreground)]/80">
            <p>
              실습을 따라가는 동안 외면해 둔 감정이 올라오는 순간이 분명히 옵니다.
              그건 워크북이 제대로 작동하고 있다는 신호이지, 무언가 잘못된 게 아니에요.
            </p>
            <p>
              빠르게 끝내려 하지 마세요. 한 단계를 마치고 잠시 숨을 고르셔도 좋고,
              하루 비워두었다가 다시 돌아오셔도 진행은 그대로 이어집니다.
            </p>
            <p className="font-semibold text-[var(--foreground)]">
              이 과정을 끝까지 통과한 분들은 같은 상황에서 다른 선택을 합니다.
              자신을 들여다보기로 한 지금의 결정만으로도, 변화는 이미 시작되었습니다.
            </p>
          </div>
        </div>
      </div>

      {/* [5] 실습 전 안내 — 옅은 회색 콜아웃 */}
      <div className="rounded-xl bg-[var(--gray-100)] p-5">
        <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          실습 전 꼭 확인해 주세요
        </p>
        <ul className="space-y-2 text-sm leading-relaxed text-[var(--foreground)]/75">
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5">💻</span>
            <span>원활한 작성을 위해 <strong>PC 환경</strong>에서 진행하시길 권장드려요.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5">⏱</span>
            <span>총 소요 시간은 <strong>{PRACTICE_DURATION}</strong>입니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5">💾</span>
            <span>작성 내용은 <strong>자동 저장</strong>되어, 중간에 멈추셔도 언제든 이어서 하실 수 있어요.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5">🔒</span>
            <span>한 단계를 완료하셔야 <strong>다음 단계가 열립니다.</strong> 순서대로 차근차근 진행해 주세요.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
