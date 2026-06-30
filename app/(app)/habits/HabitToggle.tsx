"use client";

import { useState, useTransition } from "react";
import { toggleHabitLog } from "./actions";

// Larger check used in the "Hoy" view. On completion it shows a brief celebration
// — BJ Fogg's "Shine": a small immediate positive emotion is what wires the habit.
const CHEERS = ["✨ ¡Voto emitido!", "💪 ¡Sos esa persona!", "🔥 ¡Otra más!", "🌱 ¡Suma!"];

export function HabitToggle({
  habitId,
  ownerId,
  date,
  done,
  cheerIndex = 0,
}: {
  habitId: string;
  ownerId: string;
  date: string;
  done: boolean;
  cheerIndex?: number;
}) {
  const [pending, start] = useTransition();
  const [cheer, setCheer] = useState(false);

  function onClick() {
    const willComplete = !done;
    start(() => toggleHabitLog(habitId, ownerId, date));
    if (willComplete) {
      setCheer(true);
      setTimeout(() => setCheer(false), 1400);
    }
  }

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        aria-pressed={done}
        aria-label={done ? "Marcar como no hecho" : "Marcar como hecho"}
        disabled={pending}
        onClick={onClick}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-base transition-colors ${
          done
            ? "border-[var(--color-brand-600)] bg-[var(--color-brand-600)] text-white"
            : "border-[var(--color-line)] bg-white text-transparent hover:border-[var(--color-brand-400)]"
        } ${pending ? "opacity-50" : ""}`}
      >
        ✓
      </button>
      {cheer && (
        <span className="pointer-events-none absolute left-11 whitespace-nowrap text-xs font-semibold text-[var(--color-brand-600)]">
          {CHEERS[cheerIndex % CHEERS.length]}
        </span>
      )}
    </div>
  );
}
