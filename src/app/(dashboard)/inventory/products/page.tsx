import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money } from "@/lib/format";
import { canManageInventory } from "@/lib/permissions";
import { saveCategoryAction } from "@/app/actions/inventory";
import { PageHeader } from "@/components/ui";

export default async function ProductsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId: user.organizationId },
      include: { category: true, unit: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ where: { organizationId: user.organizationId } }),
  ]);

  return (
    <div className="p-4">
      <PageHeader
        title="کالاها"
        subtitle="فهرست کالا"
        action={
          canManageInventory(user) ? (
            <Link className="btn" href="/inventory/products/new">
              کالای جدید
            </Link>
          ) : null
        }
      />
      {canManageInventory(user) ? (
        <div className="tech-card mb-3 space-y-3 p-3 rounded-md">
          <form action={saveCategoryAction} className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <label>دسته جدید</label>
              <input name="name" placeholder="مثلاً لبنیات" />
            </div>
            <button className="btn" type="submit">
              افزودن دسته
            </button>
          </form>
          <div className="space-y-2">
            {categories.map((c) => (
              <form key={c.id} action={saveCategoryAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={c.id} />
                <div className="min-w-48 flex-1">
                  <input name="name" required defaultValue={c.name} />
                </div>
                <button className="btn-ghost rounded-md px-3 text-xs" type="submit">
                  ذخیره دسته
                </button>
              </form>
            ))}
          </div>
        </div>
      ) : null}
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>کد</th>
              <th>نام</th>
              <th>دسته</th>
              <th>واحد</th>
              <th>حداقل</th>
              <th>میانگین بها</th>
              <th>فروش</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs text-blue-400">{p.sku}</td>
                <td>{p.name}</td>
                <td className="text-text-secondary">{p.category.name}</td>
                <td>{p.unit.name}</td>
                <td className="font-mono">{Number(p.minStock)}</td>
                <td className="font-mono">{money(p.avgCost)}</td>
                <td className="font-mono">{money(p.salePrice)}</td>
                <td>
                  {canManageInventory(user) ? (
                    <Link className="text-text-secondary hover:text-white text-xs" href={`/inventory/products/${p.id}`}>
                      ویرایش
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
