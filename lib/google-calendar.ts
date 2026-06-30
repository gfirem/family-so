import { auth } from "@/auth";

// Minimal Google Calendar client. Uses the access token stored in the session
// (refreshed by the auth jwt callback). All writes are explicit, user-triggered
// actions — nothing is sent to the calendar automatically.

const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

// Time zone used for timed/recurring events. Set APP_TIMEZONE (IANA name).
// `||` so an empty string falls back to the default (Austin, TX).
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "America/Chicago";

export type CalendarTime =
  | { date: string } // all-day (YYYY-MM-DD)
  | { dateTime: string; timeZone: string }; // timed (ISO)

export type CalendarEventInput = {
  summary: string;
  description?: string;
  start: CalendarTime;
  end: CalendarTime;
  recurrence?: string[]; // e.g. ["RRULE:FREQ=WEEKLY;BYDAY=SU"]
};

export type CalendarResult = { ok: boolean; id?: string; htmlLink?: string; error?: string };

// Builds a recurring all-the-week (or selected-weekdays) reminder for a habit.
// `daysOfWeek` uses the app index 0=Mon..6=Sun; empty means every day.
export function habitReminderInput(opts: {
  name: string;
  cue?: string | null;
  timeHHmm: string; // "08:00"
  anchorDateIso: string; // "YYYY-MM-DD" — first occurrence (today is fine)
  daysOfWeek: number[];
}): CalendarEventInput {
  const WEEKDAY = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const [h, m] = opts.timeHHmm.split(":");
  const startLocal = `${opts.anchorDateIso}T${h.padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}:00`;
  // 15-minute window so the event shows clearly in the calendar.
  const endMinutes = (Number(h) * 60 + Number(m ?? 0) + 15) % (24 * 60);
  const endLocal = `${opts.anchorDateIso}T${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}:00`;
  const rrule =
    !opts.daysOfWeek || opts.daysOfWeek.length === 0
      ? "RRULE:FREQ=DAILY"
      : `RRULE:FREQ=WEEKLY;BYDAY=${opts.daysOfWeek.map((d) => WEEKDAY[d]).join(",")}`;
  return {
    summary: `Hábito: ${opts.name}`,
    description: opts.cue ?? "Recordatorio de hábito creado desde family-so.",
    start: { dateTime: startLocal, timeZone: APP_TIMEZONE },
    end: { dateTime: endLocal, timeZone: APP_TIMEZONE },
    recurrence: [rrule],
  };
}

export async function getCalendarToken(): Promise<string | null> {
  const session = await auth();
  if (!session || session.error || !session.accessToken) return null;
  return session.accessToken;
}

export async function createCalendarEvent(input: CalendarEventInput): Promise<CalendarResult> {
  const token = await getCalendarToken();
  if (!token) {
    return { ok: false, error: "Sin acceso a Google Calendar. Volvé a entrar con Google." };
  }
  const res = await fetch(EVENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const detail = await res.text();
    return { ok: false, error: `Google Calendar respondió ${res.status}: ${detail.slice(0, 200)}` };
  }
  const data = (await res.json()) as { id?: string; htmlLink?: string };
  return { ok: true, id: data.id, htmlLink: data.htmlLink };
}

// Deletes an event by id. Treats already-gone events (404/410) as success so
// removing a reminder is idempotent.
export async function deleteCalendarEvent(eventId: string): Promise<CalendarResult> {
  const token = await getCalendarToken();
  if (!token) {
    return { ok: false, error: "Sin acceso a Google Calendar. Volvé a entrar con Google." };
  }
  const res = await fetch(`${EVENTS_URL}/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const detail = await res.text();
    return { ok: false, error: `Google Calendar respondió ${res.status}: ${detail.slice(0, 200)}` };
  }
  return { ok: true };
}
