import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { journalSourceLabel, money, toJalali } from "@/lib/format";
import { scopedBranchIds } from "@/lib/scope";
import { BackLink, PageHeader } from "@/components/ui";

export default async function JournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;
  const ids = await scopedBranchIds(user);
  const entry = await prisma.journalEntry.findFirst({
    where: { id, branchId: { in: ids } },
    include: {
      branch: true,
      lines: { include: { account: true } },
      invoice: true,
      payroll: { include: { user: true } },
    },
  });
  if (!entry) notFound();
  const debit = entry.lines.reduce((s, l) => s + Number(l.debit), 0);
  const credit = entry.lines.reduce((s, l) => s + Number(l.credit), 0);

  return (
    <div className="p-4">
      <BackLink href="/accounting/journals" label="اسناد" />
      <PageHeader title={entry.number} subtitle={`${journalSourceLabel[entry.source]} · ${entry.branch.name}`} />
      <p className="text-sm text-text-secondary mb-3">
        {entry.description} · {toJalali(entry.date)}
      </p>
      {entry.invoice ? (
        <p className="text-sm mb-3">
          فاکتور{" "}
          <Link className="font-mono text-blue-400 hover:text-white" href={`/accounting/invoices/${entry.invoice.id}`}>
            {entry.invoice.number}
          </Link>
        </p>
      ) : null}
      {entry.payroll ? (
        <p className="text-sm mb-3">
          حقوق {entry.payroll.period} · {entry.payroll.user.name}
        </p>
      ) : null}
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>کد</th>
              <th>حساب</th>
              <th>شرح</th>
              <th>بدهکار</th>
              <th>بستانکار</th>
            </tr>
          </thead>
          <tbody>
            {entry.lines.map((l) => (
              <tr key={l.id}>
                <td className="font-mono text-xs text-blue-400">{l.account.code}</td>
                <td>{l.account.name}</td>
                <td className="text-text-secondary text-xs">{l.memo || "—"}</td>
                <td className="font-mono">{money(l.debit)}</td>
                <td className="font-mono">{money(l.credit)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3}>جمع</td>
              <td className="font-mono">{money(debit)}</td>
              <td className="font-mono">{money(credit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
