# ARCHITECTURE

## Mapa del sistema

```
                 ┌─────────────────────────────────────┐
                 │   CAPA: Hábitos Atómicos             │
                 │   identidad · entorno · stacking ·   │
                 │   regla 2 min · nunca fallar 2 veces │
                 └─────────────────────────────────────┘
                                  ▼ (aplica a todo)
  ┌──────────────────────────────────────────────────────────────┐
  │  SISTEMA MADRE: Planning del domingo (7 bloques)               │
  │  → produce: compras + comidas + actividades de la semana       │
  └──────────────────────────────────────────────────────────────┘
        │            │             │            │            │
        ▼            ▼             ▼            ▼            ▼
   Estructura   Alimentación   Hábitos     Planes y     Entrenamiento
   del día      (1-2-12 +      (tracker)   conexión     (POR CONSTRUIR)
   (+ sueño     banco de                   (salidas /
   10-3-2-1-0)  recetas)                   invitaciones)

  ┌──────────────────────────────────────────────────────────────┐
  │  FUNDAMENTO: 3 pilares clave → dormir · entrenar · comer       │
  │  Luego expandir a los 12 pilares de la vida                    │
  └──────────────────────────────────────────────────────────────┘
```

## Modelo de datos (borrador)

> Pensado para que la pareja comparta los mismos datos. `owner` permite hábitos/pesos individuales.

- **User** — `id`, `name` (Guille / esposa), `role`.
- **Pillar** — `id`, `name` (los 12 pilares), `active`.
- **Goal** — `id`, `year`, `quarter` (`null` = meta del año; 1–4 = trimestral), `pillarId`, `text`, `status` (`open` / `done` / `carried`), `visibility` (`private` = personal, solo la ve su dueño / `family` = compartida), `ownerId`, `createdAt`, `closedAt`.
- **QuarterReview** — cierre/análisis de un período: `year`, `quarter` (`null` = cierre anual; 1–4 = cierre trimestral), `visibility`, `ownerId`, y los campos del cierre (`wins`, `challenges`, `learnings`, `nextFocus`). Uno por período + alcance.
- **Habit** — `id`, `ownerId`, `name`, `identityLink`, `isKeystone`, `active`, `createdAt`.
- **HabitLog** — `id`, `habitId`, `date`, `done` (bool). (Derivar racha y total.)
- **DayStructure** — bloques horarios + reglas de sueño (config, no por día).
- **Week** — `id`, `weekOf` (lunes), `shoppingList[]`, `activities[]`, `notes`. Resultado del planning.
- **Recipe** — `id`, `name`, `source` (recetario 1-2-12), `approved` (bool), `protein_g`, `tags[]` (sin-lácteos, etc.), `prepStyle` (minimalist / batch / full).
- **MealPlan** — `weekId`, por día: `{ shake, meal1Id, meal2Id }`.
- **Event** — `id`, `date`, `type` (salida / social / cita-fertilidad), `place`, `invitees[]`, `plan` (decisión tomada en frío).
- **Reminder** — `id`, `kind` (planning-viernes / planning-domingo / pastillas / agua), `schedule` (RRULE), `calendarBacked` (bool).

## Integraciones
- **Google Calendar** (ya conectado): recordatorios y eventos recurrentes (viernes, domingo, pastillas, agua) + invitaciones a amigos. Toda acción que envíe/publique requiere confirmación del usuario.
- **Recetario 1-2-12** (PDF): fuente para poblar `Recipe` (banco de recetas).
- *(Opcional futuro)* IA para generar/rotar el plan de comidas semanal a pedido.

## Notas
- La capa de Hábitos Atómicos no es un módulo: es transversal (cómo se diseña cada feature: hacer lo bueno obvio/fácil, lo malo invisible/difícil).
- El módulo de **entrenamiento** está vacío a propósito — ver BACKLOG.
