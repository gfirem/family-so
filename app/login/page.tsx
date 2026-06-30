import { loginWithGoogle } from "./actions";
import { SubmitButton } from "@/components/actions-ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt="family-so"
            width={56}
            height={56}
            className="mx-auto mb-3 h-14 w-14 rounded-2xl"
          />
          <h1 className="text-2xl font-bold">family-so</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Planificar, decidir, ejecutar y medir la vida en familia.
          </p>
        </div>

        <div className="card space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
              {error === "AccessDenied"
                ? "Esa cuenta no tiene acceso. Entrá con tu cuenta de Google autorizada."
                : "No pudimos iniciar sesión. Intentá de nuevo."}
            </p>
          )}
          <form action={loginWithGoogle}>
            <SubmitButton className="btn-primary w-full">Entrar con Google</SubmitButton>
          </form>
          <p className="text-center text-xs text-[var(--color-muted)]">
            Acceso solo para las cuentas de Guille y China.
          </p>
        </div>
      </div>
    </main>
  );
}
