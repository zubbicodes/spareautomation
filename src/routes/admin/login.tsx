import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Notice } from "@/components/admin/cms-ui";
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
    <div className="cms">
      <div className="cms-auth">
        <div className="cms-auth-card">
          <span className="cms-brand-mark" aria-hidden="true">
            <ShieldCheck />
          </span>
          <div className="cms-eyebrow" style={{ marginTop: 16 }}>
            Spares Automation
          </div>
          <h1 className="cms-title" style={{ fontSize: 20 }}>
            Admin sign in
          </h1>
          <p className="cms-subtitle" style={{ fontSize: 13 }}>
            Content platform for website copy, media, enquiries and accounts.
          </p>

          <form method="post" onSubmit={handleSubmit} className="cms-stack" style={{ marginTop: 20 }}>
            <label className="cms-field">
              <span className="cms-label">Email address</span>
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                className="cms-input"
              />
            </label>
            <label className="cms-field">
              <span className="cms-label">Password</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="cms-input"
              />
            </label>

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <button disabled={busy || !hydrated} className="cms-btn cms-btn-primary">
              {busy ? (
                <Loader2 aria-hidden="true" className="cms-spin" />
              ) : (
                <ShieldCheck aria-hidden="true" />
              )}
              Sign in
            </button>
          </form>

          <p className="cms-faint" style={{ marginTop: 16, fontSize: 12 }}>
            Access is restricted to Spares Automation staff. Sessions expire after 8 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
