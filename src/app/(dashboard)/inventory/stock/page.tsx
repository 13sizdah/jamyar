import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { qty } from "@/lib/format";
import { canManageInventory } from "@/lib/permissions";
import { scopedBranchIds } from "@/lib/scope";
import { adjustAction } from "@/app/actions/inventory";
import { PageHeader } from "@/components/ui";

export default async function StockPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const branchIds = await scopedBranchIds(user);
  const [levels, products, warehouses] = await Promise.all([
    prisma.stockLevel.findMany({
      where: { warehouse: { branchId: { in: branchIds } } },
      include: { product: true, warehouse: { include: { branch: true } } },
      orderBy: { quantity: "asc" },
    }),
    prisma.product.findMany({ where: { organizationId: user.organizationId, active: true } }),
    prisma.warehouse.findMany({ where: { branchId: { in: branchIds } }, include: { branch: true } }),
  ]);

  return (
    <div className="p-4">
      <PageHeader title="موجودی انبار" subtitle="موجودی روی دست" />
      {canManageInventory(user) ? (
        <form action={adjustAction} className="tech-card mb-3 grid gap-3 p-3 rounded-md md:grid-cols-5">
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
            <label>انبار</label>
            <select name="warehouseId" required>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.branch.name} / {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>تغییر مقدار (+/-)</label>
            <input name="quantity" type="number" step="0.001" required className="font-mono" />
          </div>
          <div>
            <label>یادداشت</label>
            <input name="note" />
          </div>
          <div className="flex items-end">
            <button className="btn w-full" type="submit">
              تعدیل
            </button>
          </div>
        </form>
      ) : null}
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>کالا</th>
              <th>SKU</th>
              <th>شعبه</th>
              <th>انبار</th>
              <th>موجودی</th>
              <th>حداقل</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((s) => {
              const low = Number(s.quantity) <= Number(s.product.minStock);
              return (
                <tr key={s.id}>
                  <td>{s.product.name}</td>
                  <td className="font-mono text-xs text-text-secondary">{s.product.sku}</td>
                  <td>{s.warehouse.branch.name}</td>
                  <td>{s.warehouse.name}</td>
                  <td className={`font-mono ${low ? "text-orange-400" : ""}`}>{qty(s.quantity)}</td>
                  <td className="font-mono text-text-secondary">{qty(s.product.minStock)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
