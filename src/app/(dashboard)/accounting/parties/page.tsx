import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { savePartyAction } from "@/app/actions/accounting";
import { canManageInvoices } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";

export default async function PartiesPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const parties = await prisma.party.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: "asc" },
  });
  const canEdit = canManageInvoices(user);

  return (
    <div className="p-4">
      <PageHeader title="طرف‌حساب" subtitle="مشتری و تأمین‌کننده" />
      {canEdit ? (
        <form action={savePartyAction} className="tech-card mb-3 grid gap-3 p-3 rounded-md md:grid-cols-4">
          <div>
            <label>نوع</label>
            <select name="type">
              <option value="CUSTOMER">مشتری</option>
              <option value="SUPPLIER">تأمین‌کننده</option>
            </select>
          </div>
          <div>
            <label>نام</label>
            <input name="name" required />
          </div>
          <div>
            <label>تلفن</label>
            <input name="phone" />
          </div>
          <div className="flex items-end">
            <button className="btn w-full" type="submit">
              افزودن
            </button>
          </div>
        </form>
      ) : null}
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>نام</th>
              <th>نوع</th>
              <th>تلفن</th>
              {canEdit ? <th></th> : null}
            </tr>
          </thead>
          <tbody>
            {parties.map((p) =>
              canEdit ? (
                <tr key={p.id}>
                  <td colSpan={4} className="p-2">
                    <form action={savePartyAction} className="grid gap-2 md:grid-cols-4 items-end">
                      <input type="hidden" name="id" value={p.id} />
                      <input name="name" required defaultValue={p.name} />
                      <select name="type" defaultValue={p.type}>
                        <option value="CUSTOMER">مشتری</option>
                        <option value="SUPPLIER">تأمین‌کننده</option>
                      </select>
                      <input name="phone" defaultValue={p.phone} />
                      <button className="btn" type="submit">
                        ذخیره
                      </button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.type === "CUSTOMER" ? "مشتری" : "تأمین‌کننده"}</td>
                  <td className="font-mono text-xs text-text-secondary">{p.phone || "—"}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
