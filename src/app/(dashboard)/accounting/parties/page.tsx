import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { savePartyAction } from "@/app/actions/accounting";
import { PageHeader } from "@/components/ui";

export default async function PartiesPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const parties = await prisma.party.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4">
      <PageHeader title="طرف‌حساب" subtitle="AR · AP" />
      <form action={savePartyAction} className="tech-card mb-3 grid gap-3 p-3 rounded-md md:grid-cols-4">
        <div>
          <label>TYPE</label>
          <select name="type">
            <option value="CUSTOMER">مشتری</option>
            <option value="SUPPLIER">تأمین‌کننده</option>
          </select>
        </div>
        <div>
          <label>NAME</label>
          <input name="name" required />
        </div>
        <div>
          <label>PHONE</label>
          <input name="phone" />
        </div>
        <div className="flex items-end">
          <button className="btn w-full" type="submit">
            افزودن
          </button>
        </div>
      </form>
      <div className="tech-card rounded-md overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>نام</th>
              <th>نوع</th>
              <th>تلفن</th>
            </tr>
          </thead>
          <tbody>
            {parties.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="font-mono text-xs">{p.type}</td>
                <td className="font-mono text-xs text-text-secondary">{p.phone || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
