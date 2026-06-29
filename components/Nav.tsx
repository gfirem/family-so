"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

const LINKS = [
  { href: "/", label: "Tablero", icon: "📊" },
  { href: "/planning", label: "Domingo", icon: "🗓️" },
  { href: "/nutrition", label: "Comida", icon: "🥗" },
  { href: "/habits", label: "Hábitos", icon: "✅" },
  { href: "/goals", label: "Metas", icon: "🎯" },
  { href: "/day", label: "El día", icon: "🌅" },
  { href: "/plans", label: "Planes", icon: "🌳" },
  { href: "/chat", label: "Chat", icon: "💬" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-line)] bg-white p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-600)] text-lg">
          🏡
        </span>
        <span className="font-bold">family-so</span>
      </div>
      <nav className="flex-1 space-y-1">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              isActive(pathname, l.href)
                ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
            }`}
          >
            <span aria-hidden>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="mt-4 border-t border-[var(--color-line)] pt-4">
        <p className="px-3 text-sm font-medium">{userName}</p>
        <form action={logoutAction}>
          <button className="mt-1 px-3 text-xs text-[var(--color-muted)] hover:text-[var(--color-danger)]">
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}

export function BottomBar() {
  const pathname = usePathname();
  // On mobile we show the 5 main destinations.
  const main = LINKS.slice(0, 5);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[var(--color-line)] bg-white md:hidden">
      {main.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
            isActive(pathname, l.href)
              ? "text-[var(--color-brand-700)]"
              : "text-[var(--color-muted)]"
          }`}
        >
          <span className="text-lg" aria-hidden>
            {l.icon}
          </span>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
