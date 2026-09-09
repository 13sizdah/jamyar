import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageStaff, isOwner } from "@/lib/permissions";
import { scopedBranchIds } from "@/lib/scope";
import { StaffForm } from "@/components/staff-form";

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canManageStaff(user)) redirect("/staff");
  const { id } = await params;
  const ids = await scopedBranchIds(user);
  const [person, branches] = await Promise.all([
    prisma.user.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        ...(isOwner(user)
          ? {}
          : { branchId: user.branchId, role: { in: ["STAFF", "WAREHOUSE"] } }),
      },
    }),
    prisma.branch.findMany({ where: { organizationId: user.organizationId, id: { in: ids } } }),
  ]);
  if (!person) notFound();
  return <StaffForm person={person} branches={branches} canAssignOwner={isOwner(user)} />;
}
