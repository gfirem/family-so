import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  emoji,
  action,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          {emoji && <span aria-hidden>{emoji}</span>}
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
      {children}
    </h2>
  );
}

export function EmptyState({
  text,
  cta,
}: {
  text: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white/50 p-6 text-center text-sm text-[var(--color-muted)]">
      <p>{text}</p>
      {cta && (
        <Link href={cta.href} className="btn-primary mt-3">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

// Aviso de salud informativo (nunca prescriptivo).
export function HealthNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      ⚕️ {children}
    </p>
  );
}
