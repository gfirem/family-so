# family-so — Sistema Operativo Familiar

Un solo lugar para que Guille y su esposa **planifiquen, decidan, ejecuten y midan** la vida en familia: comidas, hábitos, entrenamiento, metas y salidas, construido sobre tres pilares clave (dormir, entrenar, comer) y la metodología de Hábitos Atómicos.

## Por qué existe
Trabajan los dos en remoto desde casa. Sin un plan propio, la semana se va encerrados y el fin de semana se suman al plan del que aparezca (cerveza, tabaco, dulce). Este sistema llena ese vacío: si tenemos nuestro propio plan, no hay nada que resistir.

## Norte (3 meses)
- G: 87 → 83 kg · Esposa: 75 → 70 kg
- Llegar física y mentalmente listos para el proceso de fertilidad (FIV)
- Reconstruir los hábitos buenos y, desde ahí, expandir a los 12 pilares de la vida

## Documentación
- [`docs/CONTEXT.md`](docs/CONTEXT.md) — **empezá por acá.** Contexto completo para retomar el proyecto (humano o agente de código).
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — módulos, capa de hábitos y modelo de datos.
- [`docs/BACKLOG.md`](docs/BACKLOG.md) — funcionalidades por módulo (v1/v2/v3).
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — fases de construcción.
- [`docs/HEALTH-AND-CONSTRAINTS.md`](docs/HEALTH-AND-CONSTRAINTS.md) — notas de salud y límites del producto.
- [`reference/`](reference/) — los planes actuales (día, semana, hábitos, comida) ya mejorados, como contenido semilla.

## Stack (v1)
- **Next.js (App Router) + TypeScript**, **Tailwind CSS v4** — interfaz en español, mobile-first.
- **Prisma 7** (Rust-free) + **PostgreSQL** vía driver adapter — pensado para **Neon** en producción.
- **Auth.js v5** — login con **Google Workspace** (Google-only), con scopes de **Google Calendar**.
- **Anthropic SDK** (`claude-opus-4-8`) — chat asistente que lee tus datos reales.
- **Servidor MCP** (`/api/mcp`) — expone los datos de family-so como herramientas para Claude.

## Cómo correr en local
1. `npm install`
2. Copiá `.env.example` a `.env` y completá (ver `.env.example` para el detalle):
   - `DATABASE_URL` (Postgres local o Neon)
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (OAuth de Google, con la Calendar API habilitada)
   - `ALLOWED_EMAILS` / `GUILLE_EMAIL` / `CHINA_EMAIL` (las cuentas de Workspace autorizadas)
   - `APP_TIMEZONE` (zona horaria para los eventos del Calendar)
   - `ANTHROPIC_API_KEY` (opcional; sin esto el chat queda deshabilitado)
   - `MCP_TOKEN` (opcional; protege el endpoint MCP)
3. `npm run db:push` — crea las tablas del esquema.
4. `npm run db:seed` — siembra las dos personas (por email de Workspace), pilares, hábitos, recetas y planes desde `reference/`.
5. `npm run dev` — la app queda en http://localhost:3000

> El ingreso es **solo con Google Workspace**: entrás con tu cuenta autorizada (`ALLOWED_EMAILS`). El seed liga cada persona a su email para que hábitos y peso sean individuales.

### Configurar Google OAuth (una vez)
1. En Google Cloud → APIs & Services: creá un **OAuth 2.0 Client ID** (tipo *Web application*) y habilitá la **Google Calendar API**.
2. Redirect URIs: `http://localhost:3000/api/auth/callback/google` y `https://<dominio-vercel>/api/auth/callback/google`.
3. Pegá `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env` (local) y en Vercel.

## Despliegue (Vercel + Neon)
- Conectá el repo a Vercel y creá una base en Neon.
- Cargá las variables (`DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_EMAILS`, `GUILLE_EMAIL`, `CHINA_EMAIL`, `APP_TIMEZONE`, `ANTHROPIC_API_KEY`, `MCP_TOKEN`) en Vercel.
- En el primer deploy corré `npm run db:push && npm run db:seed` contra Neon.

## Mapa de módulos
- **Tablero** (`/`) — peso, % de hábitos, "qué nos descarriló".
- **Planning del domingo** (`/planning`) — flujo de 7 bloques (columna vertebral).
- **Alimentación 1-2-12** (`/nutrition`) — banco de recetas + plan semanal + lista del mercado.
- **Hábitos** (`/habits`) — tracker por persona, racha, "nunca fallar dos veces", peso.
- **Metas** (`/goals`) — trimestrales por pilar.
- **El día** (`/day`) — estructura + sueño 10-3-2-1-0.
- **Planes** (`/plans`) — banco de planes + guion del "no".
- **Asistente** (`/chat`) — chat con Claude sobre tus datos.

> Pendientes conocidos (v1+): cargar el recetario 1-2-12 completo (PDF) y construir el módulo de entrenamiento (casa + club). Recordatorios reales vía Google Calendar quedan para v2.
