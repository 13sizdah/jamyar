"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageStaff, isOwner } from "@/lib/permissions";
import { assertBranchInScope } from "@/lib/scope";

export async function saveStaffAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageStaff(user)) throw new Error("FORBIDDEN");

  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "STAFF") as Role;
  if (role === "OWNER" && !isOwner(user)) throw new Error("FORBIDDEN");

  const branchIdRaw = String(formData.get("branchId") ?? "");
  const branchId = role === "OWNER" ? null : branchIdRaw || null;
  if (branchId) await assertBranchInScope(user, branchId);
  if (!isOwner(user) && !["STAFF", "WAREHOUSE"].includes(role)) throw new Error("FORBIDDEN");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const active = formData.get("active") === "on";
  const password = String(formData.get("password") ?? "");

  if (!name || !email) throw new Error("نام و ایمیل الزامی است");

  if (id) {
    const existing = await prisma.user.findUniqueOrThrow({ where: { id } });
    if (existing.organizationId !== user.organizationId) throw new Error("FORBIDDEN");
    if (!isOwner(user) && existing.branchId !== user.branchId) throw new Error("FORBIDDEN");
    if (!isOwner(user) && existing.role !== "STAFF" && existing.role !== "WAREHOUSE") {
      throw new Error("FORBIDDEN");
    }
    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        notes,
        role,
        branchId,
        active,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
    });
  } else {
    if (!password) throw new Error("رمز عبور برای کاربر جدید الزامی است");
    await prisma.user.create({
      data: {
        organizationId: user.organizationId,
        branchId,
        name,
        email,
        phone,
        notes,
        role,
        active,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
  }
  revalidatePath("/staff");
  redirect("/staff");
}

export async function deactivateStaffAction(formData: FormData) {
  const user = await requireSession();
  if (!canManageStaff(user)) throw new Error("FORBIDDEN");
  const id = String(formData.get("id") ?? "");
  if (id === user.id) throw new Error("نمی‌توانید خودتان را غیرفعال کنید");
  const existing = await prisma.user.findUniqueOrThrow({ where: { id } });
  if (existing.organizationId !== user.organizationId) throw new Error("FORBIDDEN");
  if (!isOwner(user) && existing.branchId !== user.branchId) throw new Error("FORBIDDEN");
  if (!isOwner(user) && existing.role !== "STAFF" && existing.role !== "WAREHOUSE") {
    throw new Error("FORBIDDEN");
  }
  await prisma.user.update({ where: { id }, data: { active: false } });
  revalidatePath("/staff");
}
