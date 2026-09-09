import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money, qty, toJalali } from "@/lib/format";
import { trialBalance } from "@/lib/accounting";
import { canViewAccounting } from "@/lib/permissions";
import { scopedBranchIds } from "@/lib/scope";
import { PageHeader } from "@/components/ui";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const branchIds = await scopedBranchIds(user);

  const [lowStock, staffCount, recentMoves, invoices] = await Promise.all([
    prisma.stockLevel.findMany({
      where: { warehouse: { branchId: { in: branchIds } } },
      include: { product: true, warehouse: { include: { branch: true } } },
    }),
    prisma.user.count({
      where: {
        organizationId: user.organizationId,
        active: true,
        ...(user.role !== "OWNER" && user.role !== "ACCOUNTANT" ? { branchId: { in: branchIds } } : {}),
      },
    }),
    prisma.stockMovement.findMany({
      where: { warehouse: { branchId: { in: branchIds } } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { product: true, warehouse: true },
    }),
    prisma.invoice.findMany({
      where: { branchId: { in: branchIds }, status: "POSTED" },
      include: { lines: true },
    }),
  ]);

  const alerts = lowStock.filter((s) => Number(s.quantity) <= Number(s.product.minStock));
  const sales = invoices
    .filter((i) => i.type === "SALE")
    .reduce((sum, i) => sum + i.lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unitPrice), 0), 0);
  const purchases = invoices
    .filter((i) => i.type === "PURCHASE")
    .reduce((sum, i) => sum + i.lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unitPrice), 0), 0);

  const tb = canViewAccounting(user)
    ? await trialBalance(user.organizationId, user.role === "BRANCH_MANAGER" ? (user.branchId ?? undefined) : undefined)
    : [];
  const cash = tb.find((r) => r.code === "1101");
  const cashBal = cash ? cash.debit - cash.credit : 0;
  const maxAlert = Math.max(...alerts.map((a) => Number(a.product.minStock) || 1), 1);

  return (
    <div className="flex flex-col p-4 gap-3">
      <PageHeader title="Dashboard" subtitle="OPS OVERVIEW" />

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <Link href="/accounting/invoices" className="tech-card p-4 rounded-md flex flex-col justify-between h-24 group hover:border-white transition-colors">
          <div className="flex justify-between items-start">
            <span className="mono-label text-text-secondary group-hover:text-white">Sales posted</span>
            <span className="material-icons-outlined text-text-muted group-hover:text-white">point_of_sale</span>
          </div>
          <span className="text-2xl font-bold font-mono">{money(sales)}</span>
        </Link>
        <Link href="/accounting/invoices" className="tech-card p-4 rounded-md flex flex-col justify-between h-24 group hover:border-white transition-colors">
          <div className="flex justify-between items-start">
            <span className="mono-label text-text-secondary group-hover:text-white">Purchases</span>
            <span className="material-icons-outlined text-text-muted group-hover:text-white">local_shipping</span>
          </div>
          <span className="text-2xl font-bold font-mono">{money(purchases)}</span>
        </Link>
        <Link href="/inventory/stock" className="tech-card p-4 rounded-md flex flex-col justify-between h-24 group hover:border-white transition-colors">
          <div className="flex justify-between items-start">
            <span className="mono-label text-text-secondary group-hover:text-white">Low stock</span>
            <span className="material-icons-outlined text-text-muted group-hover:text-white">warning</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono">{alerts.length}</span>
            {alerts.length > 0 ? <span className="text-xs font-mono text-orange-400 mb-1">HOT</span> : <span className="text-xs font-mono text-green-400 mb-1">OK</span>}
          </div>
        </Link>
        <Link href="/staff" className="tech-card p-4 rounded-md flex flex-col justify-between h-24 group hover:border-white transition-colors">
          <div className="flex justify-between items-start">
            <span className="mono-label text-text-secondary group-hover:text-white">Active staff</span>
            <span className="material-icons-outlined text-text-muted group-hover:text-white">group</span>
          </div>
          <span className="text-2xl font-bold font-mono">{staffCount}</span>
        </Link>
      </section>

      {canViewAccounting(user) ? (
        <p className="text-xs font-mono text-text-secondary">
          CASH 1101 · <span className="text-white">{money(cashBal)}</span> RIAL
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="tech-card p-3 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">موجودی زیر حداقل</h3>
            <span className="font-mono text-xs text-text-secondary">ALERTS</span>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-text-secondary">موردی نیست.</p>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 8).map((a) => (
                <div key={a.id} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-text-secondary truncate">{a.product.name}</span>
                    <span className="text-xs font-mono text-white">
                      {qty(a.quantity)} / {qty(a.product.minStock)}
                    </span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-orange-500 to-orange-400 rounded-full"
                      style={{ width: `${Math.min(100, (Number(a.quantity) / maxAlert) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tech-card p-3 rounded-md overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">آخرین حرکات انبار</h3>
            <span className="font-mono text-xs text-text-secondary">LEDGER</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>کالا</th>
                <th>نوع</th>
                <th>مقدار</th>
              </tr>
            </thead>
            <tbody>
              {recentMoves.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono text-xs text-text-secondary">{toJalali(m.createdAt)}</td>
                  <td>{m.product.name}</td>
                  <td className="font-mono text-xs">{moveLabel(m.type)}</td>
                  <td className="font-mono">{qty(m.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-border pt-2">
        <h3 className="text-xs font-bold text-white mb-1.5 flex items-center gap-2">
          <span className="material-icons-outlined text-base">terminal</span>
          Quick Start
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Quick href="/inventory/products/new" label="کالای جدید" icon="add_box" code="inventory · sku" color="text-green-400" />
          <Quick href="/inventory/transfer" label="انتقال انبار" icon="swap_horiz" code="stock · transfer" color="text-blue-400" />
          <Quick href="/accounting/invoices/new" label="فاکتور" icon="receipt" code="invoice · post" color="text-orange-400" />
          <Quick href="/accounting/payroll" label="ثبت حقوق" icon="payments" code="payroll · je" color="text-purple-400" />
        </div>
      </div>
    </div>
  );
}

function Quick({ href, label, icon, code, color }: { href: string; label: string; icon: string; code: string; color: string }) {
  return (
    <Link href={href} className="tech-card rounded-md p-2 group hover:border-text-secondary transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-secondary text-xs">{label}</span>
        <span className="material-icons-outlined text-text-muted text-sm">{icon}</span>
      </div>
      <code className={`text-xs font-mono ${color} block bg-surface p-2 rounded`}>{code}</code>
    </Link>
  );
}

function moveLabel(type: string) {
  const map: Record<string, string> = {
    IN: "IN",
    OUT: "OUT",
    TRANSFER_IN: "TR-IN",
    TRANSFER_OUT: "TR-OUT",
    ADJUSTMENT: "ADJ",
  };
  return map[type] ?? type;
}
