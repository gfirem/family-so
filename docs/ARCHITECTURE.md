# ARCHITECTURE

## System map

```
                 ┌─────────────────────────────────────┐
                 │   LAYER: Atomic Habits               │
                 │   identity · environment · stacking ·│
                 │   2-min rule · never miss twice      │
                 └─────────────────────────────────────┘
                                  ▼ (applies to everything)
  ┌──────────────────────────────────────────────────────────────┐
  │  PARENT SYSTEM: Sunday planning (7 blocks)                     │
  │  → produces: shopping + meals + activities for the week        │
  └──────────────────────────────────────────────────────────────┘
        │            │             │            │            │
        ▼            ▼             ▼            ▼            ▼
   Day          Nutrition      Habits      Plans and    Training
   structure    (1-2-12 +      (tracker)   connection   (Freeletics)
   (+ sleep     recipe                     (outings /
   10-3-2-1-0)  bank)                      invitations)

  ┌──────────────────────────────────────────────────────────────┐
  │  FOUNDATION: 3 key pillars → sleep · train · eat               │
  │  Then expand to the 12 pillars of life                         │
  └──────────────────────────────────────────────────────────────┘
```

## Data model (draft)

> Designed so the couple shares the same data. `owner` allows individual habits/weights.

- **User** — `id`, `name` (Guille / wife), `role`.
- **Pillar** — `id`, `name` (the 12 pillars), `active`.
- **Goal** — `id`, `year`, `quarter` (`null` = yearly goal; 1–4 = quarterly), `pillarId`, `text`, `status` (`open` / `done` / `carried`), `visibility` (`private` = personal, only its owner sees it / `family` = shared), `ownerId`, `createdAt`, `closedAt`.
- **QuarterReview** — close/analysis of a period: `year`, `quarter` (`null` = annual close; 1–4 = quarterly close), `visibility`, `ownerId`, and the close fields (`wins`, `challenges`, `learnings`, `nextFocus`). One per period + scope.
- **Habit** — `id`, `ownerId`, `name`, `identityLink`, `isKeystone`, `active`, `createdAt`.
- **HabitLog** — `id`, `habitId`, `date`, `done` (bool). (Derive streak and total.)
- **DayStructure** — time blocks + sleep rules (config, not per day).
- **Week** — `id`, `weekOf` (Monday), `shoppingList[]`, `activities[]`, `notes`. Output of the planning.
- **Recipe** — `id`, `name`, `source` (1-2-12 recipe book), `approved` (bool), `protein_g`, `tags[]` (dairy-free, etc.), `prepStyle` (minimalist / batch / full).
- **MealPlan** — `weekId`, per day: `{ shake, meal1Id, meal2Id }`.
- **Event** — `id`, `date`, `type` (outing / social / fertility-appointment), `place`, `invitees[]`, `plan` (decision made cold).
- **Reminder** — `id`, `kind` (planning-friday / planning-sunday / pills / water), `schedule` (RRULE), `calendarBacked` (bool).

## Integrations
- **Google Calendar** (already connected): reminders and recurring events (Friday, Sunday, pills, water) + invitations to friends. Any action that sends/publishes requires user confirmation.
- **1-2-12 recipe book** (PDF): source to populate `Recipe` (recipe bank).
- *(Optional, future)* AI to generate/rotate the weekly meal plan on demand.

## Notes
- The Atomic Habits layer is not a module: it is cross-cutting (how each feature is designed: make the good obvious/easy, the bad invisible/hard).
- **Training** is external (Freeletics): there is no routines module; it is only tracked with the "Did you train" habit. See BACKLOG.
