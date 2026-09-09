import { Prisma, StockMovementType } from "@prisma/client";
import { prisma } from "./db";

export async function applyStockChange(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    warehouseId: string;
    delta: number;
    type: StockMovementType;
    unitCost: number;
    note?: string;
    invoiceId?: string;
    transferGroup?: string;
  },
) {
  const product = await tx.product.findUniqueOrThrow({ where: { id: input.productId } });
  const current = await tx.stockLevel.findUnique({
    where: { productId_warehouseId: { productId: input.productId, warehouseId: input.warehouseId } },
  });
  const oldQty = Number(current?.quantity ?? 0);
  const newQty = oldQty + input.delta;
  if (newQty < -0.0001) {
    throw new Error(`موجودی کالای «${product.name}» کافی نیست`);
  }

  if (input.delta > 0 && input.type === "IN") {
    const oldCost = Number(product.avgCost);
    const incoming = input.delta * input.unitCost;
    const avg = oldQty + input.delta === 0 ? input.unitCost : (oldQty * oldCost + incoming) / (oldQty + input.delta);
    await tx.product.update({ where: { id: product.id }, data: { avgCost: avg } });
  }

  await tx.stockLevel.upsert({
    where: { productId_warehouseId: { productId: input.productId, warehouseId: input.warehouseId } },
    update: { quantity: newQty },
    create: { productId: input.productId, warehouseId: input.warehouseId, quantity: newQty },
  });

  await tx.stockMovement.create({
    data: {
      productId: input.productId,
      warehouseId: input.warehouseId,
      type: input.type,
      quantity: Math.abs(input.delta),
      unitCost: input.unitCost,
      note: input.note ?? "",
      invoiceId: input.invoiceId,
      transferGroup: input.transferGroup,
    },
  });
}

export async function transferStock(input: {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  note?: string;
}) {
  if (input.fromWarehouseId === input.toWarehouseId) {
    throw new Error("انبار مبدأ و مقصد نباید یکسان باشد");
  }
  if (input.quantity <= 0) throw new Error("مقدار باید بزرگ‌تر از صفر باشد");

  const group = crypto.randomUUID();
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({ where: { id: input.productId } });
    const cost = Number(product.avgCost);
    await applyStockChange(tx, {
      productId: input.productId,
      warehouseId: input.fromWarehouseId,
      delta: -input.quantity,
      type: "TRANSFER_OUT",
      unitCost: cost,
      note: input.note,
      transferGroup: group,
    });
    await applyStockChange(tx, {
      productId: input.productId,
      warehouseId: input.toWarehouseId,
      delta: input.quantity,
      type: "TRANSFER_IN",
      unitCost: cost,
      note: input.note,
      transferGroup: group,
    });
  });
}

export async function adjustStock(input: {
  productId: string;
  warehouseId: string;
  quantity: number;
  note?: string;
}) {
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({ where: { id: input.productId } });
    await applyStockChange(tx, {
      productId: input.productId,
      warehouseId: input.warehouseId,
      delta: input.quantity,
      type: "ADJUSTMENT",
      unitCost: Number(product.avgCost),
      note: input.note ?? "تعدیل موجودی",
    });
  });
}
