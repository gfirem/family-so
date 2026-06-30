import { Card, SectionTitle } from "@/components/ui";
import { ActionButton, SubmitButton } from "@/components/actions-ui";
import { getPartners } from "@/lib/session";
import { getHabits, getSchedules } from "@/lib/habits";
import { DAY_SHORT } from "@/lib/dates";
import {
  addHabit,
  updateHabit,
  deleteHabit,
  addSchedule,
  deleteSchedule,
  createDefaultSchedules,
  setHabitReminder,
  removeHabitReminder,
} from "../actions";

type ScheduleOption = { id: string; name: string; emoji: string };

export default async function ManagePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const users = await getPartners();
  const selected = users.find((u) => u.id === p) ?? users[0];

  const [habits, schedules] = await Promise.all([
    getHabits(selected.id),
    getSchedules(selected.id),
  ]);
  const scheduleOptions: ScheduleOption[] = schedules.map((s) => ({
    id: s.id,
    name: s.name,
    emoji: s.emoji,
  }));

  return (
    <>
      {/* --- Schedules --- */}
      <Card className="mb-5">
        <SectionTitle>Horarios de {selected.name}</SectionTitle>
        <p className="mb-3 text-xs text-[var(--color-muted)]">
          Organizar los hábitos por momento del día es la base del apilamiento de hábitos: el
          momento se vuelve la señal que dispara la conducta.
        </p>

        {schedules.length === 0 ? (
          <form action={createDefaultSchedules.bind(null, selected.id)}>
            <p className="mb-2 text-sm text-[var(--color-muted)]">Todavía no hay horarios.</p>
            <SubmitButton className="btn-ghost">Crear Mañana · Mediodía · Noche</SubmitButton>
          </form>
        ) : (
          <ul className="mb-3 flex flex-wrap gap-2">
            {schedules.map((s) => (
              <li key={s.id} className="chip gap-1.5">
                <span>
                  {s.emoji} {s.name}
                  {s.atTime ? ` · ${s.atTime}` : ""}
                </span>
                <ActionButton
                  id={s.id}
                  action={deleteSchedule}
                  confirm={`¿Eliminar el horario "${s.name}"? Los hábitos quedan, sin horario.`}
                  className="text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                >
                  ✕
                </ActionButton>
              </li>
            ))}
          </ul>
        )}

        <form action={addSchedule} className="flex flex-wrap items-end gap-2 border-t border-[var(--color-line)] pt-3">
          <input type="hidden" name="ownerId" value={selected.id} />
          <input name="emoji" placeholder="🌅" className="input w-16" defaultValue="🕒" />
          <input name="name" placeholder="Nombre del horario" className="input w-44" required />
          <input name="atTime" type="time" className="input w-32" />
          <SubmitButton className="btn-ghost">Agregar horario</SubmitButton>
        </form>
      </Card>

      {/* --- New habit --- */}
      <Card className="mb-5">
        <SectionTitle>Nuevo hábito</SectionTitle>
        <form action={addHabit} className="space-y-2">
          <input type="hidden" name="ownerId" value={selected.id} />
          <HabitFields schedules={scheduleOptions} />
          <SubmitButton className="btn-primary">Agregar hábito</SubmitButton>
        </form>
      </Card>

      {/* --- Existing habits (edit + reminder + archive) --- */}
      <Card>
        <SectionTitle>Hábitos de {selected.name}</SectionTitle>
        {habits.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Sin hábitos todavía.</p>
        ) : (
          <ul className="space-y-2">
            {habits.map((h) => (
              <li key={h.id} className="rounded-xl border border-[var(--color-line)]">
                <details>
                  <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {h.name}
                      {h.isKeystone && <span className="pill-keystone">pilar</span>}
                      {h.reminderAt && (
                        <span className="text-xs text-[var(--color-muted)]">🔔 {h.reminderAt}</span>
                      )}
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">Editar</span>
                  </summary>

                  <div className="space-y-4 border-t border-[var(--color-line)] px-3 py-3">
                    {/* Edit form */}
                    <form action={updateHabit} className="space-y-2">
                      <input type="hidden" name="id" value={h.id} />
                      <HabitFields schedules={scheduleOptions} habit={h} />
                      <SubmitButton className="btn-ghost">Guardar cambios</SubmitButton>
                    </form>

                    {/* Reminder / alarm */}
                    <div className="rounded-xl bg-[var(--color-bg)] p-3">
                      <p className="mb-1 text-sm font-medium">Recordatorio</p>
                      <p className="mb-2 text-xs text-[var(--color-muted)]">
                        Guardamos la hora y, si tenés Google Calendar conectado, creamos una alarma
                        recurrente que suena en tu teléfono.
                      </p>
                      <form action={setHabitReminder} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={h.id} />
                        <input
                          name="reminderAt"
                          type="time"
                          className="input w-32"
                          defaultValue={h.reminderAt ?? ""}
                          required
                        />
                        <SubmitButton className="btn-ghost">
                          {h.reminderAt ? "Actualizar alarma" : "Crear alarma"}
                        </SubmitButton>
                        {h.reminderAt && (
                          <ActionButton id={h.id} action={removeHabitReminder}>
                            Quitar
                          </ActionButton>
                        )}
                      </form>
                      {h.calendarEventId && (
                        <p className="mt-1 text-[11px] text-[var(--color-brand-700)]">
                          ✓ Alarma activa en Google Calendar
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <ActionButton id={h.id} action={deleteHabit} confirm="¿Archivar este hábito?">
                        Archivar hábito
                      </ActionButton>
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

// Shared fields for the create and edit forms. `habit` prefills the edit case.
function HabitFields({
  schedules,
  habit,
}: {
  schedules: ScheduleOption[];
  habit?: {
    name: string;
    identityLink: string | null;
    tinyVersion: string | null;
    cue: string | null;
    scheduleId: string | null;
    daysOfWeek: number[];
    isKeystone: boolean;
  };
}) {
  return (
    <>
      <input name="name" placeholder="Nombre del hábito" className="input" defaultValue={habit?.name ?? ""} required />
      <input
        name="tinyVersion"
        placeholder="Versión mínima (2 min), ej: ponete las zapatillas"
        className="input"
        defaultValue={habit?.tinyVersion ?? ""}
      />
      <input
        name="cue"
        placeholder="Intención: Después de [X], haré [esto]"
        className="input"
        defaultValue={habit?.cue ?? ""}
      />
      <input
        name="identityLink"
        placeholder="Ancla de identidad, ej: soy alguien que entrena"
        className="input"
        defaultValue={habit?.identityLink ?? ""}
      />

      <div className="flex flex-wrap items-center gap-2">
        <select name="scheduleId" className="input w-auto" defaultValue={habit?.scheduleId ?? ""}>
          <option value="">Sin horario</option>
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.emoji} {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="label">Días (vacío = todos los días)</span>
        <div className="flex flex-wrap gap-1.5">
          {DAY_SHORT.map((d, i) => {
            const checked = habit?.daysOfWeek?.includes(i) ?? false;
            return (
              <label
                key={i}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--color-line)] px-2 py-1 text-xs has-[:checked]:border-[var(--color-brand-500)] has-[:checked]:bg-[var(--color-brand-50)] has-[:checked]:text-[var(--color-brand-700)]"
              >
                <input type="checkbox" name="dow" value={i} defaultChecked={checked} className="sr-only" />
                {d}
              </label>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isKeystone"
          defaultChecked={habit?.isKeystone ?? false}
          className="h-4 w-4 accent-[var(--color-brand-600)]"
        />
        Es un hábito pilar (keystone)
      </label>
    </>
  );
}
