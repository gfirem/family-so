// Date utilities. The week starts on MONDAY (weekOf).

export function startOfWeek(d: Date = new Date()): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0=Sunday
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Parses a "YYYY-MM-DD" query param into the Monday of that week.
// Falls back to the current week when missing or invalid.
export function parseWeekOf(s: string | undefined | null): Date {
  if (!s) return startOfWeek();
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return startOfWeek();
  return startOfWeek(d);
}

// "30 jun – 6 jul" style label for a week starting on Monday.
export function formatWeekRange(weekOf: Date): string {
  const end = addDays(weekOf, 6);
  const fmt = (d: Date) => d.toLocaleDateString("es", { day: "numeric", month: "short" });
  return `${fmt(weekOf)} – ${fmt(end)}`;
}

export const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function quarterOf(d: Date = new Date()): { year: number; quarter: number } {
  return { year: d.getUTCFullYear(), quarter: Math.floor(d.getUTCMonth() / 3) + 1 };
}

export function formatDateEs(d: Date): string {
  return d.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
