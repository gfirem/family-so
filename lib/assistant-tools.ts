// Herramientas compartidas por el chat con Claude (in-app) y el servidor MCP.
// Cada una lee/escribe datos de family-so. Las de escritura son acotadas y seguras
// (no borran ni modifican datos de salud sensibles).

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
      "Resumen de la semana actual: el norte, lista de compras, actividades, plan de comida y % de hábitos por persona.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async () => {
      const week = await getCurrentWeek();
      const { stats } = await weekHabitStats(week.weekOf);
      return JSON.stringify({
        semanaDel: isoDate(week.weekOf),
        norte: week.northStar,
        queNosDescarrilo: week.notes,
        compras: week.shoppingItems.map((i) => ({ nombre: i.name, hecho: i.checked })),
        actividades: week.activities.map((a) => ({
          dia: DAY_NAMES[a.day],
          titulo: a.title,
          hora: a.time,
          quien: a.who,
          tipo: a.type,
          hecho: a.done,
        })),
        habitos: stats.map((s) => ({ persona: s.user.name, porcentaje: s.pct })),
      });
    },
  },
  {
    name: "get_habits",
    description: "Hábitos por persona con su racha de la semana y si son clave (keystone).",
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
          persona: u.name,
          habitos: habits.map((h) => ({
            nombre: h.name,
            clave: h.isKeystone,
            cumplidosEstaSemana: doneByHabit.get(h.id) ?? 0,
          })),
        });
      }
      return JSON.stringify(out);
    },
  },
  {
    name: "get_goals",
    description: "Metas del trimestre actual, agrupadas por pilar, con su estado.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async () => {
      const { year, quarter } = quarterOf();
      const goals = await db.goal.findMany({
        where: { year, quarter },
        include: { pillar: true },
        orderBy: { createdAt: "asc" },
      });
      return JSON.stringify({
        trimestre: `Q${quarter} ${year}`,
        metas: goals.map((g) => ({ texto: g.text, pilar: g.pillar.name, estado: g.status })),
      });
    },
  },
  {
    name: "list_recipes",
    description: "Banco de recetas 1-2-12. Filtro opcional 'soloAprobadas' (true por defecto).",
    inputSchema: {
      type: "object",
      properties: {
        soloAprobadas: { type: "boolean", description: "Devolver solo recetas aprobadas" },
      },
      additionalProperties: false,
    },
    handler: async (args) => {
      const soloAprobadas = args.soloAprobadas !== false;
      const recipes = await db.recipe.findMany({
        where: soloAprobadas ? { approved: true } : {},
        orderBy: [{ isShake: "desc" }, { name: "asc" }],
      });
      return JSON.stringify(
        recipes.map((r) => ({
          nombre: r.name,
          licuado: r.isShake,
          proteinaG: r.proteinG,
          etiquetas: r.tags,
          aprobada: r.approved,
        })),
      );
    },
  },
  {
    name: "get_day_structure",
    description: "Estructura del día (bloques horarios) y reglas de sueño 10-3-2-1-0.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async () => {
      const day = await db.dayStructure.findFirst();
      return JSON.stringify({ bloques: day?.blocks ?? [], sueno: day?.sleepRules ?? [] });
    },
  },
  {
    name: "add_plan_idea",
    description: "Agrega una idea al banco de planes (salidas/conexión).",
    inputSchema: {
      type: "object",
      properties: {
        titulo: { type: "string", description: "La idea de plan" },
        categoria: { type: "string", description: "parque | rio | salida | conexion" },
        costo: { type: "string", description: "ej: gratis, barato" },
      },
      required: ["titulo"],
      additionalProperties: false,
    },
    handler: async (args) => {
      const idea = await db.planIdea.create({
        data: {
          title: String(args.titulo),
          category: String(args.categoria ?? "salida"),
          cost: String(args.costo ?? "gratis"),
        },
      });
      return JSON.stringify({ ok: true, id: idea.id, titulo: idea.title });
    },
  },
  {
    name: "add_shopping_item",
    description: "Agrega un item a la lista del mercado de la semana actual.",
    inputSchema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "El producto a comprar" },
        cantidad: { type: "string", description: "Cantidad (opcional)" },
      },
      required: ["nombre"],
      additionalProperties: false,
    },
    handler: async (args) => {
      const week = await getCurrentWeek();
      const item = await db.shoppingItem.create({
        data: {
          weekId: week.id,
          name: String(args.nombre),
          qty: args.cantidad ? String(args.cantidad) : null,
          source: "manual",
        },
      });
      return JSON.stringify({ ok: true, id: item.id });
    },
  },
];

export const toolsByName = new Map(assistantTools.map((t) => [t.name, t]));

// Schemas en el formato que espera la Messages API de Anthropic.
export function anthropicToolSchemas() {
  return assistantTools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }));
}
