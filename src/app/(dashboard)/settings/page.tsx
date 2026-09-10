import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageSettings } from "@/lib/permissions";
import { saveBranchAction, saveUnitAction, saveWarehouseAction } from "@/app/actions/settings";
import { PageHeader } from "@/components/ui";

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canManageSettings(user)) redirect("/");
  const [branches, units] = await Promise.all([
    prisma.branch.findMany({
      where: { organizationId: user.organizationId },
      include: { warehouses: true },
      orderBy: { name: "asc" },
    }),
    prisma.unit.findMany({ where: { organizationId: user.organizationId } }),
  ]);

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="تنظیمات" subtitle="سازمان · شعبه · واحد" />
      <section className="tech-card p-4 rounded-md">
        <h3 className="text-sm font-semibold mb-3">شعبه جدید</h3>
        <form action={saveBranchAction} className="grid gap-3 md:grid-cols-3 mb-4">
          <div>
            <label>نام</label>
            <input name="name" required />
          </div>
          <div>
            <label>شهر</label>
            <input name="city" />
          </div>
          <div className="flex items-end">
            <button className="btn" type="submit">
              افزودن شعبه
            </button>
          </div>
        </form>
        <h3 className="text-sm font-semibold mb-3">شعب موجود</h3>
        <div className="space-y-3">
          {branches.map((b) => (
            <div key={b.id} className="border border-border rounded-md p-3">
              <form action={saveBranchAction} className="grid gap-2 md:grid-cols-4 items-end">
                <input type="hidden" name="id" value={b.id} />
                <div>
                  <label>نام</label>
                  <input name="name" required defaultValue={b.name} />
                </div>
                <div>
                  <label>شهر</label>
                  <input name="city" defaultValue={b.city} />
                </div>
                <label className="flex items-center gap-2 text-sm !font-sans normal-case tracking-normal pb-2">
                  <input className="w-auto" type="checkbox" name="active" defaultChecked={b.active} />
                  فعال
                </label>
                <button className="btn" type="submit">
                  ذخیره شعبه
                </button>
              </form>
              <p className="text-xs text-text-secondary mt-2">{b.warehouses.map((w) => w.name).join(" · ") || "بدون انبار"}</p>
              <form action={saveWarehouseAction} className="mt-2 flex gap-2">
                <input type="hidden" name="branchId" value={b.id} />
                <input name="name" placeholder="نام انبار" required />
                <button className="btn-ghost rounded-md px-3 text-xs" type="submit">
                  انبار
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
      <section className="tech-card p-4 rounded-md">
        <h3 className="text-sm font-semibold mb-3">واحدها</h3>
        <form action={saveUnitAction} className="flex gap-2 max-w-md">
          <input name="name" placeholder="مثلاً کارتن" required />
          <button className="btn" type="submit">
            افزودن
          </button>
        </form>
        <p className="mt-2 text-xs font-mono text-text-muted">{units.map((u) => u.name).join(" · ")}</p>
      </section>
    </div>
  );
}
