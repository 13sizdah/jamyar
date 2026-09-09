import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toJalali } from "@/lib/format";
import { canManageStaff, roleLabel } from "@/lib/permissions";
import { scopedBranchIds } from "@/lib/scope";
import { deactivateStaffAction } from "@/app/actions/staff";
import { PageHeader } from "@/components/ui";

export default async function StaffPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const branchIds = await scopedBranchIds(user);
  const people = await prisma.user.findMany({
    where: {
      organizationId: user.organizationId,
      ...(user.role === "OWNER" || user.role === "ACCOUNTANT" ? {} : { OR: [{ branchId: { in: branchIds } }, { id: user.id }] }),
    },
    include: { branch: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4">
      <PageHeader
        title="پرسنل"
        subtitle="PEOPLE · ACCESS"
        action={
          canManageStaff(user) ? (
            <Link className="btn" href="/staff/new">
              کاربر جدید
            </Link>
          ) : null
        }
      />
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>نام</th>
              <th>ایمیل</th>
              <th>نقش</th>
              <th>شعبه</th>
              <th>استخدام</th>
              <th>وضعیت</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="font-mono text-xs text-text-secondary">{p.email}</td>
                <td>{roleLabel[p.role]}</td>
                <td>{p.branch?.name ?? "همه شعب"}</td>
                <td className="font-mono text-xs">{toJalali(p.hiredAt)}</td>
                <td className={p.active ? "text-green-400 font-mono text-xs" : "text-rose-400 font-mono text-xs"}>
                  {p.active ? "ACTIVE" : "OFF"}
                </td>
                <td className="flex gap-2">
                  {canManageStaff(user) ? (
                    <Link className="font-mono text-xs text-text-secondary hover:text-white" href={`/staff/${p.id}`}>
                      EDIT
                    </Link>
                  ) : null}
                  {canManageStaff(user) && p.active && p.id !== user.id ? (
                    <form action={deactivateStaffAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="font-mono text-xs text-rose-400" type="submit">
                        DISABLE
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
