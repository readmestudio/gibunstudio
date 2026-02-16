import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCounselingType } from "@/lib/counseling/types";
import { BookingContent } from "./BookingContent";

interface Props {
  params: Promise<{ type: string }>;
}

export default async function BookingPage({ params }: Props) {
  const { type } = await params;
  const counselingType = getCounselingType(type);

  if (!counselingType) {
    redirect("/programs/counseling");
  }

  // 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      {/* 히어로 배경 */}
      <section
        className="relative bg-center bg-no-repeat bg-cover py-16"
        style={{ backgroundImage: "url('/patterns/patternTop.svg')" }}
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            {counselingType.title}
          </h1>
          <p className="mt-4 text-lg text-[var(--foreground)]/80">
            {counselingType.description}
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
            {counselingType.priceLabel}
            <span className="text-sm font-normal text-[var(--foreground)]/60">
              원 / {counselingType.duration}
            </span>
          </p>
        </div>
      </section>

      {/* 예약 폼 */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <BookingContent counselingTypeId={type} />
      </div>
    </div>
  );
}
