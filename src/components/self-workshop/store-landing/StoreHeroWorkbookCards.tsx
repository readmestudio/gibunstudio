import Link from "next/link";
import {
  WORKBOOK_CATALOG,
  type WorkbookInfo,
} from "@/lib/self-workshop/workbook-catalog";
import { NotifyButton } from "@/components/NotifyButton";
import { HERO_WORKBOOK_CARDS, type HeroWorkbookCard } from "./content";

/**
 * 히어로 인라인 컴팩트 워크북 카드.
 *
 * 첫 화면에서 바로 워크북을 선택할 수 있도록 서브 카피 바로 아래 배치.
 * 상세 카드(`StoreWorkbookGridSection`)와 역할 분리: 여기는 빠른 전환용.
 */
export function StoreHeroWorkbookCards() {
  return (
    <div className="mt-10 grid gap-4 max-w-2xl mx-auto md:grid-cols-2">
      {HERO_WORKBOOK_CARDS.map((card, idx) => {
        const catalog = WORKBOOK_CATALOG.find((w) => w.id === card.id);
        if (!catalog) return null;
        return (
          <CompactCard
            key={card.id}
            card={card}
            catalog={catalog}
            index={idx}
          />
        );
      })}
    </div>
  );
}

/* ── 카드 단일 ── */

function CompactCard({
  card,
  catalog,
  index,
}: {
  card: HeroWorkbookCard;
  catalog: WorkbookInfo;
  index: number;
}) {
  const priceLabel =
    catalog.originalPrice && catalog.originalPrice > catalog.price
      ? `${catalog.originalPrice.toLocaleString()}원 → ${catalog.price.toLocaleString()}원`
      : `${catalog.price.toLocaleString()}원`;

  const orderLabel = String(index + 1).padStart(2, "0");

  const body = (
    <div className="flex flex-col h-full rounded-2xl border-2 border-[var(--foreground)] bg-white p-5 text-left transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]">
      {/* 상단: kicker + 상태 뱃지 */}
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-[10px] font-semibold tracking-widest uppercase text-[var(--foreground)]/50"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Workbook · {orderLabel}
        </p>
        {catalog.comingSoon && (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded border border-[var(--foreground)] text-[var(--foreground)]">
            Coming Soon
          </span>
        )}
      </div>

      {/* 제목 */}
      <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] break-keep mb-2">
        {card.heroTitle}
      </h3>

      {/* 요약 */}
      <p className="text-sm leading-relaxed text-[var(--foreground)]/70 break-keep mb-4">
        {card.summary}
      </p>

      {/* 하단: 가격 + CTA */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-[var(--foreground)]/10">
        <p className="text-xs font-semibold text-[var(--foreground)]">
          {priceLabel}
        </p>

        {catalog.comingSoon ? (
          <NotifyButton
            programId={catalog.id}
            programTitle={`마음 챙김 워크북 - ${catalog.title}`}
          />
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--foreground)]">
            바로 시작 →
          </span>
        )}
      </div>
    </div>
  );

  if (catalog.comingSoon) {
    return body;
  }

  return (
    <Link
      href={`/payment/self-workshop/${catalog.id}`}
      className="block h-full"
    >
      {body}
    </Link>
  );
}
