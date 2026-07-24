import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { adminLogout, type AdminSession } from "@/lib/admin/admin.functions";

type AdminShellProps = {
  staff: AdminSession;
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export function AdminShell({ staff, title, eyebrow = "Admin", children }: AdminShellProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    await adminLogout();
    void navigate({ to: "/admin/login" });
  }

  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="border-b border-rule bg-charcoal-deep text-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center bg-accent text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <Link to="/admin" search={{ type: "all", status: "all", search: "", page: 1 }} className="font-display text-sm font-bold uppercase tracking-tight hover:text-accent">
                Spares Automation CMS
              </Link>
              <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/45">
                Submissions console
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold">{staff.name}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
                {staff.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-2 border border-white/20 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white transition-colors hover:border-accent hover:text-accent"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">{eyebrow}</div>
          <h1 className="mt-2 font-display text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
            {title}
          </h1>
        </div>
        {children}
      </main>
    </div>
  );
}
