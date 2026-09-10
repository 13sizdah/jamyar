export function money(value: number | string | { toString(): string }) {
  const n = Number(value);
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
}

export function qty(value: number | string | { toString(): string }) {
  const n = Number(value);
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 3 }).format(Number.isFinite(n) ? n : 0);
}

export function toJalali(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function toInputDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseFormDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return new Date();
  const d = new Date(`${raw}T12:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export const invoiceStatusLabel: Record<string, string> = {
  DRAFT: "پیش‌نویس",
  POSTED: "ثبت‌شده",
  VOIDED: "باطل",
};

export const invoiceTypeLabel: Record<string, string> = {
  SALE: "فروش",
  PURCHASE: "خرید",
};

export const journalSourceLabel: Record<string, string> = {
  MANUAL: "دستی",
  INVOICE: "فاکتور",
  PAYROLL: "حقوق",
};
