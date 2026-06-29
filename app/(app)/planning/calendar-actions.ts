"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { addDays, isoDate, startOfWeek } from "@/lib/dates";
import { createCalendarEvent, APP_TIMEZONE, type CalendarResult } from "@/lib/google-calendar";

// Redirects back to /planning with a result banner.
function finish(result: CalendarResult): never {
  if (result.ok) redirect("/planning?cal=ok");
  redirect(`/planning?cal=err&msg=${encodeURIComponent(result.error ?? "Error")}`);
}

// Parses a free-text time like "9:00" or "18:30" into HH:MM, or null.
function parseTime(time: string | null): string | null {
  if (!time) return null;
  const m = time.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hh = String(Math.min(23, Number(m[1]))).padStart(2, "0");
  return `${hh}:${m[2]}`;
}

export async function addActivityToCalendar(id: string) {
  await requireUser();
  const activity = await db.activity.findUnique({ where: { id }, include: { week: true } });
  if (!activity) finish({ ok: false, error: "Actividad no encontrada" });
  const date = addDays(activity!.week.weekOf, activity!.day);
  const dayIso = isoDate(date);
  const hm = parseTime(activity!.time);

  const description = [activity!.who ? `Para: ${activity!.who}` : null, `family-so · ${activity!.type}`]
    .filter(Boolean)
    .join("\n");

  let result: CalendarResult;
  if (hm) {
    const endHour = String(Math.min(23, Number(hm.slice(0, 2)) + 1)).padStart(2, "0");
    result = await createCalendarEvent({
      summary: activity!.title,
      description,
      start: { dateTime: `${dayIso}T${hm}:00`, timeZone: APP_TIMEZONE },
      end: { dateTime: `${dayIso}T${endHour}:${hm.slice(3)}:00`, timeZone: APP_TIMEZONE },
    });
  } else {
    result = await createCalendarEvent({
      summary: activity!.title,
      description,
      start: { date: dayIso },
      end: { date: isoDate(addDays(date, 1)) },
    });
  }
  finish(result);
}

export async function addEventToCalendar(id: string) {
  await requireUser();
  const event = await db.event.findUnique({ where: { id } });
  if (!event) finish({ ok: false, error: "Evento no encontrado" });
  const dayIso = isoDate(event!.date);
  const result = await createCalendarEvent({
    summary: event!.place ? `${event!.place} (${event!.type})` : event!.type,
    description: [event!.plan ? `Plan en frío: ${event!.plan}` : null, event!.invitees.length ? `Con: ${event!.invitees.join(", ")}` : null]
      .filter(Boolean)
      .join("\n"),
    start: { date: dayIso },
    end: { date: isoDate(addDays(event!.date, 1)) },
  });
  finish(result);
}

// Creates the two recurring planning reminders (Friday prompt + Sunday planning).
export async function createWeeklyReminders() {
  await requireUser();
  // Anchor on the current week's Friday and Sunday (recurrence handles the rest).
  const monday = startOfWeek();
  const friday = isoDate(addDays(monday, 4));
  const sunday = isoDate(addDays(monday, 6));

  const friResult = await createCalendarEvent({
    summary: "family-so · Pensá el plan del finde",
    description: "Recordatorio del viernes: andá pensando a dónde van la semana próxima.",
    start: { dateTime: `${friday}T18:00:00`, timeZone: APP_TIMEZONE },
    end: { dateTime: `${friday}T18:15:00`, timeZone: APP_TIMEZONE },
    recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=FR"],
  });
  if (!friResult.ok) finish(friResult);

  const sunResult = await createCalendarEvent({
    summary: "family-so · Planning del domingo (15 min, juntos)",
    description: "Los 7 bloques: mirar atrás, norte, entreno, comida, conexión, anticipar baches, tareas.",
    start: { dateTime: `${sunday}T10:00:00`, timeZone: APP_TIMEZONE },
    end: { dateTime: `${sunday}T10:30:00`, timeZone: APP_TIMEZONE },
    recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=SU"],
  });
  finish(sunResult);
}
