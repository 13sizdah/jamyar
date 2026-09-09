import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageStaff, isOwner } from "@/lib/permissions";
import { scopedBranchIds } from "@/lib/scope";
import { StaffForm } from "@/components/staff-form";

export default async function NewStaffPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canManageStaff(user)) redirect("/staff");
  const ids = await scopedBranchIds(user);
  const branches = await prisma.branch.findMany({
    where: { organizationId: user.organizationId, id: { in: ids } },
  });
  return <StaffForm branches={branches} canAssignOwner={isOwner(user)} />;
}
