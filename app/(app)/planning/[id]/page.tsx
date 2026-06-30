import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/ui";
import { CheckItem, ActionButton, SubmitButton } from "@/components/actions-ui";
import { getPlanningForUser, PLANNING_SCOPES } from "@/lib/week";
import { requireUser, getPartners } from "@/lib/session";
import { formatWeekRange, DAY_NAMES, isoDate } from "@/lib/dates";
import {
  saveLookback,
  saveNorthStar,
  addActivity,
  toggleActivity,
  deleteActivity,
  addShoppingItem,
  toggleShopping,
  deleteShopping,
  addEvent,
  deleteEvent,
} from "../actions";
import {
  addActivityToCalendar,
  addEventToCalendar,
  createWeeklyReminders,
} from "../calendar-actions";

export default async function PlanningEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cal?: string; msg?: string }>;
}) {
  const { id } = await params;
  const { cal, msg } = await searchParams;
  const me = await requireUser();
  const week = await getPlanningForUser(id, me.id);
  if (!week) notFound();

  const scopeDef = PLANNING_SCOPES.find((s) => s.scope === week.scope) ?? PLANNING_SCOPES[0];
  const isFamily = week.scope === "familia";

  const calBanner = (
    <>
      {cal === "ok" && (
        <p className="mb-4 rounded-xl bg-[var(--color-brand-100)] px-3 py-2 text-sm text-[var(--color-brand-700)]">
          ✓ Agregado a Google Calendar.
        </p>
      )}
      {cal === "err" && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
          No se pudo agregar al Calendar. {msg ?? ""}
        </p>
      )}
    </>
  );

  const backLink = (
    <Link
      href={`/planning?week=${isoDate(week.weekOf)}`}
      className="mb-4 inline-block text-sm font-medium text-[var(--color-brand-700)]"
    >
      ← Volver al calendario
    </Link>
  );

  // --- Private plannings (personal / empresa): a lighter editor. ---
  if (!isFamily) {
    return (
      <>
        {backLink}
        <PageHeader
          emoji={scopeDef.emoji}
          title={`Planning ${scopeDef.label.toLowerCase()}`}
          subtitle={`Privada · Semana del ${formatWeekRange(week.weekOf)}`}
        />
        {calBanner}

        <Block n={1} title="Mi norte" desc="Una frase que te recentre esta semana.">
          <form action={saveNorthStar} className="space-y-3">
            <input type="hidden" name="weekId" value={week.id} />
            <input
              name="northStar"
              defaultValue={week.northStar ?? ""}
              placeholder="¿Hacia dónde voy esta semana?"
              className="input"
            />
            <SubmitButton>Guardar el norte</SubmitButton>
          </form>
        </Block>

        <Block n={2} title="Notas" desc="Lo que querés tener presente o revisar.">
          <form action={saveLookback} className="space-y-3">
            <input type="hidden" name="weekId" value={week.id} />
            <textarea
              name="notes"
              rows={3}
              defaultValue={week.notes ?? ""}
              placeholder="Notas de la semana…"
              className="input"
            />
            <SubmitButton>Guardar</SubmitButton>
          </form>
        </Block>

        <Block n={3} title="Tareas y actividades" desc="Lo que no tiene día y hora, no sucede.">
          <ActivityList items={week.activities} emptyText="Todavía no hay nada esta semana." />
          <AddActivityForm weekId={week.id} type="tarea" placeholder="Ej: Revisar pendientes" />
        </Block>
      </>
    );
  }

  // --- Family planning: the full Sunday ritual (7 blocks). ---
  const partners = await getPartners();
  const whoOptions = ["Ambos", ...partners.map((p) => p.name)];
  const workouts = week.activities.filter((a) => a.type === "entreno");
  const connectionPlans = week.activities.filter((a) => a.type === "conexion");
  const tasks = week.activities.filter((a) => a.type === "tarea");

  return (
    <>
      {backLink}
      <PageHeader
        emoji="🗓️"
        title="Planning de la familia"
        subtitle={`15 min, juntos · Semana del ${formatWeekRange(week.weekOf)}`}
      />

      <p className="mb-4 rounded-2xl bg-[var(--color-brand-50)] p-4 text-sm text-[var(--color-brand-700)]">
        El que tiene su propio plan no se suma al plan del otro. Estos 7 bloques producen las
        <strong> compras, las comidas y las actividades</strong> de la semana.
      </p>

      {calBanner}

      {/* BLOCK 1 */}
      <Block n={1} title="Mirar atrás" desc="¿Cumplimos entreno, comida, sueño? ¿Dónde se cayó el plan? Sin reproches: buscamos el patrón.">
        <form action={saveLookback} className="space-y-3">
          <input type="hidden" name="weekId" value={week.id} />
          <textarea
            name="notes"
            rows={3}
            defaultValue={week.notes ?? ""}
            placeholder="Qué nos descarriló esta semana y por qué…"
            className="input"
          />
          <SubmitButton>Guardar</SubmitButton>
        </form>
      </Block>

      {/* BLOCK 2 */}
      <Block n={2} title="Recordar el norte" desc="Una frase que nos recentre.">
        <form action={saveNorthStar} className="space-y-3">
          <input type="hidden" name="weekId" value={week.id} />
          <input
            name="northStar"
            defaultValue={week.northStar ?? ""}
            placeholder="Vamos a 83 y 70, y a estar listos para ser papás."
            className="input"
          />
          <SubmitButton>Guardar el norte</SubmitButton>
        </form>
      </Block>

      {/* BLOCK 3 */}
      <Block n={3} title="Entrenamiento" desc="Confirmar días, horas y lugar. Lo que no tiene hora, no sucede.">
        <ActivityList items={workouts} emptyText="Todavía no hay entrenos esta semana." />
        <AddActivityForm weekId={week.id} type="entreno" whoOptions={whoOptions} placeholder="Ej: Caminadora 30 min" />
      </Block>

      {/* BLOCK 4 */}
      <Block n={4} title="Alimentación" desc="Elegir las recetas de la semana (rotando para no aburrirnos) y armar la lista del mercado.">
        <Link href="/nutrition" className="btn-primary mb-4">
          🥗 Armar el plan 1-2-12 →
        </Link>
        <h3 className="mb-2 text-sm font-semibold">Lista del mercado</h3>
        {week.shoppingItems.length === 0 ? (
          <p className="mb-3 text-sm text-[var(--color-muted)]">
            Se llena desde el plan de comida, o agregá items sueltos acá.
          </p>
        ) : (
          <ul className="mb-3 divide-y divide-[var(--color-line)]">
            {week.shoppingItems.map((it) => (
              <li key={it.id} className="flex items-center justify-between">
                <CheckItem
                  id={it.id}
                  checked={it.checked}
                  label={it.qty ? `${it.name} · ${it.qty}` : it.name}
                  sub={it.source === "receta" ? "de receta" : undefined}
                  toggle={toggleShopping}
                />
                <ActionButton id={it.id} action={deleteShopping}>
                  ✕
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
        <form action={addShoppingItem} className="flex flex-wrap gap-2">
          <input type="hidden" name="weekId" value={week.id} />
          <input name="name" placeholder="Item" className="input flex-1" required />
          <input name="qty" placeholder="Cant." className="input w-24" />
          <SubmitButton className="btn-ghost">Agregar</SubmitButton>
        </form>
      </Block>

      {/* BLOCK 5 */}
      <Block n={5} title="Planes y conexión" desc="El miércoles afuera y el plan del fin de semana, con lugar y hora. Esto nos blinda de las presiones sociales.">
        <ActivityList items={connectionPlans} emptyText="Sin planes de conexión todavía." />
        <AddActivityForm weekId={week.id} type="conexion" whoOptions={whoOptions} placeholder="Ej: Trabajar desde el río" />
        <Link href="/plans" className="mt-3 inline-block text-sm font-medium text-[var(--color-brand-700)]">
          Ver el banco de planes →
        </Link>
      </Block>

      {/* BLOCK 6 */}
      <Block n={6} title="Anticipar baches" desc="¿Qué viene que nos pueda descarrilar? Decidir EN FRÍO: 'vamos pero no tomamos', 'nos vamos a las 9'.">
        {week.events.length > 0 && (
          <ul className="mb-3 space-y-2">
            {week.events.map((e) => (
              <li key={e.id} className="rounded-xl bg-[var(--color-bg)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {e.place || e.type} · {isoDate(e.date)}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <ActionButton id={e.id} action={addEventToCalendar} className="text-sm hover:opacity-70">
                      📅
                    </ActionButton>
                    <ActionButton id={e.id} action={deleteEvent}>
                      ✕
                    </ActionButton>
                  </div>
                </div>
                {e.plan && <p className="mt-1 text-sm text-[var(--color-brand-700)]">→ {e.plan}</p>}
                {e.invitees.length > 0 && (
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">Con: {e.invitees.join(", ")}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        <form action={addEvent} className="space-y-2">
          <input type="hidden" name="weekId" value={week.id} />
          <div className="flex flex-wrap gap-2">
            <input name="date" type="date" className="input w-40" required />
            <input name="place" placeholder="Lugar / ocasión" className="input flex-1" />
          </div>
          <input name="plan" placeholder="Decisión en frío (ej: vamos pero no tomamos, nos vamos a las 9)" className="input" />
          <input name="invitees" placeholder="Invitados (separados por coma)" className="input" />
          <SubmitButton className="btn-ghost">Anticipar este bache</SubmitButton>
        </form>
        <Link href="/plans" className="mt-3 inline-block text-sm font-medium text-[var(--color-brand-700)]">
          Ver el guion del &quot;no&quot; →
        </Link>
      </Block>

      {/* BLOCK 7 */}
      <Block n={7} title="Tareas claras" desc="Quién compra, quién cocina qué día, quién investiga el plan del finde.">
        <ActivityList items={tasks} emptyText="Sin tareas asignadas todavía." showWho />
        <AddActivityForm weekId={week.id} type="tarea" whoOptions={whoOptions} placeholder="Ej: Comprar el sábado" />
      </Block>

      {/* Google Calendar reminders */}
      <Card className="mt-6">
        <h2 className="font-bold">📅 Recordatorios en Google Calendar</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Crea dos eventos recurrentes: el aviso del <strong>viernes</strong> para pensar el finde y el{" "}
          <strong>planning del domingo</strong>. Tocá 📅 en cualquier actividad o bache para mandarlo al Calendar.
        </p>
        <form action={createWeeklyReminders} className="mt-3">
          <SubmitButton className="btn-ghost">Crear recordatorios recurrentes</SubmitButton>
        </form>
      </Card>

      {/* RESULT */}
      <Card className="mt-4 bg-[var(--color-brand-600)] text-white">
        <h2 className="text-lg font-bold">Resultado de la semana</h2>
        <p className="mt-1 text-sm text-[var(--color-brand-100)]">
          {week.shoppingItems.length} compras · {week.activities.length} actividades ·{" "}
          {week.events.length} baches anticipados
        </p>
        <Link href="/" className="btn mt-3 bg-white text-[var(--color-brand-700)]">
          Ver el tablero →
        </Link>
      </Card>
    </>
  );
}

function Block({
  n,
  title,
  desc,
  children,
}: {
  n: number;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-4">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-sm font-bold text-[var(--color-brand-700)]">
          {n}
        </span>
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="text-sm text-[var(--color-muted)]">{desc}</p>
        </div>
      </div>
      <div className="pl-10">{children}</div>
    </Card>
  );
}

function ActivityList({
  items,
  emptyText,
  showWho,
}: {
  items: {
    id: string;
    title: string;
    day: number;
    time: string | null;
    who: string | null;
    done: boolean;
  }[];
  emptyText: string;
  showWho?: boolean;
}) {
  if (items.length === 0)
    return <p className="mb-3 text-sm text-[var(--color-muted)]">{emptyText}</p>;
  return (
    <ul className="mb-3 divide-y divide-[var(--color-line)]">
      {items.map((a) => {
        const meta = [DAY_NAMES[a.day], a.time, showWho ? a.who : null]
          .filter(Boolean)
          .join(" · ");
        return (
          <li key={a.id} className="flex items-center justify-between">
            <CheckItem id={a.id} checked={a.done} label={a.title} sub={meta || undefined} toggle={toggleActivity} />
            <div className="flex shrink-0 items-center gap-2">
              <ActionButton
                id={a.id}
                action={addActivityToCalendar}
                className="text-sm hover:opacity-70"
              >
                📅
              </ActionButton>
              <ActionButton id={a.id} action={deleteActivity}>
                ✕
              </ActionButton>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function AddActivityForm({
  weekId,
  type,
  whoOptions,
  placeholder,
}: {
  weekId: string;
  type: string;
  whoOptions?: string[];
  placeholder: string;
}) {
  return (
    <form action={addActivity} className="flex flex-wrap gap-2">
      <input type="hidden" name="weekId" value={weekId} />
      <input type="hidden" name="type" value={type} />
      <input name="title" placeholder={placeholder} className="input flex-1" required />
      <select name="day" className="input w-32" defaultValue="0">
        {DAY_NAMES.map((d, i) => (
          <option key={i} value={i}>
            {d}
          </option>
        ))}
      </select>
      <input name="time" placeholder="Hora" className="input w-24" />
      {whoOptions && (
        <select name="who" className="input w-28" defaultValue="Ambos">
          {whoOptions.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      )}
      <SubmitButton className="btn-ghost">Agregar</SubmitButton>
    </form>
  );
}
