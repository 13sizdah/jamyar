import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money, toJalali } from "@/lib/format";
import { canManageAccounting } from "@/lib/permissions";
import { scopedBranchIds } from "@/lib/scope";
import { createPayrollAction } from "@/app/actions/accounting";
import { PageHeader } from "@/components/ui";

export default async function PayrollPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canManageAccounting(user) && user.role !== "BRANCH_MANAGER") redirect("/");
  const ids = await scopedBranchIds(user);
  const [entries, people, branches] = await Promise.all([
    prisma.payrollEntry.findMany({
      where: { branchId: { in: ids } },
      include: { user: true, branch: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId, active: true, role: { not: "OWNER" } },
    }),
    prisma.branch.findMany({ where: { id: { in: ids } } }),
  ]);

  return (
    <div className="p-4">
      <PageHeader title="حقوق" subtitle="حقوق پرسنل" />
      {canManageAccounting(user) ? (
        <form action={createPayrollAction} className="tech-card mb-3 grid gap-3 p-3 rounded-md md:grid-cols-6">
          <div>
            <label>شعبه</label>
            <select name="branchId" required>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>پرسنل</label>
            <select name="userId" required>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>دوره</label>
            <input name="period" placeholder="1404-06" required className="font-mono" />
          </div>
          <div>
            <label>مبلغ</label>
            <input name="amount" type="number" required className="font-mono" />
          </div>
          <label className="flex items-end gap-2 text-sm pb-2">
            <input className="w-auto" type="checkbox" name="paid" />
            پرداخت از صندوق
          </label>
          <div className="flex items-end">
            <button className="btn w-full" type="submit">
              ثبت
            </button>
          </div>
        </form>
      ) : null}
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>دوره</th>
              <th>کارمند</th>
              <th>شعبه</th>
              <th>مبلغ</th>
              <th>پرداخت</th>
              <th>تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="font-mono text-xs">{e.period}</td>
                <td>{e.user.name}</td>
                <td>{e.branch.name}</td>
                <td className="font-mono">{money(e.amount)}</td>
                <td className={e.paid ? "text-green-400 font-mono text-xs" : "text-orange-400 font-mono text-xs"}>
                  {e.paid ? "PAID" : "ACCRUED"}
                </td>
                <td className="font-mono text-xs text-text-secondary">{toJalali(e.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
