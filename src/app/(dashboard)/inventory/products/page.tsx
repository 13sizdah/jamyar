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
        subtitle="SKU · CATALOG"
        action={
          canManageInventory(user) ? (
            <Link className="btn" href="/inventory/products/new">
              کالای جدید
            </Link>
          ) : null
        }
      />
      {canManageInventory(user) ? (
        <form action={saveCategoryAction} className="tech-card mb-3 flex flex-wrap items-end gap-3 p-3 rounded-md">
          <div className="min-w-48 flex-1">
            <label>CATEGORY</label>
            <input name="name" placeholder="مثلاً لبنیات" />
          </div>
          <button className="btn" type="submit">
            افزودن دسته
          </button>
          <p className="w-full text-[10px] font-mono text-text-muted">
            {categories.map((c) => c.name).join(" · ") || "—"}
          </p>
        </form>
      ) : null}
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>نام</th>
              <th>دسته</th>
              <th>واحد</th>
              <th>حداقل</th>
              <th>avg cost</th>
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
                    <Link className="text-text-secondary hover:text-white font-mono text-xs" href={`/inventory/products/${p.id}`}>
                      EDIT
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
