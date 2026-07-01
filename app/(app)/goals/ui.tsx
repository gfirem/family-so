import Link from "next/link";
import { Card, SectionTitle } from "@/components/ui";
import { SubmitButton } from "@/components/actions-ui";
import { saveReview } from "./actions";

// Shifts a (year, quarter) pair by `delta` quarters, wrapping across years.
export function shiftQuarter(year: number, quarter: number, delta: number) {
  let q = quarter + delta;
  let y = year;
  while (q > 4) {
    q -= 4;
    y += 1;
  }
  while (q < 1) {
    q += 4;
    y -= 1;
  }
  return { year: y, quarter: q };
}

// Segmented control that renders one link per option, highlighting the active one.
export function Toggle<T extends string>({
  options,
  active,
}: {
  options: { key: T; label: string; href: string }[];
  active: T;
}) {
  return (
    <div className="inline-flex rounded-xl border border-[var(--color-line)] bg-white p-1">
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            o.key === active
              ? "bg-[var(--color-brand-600)] text-white"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

// Closing / retrospective form for a period (a quarter, or the whole year when
// quarter = null). Scoped by visibility; persisted via the saveReview action.
export function ReviewForm({
  scope,
  year,
  quarter,
  review,
  title,
  subtitle,
}: {
  scope: "family" | "private";
  year: number;
  quarter: number | null;
  review: { wins: string | null; challenges: string | null; learnings: string | null; nextFocus: string | null } | null;
  title: string;
  subtitle: string;
}) {
  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <p className="-mt-2 mb-3 text-xs text-[var(--color-muted)]">{subtitle}</p>
      <form action={saveReview} className="space-y-3">
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="quarter" value={quarter ?? ""} />
        <input type="hidden" name="visibility" value={scope} />
        <ReviewField
          name="wins"
          label="✅ Lo que salió bien"
          placeholder="Logros, lo que celebramos…"
          defaultValue={review?.wins ?? ""}
        />
        <ReviewField
          name="challenges"
          label="🌧️ Lo más difícil / qué nos descarriló"
          placeholder="Sin reproches: ¿cuál fue el patrón?"
          defaultValue={review?.challenges ?? ""}
        />
        <ReviewField
          name="learnings"
          label="💡 Aprendizajes"
          placeholder="¿Qué nos llevamos?"
          defaultValue={review?.learnings ?? ""}
        />
        <ReviewField
          name="nextFocus"
          label="🎯 Foco para el próximo período"
          placeholder="¿Dónde ponemos la energía ahora?"
          defaultValue={review?.nextFocus ?? ""}
        />
        <SubmitButton>Guardar cierre</SubmitButton>
      </form>
    </Card>
  );
}

function ReviewField({
  name,
  label,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <textarea name={name} rows={2} placeholder={placeholder} defaultValue={defaultValue} className="input" />
    </label>
  );
}
