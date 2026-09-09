import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/product-form";

export default async function NewProductPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const [categories, units] = await Promise.all([
    prisma.category.findMany({ where: { organizationId: user.organizationId } }),
    prisma.unit.findMany({ where: { organizationId: user.organizationId } }),
  ]);
  return <ProductForm categories={categories} units={units} />;
}
