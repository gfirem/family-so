"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/nutrition/recipes", label: "Recetas" },
  { href: "/nutrition/plan", label: "Plan" },
  { href: "/nutrition/shopping", label: "Compras" },
  { href: "/nutrition/import", label: "Importar" },
];

export function NutritionTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto border-b border-[var(--color-line)]">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-[var(--color-brand-600)] text-[var(--color-brand-700)]"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
