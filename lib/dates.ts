// Utilidades de fecha. La semana arranca el LUNES (weekOf).

export function startOfWeek(d: Date = new Date()): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0=domingo
  const diff = (day === 0 ? -6 : 1) - day; // mover al lunes
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
