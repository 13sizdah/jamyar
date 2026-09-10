import { prisma } from "./db";
import { applyStockChange } from "./inventory";
import { accountByKey, nextInvoiceNumber, nextJournalNumber } from "./numbering";

export async function postInvoice(invoiceId: string) {
  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: { lines: { include: { product: true } }, warehouse: true, branch: true },
    });
    if (invoice.status === "POSTED") throw new Error("این فاکتور قبلاً ثبت شده است");
    if (invoice.status === "VOIDED") throw new Error("فاکتور باطل‌شده را نمی‌توان ثبت کرد");
    if (invoice.lines.length === 0) throw new Error("فاکتور بدون ردیف است");

    const orgId = invoice.branch.organizationId;
    const inventory = await accountByKey(orgId, "INVENTORY", tx);
    const cash = await accountByKey(orgId, "CASH", tx);
    const ap = await accountByKey(orgId, "AP", tx);
    const ar = await accountByKey(orgId, "AR", tx);
    const sales = await accountByKey(orgId, "SALES", tx);
    const cogs = await accountByKey(orgId, "COGS", tx);

    let merchandise = 0;
    let cogsTotal = 0;

    for (const line of invoice.lines) {
      const qty = Number(line.quantity);
      const price = Number(line.unitPrice);
      merchandise += qty * price;
      const avg = Number(line.product.avgCost);

      if (invoice.type === "PURCHASE") {
        await applyStockChange(tx, {
          productId: line.productId,
          warehouseId: invoice.warehouseId,
          delta: qty,
          type: "IN",
          unitCost: price,
          invoiceId: invoice.id,
          note: `فاکتور خرید ${invoice.number}`,
        });
      } else {
        await applyStockChange(tx, {
          productId: line.productId,
          warehouseId: invoice.warehouseId,
          delta: -qty,
          type: "OUT",
          unitCost: avg,
          invoiceId: invoice.id,
          note: `فاکتور فروش ${invoice.number}`,
        });
        cogsTotal += qty * avg;
      }
    }

    const number = await nextJournalNumber(invoice.branchId, tx);
    const payAccountId = invoice.paid ? cash.id : invoice.type === "PURCHASE" ? ap.id : ar.id;

    const lines =
      invoice.type === "PURCHASE"
        ? [
            { accountId: inventory.id, debit: merchandise, credit: 0, memo: "ورود کالا" },
            { accountId: payAccountId, debit: 0, credit: merchandise, memo: invoice.paid ? "پرداخت نقدی" : "بدهی تأمین‌کننده" },
          ]
        : [
            { accountId: payAccountId, debit: merchandise, credit: 0, memo: invoice.paid ? "دریافت نقدی" : "طلب از مشتری" },
            { accountId: sales.id, debit: 0, credit: merchandise, memo: "درآمد فروش" },
            { accountId: cogs.id, debit: cogsTotal, credit: 0, memo: "بهای تمام‌شده" },
            { accountId: inventory.id, debit: 0, credit: cogsTotal, memo: "خروج کالا" },
          ];

    const entry = await tx.journalEntry.create({
      data: {
        branchId: invoice.branchId,
        number,
        description: `${invoice.type === "PURCHASE" ? "خرید" : "فروش"} ${invoice.number}`,
        source: "INVOICE",
        date: invoice.date,
        lines: { create: lines },
      },
    });

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "POSTED", journalEntryId: entry.id },
    });
  });
}

type InvoiceInput = {
  branchId: string;
  warehouseId: string;
  partyId: string;
  type: "PURCHASE" | "SALE";
  paid: boolean;
  note?: string;
  date?: Date;
  lines: { productId: string; quantity: number; unitPrice: number }[];
};

export async function createDraftInvoice(input: InvoiceInput) {
  if (input.lines.length === 0) throw new Error("حداقل یک ردیف لازم است");
  const number = await nextInvoiceNumber(input.branchId, input.type);
  const invoice = await prisma.invoice.create({
    data: {
      branchId: input.branchId,
      warehouseId: input.warehouseId,
      partyId: input.partyId,
      type: input.type,
      status: "DRAFT",
      number,
      paid: input.paid,
      note: input.note ?? "",
      date: input.date ?? new Date(),
      lines: {
        create: input.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      },
    },
  });
  return invoice.id;
}

export async function updateDraftInvoice(invoiceId: string, input: InvoiceInput) {
  if (input.lines.length === 0) throw new Error("حداقل یک ردیف لازم است");
  const existing = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (existing.status !== "DRAFT") throw new Error("فقط پیش‌نویس قابل ویرایش است");
  await prisma.$transaction(async (tx) => {
    await tx.invoiceLine.deleteMany({ where: { invoiceId } });
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        branchId: input.branchId,
        warehouseId: input.warehouseId,
        partyId: input.partyId,
        type: input.type,
        paid: input.paid,
        note: input.note ?? "",
        date: input.date ?? existing.date,
        lines: {
          create: input.lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        },
      },
    });
  });
  return invoiceId;
}

export async function createAndPostInvoice(input: InvoiceInput) {
  const id = await createDraftInvoice(input);
  await postInvoice(id);
  return id;
}

