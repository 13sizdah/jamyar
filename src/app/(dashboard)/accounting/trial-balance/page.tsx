import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { money } from "@/lib/format";
import { trialBalance } from "@/lib/accounting";
import { canViewAccounting } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";

export default async function TrialBalancePage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canViewAccounting(user)) redirect("/");
  const rows = await trialBalance(
    user.organizationId,
    user.role === "BRANCH_MANAGER" ? (user.branchId ?? undefined) : undefined,
  );
  const debit = rows.reduce((s, r) => s + r.debit, 0);
  const credit = rows.reduce((s, r) => s + r.credit, 0);

  return (
    <div className="p-4">
      <PageHeader title="تراز آزمایشی" subtitle="TRIAL BALANCE" />
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
                <td className="font-mono text-xs text-text-secondary">{r.type}</td>
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
