"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { logoutAction } from "@/app/actions/auth";
import type { NavItem } from "@/lib/permissions";

export function Sidebar({
  items,
  userName,
  roleLabel,
  isOpen,
  onClose,
}: {
  items: NavItem[];
  userName: string;
  roleLabel: string;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      {isOpen ? <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} /> : null}
      <aside
        className={clsx(
          "w-64 border-l border-border flex flex-col justify-between p-6 bg-background shrink-0 z-50 transition-transform duration-300",
          "fixed lg:relative h-full right-0",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
      >
        <div className="min-h-0 flex-1 overflow-auto">
          <Link href="/" className="mb-10 flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={onClose}>
            <div className="logo-mark h-8 w-8 bg-white text-black flex items-center justify-center font-bold font-mono text-lg rounded-sm">
              J
            </div>
            <h1 className="font-bold text-lg tracking-tight">JAMYAR</h1>
          </Link>
          <nav className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors group",
                  isActive(item.href)
                    ? "text-white bg-surface border border-border"
                    : "text-text-secondary hover:text-white hover:bg-surface/50 border border-transparent",
                )}
              >
                <span className="material-icons-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <Link href="/profile" onClick={onClose} className="text-sm text-white hover:underline">
              {userName}
            </Link>
            <p className="text-[10px] text-text-muted font-mono mt-0.5">{roleLabel}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="flex items-center gap-2 text-xs text-text-secondary hover:text-white transition-colors font-mono">
              <span className="material-icons-outlined text-[16px]">logout</span>
              خروج
            </button>
          </form>
          <div className="text-[10px] text-text-muted font-mono">v0.1.0 · Next.js</div>
        </div>
      </aside>
    </>
  );
}
