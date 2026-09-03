import { Link, useNavigate } from "@tanstack/react-router";
import { FileText, Images, KeyRound, LogOut, ShieldCheck, Users } from "lucide-react";
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

      <nav aria-label="CMS sections" className="border-b border-rule bg-surface">
        <div className="mx-auto flex max-w-[1400px] flex-wrap gap-1 px-4 py-2 md:px-6">
          <Link to="/admin" search={{ type: "all", status: "all", search: "", page: 1 }} className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:text-accent"><FileText className="h-4 w-4" /> Submissions</Link>
          <Link to="/admin/content" className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:text-accent"><FileText className="h-4 w-4" /> Content</Link>
          <Link to="/admin/media" className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:text-accent"><Images className="h-4 w-4" /> Media</Link>
          {staff.role === "admin" ? <Link to="/admin/users" className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:text-accent"><Users className="h-4 w-4" /> Users</Link> : null}
          <Link to="/admin/change-password" className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:text-accent"><KeyRound className="h-4 w-4" /> Password</Link>
        </div>
      </nav>

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
