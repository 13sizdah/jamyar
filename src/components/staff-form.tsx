import { Role } from "@prisma/client";
import { saveStaffAction } from "@/app/actions/staff";
import { roleLabel } from "@/lib/permissions";
import { BackLink, PageHeader } from "@/components/ui";

export function StaffForm({
  person,
  branches,
  canAssignOwner,
}: {
  person?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
    role: Role;
    branchId: string | null;
    active: boolean;
  };
  branches: { id: string; name: string }[];
  canAssignOwner: boolean;
}) {
  const roles = (Object.keys(roleLabel) as Role[]).filter((r) => canAssignOwner || r !== "OWNER");
  return (
    <div className="p-4 max-w-xl">
      <BackLink href="/staff" label="پرسنل" />
      <PageHeader title={person ? "ویرایش پرسنل" : "کاربر جدید"} subtitle="دسترسی‌ها" />
      <form action={saveStaffAction} className="tech-card space-y-4 p-4 rounded-md">
        {person ? <input type="hidden" name="id" value={person.id} /> : null}
        <div>
          <label>نام</label>
          <input name="name" required defaultValue={person?.name} />
        </div>
        <div>
          <label>ایمیل</label>
          <input name="email" type="email" required defaultValue={person?.email} className="font-mono" />
        </div>
        <div>
          <label>تلفن</label>
          <input name="phone" defaultValue={person?.phone} />
        </div>
        <div>
          <label>نقش</label>
          <select name="role" defaultValue={person?.role ?? "STAFF"}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>شعبه</label>
          <select name="branchId" defaultValue={person?.branchId ?? ""}>
            <option value="">— همه / بدون شعبه —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>رمز عبور {person ? "(خالی = بدون تغییر)" : ""}</label>
          <input name="password" type="password" required={!person} />
        </div>
        <div>
          <label>یادداشت</label>
          <textarea name="notes" rows={3} defaultValue={person?.notes} />
        </div>
        <label className="flex items-center gap-2 text-sm !font-sans normal-case tracking-normal">
          <input className="w-auto" type="checkbox" name="active" defaultChecked={person?.active ?? true} />
          فعال
        </label>
        <button className="btn" type="submit">
          ذخیره
        </button>
      </form>
    </div>
  );
}
