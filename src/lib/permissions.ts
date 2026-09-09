import { Role } from "@prisma/client";
import type { SessionUser } from "./auth";

export const roleLabel: Record<Role, string> = {
  OWNER: "مالک مجموعه",
  BRANCH_MANAGER: "مدیر شعبه",
  WAREHOUSE: "انباردار",
  ACCOUNTANT: "حسابدار",
  STAFF: "کارمند",
};

export function isOwner(user: SessionUser) {
  return user.role === "OWNER";
}

export function canAccessAllBranches(user: SessionUser) {
  return user.role === "OWNER" || user.role === "ACCOUNTANT";
}

export function branchScope(user: SessionUser): string | "all" {
  if (canAccessAllBranches(user)) return "all";
  return user.branchId ?? "none";
}

export function canManageStaff(user: SessionUser) {
  return user.role === "OWNER" || user.role === "BRANCH_MANAGER";
}

export function canManageInventory(user: SessionUser) {
  return ["OWNER", "BRANCH_MANAGER", "WAREHOUSE"].includes(user.role);
}

export function canManageAccounting(user: SessionUser) {
  return user.role === "OWNER" || user.role === "ACCOUNTANT";
}

export function canViewAccounting(user: SessionUser) {
  return ["OWNER", "ACCOUNTANT", "BRANCH_MANAGER"].includes(user.role);
}

export function canManageSettings(user: SessionUser) {
  return user.role === "OWNER";
}

export type NavItem = { href: string; label: string; icon: string };

export function navFor(user: SessionUser): NavItem[] {
  const items: NavItem[] = [
    { href: "/", label: "داشبورد", icon: "dashboard" },
    { href: "/inventory/products", label: "کالاها", icon: "inventory_2" },
    { href: "/inventory/stock", label: "موجودی", icon: "warehouse" },
    { href: "/inventory/movements", label: "حرکات انبار", icon: "swap_vert" },
  ];
  if (canManageInventory(user)) {
    items.push({ href: "/inventory/transfer", label: "انتقال", icon: "swap_horiz" });
  }
  items.push({ href: "/staff", label: "پرسنل", icon: "group" });
  if (canViewAccounting(user)) {
    items.push(
      { href: "/accounting/invoices", label: "فاکتورها", icon: "receipt_long" },
      { href: "/accounting/journals", label: "اسناد", icon: "menu_book" },
      { href: "/accounting/trial-balance", label: "تراز آزمایشی", icon: "balance" },
      { href: "/accounting/pnl", label: "سود و زیان", icon: "trending_up" },
      { href: "/accounting/payroll", label: "حقوق", icon: "payments" },
      { href: "/accounting/parties", label: "طرف‌حساب", icon: "handshake" },
      { href: "/accounting/accounts", label: "دفتر حساب‌ها", icon: "account_balance" },
    );
  }
  if (canManageSettings(user)) {
    items.push({ href: "/settings", label: "تنظیمات", icon: "settings" });
  }
  return items;
}
