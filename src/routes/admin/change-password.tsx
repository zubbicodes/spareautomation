import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminLogout, getAdminSession } from "@/lib/admin/admin.functions";
import { changeOwnPassword } from "@/lib/admin/users.functions";

export const Route = createFileRoute("/admin/change-password")({
  head: () => ({ meta: [{ title: "Change password | Spares Automation CMS" }, { name: "robots", content: "noindex, nofollow" }] }),
  loader: async () => { const staff = await getAdminSession(); if (!staff) throw redirect({ to: "/admin/login" }); return { staff }; },
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const { staff } = Route.useLoaderData(); const navigate = useNavigate(); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); try { const result = await changeOwnPassword({ data: { password: String(form.get("password")), confirmation: String(form.get("confirmation")) } }); if (!result.ok) { setError(result.error); return; } await adminLogout(); void navigate({ to: "/admin/login" }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Password could not be changed."); } }
  return <AdminShell staff={staff} title="Change password" eyebrow={staff.mustChangePassword ? "Required before continuing" : "Account security"}><form onSubmit={submit} className="grid max-w-xl gap-4 border border-rule bg-surface p-6"><p className="text-sm leading-6 text-ink-muted">Use at least 12 characters with upper-case, lower-case and numeric characters. Changing it signs out all existing sessions.</p><Field name="password" label="New password" /><Field name="confirmation" label="Confirm password" />{error ? <div role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}<button className="h-11 bg-accent px-5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white">Change password</button></form></AdminShell>;
}
function Field({ name, label }: { name: string; label: string }) { return <label className="grid gap-1.5"><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">{label}</span><input name={name} type="password" minLength={12} maxLength={200} required autoComplete="new-password" className="h-11 border border-rule bg-background px-3 text-sm outline-none focus:border-accent" /></label>; }
