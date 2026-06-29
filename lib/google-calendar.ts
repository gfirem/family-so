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

export type CalendarResult = { ok: boolean; htmlLink?: string; error?: string };

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
  const data = (await res.json()) as { htmlLink?: string };
  return { ok: true, htmlLink: data.htmlLink };
}
