import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scopedBranchIds } from "@/lib/scope";
import { InvoiceForm } from "@/components/invoice-form";
import { BackLink, PageHeader } from "@/components/ui";

export default async function NewInvoicePage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "STAFF" || user.role === "WAREHOUSE") redirect("/accounting/invoices");
  const ids = await scopedBranchIds(user);
  const [branches, warehouses, parties, products] = await Promise.all([
    prisma.branch.findMany({ where: { id: { in: ids } } }),
    prisma.warehouse.findMany({ where: { branchId: { in: ids } } }),
    prisma.party.findMany({ where: { organizationId: user.organizationId } }),
    prisma.product.findMany({ where: { organizationId: user.organizationId, active: true } }),
  ]);

  return (
    <div className="p-4 max-w-3xl">
      <BackLink href="/accounting/invoices" label="فاکتورها" />
      <PageHeader title="فاکتور جدید" subtitle="POST TO LEDGER" />
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
      />
    </div>
  );
}
