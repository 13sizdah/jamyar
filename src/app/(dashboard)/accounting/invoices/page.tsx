import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { invoiceStatusLabel, invoiceTypeLabel, money, toJalali } from "@/lib/format";
import { canManageInvoices } from "@/lib/permissions";
import { scopedBranchIds } from "@/lib/scope";
import { PageHeader } from "@/components/ui";

export default async function InvoicesPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const ids = await scopedBranchIds(user);
  const invoices = await prisma.invoice.findMany({
    where: { branchId: { in: ids } },
    include: { party: true, branch: true, lines: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4">
      <PageHeader
        title="فاکتورها"
        subtitle="خرید و فروش"
        action={
          canManageInvoices(user) ? (
            <Link className="btn" href="/accounting/invoices/new">
              فاکتور جدید
            </Link>
          ) : null
        }
      />
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>شماره</th>
              <th>نوع</th>
              <th>شعبه</th>
              <th>طرف‌حساب</th>
              <th>مبلغ</th>
              <th>وضعیت</th>
              <th>تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const total = inv.lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unitPrice), 0);
              return (
                <tr key={inv.id}>
                  <td>
                    <Link className="font-mono text-blue-400 hover:text-white" href={`/accounting/invoices/${inv.id}`}>
                      {inv.number}
                    </Link>
                  </td>
                  <td>{invoiceTypeLabel[inv.type]}</td>
                  <td>{inv.branch.name}</td>
                  <td>{inv.party.name}</td>
                  <td className="font-mono">{money(total)}</td>
                  <td
                    className={
                      inv.status === "POSTED"
                        ? "text-green-400 font-mono text-xs"
                        : inv.status === "VOIDED"
                          ? "text-rose-400 font-mono text-xs"
                          : "font-mono text-xs text-orange-400"
                    }
                  >
                    {invoiceStatusLabel[inv.status]}
                  </td>
                  <td className="font-mono text-xs text-text-secondary">{toJalali(inv.date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
