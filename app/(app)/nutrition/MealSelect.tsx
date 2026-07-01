"use client";

import { useTransition } from "react";
import { setMealPlanDay, type MealSlot } from "./actions";

export function MealSelect({
  weekId,
  day,
  slot,
  current,
  options,
}: {
  weekId: string;
  day: number;
  slot: MealSlot;
  current: string | null;
  options: { id: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={current ?? ""}
      disabled={pending}
      onChange={(e) => start(() => setMealPlanDay(weekId, day, slot, e.target.value))}
      className="input w-full text-xs"
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
