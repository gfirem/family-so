// Recipe import helpers. They use Claude to turn unstructured sources
// (a recipe web page or a PDF recipe book) into structured recipes that match
// the Recipe / RecipeIngredient data model. Shared by the in-app import page
// (server actions) and the MCP tools.

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const MODEL = "claude-opus-4-8";

// Structured recipe as extracted by Claude. Mirrors the Recipe model fields.
export type ExtractedIngredient = {
  name: string;
  quantity?: string | null;
  unit?: string | null;
  aisle?: string | null;
};

export type ExtractedRecipe = {
  name: string;
  category?: string | null;
  isShake?: boolean;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  servings?: number | null;
  calories?: number | null;
  proteinG?: number | null;
  fatG?: number | null;
  carbsG?: number | null;
  tags?: string[];
  ingredients?: ExtractedIngredient[];
  directions?: string[];
  notes?: string | null;
  photoUrl?: string | null;
};

// JSON schema for the forced tool call. Claude must return recipes in this shape.
const SAVE_RECIPES_TOOL: Anthropic.Tool = {
  name: "save_recipes",
  description: "Save the recipes extracted from the source.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      recipes: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            category: {
              type: "string",
              description:
                "Recipe category in Spanish, e.g. Licuados, Desayuno, Almuerzo, Cena, Snack, Postre.",
            },
            isShake: { type: "boolean", description: "true if it is a shake/smoothie/licuado" },
            prepMinutes: { type: "number" },
            cookMinutes: { type: "number" },
            servings: { type: "number" },
            calories: { type: "number" },
            proteinG: { type: "number" },
            fatG: { type: "number" },
            carbsG: { type: "number" },
            tags: {
              type: "array",
              items: { type: "string" },
              description:
                "Dietary tags in Spanish kebab-case, e.g. sin-gluten, sin-lacteos, vegetariano, vegano.",
            },
            ingredients: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string", description: "numeric/fraction as text, e.g. 1, ¼, 8" },
                  unit: { type: "string", description: "e.g. cup, oz, tbs, tsp, serving" },
                  aisle: {
                    type: "string",
                    description: "grocery aisle in Spanish, e.g. frutas-y-verduras, lacteos, almacen",
                  },
                },
                required: ["name"],
              },
            },
            directions: { type: "array", items: { type: "string" } },
            notes: { type: "string" },
          },
          required: ["name"],
        },
      },
    },
    required: ["recipes"],
  },
};

const SYSTEM = `You extract recipes from documents and web pages into structured data.
Keep recipe names, categories, ingredients, directions and notes in Spanish (translate if the source is in another language).
Preserve quantities and units faithfully. Use grams for protein/fat/carbs and kcal for calories.
Mark isShake=true for shakes, smoothies or licuados. If a field is unknown, omit it. Never invent macros that are not present.`;

function extractRecipesFromMessage(msg: Anthropic.Message): ExtractedRecipe[] {
  for (const block of msg.content) {
    if (block.type === "tool_use" && block.name === "save_recipes") {
      const input = block.input as { recipes?: ExtractedRecipe[] };
      return input.recipes ?? [];
    }
  }
  return [];
}

async function runExtraction(content: Anthropic.ContentBlockParam[]): Promise<ExtractedRecipe[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY no está configurada.");
  }
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM,
    tools: [SAVE_RECIPES_TOOL],
    tool_choice: { type: "tool", name: "save_recipes" },
    messages: [{ role: "user", content }],
  });
  return extractRecipesFromMessage(msg);
}

// Extract recipes from a recipe web page (URL). Also tries to capture the main photo.
export async function extractRecipesFromUrl(url: string): Promise<ExtractedRecipe[]> {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; family-so recipe importer)" },
  });
  if (!res.ok) throw new Error(`No se pudo leer la URL (${res.status}).`);
  const html = await res.text();
  const photoUrl = ogImage(html);
  const text = htmlToText(html).slice(0, 60_000);

  const recipes = await runExtraction([
    {
      type: "text",
      text: `Extraé la(s) receta(s) de esta página web (${url}). Contenido:\n\n${text}`,
    },
  ]);
  // Attach the page photo and source URL to single-recipe imports.
  for (const r of recipes) {
    if (!r.photoUrl && photoUrl) r.photoUrl = photoUrl;
  }
  return recipes;
}

// Extract recipes from a PDF. Accepts a public URL or a base64-encoded PDF.
export async function extractRecipesFromPdf(opts: {
  url?: string;
  base64?: string;
}): Promise<ExtractedRecipe[]> {
  if (!opts.base64 && !opts.url) throw new Error("Se requiere un PDF (url o base64).");
  const source: Anthropic.Base64PDFSource | Anthropic.URLPDFSource = opts.base64
    ? { type: "base64", media_type: "application/pdf", data: opts.base64 }
    : { type: "url", url: opts.url as string };

  return runExtraction([
    { type: "document", source },
    {
      type: "text",
      text: "Extraé TODAS las recetas del recetario en PDF, una por una, con sus macros, ingredientes y pasos.",
    },
  ]);
}

// Persist extracted recipes into the bank (with their ingredients). Imported as
// not-approved by default so they are reviewed before entering the weekly plan.
export async function saveExtractedRecipes(
  recipes: ExtractedRecipe[],
  opts: { source: string; approved?: boolean; sourceUrl?: string },
): Promise<{ id: string; name: string }[]> {
  const created: { id: string; name: string }[] = [];
  for (const r of recipes) {
    if (!r.name?.trim()) continue;
    const recipe = await db.recipe.create({
      data: {
        name: r.name.trim(),
        source: opts.source,
        approved: opts.approved ?? false,
        sourceUrl: opts.sourceUrl ?? null,
        category: clean(r.category),
        isShake: r.isShake ?? false,
        prepMinutes: int(r.prepMinutes),
        cookMinutes: int(r.cookMinutes),
        servings: int(r.servings),
        calories: int(r.calories),
        proteinG: int(r.proteinG),
        fatG: int(r.fatG),
        carbsG: int(r.carbsG),
        tags: (r.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
        directions: (r.directions ?? []).map((d) => d.trim()).filter(Boolean),
        photoUrl: clean(r.photoUrl),
        notes: clean(r.notes),
        ingredients: {
          create: (r.ingredients ?? [])
            .filter((i) => i.name?.trim())
            .map((i, idx) => ({
              name: i.name.trim(),
              quantity: clean(i.quantity),
              unit: clean(i.unit),
              aisle: clean(i.aisle),
              order: idx,
            })),
        },
      },
    });
    created.push({ id: recipe.id, name: recipe.name });
  }
  return created;
}

// --- small utilities ---
function int(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}
function clean(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s || null;
}
function ogImage(html: string): string | null {
  const m =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return m ? m[1] : null;
}
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
