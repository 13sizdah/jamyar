import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { money } from "@/lib/format";
import { profitAndLoss } from "@/lib/accounting";
import { canViewAccounting } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";

export default async function PnlPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canViewAccounting(user)) redirect("/");
  const pnl = await profitAndLoss(
    user.organizationId,
    user.role === "BRANCH_MANAGER" ? (user.branchId ?? undefined) : undefined,
  );

  return (
    <div className="p-4">
      <PageHeader title="سود و زیان" subtitle="P&L" />
      <div className="grid gap-3 md:grid-cols-3 mb-3">
        <div className="tech-card p-4 rounded-md h-24 flex flex-col justify-between">
          <span className="mono-label text-text-secondary">Revenue</span>
          <span className="text-2xl font-mono font-bold">{money(pnl.revenue)}</span>
        </div>
        <div className="tech-card p-4 rounded-md h-24 flex flex-col justify-between">
          <span className="mono-label text-text-secondary">Expense</span>
          <span className="text-2xl font-mono font-bold">{money(pnl.expense)}</span>
        </div>
        <div className="tech-card p-4 rounded-md h-24 flex flex-col justify-between hover:border-white">
          <span className="mono-label text-text-secondary">Net</span>
          <span className={`text-2xl font-mono font-bold ${pnl.net >= 0 ? "text-green-400" : "text-orange-400"}`}>
            {money(pnl.net)}
          </span>
        </div>
      </div>
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>کد</th>
              <th>حساب</th>
              <th>مانده</th>
            </tr>
          </thead>
          <tbody>
            {pnl.rows.map((r) => (
              <tr key={r.code}>
                <td className="font-mono text-xs text-blue-400">{r.code}</td>
                <td>{r.name}</td>
                <td className="font-mono">
                  {money(r.type === "REVENUE" ? r.credit - r.debit : r.debit - r.credit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
