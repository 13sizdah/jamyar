import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageAccounting } from "@/lib/permissions";
import { scopedBranchIds } from "@/lib/scope";
import { JournalForm } from "@/components/journal-form";
import { BackLink, PageHeader } from "@/components/ui";

export default async function NewJournalPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canManageAccounting(user)) redirect("/accounting/journals");
  const ids = await scopedBranchIds(user);
  const [branches, accounts] = await Promise.all([
    prisma.branch.findMany({ where: { id: { in: ids } } }),
    prisma.account.findMany({ where: { organizationId: user.organizationId }, orderBy: { code: "asc" } }),
  ]);
  return (
    <div className="p-4 max-w-3xl">
      <BackLink href="/accounting/journals" label="اسناد" />
      <PageHeader title="سند دستی" subtitle="MANUAL JE" />
      <JournalForm branches={branches} accounts={accounts} />
    </div>
  );
}
