"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";

type NavLink = {
  href: string;
  label: string;
  icon: string;
  children?: { href: string; label: string }[];
};

const LINKS: NavLink[] = [
  { href: "/", label: "Tablero", icon: "📊" },
  { href: "/planning", label: "Domingo", icon: "🗓️" },
  {
    href: "/nutrition",
    label: "Comida",
    icon: "🥗",
    children: [
      { href: "/nutrition/recipes", label: "Recetas" },
      { href: "/nutrition/plan", label: "Plan semanal" },
      { href: "/nutrition/shopping", label: "Lista de compras" },
      { href: "/nutrition/import", label: "Importar" },
    ],
  },
  { href: "/habits", label: "Hábitos", icon: "✅" },
  { href: "/goals", label: "Metas", icon: "🎯" },
  { href: "/day", label: "El día", icon: "🌅" },
  { href: "/plans", label: "Planes", icon: "🌳" },
  { href: "/chat", label: "Chat", icon: "💬" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function currentLabel(pathname: string) {
  const flat = LINKS.flatMap((l) => [l, ...(l.children ?? [])]);
  const match = [...flat]
    .sort((a, b) => b.href.length - a.href.length)
    .find((l) => isActive(pathname, l.href));
  return match?.label ?? "family-so";
}

// Renders a top-level link and, when its section is active, its sub-links.
function NavSection({ link, pathname }: { link: NavLink; pathname: string }) {
  const active = isActive(pathname, link.href);
  return (
    <div>
      <Link
        href={link.href}
        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
          active
            ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
            : "text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
        }`}
      >
        <span aria-hidden>{link.icon}</span>
        {link.label}
      </Link>
      {link.children && active && (
        <div className="mt-1 ml-7 space-y-0.5 border-l border-[var(--color-line)] pl-3">
          {link.children.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`block rounded-lg px-2 py-1.5 text-sm transition-colors ${
                isActive(pathname, c.href)
                  ? "font-medium text-[var(--color-brand-700)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-line)] bg-white p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" width={36} height={36} className="h-9 w-9 rounded-xl" />
        <span className="font-bold">family-so</span>
      </div>
      <nav className="flex-1 space-y-1">
        {LINKS.map((l) => (
          <NavSection key={l.href} link={l} pathname={pathname} />
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

export function MobileTopBar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent the page behind the drawer from scrolling while it is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--color-line)] bg-white px-4 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-ink)] hover:bg-[var(--color-bg)]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="font-semibold">{currentLabel(pathname)}</span>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-192.png" alt="" width={36} height={36} className="h-9 w-9 rounded-xl" />
                <span className="font-bold">family-so</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {LINKS.map((l) => (
                <NavSection key={l.href} link={l} pathname={pathname} />
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
          </div>
        </div>
      )}
    </>
  );
}

export function BottomBar() {
  const pathname = usePathname();
  // On mobile we show the 5 main destinations; the rest live in the drawer menu.
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
