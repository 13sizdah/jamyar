import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { getSession } from "@/lib/auth";
import { ThemeToggleButton } from "@/components/ThemeProvider";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");
  const { error } = await searchParams;
  return (
    <div className="h-screen grid place-items-center p-6 bg-background">
      <div className="absolute top-4 left-4">
        <ThemeToggleButton />
      </div>
      <div className="tech-card w-full max-w-md rounded-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="logo-mark h-8 w-8 bg-white text-black flex items-center justify-center font-bold font-mono text-lg rounded-sm">
            J
          </div>
          <h1 className="font-bold text-lg tracking-tight">JAMYAR</h1>
        </div>
        <p className="text-xs text-text-secondary">عملیات فروشگاه</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">ورود به پنل</h2>
        <form action={loginAction} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email">ایمیل</label>
            <input id="email" name="email" type="email" required autoComplete="username" className="font-mono" />
          </div>
          <div>
            <label htmlFor="password">رمز عبور</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {error ? <p className="text-sm text-rose-400">ایمیل یا رمز عبور نادرست است.</p> : null}
          <button className="btn w-full" type="submit">
            ورود
          </button>
        </form>
      </div>
    </div>
  );
}
