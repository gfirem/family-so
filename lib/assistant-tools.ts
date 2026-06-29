// Tools shared by the chat with Claude (in-app) and the MCP server.
// Each one reads/writes family-so data. The write tools are scoped and safe
// (they don't delete or modify sensitive health data).

import { db } from "@/lib/db";
import { getCurrentWeek, weekHabitStats } from "@/lib/week";
import { startOfWeek, addDays, isoDate, quarterOf, DAY_NAMES } from "@/lib/dates";

export type ToolDef = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties: false;
  };
  handler: (args: Record<string, unknown>) => Promise<string>;
};

export const assistantTools: ToolDef[] = [
  {
    name: "get_week_summary",
    description:
      "Summary of the current week: the north star, shopping list, activities, meal plan and % of habits per person.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async () => {
      const week = await getCurrentWeek();
      const { stats } = await weekHabitStats(week.weekOf);
      return JSON.stringify({
        weekOf: isoDate(week.weekOf),
        northStar: week.northStar,
        whatDerailedUs: week.notes,
        shopping: week.shoppingItems.map((i) => ({ name: i.name, done: i.checked })),
        activities: week.activities.map((a) => ({
          day: DAY_NAMES[a.day],
          title: a.title,
          time: a.time,
          who: a.who,
          type: a.type,
          done: a.done,
        })),
        habits: stats.map((s) => ({ person: s.user.name, percent: s.pct })),
      });
    },
  },
  {
    name: "get_habits",
    description: "Habits per person with their streak for the week and whether they are keystone habits.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async () => {
      const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
      const weekOf = startOfWeek();
      const from = weekOf;
      const to = addDays(weekOf, 7);
      const out = [];
      for (const u of users) {
        const habits = await db.habit.findMany({
          where: { ownerId: u.id, active: true },
          orderBy: [{ isKeystone: "desc" }, { order: "asc" }],
        });
        const logs = await db.habitLog.findMany({
          where: { ownerId: u.id, done: true, date: { gte: from, lt: to } },
        });
        const doneByHabit = new Map<string, number>();
        for (const l of logs) doneByHabit.set(l.habitId, (doneByHabit.get(l.habitId) ?? 0) + 1);
        out.push({
          person: u.name,
          habits: habits.map((h) => ({
            name: h.name,
            keystone: h.isKeystone,
            doneThisWeek: doneByHabit.get(h.id) ?? 0,
          })),
        });
      }
      return JSON.stringify(out);
    },
  },
  {
    name: "get_goals",
    description: "Goals for the current quarter, grouped by pillar, with their status.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async () => {
      const { year, quarter } = quarterOf();
      const goals = await db.goal.findMany({
        where: { year, quarter },
        include: { pillar: true },
        orderBy: { createdAt: "asc" },
      });
      return JSON.stringify({
        quarter: `Q${quarter} ${year}`,
        goals: goals.map((g) => ({ text: g.text, pillar: g.pillar.name, status: g.status })),
      });
    },
  },
  {
    name: "list_recipes",
    description: "1-2-12 recipe bank. Optional filter 'onlyApproved' (true by default).",
    inputSchema: {
      type: "object",
      properties: {
        onlyApproved: { type: "boolean", description: "Return only approved recipes" },
      },
      additionalProperties: false,
    },
    handler: async (args) => {
      const onlyApproved = args.onlyApproved !== false;
      const recipes = await db.recipe.findMany({
        where: onlyApproved ? { approved: true } : {},
        orderBy: [{ isShake: "desc" }, { name: "asc" }],
      });
      return JSON.stringify(
        recipes.map((r) => ({
          name: r.name,
          isShake: r.isShake,
          proteinG: r.proteinG,
          tags: r.tags,
          approved: r.approved,
        })),
      );
    },
  },
  {
    name: "get_day_structure",
    description: "Day structure (time blocks) and 10-3-2-1-0 sleep rules.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async () => {
      const day = await db.dayStructure.findFirst();
      return JSON.stringify({ blocks: day?.blocks ?? [], sleepRules: day?.sleepRules ?? [] });
    },
  },
  {
    name: "add_plan_idea",
    description: "Adds an idea to the plan bank (outings/connection).",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The plan idea" },
        category: { type: "string", description: "parque | rio | salida | conexion" },
        cost: { type: "string", description: "e.g.: gratis, barato" },
      },
      required: ["title"],
      additionalProperties: false,
    },
    handler: async (args) => {
      const idea = await db.planIdea.create({
        data: {
          title: String(args.title),
          category: String(args.category ?? "salida"),
          cost: String(args.cost ?? "gratis"),
        },
      });
      return JSON.stringify({ ok: true, id: idea.id, title: idea.title });
    },
  },
  {
    name: "add_shopping_item",
    description: "Adds an item to the current week's grocery list.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "The product to buy" },
        quantity: { type: "string", description: "Quantity (optional)" },
      },
      required: ["name"],
      additionalProperties: false,
    },
    handler: async (args) => {
      const week = await getCurrentWeek();
      const item = await db.shoppingItem.create({
        data: {
          weekId: week.id,
          name: String(args.name),
          qty: args.quantity ? String(args.quantity) : null,
          source: "manual",
        },
      });
      return JSON.stringify({ ok: true, id: item.id });
    },
  },
];

export const toolsByName = new Map(assistantTools.map((t) => [t.name, t]));

// Schemas in the format expected by Anthropic's Messages API.
export function anthropicToolSchemas() {
  return assistantTools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }));
}
