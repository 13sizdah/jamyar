import type { SessionUser } from "./auth";
import { prisma } from "./db";
import { branchScope } from "./permissions";

export async function scopedBranchIds(user: SessionUser) {
  const scope = branchScope(user);
  if (scope === "all") {
    const branches = await prisma.branch.findMany({
      where: { organizationId: user.organizationId, active: true },
      select: { id: true },
    });
    return branches.map((b) => b.id);
  }
  if (scope === "none") return [];
  return [scope];
}

export async function assertWarehouseInScope(user: SessionUser, warehouseId: string) {
  const ids = await scopedBranchIds(user);
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, branchId: { in: ids } },
  });
  if (!warehouse) throw new Error("FORBIDDEN");
  return warehouse;
}

export async function assertWarehouseInOrganization(user: SessionUser, warehouseId: string) {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, branch: { organizationId: user.organizationId } },
  });
  if (!warehouse) throw new Error("FORBIDDEN");
  return warehouse;
}

export async function assertProductInOrganization(user: SessionUser, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId: user.organizationId },
  });
  if (!product) throw new Error("FORBIDDEN");
  return product;
}

export async function assertBranchInScope(user: SessionUser, branchId: string) {
  const ids = await scopedBranchIds(user);
  if (!ids.includes(branchId)) throw new Error("FORBIDDEN");
}
