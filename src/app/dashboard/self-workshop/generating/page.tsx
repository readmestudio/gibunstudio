import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isWorkshopTestUser } from "@/lib/self-workshop/test-users";
import { KAKAO_CHANNEL_URL } from "@/app/programs/counseling/content";

export const dynamic = "force-dynamic";

export default async function WorkshopGeneratingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/dashboard/self-workshop");

  const isTestUser = isWorkshopTestUser(user.email);

  // 결제 완료(confirmed) 사용자에게만 노출 — 미구매자는 워크북 안내로 돌려보냄.
  const { data: purchase } = await supabase
    .from("workshop_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("workshop_type", "achievement-addiction")
    .eq("status", "confirmed")
    .maybeSingle();

  if (!purchase && !isTestUser) {
    redirect("/dashboard/self-workshop");
  }

  // 본인 행만 읽는 RLS 정책으로 조회. 상태에 따라 안내가 세 갈래로 갈린다.
  //  · 전달됨(released_at 있음) → 워크북 열기
  //  · 설문 제출했지만 미전달 → 제작 중
  //  · 설문 미제출 → 설문 작성 유도
  const { data: survey } = await supabase
    .from("workshop_survey_responses")
    .select("id, released_at, workbook_url")
    .eq("user_id", user.id)
    .eq("workshop_type", "achievement-addiction")
    .maybeSingle();

  const surveyDone = !!survey;
  const released = !!survey?.released_at;
  const workbookUrl = survey?.workbook_url ?? null;
  // 워크북 열기 목적지: 커스텀 링크가 있으면 그걸로, 없으면 기본 인앱 워크북(1단계).
  const openHref = workbookUrl || "/dashboard/self-workshop/step/1";
  const openExternal = /^https?:\/\//i.test(openHref);

  const userName =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    null;
  const displayName = userName ?? "회원";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {/* 완료 체크 아이콘 */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--foreground)]">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        결제가 완료되었습니다
      </h1>

      <p className="mt-4 break-keep text-base leading-relaxed text-[var(--foreground)]/80">
        워크북은 결제 이후 <span className="font-semibold">{displayName}</span>님의
        고민에 맞춰 새롭게 제작하여 전달드립니다.
      </p>

      {released ? (
        /* 워크북 전달 완료 → 워크북 열기 (커스텀 링크 또는 기본 인앱 1단계) */
        <>
          <div className="mt-8 rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-6 text-left">
            <p className="break-keep text-base font-semibold text-[var(--foreground)]">
              워크북이 도착했어요 🎉
            </p>
            <p className="mt-2 break-keep text-sm leading-relaxed text-[var(--foreground)]/70">
              {displayName}님의 고민에 맞춰 완성한 워크북이에요. 아래 버튼으로 바로
              열어보실 수 있어요.
            </p>
          </div>

          <a
            href={openHref}
            {...(openExternal
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
          >
            워크북 열기
          </a>
          <p className="mt-3 break-keep text-xs leading-relaxed text-[var(--foreground)]/55">
            {openExternal
              ? "링크가 열리지 않으면 카카오톡 채널로 알려주세요."
              : "버튼을 누르면 워크북 1단계부터 시작돼요."}
          </p>
        </>
      ) : (
        <>
          {/* 안내 박스 — 진행 순서 3단계 */}
          <div className="mt-8 rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-6 text-left">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              이렇게 전달돼요
            </p>
            <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--foreground)]/70">
              <li className="flex gap-2">
                <span className="font-semibold text-[var(--foreground)]">1.</span>
                <span className="break-keep">
                  아래 버튼을 클릭하여 설문을 제출해주세요.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-[var(--foreground)]">2.</span>
                <span className="break-keep">
                  심리 상담사와 명상 디렉터가 함께 답변을 분석하여 워크북을
                  제작합니다.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-[var(--foreground)]">3.</span>
                <span className="break-keep">
                  워크북이 완성되면 워크북 링크를 카카오톡으로 전달드립니다.
                </span>
              </li>
            </ol>
          </div>

          <p className="mt-4 break-keep text-sm leading-relaxed text-[var(--foreground)]/60">
            설문지 제출 이후 영업일 기준 1일에서 3일까지 소요될 수 있어요.
          </p>

          {surveyDone ? (
            /* 설문 제출 완료 → 제작 중 안내 + 카카오톡 채널 추가 */
            <>
              <div className="mt-8 rounded-xl border-2 border-[var(--foreground)]/10 bg-[var(--surface)] p-5">
                <p className="break-keep text-sm font-semibold text-[var(--foreground)]">
                  설문이 잘 접수되었어요 ✓
                </p>
                <p className="mt-1.5 break-keep text-sm leading-relaxed text-[var(--foreground)]/60">
                  지금부터 {displayName}님만을 위한 워크북을 제작합니다. 완성되면
                  카카오톡으로 링크를 보내드릴게요.
                </p>
              </div>

              <a
                href={KAKAO_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-4 text-base font-bold text-[var(--foreground)] transition-transform hover:-translate-y-0.5"
              >
                <span aria-hidden>💬</span> 카카오톡 채널 추가하고 알림 받기
              </a>
              <p className="mt-3 break-keep text-xs leading-relaxed text-[var(--foreground)]/55">
                완성된 워크북 링크를 카카오톡으로 보내드려요. 채널을 미리 추가해
                두시면 놓치지 않고 받아보실 수 있어요.
              </p>
            </>
          ) : (
            /* 설문 미제출 → 설문 작성 유도 */
            <>
              <Link
                href="/dashboard/self-workshop/survey"
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                설문지 작성하러 가기
              </Link>
              <p className="mt-3 break-keep text-xs leading-relaxed text-[var(--foreground)]/55">
                설문을 제출해주시면 익일 영업 시간부터 워크북 제작을 시작해요.
                설문 제출 이후에는 환불이 어렵습니다.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
