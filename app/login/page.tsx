"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-600)] text-2xl">
            🏡
          </div>
          <h1 className="text-2xl font-bold">family-so</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Planificar, decidir, ejecutar y medir la vida en familia.
          </p>
        </div>

        <form action={formAction} className="card space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              placeholder="guille@family.so"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
          Acceso para Guille y China.
        </p>
      </div>
    </main>
  );
}
