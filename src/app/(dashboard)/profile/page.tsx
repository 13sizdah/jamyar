import { redirect } from "next/navigation";
import { changePasswordAction } from "@/app/actions/auth";
import { getSession } from "@/lib/auth";
import { roleLabel } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";

const errors: Record<string, string> = {
  short: "رمز جدید باید حداقل ۸ نویسه باشد.",
  mismatch: "رمز جدید و تکرار آن یکسان نیست.",
  current: "رمز فعلی نادرست است.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { error, ok } = await searchParams;

  return (
    <div className="p-4 max-w-xl">
      <PageHeader title="حساب من" subtitle="تغییر رمز عبور" />
      <div className="tech-card p-4 rounded-md mb-3">
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-text-secondary font-mono mt-1">{user.email}</p>
        <p className="text-xs text-text-muted mt-1">{roleLabel[user.role]}</p>
      </div>
      <form action={changePasswordAction} className="tech-card space-y-4 p-4 rounded-md">
        <div>
          <label>رمز فعلی</label>
          <input name="current" type="password" required autoComplete="current-password" />
        </div>
        <div>
          <label>رمز جدید</label>
          <input name="next" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <div>
          <label>تکرار رمز جدید</label>
          <input name="confirm" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        {error ? <p className="text-sm text-rose-400">{errors[error] ?? "خطا در تغییر رمز."}</p> : null}
        {ok ? <p className="text-sm text-green-400">رمز با موفقیت عوض شد.</p> : null}
        <button className="btn" type="submit">
          ذخیره رمز
        </button>
      </form>
    </div>
  );
}
