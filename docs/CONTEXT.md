# CONTEXT — Project handoff

> Context document to pick the project back up in a new session or with a coding agent. It summarizes who the users are, the goals, the decisions made and the technical limits. If you are an agent: read this in full before proposing code.

## 1. Users
- **Guille (Guillermo)** and his **wife**. A couple, no children yet (preparing for fertility/IVF).
- Both work **100% remotely from home**, with flexible hours (they can work from anywhere).
- They have dogs. They have gym equipment at home (treadmill, dumbbells, multi-gym) and a club membership starting at the end of July (cold/contrast/sauna).

## 2. Root problem
Shut in all week working from home. Without a plan of their own, on the weekend they join their friends' plan → beer, tobacco, cigarettes, sweets. **It's not a lack of willpower; it's a lack of their own plans and structure.** The solution is to fill the gap with their own plans and to design the environment.

## 3. Goals
- **3 months:** G 87→83 kg, wife 75→70 kg; arrive physically and mentally ready for IVF.
- **Big picture:** improve family quality of life with systems, across the **12 pillars of life**.
- **Sequence:** first nail the 3-4 key habits (sleep, train, eat); only then expand to the 12 pillars. Not the other way around.

## 4. Key pillars (keystone habits)
1. **Sleep** (the base of the base; impacts hormones and fertility).
2. **Train.**
3. **Eat** well.

## 5. Designed systems
- **Parent system — Sunday planning (15 min, together), 7 blocks:** look back → recall the north star → training → nutrition → plans and connection → anticipate social bumps → clear tasks. Produces: shopping list, meals and activities for the week.
- **Day structure:** morning chain + schedule. Includes **10-3-2-1-0** sleep rules (10h no caffeine / 3h no food or alcohol / 2h no work / 1h no screens / 0 times hitting snooze).
- **Habits (tracker):** "don't break the chain" style, with an identity anchor and the **never miss twice in a row** rule. New habits can be added and progress marked.
- **Nutrition — 1-2-12 system:** 1 protein shake (first) + 2 real meals (≥30 g protein each) + 8 AM–6 PM window. **Weekly** plan filled from a **recipe bank** the couple approves over time. Generates the shopping list.
- **Training: external, in Freeletics.** No routines module is built in family-so; the app only records that a workout happened via the key habit "Did you train".
- **Plans and connection:** Wednesday out (remote work from a park/river), cheap weekend outings (parks, rivers). A plan bank so the weekend is never blank.

## 6. Cross-cutting layer — Atomic Habits
- **Identity before goal:** "we are people who sleep well, train and eat to be strong — ready to be parents."
- **Environment design > willpower:** no beer/sweets at home; workout clothes ready the night before.
- **Habit stacking:** hang new habits off existing anchors.
- **2-minute rule** and **never miss twice in a row.**

## 7. Health (read HEALTH-AND-CONSTRAINTS.md)
- **Guille:** hypertension (controlled when he trains) + **fatty liver**.
- **Wife:** **prediabetic**.
- 1-2-12 is the safe nutritional baseline (dietitian-backed). The **salt water from the Unani protocol** and the **"cleanses"/fasts from the Fat Burning Factor** must be cleared with a doctor/nutritionist before being implemented. **This is NOT medical advice.**

## 8. Current vision
A **family operating system app**: a single place where the two of them log in, capture plans, define what they will do, monitor progress and get reminders.

## 9. Technical limits (important so we don't overpromise)
- A **web app** can: store persistent data, be multi-user if deployed, show dashboards, keep plans/habits/goals.
- A web app **cannot** ring an alarm on the phone when it's closed. **Reminders** (Friday alarm, Sunday planning event, pills, water) are handled with **Google Calendar** (already connected) as recurring events. **Invitations to friends** go out via Calendar/email, with user confirmation each time.
- A native app on both phones with their own accounts = a separate deployment project.

## 10. Assets / sources
- **Fat Burning Factor** (PDF): useful for its motivational and structural framework ("small steps", habits). It has pseudoscientific content (cleanses/toxins/microwave/etc.) that is ignored.
- **1-2-12** (Life Time, dietitian Samantha McKinney, RD) + **recipe book** (PDF, 70+ high-protein, gluten-free recipes). Nutritional baseline.
- **Unani** (academiaunani.com): a course Guille is taking; protocols to validate with a doctor.
- **reference/**: current plans (day, week, habits, meals) already improved.

## 11. Status / next steps
- Pending: read the recipe book PDF and load the recipe bank.
- Training: handled outside the app (Freeletics); family-so only tracks it with the "Did you train" habit.
- Proposed v1: Sunday planning + meals/recipe bank + habits tracker + quarterly goals + day structure. See ROADMAP.md.
