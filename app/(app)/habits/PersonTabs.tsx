"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// Person selector that keeps the current sub-view while switching between
// Guille and China (writes ?p= onto the active path).
export function PersonTabs({ users }: { users: { id: string; name: string }[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedId = params.get("p") ?? users[0]?.id;

  return (
    <div className="mb-4 flex gap-2">
      {users.map((u) => (
        <Link
          key={u.id}
          href={`${pathname}?p=${u.id}`}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            u.id === selectedId
              ? "bg-[var(--color-brand-600)] text-white"
              : "border border-[var(--color-line)] bg-white text-[var(--color-muted)]"
          }`}
        >
          {u.name}
        </Link>
      ))}
    </div>
  );
}
