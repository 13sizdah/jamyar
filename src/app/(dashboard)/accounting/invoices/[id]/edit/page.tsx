import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/permissions";
import { scopedBranchIds } from "@/lib/scope";
import { InvoiceForm } from "@/components/invoice-form";
import { BackLink, PageHeader } from "@/components/ui";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canManageInvoices(user)) redirect("/accounting/invoices");
  const { id } = await params;
  const ids = await scopedBranchIds(user);
  const invoice = await prisma.invoice.findFirst({
    where: { id, branchId: { in: ids }, status: "DRAFT" },
    include: { lines: true },
  });
  if (!invoice) notFound();
  const [branches, warehouses, parties, products] = await Promise.all([
    prisma.branch.findMany({ where: { id: { in: ids } } }),
    prisma.warehouse.findMany({ where: { branchId: { in: ids } } }),
    prisma.party.findMany({ where: { organizationId: user.organizationId } }),
    prisma.product.findMany({ where: { organizationId: user.organizationId, active: true } }),
  ]);

  return (
    <div className="p-4 max-w-3xl">
      <BackLink href={`/accounting/invoices/${invoice.id}`} label="فاکتور" />
      <PageHeader title={`ویرایش ${invoice.number}`} subtitle="پیش‌نویس" />
      <InvoiceForm
        branches={branches}
        warehouses={warehouses}
        parties={parties}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          salePrice: Number(p.salePrice),
          avgCost: Number(p.avgCost),
        }))}
        invoice={{
          id: invoice.id,
          type: invoice.type,
          branchId: invoice.branchId,
          warehouseId: invoice.warehouseId,
          partyId: invoice.partyId,
          paid: invoice.paid,
          note: invoice.note,
          date: invoice.date,
          lines: invoice.lines.map((l) => ({
            productId: l.productId,
            quantity: Number(l.quantity),
            unitPrice: Number(l.unitPrice),
          })),
        }}
      />
    </div>
  );
}
