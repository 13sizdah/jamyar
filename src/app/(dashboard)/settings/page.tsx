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
    }),
    prisma.unit.findMany({ where: { organizationId: user.organizationId } }),
  ]);

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="تنظیمات" subtitle="ORG · BRANCH · UNIT" />
      <section className="tech-card p-4 rounded-md">
        <h3 className="text-sm font-semibold mb-3">شعب</h3>
        <form action={saveBranchAction} className="grid gap-3 md:grid-cols-3 mb-4">
          <div>
            <label>NAME</label>
            <input name="name" required />
          </div>
          <div>
            <label>CITY</label>
            <input name="city" />
          </div>
          <div className="flex items-end">
            <button className="btn" type="submit">
              افزودن شعبه
            </button>
          </div>
        </form>
        <div className="space-y-3">
          {branches.map((b) => (
            <div key={b.id} className="border border-border rounded-md p-3">
              <p className="font-medium">
                {b.name} <span className="text-text-secondary text-xs font-mono">{b.city}</span>
              </p>
              <p className="text-xs text-text-secondary mt-1">{b.warehouses.map((w) => w.name).join(" · ") || "بدون انبار"}</p>
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
