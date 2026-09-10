import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInventory } from "@/lib/permissions";
import { scopedBranchIds } from "@/lib/scope";
import { transferAction } from "@/app/actions/inventory";
import { PageHeader } from "@/components/ui";

export default async function TransferPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canManageInventory(user)) redirect("/");
  const branchIds = await scopedBranchIds(user);
  const orgWarehouses = await prisma.warehouse.findMany({
    where: { branch: { organizationId: user.organizationId } },
    include: { branch: true },
  });
  const fromWarehouses = orgWarehouses.filter((w) => branchIds.includes(w.branchId));
  const products = await prisma.product.findMany({
    where: { organizationId: user.organizationId, active: true },
  });

  return (
    <div className="p-4 max-w-xl">
      <PageHeader title="انتقال بین انبار" subtitle="جابه‌جایی موجودی" />
      <form action={transferAction} className="tech-card space-y-4 p-4 rounded-md">
        <div>
          <label>کالا</label>
          <select name="productId" required>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>از انبار</label>
          <select name="fromWarehouseId" required>
            {fromWarehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.branch.name} / {w.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>به انبار</label>
          <select name="toWarehouseId" required>
            {orgWarehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.branch.name} / {w.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>مقدار</label>
          <input name="quantity" type="number" step="0.001" required className="font-mono" />
        </div>
        <div>
          <label>یادداشت</label>
          <input name="note" />
        </div>
        <button className="btn" type="submit">
          انتقال
        </button>
      </form>
    </div>
  );
}
