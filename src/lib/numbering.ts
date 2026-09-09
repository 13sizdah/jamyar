import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

type DbClient = typeof prisma | Prisma.TransactionClient;

export async function nextInvoiceNumber(
  branchId: string,
  type: "PURCHASE" | "SALE",
  db: DbClient = prisma,
) {
  const prefix = type === "PURCHASE" ? "PUR" : "SAL";
  const last = await db.invoice.findFirst({
    where: { branchId, type },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  });
  const n = last ? Number(last.number.replace(/\D/g, "")) + 1 : 1;
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

export async function nextJournalNumber(branchId: string, db: DbClient = prisma) {
  const last = await db.journalEntry.findFirst({
    where: { branchId },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  });
  const n = last ? Number(last.number.replace(/\D/g, "")) + 1 : 1;
  return `JE-${String(n).padStart(4, "0")}`;
}

export async function accountByKey(
  organizationId: string,
  systemKey: string,
  db: DbClient = prisma,
) {
  const account = await db.account.findFirst({
    where: { organizationId, systemKey },
  });
  if (!account) throw new Error(`حساب سیستمی ${systemKey} تعریف نشده است`);
  return account;
}
