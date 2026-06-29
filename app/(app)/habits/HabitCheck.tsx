"use client";

import { useTransition } from "react";
import { toggleHabitLog } from "./actions";

export function HabitCheck({
  habitId,
  ownerId,
  date,
  done,
}: {
  habitId: string;
  ownerId: string;
  date: string;
  done: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={done}
      disabled={pending}
      onClick={() => start(() => toggleHabitLog(habitId, ownerId, date))}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors ${
        done
          ? "border-[var(--color-brand-600)] bg-[var(--color-brand-600)] text-white"
          : "border-[var(--color-line)] bg-white text-transparent hover:border-[var(--color-brand-400)]"
      } ${pending ? "opacity-50" : ""}`}
    >
      ✓
    </button>
  );
}
