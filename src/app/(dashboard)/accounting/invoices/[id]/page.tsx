import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money, qty, toJalali } from "@/lib/format";
import { scopedBranchIds } from "@/lib/scope";
import { BackLink, PageHeader } from "@/components/ui";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;
  const branchIds = await scopedBranchIds(user);
  const invoice = await prisma.invoice.findFirst({
    where: { id, branchId: { in: branchIds } },
    include: { lines: { include: { product: true } }, party: true, branch: true, warehouse: true, journalEntry: true },
  });
  if (!invoice) notFound();
  const total = invoice.lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unitPrice), 0);

  return (
    <div className="p-4">
      <BackLink href="/accounting/invoices" label="فاکتورها" />
      <PageHeader title={invoice.number} subtitle={`${invoice.type} · ${invoice.status}`} />
      <div className="grid gap-3 md:grid-cols-3 mb-3">
        <div className="tech-card p-3 rounded-md">
          <span className="mono-label text-text-secondary">Party</span>
          <p className="mt-1">{invoice.party.name}</p>
        </div>
        <div className="tech-card p-3 rounded-md">
          <span className="mono-label text-text-secondary">Warehouse</span>
          <p className="mt-1">
            {invoice.branch.name} / {invoice.warehouse.name}
          </p>
        </div>
        <div className="tech-card p-3 rounded-md">
          <span className="mono-label text-text-secondary">Date</span>
          <p className="mt-1 font-mono">{toJalali(invoice.date)}</p>
        </div>
      </div>
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>کالا</th>
              <th>مقدار</th>
              <th>فی</th>
              <th>جمع</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l) => (
              <tr key={l.id}>
                <td>{l.product.name}</td>
                <td className="font-mono">{qty(l.quantity)}</td>
                <td className="font-mono">{money(l.unitPrice)}</td>
                <td className="font-mono">{money(Number(l.quantity) * Number(l.unitPrice))}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3}>جمع</td>
              <td className="font-mono font-bold">{money(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {invoice.journalEntry ? (
        <p className="mt-3 text-xs font-mono text-text-secondary">JE {invoice.journalEntry.number}</p>
      ) : null}
    </div>
  );
}
