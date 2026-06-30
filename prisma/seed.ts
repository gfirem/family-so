import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Simple .env loader to run the seed without extra dependencies.
import fs from "node:fs";
import path from "node:path";
if (!process.env.DATABASE_URL) {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// The 12 pillars of life (CONTEXT.md: expand to these after the 3 key ones).
const PILLARS = [
  "Salud física",
  "Salud mental y emocional",
  "Pareja",
  "Familia",
  "Amistades y vida social",
  "Finanzas",
  "Carrera y trabajo",
  "Crecimiento personal",
  "Espiritualidad",
  "Recreación y ocio",
  "Entorno y hogar",
  "Contribución y comunidad",
];

// Habits from reference/plan-de-habitos.md. The 4 keystone ones are flagged.
const HABITS: { name: string; keystone?: boolean; identity?: string }[] = [
  {
    name: "Dormiste 7.5 h / cumpliste 10-3-2-1-0",
    keystone: true,
    identity: "Somos personas que duermen bien para estar fuertes.",
  },
  {
    name: "Entrenaste",
    keystone: true,
    identity: "Somos personas que entrenan, listas para ser papás.",
  },
  {
    name: "Licuado + 2 comidas (1-2-12)",
    keystone: true,
    identity: "Comemos para estar fuertes, no por ansiedad.",
  },
  {
    name: "Ventana de comida cerrada a las 6 PM",
    keystone: true,
    identity: "Respetamos la ventana 8 AM–6 PM.",
  },
  { name: "Evitaste el azúcar" },
  { name: "No tomaste alcohol" },
  { name: "Te tomaste tus pastillas" },
  { name: "Evitaste comida chatarra" },
  { name: "Estudiaste" },
  { name: "Botaste la basura" },
  { name: "Aspiraste la casa" },
  { name: "Paseaste los perros" },
  { name: "Cantaste hoy" },
  { name: "Hablaste con la familia" },
];

// Day structure from reference/plan-del-dia.md.
const DAY_BLOCKS = [
  {
    time: "5:00–6:00 AM",
    label: "Cadena de la mañana",
    items: [
      "Café",
      "Tender la cama",
      "Regar plantas",
      "Aseo",
      "Pasear perros",
      "Entrenar",
      "Baño",
      "Desayuno",
    ],
  },
  { time: "8:00–8:30 AM", label: "Empezar a trabajar", items: [] },
  { time: "1:00 PM", label: "Volver al trabajo", items: [] },
  {
    time: "5:00 PM",
    label: "Terminar de trabajar",
    items: ["Botar basura", "Aspirar", "Recoger casa", "Pasear perros"],
  },
  { time: "7:00 PM", label: "Relax · Estudio · Social", items: [] },
  { time: "9–10 PM", label: "Dormir", items: [] },
];

const SLEEP_RULES = [
  { n: "10", rule: "horas antes: no más cafeína" },
  { n: "3", rule: "horas antes: no más comida ni alcohol" },
  { n: "2", rule: "horas antes: no más trabajo" },
  { n: "1", rule: "hora antes: no más pantallas" },
  { n: "0", rule: "veces que repetís la alarma por la mañana" },
];

// Plan bank (reference: Wednesday out, cheap outings).
const PLAN_IDEAS = [
  { title: "Trabajar desde un parque o río (miércoles afuera)", category: "conexion", cost: "gratis" },
  { title: "Caminata + mate en el río el fin de semana", category: "rio", cost: "gratis" },
  { title: "Picnic en el parque con los perros", category: "parque", cost: "barato" },
  { title: "Sendero/hiking corto cerca de casa", category: "salida", cost: "gratis" },
  { title: "Día de club: frío/contraste/sauna (desde fin de julio)", category: "salida", cost: "membresía" },
];

// "No" script: replies decided in advance (cold), Sunday block 6.
const NO_SCRIPTS = [
  { trigger: "Te ofrecen una cerveza", reply: "Hoy no tomo, estoy en un plan. Pedime un agua con gas y limón." },
  { trigger: "Insisten con el postre / dulce", reply: "Gracias, ya cerré mi ventana de comida. Disfrútenlo ustedes." },
  { trigger: "Te invitan a quedarte hasta tarde", reply: "Nos vamos a las 9, mañana entrenamos temprano." },
  { trigger: "Surge un plan sin avisar el finde", reply: "Ya tenemos nuestro plan para hoy; la próxima coordinamos antes." },
];

// Starter 1-2-12 recipes. The full recipe book (PDF) is loaded later;
// these are approved as seed data so the weekly plan works right away.
const RECIPES = [
  {
    name: "Licuado de proteína base (vainilla)",
    isShake: true,
    category: "Licuados",
    proteinG: 30,
    calories: 250,
    prepMinutes: 5,
    cookMinutes: 0,
    servings: 1,
    tags: ["licuado"],
    prepStyle: "minimalist",
    approved: true,
    notes: "Proteína + leche/agua + hielo. Reemplaza la merienda dulce.",
    directions: ["Licuar todo y servir."],
    ingredients: {
      create: [
        { name: "proteína vainilla", quantity: "1", unit: "scoop", aisle: "almacen", order: 0 },
        { name: "leche o agua", quantity: "250", unit: "ml", aisle: "lacteos", order: 1 },
        { name: "hielo", quantity: "1", unit: "puñado", aisle: "almacen", order: 2 },
      ],
    },
  },
  {
    name: "Licuado verde sin lácteos",
    isShake: true,
    category: "Licuados",
    proteinG: 28,
    calories: 240,
    prepMinutes: 5,
    cookMinutes: 0,
    servings: 1,
    tags: ["licuado", "sin-lacteos"],
    prepStyle: "minimalist",
    approved: true,
    notes: "Proteína vegetal + espinaca + banana + bebida de almendras.",
    directions: ["Licuar todo y servir."],
    ingredients: {
      create: [
        { name: "proteína vegetal", quantity: "1", unit: "scoop", aisle: "almacen", order: 0 },
        { name: "espinaca", quantity: "1", unit: "puñado", aisle: "frutas-y-verduras", order: 1 },
        { name: "banana", quantity: "1", unit: null, aisle: "frutas-y-verduras", order: 2 },
        { name: "bebida de almendras", quantity: "250", unit: "ml", aisle: "almacen", order: 3 },
      ],
    },
  },
  {
    name: "Pollo al horno con verduras asadas",
    category: "Almuerzo",
    proteinG: 40,
    calories: 520,
    prepMinutes: 15,
    cookMinutes: 40,
    servings: 2,
    tags: ["sin-lacteos"],
    prepStyle: "batch",
    approved: true,
    ingredients: {
      create: [
        { name: "pechuga de pollo", quantity: "500", unit: "g", aisle: "carniceria", order: 0 },
        { name: "calabaza", quantity: "1", unit: null, aisle: "frutas-y-verduras", order: 1 },
        { name: "brócoli", quantity: "1", unit: null, aisle: "frutas-y-verduras", order: 2 },
        { name: "aceite de oliva", quantity: "2", unit: "tbs", aisle: "almacen", order: 3 },
      ],
    },
  },
  {
    name: "Salmón con ensalada grande",
    category: "Cena",
    proteinG: 34,
    calories: 480,
    prepMinutes: 10,
    cookMinutes: 15,
    servings: 2,
    tags: ["sin-lacteos"],
    prepStyle: "full",
    approved: true,
    ingredients: {
      create: [
        { name: "salmón", quantity: "400", unit: "g", aisle: "pescaderia", order: 0 },
        { name: "mix de hojas verdes", quantity: "1", unit: "bolsa", aisle: "frutas-y-verduras", order: 1 },
        { name: "tomate", quantity: "2", unit: null, aisle: "frutas-y-verduras", order: 2 },
        { name: "palta", quantity: "1", unit: null, aisle: "frutas-y-verduras", order: 3 },
      ],
    },
  },
  {
    name: "Bowl de carne magra, arroz y palta",
    category: "Almuerzo",
    proteinG: 38,
    calories: 600,
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 2,
    tags: [],
    prepStyle: "full",
    approved: true,
    ingredients: {
      create: [
        { name: "carne magra", quantity: "400", unit: "g", aisle: "carniceria", order: 0 },
        { name: "arroz", quantity: "1", unit: "taza", aisle: "almacen", order: 1 },
        { name: "palta", quantity: "1", unit: null, aisle: "frutas-y-verduras", order: 2 },
      ],
    },
  },
  {
    name: "Tortilla de huevos con verduras",
    category: "Desayuno",
    proteinG: 30,
    calories: 380,
    prepMinutes: 5,
    cookMinutes: 10,
    servings: 1,
    tags: [],
    prepStyle: "minimalist",
    approved: true,
    ingredients: {
      create: [
        { name: "huevos", quantity: "4", unit: null, aisle: "lacteos", order: 0 },
        { name: "cebolla", quantity: "1", unit: null, aisle: "frutas-y-verduras", order: 1 },
        { name: "morrón", quantity: "1", unit: null, aisle: "frutas-y-verduras", order: 2 },
      ],
    },
  },
  {
    name: "Lentejas con atún y huevo duro",
    category: "Cena",
    proteinG: 32,
    calories: 450,
    prepMinutes: 10,
    cookMinutes: 5,
    servings: 2,
    tags: ["sin-lacteos"],
    prepStyle: "batch",
    approved: true,
    ingredients: {
      create: [
        { name: "lentejas cocidas", quantity: "2", unit: "tazas", aisle: "almacen", order: 0 },
        { name: "atún al natural", quantity: "2", unit: "latas", aisle: "almacen", order: 1 },
        { name: "huevos", quantity: "2", unit: null, aisle: "lacteos", order: 2 },
      ],
    },
  },
];

async function main() {
  // --- Users. Sign-in is via Google Workspace; emails must match their Google
  // accounts so the Google identity links to the right person. Set GUILLE_EMAIL
  // and CHINA_EMAIL in the environment; defaults are placeholders. ---
  const guilleEmail = (process.env.GUILLE_EMAIL ?? "guille@family.so").toLowerCase();
  const chinaEmail = (process.env.CHINA_EMAIL ?? "china@family.so").toLowerCase();
  await db.user.upsert({
    where: { email: guilleEmail },
    update: { name: "Guille" },
    create: { name: "Guille", email: guilleEmail, role: "owner" },
  });
  await db.user.upsert({
    where: { email: chinaEmail },
    update: { name: "China" },
    create: { name: "China", email: chinaEmail, role: "owner" },
  });
  const users = await db.user.findMany();

  // --- Pillars ---
  for (let i = 0; i < PILLARS.length; i++) {
    await db.pillar.upsert({
      where: { name: PILLARS[i] },
      update: { order: i },
      create: { name: PILLARS[i], order: i },
    });
  }

  // --- Habits per person (the same for both as a baseline) ---
  for (const user of users) {
    const existing = await db.habit.count({ where: { ownerId: user.id } });
    if (existing === 0) {
      for (let i = 0; i < HABITS.length; i++) {
        const h = HABITS[i];
        await db.habit.create({
          data: {
            ownerId: user.id,
            name: h.name,
            isKeystone: !!h.keystone,
            identityLink: h.identity ?? null,
            order: i,
          },
        });
      }
    }
  }

  // --- Day structure (singleton) ---
  const dayCount = await db.dayStructure.count();
  if (dayCount === 0) {
    await db.dayStructure.create({
      data: { blocks: DAY_BLOCKS, sleepRules: SLEEP_RULES },
    });
  }

  // --- Plan bank ---
  if ((await db.planIdea.count()) === 0) {
    for (const p of PLAN_IDEAS) await db.planIdea.create({ data: p });
  }

  // --- "No" script ---
  if ((await db.noScript.count()) === 0) {
    for (let i = 0; i < NO_SCRIPTS.length; i++) {
      await db.noScript.create({ data: { ...NO_SCRIPTS[i], order: i } });
    }
  }

  // --- Seed recipes ---
  if ((await db.recipe.count()) === 0) {
    for (const r of RECIPES) await db.recipe.create({ data: r });
  }

  console.log("Seed complete:", {
    users: users.length,
    pillars: PILLARS.length,
    habits: HABITS.length,
    recipes: RECIPES.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
