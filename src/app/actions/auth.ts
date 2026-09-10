"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { clearSession, createSession, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    redirect("/login?error=1");
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) redirect("/login?error=1");
  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireSession();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next.length < 8) redirect("/profile?error=short");
  if (next !== confirm) redirect("/profile?error=mismatch");
  const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const ok = await bcrypt.compare(current, row.passwordHash);
  if (!ok) redirect("/profile?error=current");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });
  redirect("/profile?ok=1");
}
