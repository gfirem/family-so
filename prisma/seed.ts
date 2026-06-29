import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

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
  { name: "Licuado de proteína base (vainilla)", isShake: true, proteinG: 30, tags: ["licuado"], prepStyle: "minimalist", approved: true, notes: "Proteína + leche/agua + hielo. Reemplaza la merienda dulce." },
  { name: "Licuado verde sin lácteos", isShake: true, proteinG: 28, tags: ["licuado", "sin-lacteos"], prepStyle: "minimalist", approved: true, notes: "Proteína vegetal + espinaca + banana + bebida de almendras." },
  { name: "Pollo al horno con verduras asadas", proteinG: 40, tags: ["sin-lacteos"], prepStyle: "batch", approved: true },
  { name: "Salmón con ensalada grande", proteinG: 34, tags: ["sin-lacteos"], prepStyle: "full", approved: true },
  { name: "Bowl de carne magra, arroz y palta", proteinG: 38, tags: [], prepStyle: "full", approved: true },
  { name: "Tortilla de huevos con verduras", proteinG: 30, tags: [], prepStyle: "minimalist", approved: true },
  { name: "Lentejas con atún y huevo duro", proteinG: 32, tags: ["sin-lacteos"], prepStyle: "batch", approved: true },
];

async function main() {
  // --- Users (real login). Change the passwords after the first sign-in. ---
  const defaultPass = await bcrypt.hash("familia2026", 10);
  await db.user.upsert({
    where: { email: "guille@family.so" },
    update: {},
    create: { name: "Guille", email: "guille@family.so", passwordHash: defaultPass, role: "owner" },
  });
  await db.user.upsert({
    where: { email: "china@family.so" },
    update: {},
    create: { name: "China", email: "china@family.so", passwordHash: defaultPass, role: "owner" },
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
