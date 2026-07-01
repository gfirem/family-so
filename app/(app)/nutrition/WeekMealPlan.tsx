"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { DAY_NAMES } from "@/lib/dates";
import { recipePhotoSrc } from "@/lib/recipe-photo";
import { setMealPlanDay, type MealSlot } from "./actions";

// Lightweight recipe shape the picker needs — kept small so the whole approved
// list can travel to the client once (instead of one <select> per cell).
export type RecipeOption = {
  id: string;
  name: string;
  isShake: boolean;
  category: string | null;
  photoUrl: string | null;
  calories: number | null;
  proteinG: number | null;
};

export type PlanDay = {
  day: number;
  meal1Id: string | null;
  meal2Id: string | null;
  meal3Id: string | null;
  meal4Id: string | null;
};

const SLOTS: MealSlot[] = ["meal1", "meal2", "meal3", "meal4"];
const SLOT_LABELS = ["Comida 1", "Comida 2", "Comida 3", "Comida 4"];

type TypeFilter = "all" | "shake" | "meal";

export function WeekMealPlan({
  weekId,
  days,
  recipes,
}: {
  weekId: string;
  days: PlanDay[];
  recipes: RecipeOption[];
}) {
  const byId = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);

  // Local selection so the table updates instantly on pick, before the server
  // action resolves. Keyed by `${day}-${slot}`.
  const [picks, setPicks] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    for (const d of days) {
      init[`${d.day}-meal1`] = d.meal1Id;
      init[`${d.day}-meal2`] = d.meal2Id;
      init[`${d.day}-meal3`] = d.meal3Id;
      init[`${d.day}-meal4`] = d.meal4Id;
    }
    return init;
  });

  const [open, setOpen] = useState<{ day: number; slot: MealSlot } | null>(null);
  const [, start] = useTransition();

  function choose(id: string | null) {
    if (!open) return;
    const key = `${open.day}-${open.slot}`;
    setPicks((p) => ({ ...p, [key]: id }));
    const target = open;
    setOpen(null);
    start(() => setMealPlanDay(weekId, target.day, target.slot, id ?? ""));
  }

  return (
    <>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs text-[var(--color-muted)]">
            <th className="pb-2 pr-2">Día</th>
            {SLOT_LABELS.map((l) => (
              <th key={l} className="pb-2 pr-2">
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAY_NAMES.map((dn, day) => (
            <tr key={day} className="border-t border-[var(--color-line)]">
              <td className="py-2 pr-2 font-medium">{dn}</td>
              {SLOTS.map((slot) => {
                const id = picks[`${day}-${slot}`] ?? null;
                const recipe = id ? byId.get(id) ?? null : null;
                return (
                  <td key={slot} className="py-1.5 pr-2">
                    <CellButton
                      recipe={recipe}
                      onClick={() => setOpen({ day, slot })}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {open && (
        <RecipePickerModal
          title={`${DAY_NAMES[open.day]} · ${SLOT_LABELS[SLOTS.indexOf(open.slot)]}`}
          recipes={recipes}
          currentId={picks[`${open.day}-${open.slot}`] ?? null}
          onClose={() => setOpen(null)}
          onChoose={choose}
        />
      )}
    </>
  );
}

function CellButton({
  recipe,
  onClick,
}: {
  recipe: RecipeOption | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white px-2.5 py-2 text-left text-xs transition-colors hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-50)]"
    >
      {recipe ? (
        <>
          <span aria-hidden className="shrink-0">
            {recipe.isShake ? "🥤" : "🍽️"}
          </span>
          <span className="min-w-0 flex-1 truncate">{recipe.name}</span>
        </>
      ) : (
        <span className="flex w-full items-center justify-between text-[var(--color-muted)]">
          <span>Elegir receta</span>
          <span aria-hidden>＋</span>
        </span>
      )}
    </button>
  );
}

function RecipePickerModal({
  title,
  recipes,
  currentId,
  onClose,
  onChoose,
}: {
  title: string;
  recipes: RecipeOption[];
  currentId: string | null;
  onClose: () => void;
  onChoose: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [category, setCategory] = useState<string>("");

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes) if (r.category) set.add(r.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [recipes]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      if (type === "shake" && !r.isShake) return false;
      if (type === "meal" && r.isShake) return false;
      if (category && r.category !== category) return false;
      if (q && !r.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [recipes, query, type, category]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Elegir receta"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-2xl bg-[var(--color-surface)] shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + search + filters (sticky). */}
        <div className="border-b border-[var(--color-line)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-lg px-2 py-1 text-lg leading-none text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
            >
              ✕
            </button>
          </div>

          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar receta…"
            className="input"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FilterChip active={type === "all"} onClick={() => setType("all")}>
              Todas
            </FilterChip>
            <FilterChip active={type === "shake"} onClick={() => setType("shake")}>
              🥤 Licuados
            </FilterChip>
            <FilterChip active={type === "meal"} onClick={() => setType("meal")}>
              🍽️ Comidas
            </FilterChip>
            {categories.length > 0 && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="ml-auto rounded-full border border-[var(--color-line)] bg-white px-3 py-1 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-brand-500)]"
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Results (scrollable). */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-muted)]">
              No hay recetas que coincidan.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  selected={r.id === currentId}
                  onClick={() => onChoose(r.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer: clear the slot. */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line)] p-4">
          <span className="text-xs text-[var(--color-muted)]">
            {results.length} receta{results.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={() => onChoose(null)}
            className="text-sm text-[var(--color-muted)] underline hover:text-[var(--color-danger)]"
          >
            Quitar de este día
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex items-center rounded-full bg-[var(--color-brand-600)] px-3 py-1 text-xs font-medium text-white"
          : "inline-flex items-center rounded-full border border-[var(--color-line)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
      }
    >
      {children}
    </button>
  );
}

function RecipeCard({
  recipe,
  selected,
  onClick,
}: {
  recipe: RecipeOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex gap-3 rounded-xl border p-3 text-left transition-colors ${
        selected
          ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)]"
          : "border-[var(--color-line)] hover:bg-[var(--color-bg)]"
      }`}
    >
      {recipePhotoSrc(recipe) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipePhotoSrc(recipe)!}
          alt=""
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg)] text-2xl">
          {recipe.isShake ? "🥤" : "🍽️"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{recipe.name}</span>
          {selected && <span className="pill-keystone">elegida</span>}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-[var(--color-muted)]">
          {recipe.calories != null && <span>{recipe.calories} kcal</span>}
          {recipe.proteinG != null && <span>· {recipe.proteinG} g prot</span>}
          {recipe.category && <span>· {recipe.category}</span>}
        </div>
      </div>
    </button>
  );
}
