import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;
  const [product, categories, units] = await Promise.all([
    prisma.product.findFirst({ where: { id, organizationId: user.organizationId } }),
    prisma.category.findMany({ where: { organizationId: user.organizationId } }),
    prisma.unit.findMany({ where: { organizationId: user.organizationId } }),
  ]);
  if (!product) notFound();
  return <ProductForm product={product} categories={categories} units={units} />;
}
