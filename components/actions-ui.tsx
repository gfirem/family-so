"use client";

import { useTransition } from "react";
import { useFormStatus } from "react-dom";

// Checkbox that saves only when toggled (calls a server action received via prop).
export function CheckItem({
  id,
  checked,
  label,
  sub,
  toggle,
  strongLabel,
}: {
  id: string;
  checked: boolean;
  label: string;
  sub?: string;
  strongLabel?: boolean;
  toggle: (id: string) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5">
      <input
        type="checkbox"
        checked={checked}
        disabled={pending}
        onChange={() => start(() => toggle(id))}
        className="h-5 w-5 shrink-0 rounded-md border-[var(--color-line)] text-[var(--color-brand-600)] accent-[var(--color-brand-600)]"
      />
      <span className="min-w-0">
        <span
          className={`text-sm ${strongLabel ? "font-semibold" : ""} ${
            checked ? "text-[var(--color-muted)] line-through" : ""
          }`}
        >
          {label}
        </span>
        {sub && <span className="block text-xs text-[var(--color-muted)]">{sub}</span>}
      </span>
    </label>
  );
}

// Button that triggers a server action with an id (delete, close, etc.).
export function ActionButton({
  id,
  action,
  children,
  className = "text-xs text-[var(--color-muted)] hover:text-[var(--color-danger)]",
  confirm,
}: {
  id: string;
  action: (id: string) => Promise<void>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(() => action(id));
      }}
    >
      {children}
    </button>
  );
}

// Dropdown that reassigns a goal's quarter (or "Anual") as soon as it changes.
export function QuarterSelect({
  id,
  quarter,
  action,
}: {
  id: string;
  quarter: number | null;
  action: (id: string, quarter: number | null) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      value={quarter ?? ""}
      disabled={pending}
      aria-label="Asignar a un trimestre"
      onChange={(e) => {
        const v = e.target.value;
        start(() => action(id, v === "" ? null : Number(v)));
      }}
      className="rounded-lg border border-[var(--color-line)] bg-white px-1.5 py-1 text-xs text-[var(--color-muted)]"
    >
      <option value="">Anual</option>
      <option value="1">Q1</option>
      <option value="2">Q2</option>
      <option value="3">Q3</option>
      <option value="4">Q4</option>
    </select>
  );
}

// Submit button with pending state (for forms with server actions).
export function SubmitButton({
  children,
  className = "btn-primary",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Guardando…" : children}
    </button>
  );
}
