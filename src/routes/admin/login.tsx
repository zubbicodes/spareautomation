import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { adminLogin, getAdminSession } from "@/lib/admin/admin.functions";
import { useHydrated } from "@/hooks/use-hydrated";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Admin Sign In | Spares Automation" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  loader: async () => {
    const staff = await getAdminSession();
    if (staff) {
      throw redirect({ to: "/admin", search: { type: "all", status: "all", search: "", page: 1 } });
    }
    return {};
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");

    try {
      const result = await adminLogin({
        data: {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        },
      });
      if (!result.ok) {
        setError(result.error ?? "Sign in failed.");
        return;
      }
      void navigate({ to: "/admin", search: { type: "all", status: "all", search: "", page: 1 } });
    } catch {
      setError("We could not sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-deep px-4 text-white">
      <div className="w-full max-w-md border border-white/15 bg-charcoal p-8">
        <div className="mb-8 flex h-12 w-12 items-center justify-center bg-accent text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">Staff access</div>
        <h1 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight">Admin sign in</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Restricted area for Spares Automation staff managing form submissions.
        </p>

        <form method="post" onSubmit={handleSubmit} className="mt-8 grid gap-5">
          <label className="grid gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">Email address</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              className="h-12 border border-white/20 bg-white/5 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-accent"
            />
          </label>
          <label className="grid gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-12 border border-white/20 bg-white/5 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-accent"
            />
          </label>

          {error ? (
            <div role="alert" className="border border-red-400/40 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
              {error}
            </div>
          ) : null}

          <button
            disabled={busy || !hydrated}
            className="inline-flex h-12 items-center justify-center gap-2 bg-accent px-6 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
