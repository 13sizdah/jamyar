import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewAccounting } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";

export default async function AccountsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canViewAccounting(user)) redirect("/");
  const accounts = await prisma.account.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { code: "asc" },
  });

  return (
    <div className="p-4">
      <PageHeader title="دفتر حساب‌ها" subtitle="COA" />
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>کد</th>
              <th>نام</th>
              <th>نوع</th>
              <th>کلید سیستم</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td className="font-mono text-blue-400">{a.code}</td>
                <td>{a.name}</td>
                <td className="font-mono text-xs text-text-secondary">{a.type}</td>
                <td className="font-mono text-xs">{a.systemKey ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
