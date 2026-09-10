"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createDraftInvoice,
  createManualJournal,
  createPayroll,
  postInvoice,
  updateDraftInvoice,
  voidInvoice,
} from "@/lib/accounting";
import { canManageAccounting, canManageInvoices } from "@/lib/permissions";
import {
  assertBranchInScope,
  assertProductInOrganization,
  assertWarehouseInScope,
} from "@/lib/scope";
import { parseFormDate } from "@/lib/format";

function num(v: FormDataEntryValue | null) {
  return Number(String(v ?? "0").replace(/,/g, ""));
}

async function invoicePayloadFromForm(formData: FormData) {
  const user = await requireSession();
  if (!canManageInvoices(user)) throw new Error("FORBIDDEN");
  const branchId = String(formData.get("branchId") ?? "");
  const warehouseId = String(formData.get("warehouseId") ?? "");
  const type = String(formData.get("type") ?? "SALE") as "PURCHASE" | "SALE";
  const partyId = String(formData.get("partyId") ?? "");
  await assertBranchInScope(user, branchId);
  const warehouse = await assertWarehouseInScope(user, warehouseId);
  if (warehouse.branchId !== branchId) throw new Error("FORBIDDEN");

  const products = formData.getAll("productId").map(String);
  const quantities = formData.getAll("quantity").map((x) => Number(x));
  const prices = formData.getAll("unitPrice").map((x) => Number(x));
  const lines = products
    .map((productId, i) => ({ productId, quantity: quantities[i], unitPrice: prices[i] }))
    .filter((l) => l.productId && l.quantity > 0);
  await Promise.all(lines.map((line) => assertProductInOrganization(user, line.productId)));
  const party = await prisma.party.findFirst({
    where: {
      id: partyId,
      organizationId: user.organizationId,
      type: type === "SALE" ? "CUSTOMER" : "SUPPLIER",
    },
  });
  if (!party) throw new Error("طرف‌حساب معتبر نیست");
  return {
    branchId,
    warehouseId,
    partyId,
    type,
    paid: formData.get("paid") === "on",
    note: String(formData.get("note") ?? ""),
    date: parseFormDate(formData.get("date")),
    lines,
  };
}

function revalidateInvoicePaths() {
  revalidatePath("/accounting/invoices");
  revalidatePath("/inventory/stock");
  revalidatePath("/accounting/trial-balance");
  revalidatePath("/accounting/journals");
}

export async function createInvoiceAction(formData: FormData) {
  const intent = String(formData.get("intent") ?? "draft");
  const payload = await invoicePayloadFromForm(formData);
  const id = await createDraftInvoice(payload);
  if (intent === "post") await postInvoice(id);
  revalidateInvoicePaths();
  redirect(`/accounting/invoices/${id}`);
}

export async function updateInvoiceAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const intent = String(formData.get("intent") ?? "draft");
  const user = await requireSession();
  if (!canManageInvoices(user)) throw new Error("FORBIDDEN");
  const existing = await prisma.invoice.findFirst({
    where: { id, branch: { organizationId: user.organizationId } },
  });
  if (!existing) throw new Error("FORBIDDEN");
  await assertBranchInScope(user, existing.branchId);
  const payload = await invoicePayloadFromForm(formData);
  await updateDraftInvoice(id, payload);
  if (intent === "post") await postInvoice(id);
  revalidateInvoicePaths();
  redirect(`/accounting/invoices/${id}`);
}

export async function postInvoiceAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageInvoices(user)) throw new Error("FORBIDDEN");
  const id = String(formData.get("id") ?? "");
  const invoice = await prisma.invoice.findFirst({
    where: { id, branch: { organizationId: user.organizationId } },
  });
  if (!invoice) throw new Error("FORBIDDEN");
  await assertBranchInScope(user, invoice.branchId);
  await postInvoice(id);
  revalidateInvoicePaths();
  redirect(`/accounting/invoices/${id}`);
}

export async function voidInvoiceAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageInvoices(user)) throw new Error("FORBIDDEN");
  const id = String(formData.get("id") ?? "");
  const invoice = await prisma.invoice.findFirst({
    where: { id, branch: { organizationId: user.organizationId } },
  });
  if (!invoice) throw new Error("FORBIDDEN");
  await assertBranchInScope(user, invoice.branchId);
  await voidInvoice(id);
  revalidateInvoicePaths();
  redirect(`/accounting/invoices/${id}`);
}

export async function createJournalAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageAccounting(user)) throw new Error("FORBIDDEN");
  const branchId = String(formData.get("branchId") ?? "");
  await assertBranchInScope(user, branchId);
  const accountIds = formData.getAll("accountId").map(String);
  const debits = formData.getAll("debit").map((x) => Number(x || 0));
  const credits = formData.getAll("credit").map((x) => Number(x || 0));
  const memos = formData.getAll("memo").map(String);
  const validAccountCount = await prisma.account.count({
    where: { id: { in: accountIds }, organizationId: user.organizationId },
  });
  if (validAccountCount !== new Set(accountIds).size) throw new Error("حساب نامعتبر است");
  await createManualJournal({
    branchId,
    description: String(formData.get("description") ?? "").trim(),
    date: parseFormDate(formData.get("date")),
    lines: accountIds.map((accountId, i) => ({
      accountId,
      debit: debits[i] || 0,
      credit: credits[i] || 0,
      memo: memos[i],
    })),
  });
  revalidatePath("/accounting/journals");
  revalidatePath("/accounting/trial-balance");
  redirect("/accounting/journals");
}

export async function createPayrollAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageAccounting(user)) throw new Error("FORBIDDEN");
  const branchId = String(formData.get("branchId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  await assertBranchInScope(user, branchId);
  const employee = await prisma.user.findFirst({
    where: {
      id: userId,
      organizationId: user.organizationId,
      OR: [{ branchId }, { branchId: null }],
    },
  });
  if (!employee) throw new Error("پرسنل معتبر نیست");
  await createPayroll({
    organizationId: user.organizationId,
    branchId,
    userId,
    period: String(formData.get("period") ?? "").trim(),
    amount: num(formData.get("amount")),
    paid: formData.get("paid") === "on",
    note: String(formData.get("note") ?? ""),
  });
  revalidatePath("/accounting/payroll");
  revalidatePath("/accounting/trial-balance");
  redirect("/accounting/payroll");
}

export async function savePartyAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageInvoices(user)) throw new Error("FORBIDDEN");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("نام طرف‌حساب الزامی است");
  const type = String(formData.get("type") ?? "CUSTOMER") as "CUSTOMER" | "SUPPLIER";
  const phone = String(formData.get("phone") ?? "").trim();
  if (id) {
    const party = await prisma.party.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!party) throw new Error("FORBIDDEN");
    await prisma.party.update({ where: { id }, data: { name, type, phone } });
  } else {
    await prisma.party.create({
      data: {
        organizationId: user.organizationId,
        type,
        name,
        phone,
      },
    });
  }
  revalidatePath("/accounting/parties");
}
