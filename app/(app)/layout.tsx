import { Sidebar, MobileTopBar, BottomBar } from "@/components/Nav";
import { requireUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="flex min-h-dvh">
      <Sidebar userName={user.name} />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <MobileTopBar userName={user.name} />
        <main className="mx-auto w-full max-w-3xl p-4 md:p-8">{children}</main>
      </div>
      <BottomBar />
    </div>
  );
}
