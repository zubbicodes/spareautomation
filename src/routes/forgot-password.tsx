import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import { requestShopifyPasswordReset } from "@/lib/api/shopify.functions";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset Password | Spares Automation" }, { name: "robots", content: "noindex, follow" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    try {
      const response = await requestShopifyPasswordReset({ data: { email } });
      if (response.errors.length) setError(response.errors.map((item) => item.message).join(" "));
      else setMessage("If an account exists for that address, Shopify will send password-reset instructions.");
    } catch {
      setError("Password-reset instructions could not be requested. Please try again.");
    } finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-background text-ink"><SiteHeader /><main id="main-content" className="mx-auto max-w-[680px] px-4 py-12 md:px-6 md:py-20"><section className="border border-rule bg-surface p-6 md:p-9"><div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">Customer account</div><h1 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight">Reset password</h1><p className="mt-4 text-sm leading-6 text-ink-muted">Enter the email address used for your customer account.</p><form onSubmit={submit} className="mt-7 grid gap-4"><label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">Email address<input name="email" type="email" autoComplete="email" required className="h-12 border border-rule bg-background px-4 font-sans text-sm normal-case tracking-normal text-ink focus:border-accent focus:outline-none" /></label>{error ? <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}{message ? <p role="status" className="flex items-start gap-2 border border-accent/40 bg-accent/10 p-3 text-sm text-ink"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{message}</p> : null}<button disabled={busy} className="inline-flex h-12 items-center justify-center gap-2 bg-accent px-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white disabled:opacity-60">{busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}Send reset instructions</button><Link to="/login" className="text-sm font-semibold text-accent hover:underline">Return to sign in</Link></form></section></main><SiteFooter /></div>;
}
