"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adjustStock, transferStock } from "@/lib/inventory";
import { canManageInventory } from "@/lib/permissions";
import {
  assertProductInOrganization,
  assertWarehouseInOrganization,
  assertWarehouseInScope,
} from "@/lib/scope";

function num(v: FormDataEntryValue | null) {
  return Number(String(v ?? "0").replace(/,/g, ""));
}

export async function saveProductAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageInventory(user)) throw new Error("FORBIDDEN");
  const id = String(formData.get("id") ?? "");
  const data = {
    organizationId: user.organizationId,
    name: String(formData.get("name") ?? "").trim(),
    sku: String(formData.get("sku") ?? "").trim(),
    categoryId: String(formData.get("categoryId") ?? ""),
    unitId: String(formData.get("unitId") ?? ""),
    minStock: num(formData.get("minStock")),
    salePrice: num(formData.get("salePrice")),
    active: formData.get("active") === "on",
  };
  if (!data.name || !data.sku) throw new Error("نام و کد کالا الزامی است");
  const [category, unit] = await Promise.all([
    prisma.category.findFirst({
      where: { id: data.categoryId, organizationId: user.organizationId },
      select: { id: true },
    }),
    prisma.unit.findFirst({
      where: { id: data.unitId, organizationId: user.organizationId },
      select: { id: true },
    }),
  ]);
  if (!category || !unit) throw new Error("دسته یا واحد معتبر نیست");
  if (id) {
    await assertProductInOrganization(user, id);
    await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId,
        unitId: data.unitId,
        minStock: data.minStock,
        salePrice: data.salePrice,
        active: data.active,
      },
    });
  } else {
    await prisma.product.create({ data });
  }
  revalidatePath("/inventory/products");
  redirect("/inventory/products");
}

export async function saveCategoryAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageInventory(user)) throw new Error("FORBIDDEN");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("نام دسته الزامی است");
  await prisma.category.create({ data: { organizationId: user.organizationId, name } });
  revalidatePath("/inventory/products");
}

export async function transferAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageInventory(user)) throw new Error("FORBIDDEN");
  const fromWarehouseId = String(formData.get("fromWarehouseId") ?? "");
  const toWarehouseId = String(formData.get("toWarehouseId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  await assertWarehouseInScope(user, fromWarehouseId);
  await assertWarehouseInOrganization(user, toWarehouseId);
  await assertProductInOrganization(user, productId);
  await transferStock({
    productId,
    fromWarehouseId,
    toWarehouseId,
    quantity: num(formData.get("quantity")),
    note: String(formData.get("note") ?? ""),
  });
  revalidatePath("/inventory/stock");
  revalidatePath("/inventory/movements");
  redirect("/inventory/stock");
}

export async function adjustAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageInventory(user)) throw new Error("FORBIDDEN");
  const warehouseId = String(formData.get("warehouseId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  await assertWarehouseInScope(user, warehouseId);
  await assertProductInOrganization(user, productId);
  await adjustStock({
    productId,
    warehouseId,
    quantity: num(formData.get("quantity")),
    note: String(formData.get("note") ?? ""),
  });
  revalidatePath("/inventory/stock");
}
