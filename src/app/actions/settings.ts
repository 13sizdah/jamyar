"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageSettings } from "@/lib/permissions";

export async function saveBranchAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageSettings(user)) throw new Error("FORBIDDEN");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  if (!name) throw new Error("نام شعبه الزامی است");
  if (id) {
    const branch = await prisma.branch.findFirst({
      where: { id, organizationId: user.organizationId },
      select: { id: true },
    });
    if (!branch) throw new Error("FORBIDDEN");
    await prisma.branch.update({
      where: { id: branch.id },
      data: { name, city, active: formData.get("active") === "on" },
    });
  } else {
    const branch = await prisma.branch.create({
      data: { organizationId: user.organizationId, name, city },
    });
    await prisma.warehouse.create({ data: { branchId: branch.id, name: `انبار ${name}` } });
  }
  revalidatePath("/settings");
}

export async function saveWarehouseAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageSettings(user)) throw new Error("FORBIDDEN");
  const branchId = String(formData.get("branchId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, organizationId: user.organizationId },
    select: { id: true },
  });
  if (!branch) throw new Error("FORBIDDEN");
  if (!name) throw new Error("نام انبار الزامی است");
  await prisma.warehouse.create({
    data: {
      branchId: branch.id,
      name,
    },
  });
  revalidatePath("/settings");
}

export async function saveUnitAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageSettings(user)) throw new Error("FORBIDDEN");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("نام واحد الزامی است");
  await prisma.unit.create({
    data: { organizationId: user.organizationId, name },
  });
  revalidatePath("/settings");
}
