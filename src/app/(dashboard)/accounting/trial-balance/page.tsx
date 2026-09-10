import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money } from "@/lib/format";
import { trialBalance } from "@/lib/accounting";
import { canViewAccounting } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { parseReportRange, ReportFilters } from "@/components/report-filters";

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; branchId?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canViewAccounting(user)) redirect("/");
  const sp = await searchParams;
  const range = parseReportRange(sp);
  const showBranch = user.role !== "BRANCH_MANAGER";
  const branchId = showBranch ? (sp.branchId || undefined) : (user.branchId ?? undefined);
  const branches = showBranch
    ? await prisma.branch.findMany({
        where: { organizationId: user.organizationId, active: true },
        orderBy: { name: "asc" },
      })
    : [];
  const rows = await trialBalance(user.organizationId, branchId, range);
  const debit = rows.reduce((s, r) => s + r.debit, 0);
  const credit = rows.reduce((s, r) => s + r.credit, 0);

  return (
    <div className="p-4">
      <PageHeader title="تراز آزمایشی" subtitle="مانده حساب‌ها" />
      <ReportFilters
        from={sp.from}
        to={sp.to}
        branchId={branchId}
        branches={branches}
        showBranch={showBranch}
      />
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>کد</th>
              <th>حساب</th>
              <th>نوع</th>
              <th>بدهکار</th>
              <th>بستانکار</th>
              <th>مانده</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code}>
                <td className="font-mono text-xs text-blue-400">{r.code}</td>
                <td>{r.name}</td>
                <td className="text-xs text-text-secondary">{accountTypeLabel(r.type)}</td>
                <td className="font-mono">{money(r.debit)}</td>
                <td className="font-mono">{money(r.credit)}</td>
                <td className="font-mono">{money(r.debit - r.credit)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3}>جمع</td>
              <td className="font-mono">{money(debit)}</td>
              <td className="font-mono">{money(credit)}</td>
              <td className="font-mono">{money(debit - credit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function accountTypeLabel(type: string) {
  const map: Record<string, string> = {
    ASSET: "دارایی",
    LIABILITY: "بدهی",
    EQUITY: "حقوق مالکانه",
    REVENUE: "درآمد",
    EXPENSE: "هزینه",
  };
  return map[type] ?? type;
}
