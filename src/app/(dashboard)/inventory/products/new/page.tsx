import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { canManageInventory } from "@/lib/permissions";
import { scopedBranchIds } from "@/lib/scope";

export default async function NewProductPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canManageInventory(user)) redirect("/inventory/products");
  const ids = await scopedBranchIds(user);
  const [categories, units, warehouses] = await Promise.all([
    prisma.category.findMany({ where: { organizationId: user.organizationId } }),
    prisma.unit.findMany({ where: { organizationId: user.organizationId } }),
    prisma.warehouse.findMany({
      where: { branchId: { in: ids } },
      include: { branch: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return (
    <ProductForm
      categories={categories}
      units={units}
      warehouses={warehouses.map((w) => ({ id: w.id, name: `${w.name} · ${w.branch.name}` }))}
    />
  );
}
