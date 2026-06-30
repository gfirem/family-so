"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// Sub-navigation for the Habits section. Mirrors the multi-view model of apps
// like Habitify (today / calendar / streaks / analytics) plus a manage view.
// Preserves the selected person (?p=) across views.
const TABS = [
  { href: "/habits", label: "Hoy" },
  { href: "/habits/calendar", label: "Calendario" },
  { href: "/habits/streaks", label: "Rachas" },
  { href: "/habits/analytics", label: "Analítica" },
  { href: "/habits/manage", label: "Gestionar" },
];

function isActive(pathname: string, href: string) {
  if (href === "/habits") return pathname === "/habits";
  return pathname.startsWith(href);
}

export function HabitsSubnav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const p = params.get("p");
  const suffix = p ? `?p=${p}` : "";

  return (
    <nav className="mb-5 -mx-1 flex gap-1 overflow-x-auto pb-1">
      {TABS.map((t) => {
        const active = isActive(pathname, t.href);
        return (
          <Link
            key={t.href}
            href={`${t.href}${suffix}`}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-[var(--color-brand-600)] text-white"
                : "border border-[var(--color-line)] bg-white text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
