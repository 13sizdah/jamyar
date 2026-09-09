"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { ThemeToggleButton } from "./ThemeProvider";
import type { NavItem } from "@/lib/permissions";

export function LayoutShell({
  items,
  userName,
  roleLabel,
  children,
}: {
  items: NavItem[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <button
        type="button"
        className="lg:hidden fixed top-3 right-3 z-50 text-text-secondary hover:text-white p-1 rounded-md bg-surface border border-border"
        onClick={() => setOpen(true)}
        aria-label="منو"
      >
        <span className="material-icons-outlined">menu</span>
      </button>
      <Sidebar items={items} userName={userName} roleLabel={roleLabel} isOpen={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="w-10 lg:hidden" />
          <p className="text-xs text-text-secondary font-mono hidden sm:block">STORE OPS · INVENTORY · LEDGER</p>
          <div className="flex items-center gap-3 mr-auto">
            <span className="text-[10px] font-mono text-green-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
            <ThemeToggleButton />
          </div>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
