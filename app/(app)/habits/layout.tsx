import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { getPartners } from "@/lib/session";
import { PersonTabs } from "./PersonTabs";
import { HabitsSubnav } from "./HabitsSubnav";

// Shared shell for every Habits view: title, person selector and sub-navigation.
// The person tabs and sub-nav read ?p= on the client, so they live in Suspense.
export default async function HabitsLayout({ children }: { children: React.ReactNode }) {
  const users = await getPartners();
  const slim = users.map((u) => ({ id: u.id, name: u.name }));

  return (
    <>
      <PageHeader
        emoji="✅"
        title="Hábitos"
        subtitle="Construimos los hábitos pilares que sostienen todo lo demás. Cada marca es un voto por quien queremos ser."
      />
      <Suspense fallback={<div className="mb-4 h-10" />}>
        <PersonTabs users={slim} />
      </Suspense>
      <Suspense fallback={<div className="mb-5 h-10" />}>
        <HabitsSubnav />
      </Suspense>
      {children}
    </>
  );
}
