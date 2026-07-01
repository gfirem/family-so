"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { isoDate } from "@/lib/dates";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  habitReminderInput,
} from "@/lib/google-calendar";

function refresh() {
  revalidatePath("/habits", "layout");
  revalidatePath("/");
}

// Reads the "dow" checkboxes (0=Mon..6=Sun) into a sorted unique number array.
function parseDaysOfWeek(formData: FormData): number[] {
  return formData
    .getAll("dow")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    .sort((a, b) => a - b);
}

function clean(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

// Checks/unchecks a habit on a date. Creates the log if it does not exist.
export async function toggleHabitLog(habitId: string, ownerId: string, dateIso: string) {
  await requireUser();
  const date = new Date(dateIso);
  const existing = await db.habitLog.findUnique({
    where: { habitId_date: { habitId, date } },
  });
  if (existing) {
    if (existing.done) {
      await db.habitLog.delete({ where: { id: existing.id } });
    } else {
      await db.habitLog.update({ where: { id: existing.id }, data: { done: true } });
    }
  } else {
    await db.habitLog.create({ data: { habitId, ownerId, date, done: true } });
  }
  refresh();
}

export async function addHabit(formData: FormData) {
  await requireUser();
  const ownerId = String(formData.get("ownerId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const count = await db.habit.count({ where: { ownerId } });
  await db.habit.create({
    data: {
      ownerId,
      name,
      identityLink: clean(formData, "identityLink"),
      tinyVersion: clean(formData, "tinyVersion"),
      cue: clean(formData, "cue"),
      reminderAt: clean(formData, "reminderAt"),
      scheduleId: clean(formData, "scheduleId"),
      daysOfWeek: parseDaysOfWeek(formData),
      isKeystone: formData.get("isKeystone") === "on",
      order: count,
    },
  });
  refresh();
}

export async function updateHabit(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await db.habit.update({
    where: { id },
    data: {
      name,
      identityLink: clean(formData, "identityLink"),
      tinyVersion: clean(formData, "tinyVersion"),
      cue: clean(formData, "cue"),
      reminderAt: clean(formData, "reminderAt"),
      scheduleId: clean(formData, "scheduleId"),
      daysOfWeek: parseDaysOfWeek(formData),
      isKeystone: formData.get("isKeystone") === "on",
    },
  });
  refresh();
}

export async function deleteHabit(id: string) {
  await requireUser();
  await db.habit.update({ where: { id }, data: { active: false } });
  refresh();
}

// --- Schedules (time-of-day groups) ---

export async function addSchedule(formData: FormData) {
  await requireUser();
  const ownerId = String(formData.get("ownerId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!ownerId || !name) return;
  const count = await db.habitSchedule.count({ where: { ownerId } });
  await db.habitSchedule.create({
    data: {
      ownerId,
      name,
      emoji: String(formData.get("emoji") ?? "🕒").trim() || "🕒",
      atTime: clean(formData, "atTime"),
      order: count,
    },
  });
  refresh();
}

export async function updateSchedule(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await db.habitSchedule.update({
    where: { id },
    data: {
      name,
      emoji: String(formData.get("emoji") ?? "🕒").trim() || "🕒",
      atTime: clean(formData, "atTime"),
    },
  });
  refresh();
}

export async function deleteSchedule(id: string) {
  await requireUser();
  // Habits keep existing; their scheduleId is set null via onDelete: SetNull.
  await db.habitSchedule.delete({ where: { id } });
  refresh();
}

// Creates the three default moments (Morning/Noon/Night) for a person if they
// have none yet — the contextual cues behind habit stacking.
export async function createDefaultSchedules(ownerId: string) {
  await requireUser();
  const count = await db.habitSchedule.count({ where: { ownerId } });
  if (count > 0) return;
  await db.habitSchedule.createMany({
    data: [
      { ownerId, name: "Mañana", emoji: "🌅", atTime: "07:30", order: 0 },
      { ownerId, name: "Mediodía", emoji: "☀️", atTime: "13:00", order: 1 },
      { ownerId, name: "Noche", emoji: "🌙", atTime: "21:00", order: 2 },
    ],
  });
  refresh();
}

// --- Reminders / alarms (best-effort backed by Google Calendar) ---

// Saves the reminder time and, when possible, creates a recurring Google Calendar
// event so the phone fires the actual alarm. If the calendar call fails (no token,
// permissions), the reminder time is still saved and shown in the UI.
export async function setHabitReminder(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const time = String(formData.get("reminderAt") ?? "").trim();
  if (!id || !time) return;

  const habit = await db.habit.findUnique({ where: { id } });
  if (!habit) return;

  // Replace any previous calendar event so we never leave duplicates behind.
  if (habit.calendarEventId) {
    await deleteCalendarEvent(habit.calendarEventId);
  }

  const result = await createCalendarEvent(
    habitReminderInput({
      name: habit.name,
      cue: habit.cue,
      timeHHmm: time,
      anchorDateIso: isoDate(new Date()),
      daysOfWeek: habit.daysOfWeek,
    }),
  );

  await db.habit.update({
    where: { id },
    data: { reminderAt: time, calendarEventId: result.ok ? (result.id ?? null) : null },
  });
  refresh();
}

export async function removeHabitReminder(id: string) {
  await requireUser();
  const habit = await db.habit.findUnique({ where: { id } });
  if (!habit) return;
  if (habit.calendarEventId) {
    await deleteCalendarEvent(habit.calendarEventId);
  }
  await db.habit.update({ where: { id }, data: { reminderAt: null, calendarEventId: null } });
  refresh();
}

export async function addWeight(formData: FormData) {
  await requireUser();
  const ownerId = String(formData.get("ownerId"));
  const weightKg = parseFloat(String(formData.get("weightKg") ?? ""));
  if (Number.isNaN(weightKg)) return;
  const dateStr = String(formData.get("date") ?? "");
  const date = dateStr ? new Date(dateStr) : new Date();
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  await db.weightLog.upsert({
    where: { ownerId_date: { ownerId, date: day } },
    update: { weightKg },
    create: { ownerId, date: day, weightKg },
  });
  refresh();
}