export async function voidInvoice(invoiceId: string) {
  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: {
        lines: true,
        journalEntry: { include: { lines: true } },
        branch: true,
      },
    });
    if (invoice.status !== "POSTED") throw new Error("فقط فاکتور ثبت‌شده را می‌توان ابطال کرد");

    const movements = await tx.stockMovement.findMany({ where: { invoiceId: invoice.id } });
    for (const move of movements) {
      const qty = Number(move.quantity);
      const reverseType = invoice.type === "PURCHASE" ? "OUT" : "IN";
      await applyStockChange(tx, {
        productId: move.productId,
        warehouseId: move.warehouseId,
        delta: reverseType === "IN" ? qty : -qty,
        type: reverseType,
        unitCost: Number(move.unitCost),
        invoiceId: invoice.id,
        note: `ابطال فاکتور ${invoice.number}`,
      });
    }

    if (invoice.journalEntry) {
      const number = await nextJournalNumber(invoice.branchId, tx);
      await tx.journalEntry.create({
        data: {
          branchId: invoice.branchId,
          number,
          description: `ابطال ${invoice.type === "PURCHASE" ? "خرید" : "فروش"} ${invoice.number}`,
          source: "INVOICE",
          date: new Date(),
          lines: {
            create: invoice.journalEntry.lines.map((l) => ({
              accountId: l.accountId,
              debit: Number(l.credit),
              credit: Number(l.debit),
              memo: `ابطال ${l.memo}`.trim(),
            })),
          },
        },
      });
    }

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "VOIDED" },
    });
  });
}

export async function createManualJournal(input: {
  branchId: string;
  description: string;
  date?: Date;
  lines: { accountId: string; debit: number; credit: number; memo?: string }[];
}) {
  const debit = input.lines.reduce((s, l) => s + l.debit, 0);
  const credit = input.lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(debit - credit) > 0.009) {
    throw new Error("جمع بدهکار و بستانکار باید برابر باشد");
  }
  if (input.lines.length < 2) throw new Error("حداقل دو ردیف لازم است");
  const number = await nextJournalNumber(input.branchId);
  return prisma.journalEntry.create({
    data: {
      branchId: input.branchId,
      number,
      description: input.description,
      source: "MANUAL",
      date: input.date ?? new Date(),
      lines: {
        create: input.lines.map((l) => ({
          accountId: l.accountId,
          debit: l.debit,
          credit: l.credit,
          memo: l.memo ?? "",
        })),
      },
    },
  });
}

export async function createPayroll(input: {
  branchId: string;
  userId: string;
  period: string;
  amount: number;
  paid: boolean;
  note?: string;
  organizationId: string;
}) {
  if (input.amount <= 0) throw new Error("مبلغ حقوق نامعتبر است");
  const expense = await accountByKey(input.organizationId, "PAYROLL_EXPENSE");
  const payable = await accountByKey(input.organizationId, "PAYROLL_PAYABLE");
  const cash = await accountByKey(input.organizationId, "CASH");
  const creditAccount = input.paid ? cash.id : payable.id;
  const number = await nextJournalNumber(input.branchId);

  return prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.create({
      data: {
        branchId: input.branchId,
        number,
        description: `حقوق ${input.period}`,
        source: "PAYROLL",
        lines: {
          create: [
            { accountId: expense.id, debit: input.amount, credit: 0, memo: "هزینه حقوق" },
            { accountId: creditAccount, debit: 0, credit: input.amount, memo: input.paid ? "پرداخت از صندوق" : "حقوق پرداختنی" },
          ],
        },
      },
    });
    return tx.payrollEntry.create({
      data: {
        branchId: input.branchId,
        userId: input.userId,
        period: input.period,
        amount: input.amount,
        paid: input.paid,
        note: input.note ?? "",
        journalEntryId: entry.id,
      },
    });
  });
}

export async function trialBalance(
  organizationId: string,
  branchId?: string,
  range?: { from?: Date; to?: Date },
) {
  const lines = await prisma.journalLine.findMany({
    where: {
      entry: {
        posted: true,
        ...(range?.from || range?.to
          ? {
              date: {
                ...(range.from ? { gte: range.from } : {}),
                ...(range.to ? { lte: range.to } : {}),
              },
            }
          : {}),
        branch: {
          organizationId,
          ...(branchId ? { id: branchId } : {}),
        },
      },
    },
    include: { account: true },
  });
  const map = new Map<
    string,
    { code: string; name: string; type: string; debit: number; credit: number }
  >();
  for (const line of lines) {
    const row = map.get(line.accountId) ?? {
      code: line.account.code,
      name: line.account.name,
      type: line.account.type,
      debit: 0,
      credit: 0,
    };
    row.debit += Number(line.debit);
    row.credit += Number(line.credit);
    map.set(line.accountId, row);
  }
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}

export async function profitAndLoss(
  organizationId: string,
  branchId?: string,
  range?: { from?: Date; to?: Date },
) {
  const rows = await trialBalance(organizationId, branchId, range);
  const revenue = rows
    .filter((r) => r.type === "REVENUE")
    .reduce((s, r) => s + (r.credit - r.debit), 0);
  const expense = rows
    .filter((r) => r.type === "EXPENSE")
    .reduce((s, r) => s + (r.debit - r.credit), 0);
  return {
    revenue,
    expense,
    net: revenue - expense,
    rows: rows.filter((r) => r.type === "REVENUE" || r.type === "EXPENSE"),
  };
}
