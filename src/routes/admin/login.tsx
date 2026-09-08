import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { ThemeToggle } from "@/components/admin/theme";
import { Notice, Spinner } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHydrated } from "@/hooks/use-hydrated";
import { adminLogin, getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";

export const Route = createFileRoute("/admin/login")({
  head: () => cmsHead("Sign in"),
  loader: async () => {
    const staff = await getAdminSession();
    if (staff) throw redirect({ to: "/admin" });
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
      if (result.mustChangePassword) void navigate({ to: "/admin/change-password" });
      else void navigate({ to: "/admin" });
    } catch {
      setError("We could not sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center gap-2.5 px-5 py-4">
        <span
          className="flex size-6.5 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground"
          aria-hidden="true"
        >
          SA
        </span>
        <span className="text-[13px] font-semibold">Spares Automation</span>
        <span className="ml-auto">
          <ThemeToggle />
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <span
              className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl border bg-card"
              aria-hidden="true"
            >
              <ShieldCheck className="size-5 text-primary" />
            </span>
            <h1 className="text-xl font-semibold tracking-tight">Sign in to the CMS</h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Website copy, media, enquiries and accounts.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12.5px] font-medium">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[12.5px] font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <Button type="submit" className="w-full" disabled={busy || !hydrated}>
              {busy ? <Spinner /> : null} Sign in
              {busy ? null : <ArrowRight />}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Access is restricted to Spares Automation staff. Sessions expire after 8 hours.
          </p>
        </div>
      </main>
    </div>
  );
}
