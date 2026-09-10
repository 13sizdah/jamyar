import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { qty, toJalali } from "@/lib/format";
import { scopedBranchIds } from "@/lib/scope";
import { PageHeader } from "@/components/ui";

export default async function MovementsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const branchIds = await scopedBranchIds(user);
  const moves = await prisma.stockMovement.findMany({
    where: { warehouse: { branchId: { in: branchIds } } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { product: true, warehouse: { include: { branch: true } } },
  });

  return (
    <div className="p-4">
      <PageHeader title="حرکات انبار" subtitle="دفتر موجودی" />
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>تاریخ</th>
              <th>نوع</th>
              <th>کالا</th>
              <th>انبار</th>
              <th>مقدار</th>
              <th>توضیح</th>
            </tr>
          </thead>
          <tbody>
            {moves.map((m) => (
              <tr key={m.id}>
                <td className="font-mono text-xs text-text-secondary">{toJalali(m.createdAt)}</td>
                <td className="font-mono text-xs">{m.type}</td>
                <td>{m.product.name}</td>
                <td>
                  {m.warehouse.branch.name} / {m.warehouse.name}
                </td>
                <td className="font-mono">{qty(m.quantity)}</td>
                <td className="text-text-secondary text-xs">{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
