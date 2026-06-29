"use client";

import { useTransition } from "react";
import { useFormStatus } from "react-dom";

// Checkbox que guarda solo al togglear (llama a un server action recibido por prop).
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

// Botón que dispara un server action con un id (borrar, cerrar, etc.).
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

// Botón de submit con estado pending (para formularios con server actions).
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
