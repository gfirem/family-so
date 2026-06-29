import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Carga simple de .env para correr el seed sin dependencias extra.
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

// Los 12 pilares de la vida (CONTEXT.md: expandir a estos después de los 3 clave).
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

// Hábitos de reference/plan-de-habitos.md. Las 4 keystone van marcadas.
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

// Estructura del día de reference/plan-del-dia.md.
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

// Banco de planes (reference: miércoles afuera, salidas baratas).
const PLAN_IDEAS = [
  { title: "Trabajar desde un parque o río (miércoles afuera)", category: "conexion", cost: "gratis" },
  { title: "Caminata + mate en el río el fin de semana", category: "rio", cost: "gratis" },
  { title: "Picnic en el parque con los perros", category: "parque", cost: "barato" },
  { title: "Sendero/hiking corto cerca de casa", category: "salida", cost: "gratis" },
  { title: "Día de club: frío/contraste/sauna (desde fin de julio)", category: "salida", cost: "membresía" },
];

// Guion del "no": respuestas decididas en frío (bloque 6 del domingo).
const NO_SCRIPTS = [
  { trigger: "Te ofrecen una cerveza", reply: "Hoy no tomo, estoy en un plan. Pedime un agua con gas y limón." },
  { trigger: "Insisten con el postre / dulce", reply: "Gracias, ya cerré mi ventana de comida. Disfrútenlo ustedes." },
  { trigger: "Te invitan a quedarte hasta tarde", reply: "Nos vamos a las 9, mañana entrenamos temprano." },
  { trigger: "Surge un plan sin avisar el finde", reply: "Ya tenemos nuestro plan para hoy; la próxima coordinamos antes." },
];

// Recetas 1-2-12 de arranque. El recetario completo (PDF) se carga después;
// estas quedan aprobadas como semilla para que el plan semanal funcione ya.
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
  // --- Usuarios (login real). Cambiá las contraseñas tras el primer ingreso. ---
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

  // --- Pilares ---
  for (let i = 0; i < PILLARS.length; i++) {
    await db.pillar.upsert({
      where: { name: PILLARS[i] },
      update: { order: i },
      create: { name: PILLARS[i], order: i },
    });
  }

  // --- Hábitos por persona (los mismos para ambos como base) ---
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

  // --- Estructura del día (singleton) ---
  const dayCount = await db.dayStructure.count();
  if (dayCount === 0) {
    await db.dayStructure.create({
      data: { blocks: DAY_BLOCKS, sleepRules: SLEEP_RULES },
    });
  }

  // --- Banco de planes ---
  if ((await db.planIdea.count()) === 0) {
    for (const p of PLAN_IDEAS) await db.planIdea.create({ data: p });
  }

  // --- Guion del "no" ---
  if ((await db.noScript.count()) === 0) {
    for (let i = 0; i < NO_SCRIPTS.length; i++) {
      await db.noScript.create({ data: { ...NO_SCRIPTS[i], order: i } });
    }
  }

  // --- Recetas semilla ---
  if ((await db.recipe.count()) === 0) {
    for (const r of RECIPES) await db.recipe.create({ data: r });
  }

  console.log("Seed completo:", {
    usuarios: users.length,
    pilares: PILLARS.length,
    habitos: HABITS.length,
    recetas: RECIPES.length,
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
