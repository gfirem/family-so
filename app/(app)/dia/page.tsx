import { PageHeader, Card, SectionTitle, HealthNote } from "@/components/ui";
import { db } from "@/lib/db";

type Block = { time: string; label: string; items: string[] };
type SleepRule = { n: string; rule: string };

const MEALS_127 = [
  { time: "8:00 AM", what: "Licuado de proteína (el «1»)" },
  { time: "12:30–1:00 PM", what: "Comida 1 (≥30 g proteína)" },
  { time: "Media tarde", what: "Si hay hambre: algo proteico simple, nada dulce" },
  { time: "6:00 PM", what: "Comida 2 (≥30 g proteína) — cierre del día" },
];

export default async function DiaPage() {
  const day = await db.dayStructure.findFirst();
  const blocks = (day?.blocks as unknown as Block[]) ?? [];
  const sleepRules = (day?.sleepRules as unknown as SleepRule[]) ?? [];

  return (
    <>
      <PageHeader
        emoji="🌅"
        title="Estructura del día"
        subtitle="Un hábito tira del siguiente — no hay que decidir, solo seguir la cadena."
      />

      <Card className="mb-5">
        <SectionTitle>El día, bloque a bloque</SectionTitle>
        <ol className="space-y-3">
          {blocks.map((b, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-28 shrink-0 text-sm font-semibold text-[var(--color-brand-700)]">
                {b.time}
              </span>
              <div>
                <p className="text-sm font-medium">{b.label}</p>
                {b.items.length > 0 && (
                  <p className="text-sm text-[var(--color-muted)]">{b.items.join(" → ")}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-xl bg-[var(--color-bg)] p-3 text-sm">
          <strong>Versión de 2 minutos (días difíciles):</strong> ponete la ropa de entrenar y hacé
          una sola serie. Arrancar es la meta; casi siempre seguís de largo.
        </p>
      </Card>

      <Card className="mb-5">
        <SectionTitle>Comidas — sistema 1-2-12 (ventana 8 AM – 6 PM)</SectionTitle>
        <ul className="space-y-2">
          {MEALS_127.map((m, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="w-28 shrink-0 font-semibold text-[var(--color-brand-700)]">
                {m.time}
              </span>
              <span>{m.what}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle>Reglas del sueño · 10-3-2-1-0</SectionTitle>
        <ul className="space-y-2">
          {sleepRules.map((r, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-100)] font-bold text-[var(--color-brand-700)]">
                {r.n}
              </span>
              <span className="text-sm">{r.rule}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          El sueño es la base de la base: sin dormir bien, el entrenamiento y la comida se caen
          solos. Es el pilar #1.
        </p>
        <div className="mt-3">
          <HealthNote>
            Estas pautas son informativas, no consejo médico. Cualquier protocolo de sueño,
            suplementos o ayunos, validalos con tu médico.
          </HealthNote>
        </div>
      </Card>
    </>
  );
}
