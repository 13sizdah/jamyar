import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { journalSourceLabel, money, toJalali } from "@/lib/format";
import { canManageAccounting } from "@/lib/permissions";
import { scopedBranchIds } from "@/lib/scope";
import { PageHeader } from "@/components/ui";

export default async function JournalsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const ids = await scopedBranchIds(user);
  const entries = await prisma.journalEntry.findMany({
    where: { branchId: { in: ids } },
    include: { lines: true, branch: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="p-4">
      <PageHeader
        title="اسناد حسابداری"
        subtitle="دفتر روزنامه"
        action={
          canManageAccounting(user) ? (
            <Link className="btn" href="/accounting/journals/new">
              سند دستی
            </Link>
          ) : null
        }
      />
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>شماره</th>
              <th>تاریخ</th>
              <th>شعبه</th>
              <th>شرح</th>
              <th>منبع</th>
              <th>جمع</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link className="font-mono text-blue-400 hover:text-white" href={`/accounting/journals/${e.id}`}>
                    {e.number}
                  </Link>
                </td>
                <td className="font-mono text-xs text-text-secondary">{toJalali(e.date)}</td>
                <td>{e.branch.name}</td>
                <td>{e.description}</td>
                <td>{journalSourceLabel[e.source] ?? e.source}</td>
                <td className="font-mono">{money(e.lines.reduce((s, l) => s + Number(l.debit), 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
