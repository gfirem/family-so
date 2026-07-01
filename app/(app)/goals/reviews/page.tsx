import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { quarterOf } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import type { GoalVisibility } from "@prisma/client";
import { Toggle, ReviewForm } from "../ui";

type Scope = GoalVisibility;
// A period is either a quarter (1..4) or the whole year ("year").
type Period = "1" | "2" | "3" | "4" | "year";

// Builds a /goals/reviews link preserving the current scope/year/period context.
function reviewsHref(params: { scope: Scope; y: number; period: Period }) {
  const sp = new URLSearchParams({
    scope: params.scope,
    y: String(params.y),
    period: params.period,
  });
  return `/goals/reviews?${sp.toString()}`;
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; y?: string; period?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const now = quarterOf();

  const scope: Scope = sp.scope === "private" ? "private" : "family";
  const year = sp.y ? Number(sp.y) : now.year;
  const period: Period = (["1", "2", "3", "4", "year"] as const).includes(sp.period as Period)
    ? (sp.period as Period)
    : (String(now.quarter) as Period);

  // A quarter closing (1..4) or the annual one (quarter = null).
  const quarter = period === "year" ? null : Number(period);

  const review = await db.quarterReview.findFirst({
    where: {
      year,
      quarter,
      visibility: scope,
      ownerId: scope === "private" ? user.id : null,
    },
  });

  const title = quarter ? `Cierre de Q${quarter} ${year}` : `Cierre del año ${year}`;
  const subtitle = quarter
    ? "Analizá el trimestre antes de abrir el siguiente. Sin reproches: buscamos el patrón."
    : "El cierre anual: qué pasó este año y qué te llevás para el próximo.";

  return (
    <>
      <PageHeader
        emoji="📓"
        title="Cierres"
        subtitle="El repaso de cada trimestre y del año: qué salió bien, qué costó y qué nos llevamos."
      />

      {/* Scope toggle */}
      <div className="mb-4">
        <Toggle
          options={[
            { key: "family", label: "👨‍👩‍👧 Familiar", href: reviewsHref({ scope: "family", y: year, period }) },
            { key: "private", label: "🔒 Personal", href: reviewsHref({ scope: "private", y: year, period }) },
          ]}
          active={scope}
        />
      </div>

      {scope === "private" && (
        <p className="mb-4 text-xs text-[var(--color-muted)]">
          🔒 Tus cierres personales. Solo vos los ves; tu pareja no.
        </p>
      )}

      {/* Year navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Link href={reviewsHref({ scope, y: year - 1, period })} className="btn-ghost">
          ← {year - 1}
        </Link>
        <p className="text-lg font-bold">{year}</p>
        <Link href={reviewsHref({ scope, y: year + 1, period })} className="btn-ghost">
          {year + 1} →
        </Link>
      </div>

      {/* Period selector: the 4 quarters + the annual closing */}
      <div className="mb-5">
        <Toggle
          options={[
            { key: "1" as Period, label: "Q1", href: reviewsHref({ scope, y: year, period: "1" }) },
            { key: "2" as Period, label: "Q2", href: reviewsHref({ scope, y: year, period: "2" }) },
            { key: "3" as Period, label: "Q3", href: reviewsHref({ scope, y: year, period: "3" }) },
            { key: "4" as Period, label: "Q4", href: reviewsHref({ scope, y: year, period: "4" }) },
            { key: "year" as Period, label: "Año", href: reviewsHref({ scope, y: year, period: "year" }) },
          ]}
          active={period}
        />
      </div>

      <ReviewForm scope={scope} year={year} quarter={quarter} review={review} title={title} subtitle={subtitle} />
    </>
  );
}
