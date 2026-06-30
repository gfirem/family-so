// Tools shared by the chat with Claude (in-app) and the MCP server.
// Each one reads/writes family-so data. The write tools are scoped and safe
// (they don't delete or modify sensitive health data).

import { db } from "@/lib/db";
import { getCurrentWeek, weekHabitStats } from "@/lib/week";
import { startOfWeek, addDays, isoDate, quarterOf, DAY_NAMES } from "@/lib/dates";
import { regenerateMarketList } from "@/lib/shopping";
import {
  extractRecipesFromUrl,
  extractRecipesFromPdf,
  saveExtractedRecipes,
  type ExtractedRecipe,
} from "@/lib/recipe-import";

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
        include: { ingredients: { orderBy: { order: "asc" } } },
      });
      return JSON.stringify(
        recipes.map((r) => ({
          name: r.name,
          category: r.category,
          isShake: r.isShake,
          servings: r.servings,
          prepMinutes: r.prepMinutes,
          cookMinutes: r.cookMinutes,
          calories: r.calories,
          proteinG: r.proteinG,
          fatG: r.fatG,
          carbsG: r.carbsG,
          tags: r.tags,
          approved: r.approved,
          ingredients: r.ingredients.map((i) =>
            [i.quantity, i.unit, i.name].filter(Boolean).join(" "),
          ),
          directions: r.directions,
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
  {
    name: "create_recipe",
    description:
      "Creates a recipe in the bank with full data: category, times, servings, macros, ingredients and directions. Imported as not approved unless 'approved' is true.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        category: { type: "string", description: "Licuados | Desayuno | Almuerzo | Cena | Snack | Postre" },
        isShake: { type: "boolean" },
        prepMinutes: { type: "number" },
        cookMinutes: { type: "number" },
        servings: { type: "number" },
        calories: { type: "number" },
        proteinG: { type: "number" },
        fatG: { type: "number" },
        carbsG: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
        ingredients: {
          type: "array",
          description: "Structured ingredients (feed the shopping list).",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "string" },
              unit: { type: "string" },
              aisle: { type: "string" },
            },
            required: ["name"],
            additionalProperties: false,
          },
        },
        directions: { type: "array", items: { type: "string" } },
        notes: { type: "string" },
        approved: { type: "boolean" },
      },
      required: ["name"],
      additionalProperties: false,
    },
    handler: async (args) => {
      const recipe = args as unknown as ExtractedRecipe & { approved?: boolean };
      const saved = await saveExtractedRecipes([recipe], {
        source: "asistente",
        approved: recipe.approved === true,
      });
      return JSON.stringify({ ok: true, created: saved });
    },
  },
  {
    name: "import_recipe_from_url",
    description:
      "Reads a recipe web page and imports the recipe(s) into the bank (not approved). Returns the created recipe names.",
    inputSchema: {
      type: "object",
      properties: { url: { type: "string", description: "The recipe page URL" } },
      required: ["url"],
      additionalProperties: false,
    },
    handler: async (args) => {
      const url = String(args.url);
      const recipes = await extractRecipesFromUrl(url);
      const saved = await saveExtractedRecipes(recipes, { source: new URL(url).host, sourceUrl: url });
      return JSON.stringify({ ok: true, count: saved.length, created: saved });
    },
  },
  {
    name: "import_recipes_from_pdf",
    description:
      "Reads a recipe book in PDF and imports ALL recipes into the bank (not approved). Provide EITHER pdfUrl (public URL) OR pdfBase64. Returns the created recipe names.",
    inputSchema: {
      type: "object",
      properties: {
        pdfUrl: { type: "string", description: "Public URL of the PDF" },
        pdfBase64: { type: "string", description: "Base64-encoded PDF (alternative to pdfUrl)" },
      },
      additionalProperties: false,
    },
    handler: async (args) => {
      const pdfUrl = args.pdfUrl ? String(args.pdfUrl) : undefined;
      const pdfBase64 = args.pdfBase64 ? String(args.pdfBase64) : undefined;
      const recipes = await extractRecipesFromPdf({ url: pdfUrl, base64: pdfBase64 });
      const saved = await saveExtractedRecipes(recipes, {
        source: pdfUrl ? `pdf: ${pdfUrl}` : "pdf",
      });
      return JSON.stringify({ ok: true, count: saved.length, created: saved });
    },
  },
  {
    name: "generate_shopping_list",
    description:
      "Regenerates the current week's shopping list from the structured ingredients of the recipes in the meal plan.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async () => {
      const week = await getCurrentWeek();
      const count = await regenerateMarketList(week.id);
      return JSON.stringify({ ok: true, items: count });
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
