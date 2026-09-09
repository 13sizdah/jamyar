import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LayoutShell } from "@/components/LayoutShell";
import { navFor, roleLabel } from "@/lib/permissions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  return (
    <LayoutShell items={navFor(user)} userName={user.name} roleLabel={roleLabel[user.role]}>
      {children}
    </LayoutShell>
  );
}
