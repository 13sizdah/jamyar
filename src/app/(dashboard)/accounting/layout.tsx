import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canViewAccounting } from "@/lib/permissions";

export default async function AccountingLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canViewAccounting(user)) redirect("/");
  return children;
}
