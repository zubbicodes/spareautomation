import { createFileRoute, redirect } from "@tanstack/react-router";
import { KeyRound, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { createStaffUser, listStaffUsers, resetStaffPassword, updateStaffUser } from "@/lib/admin/users.functions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users | Spares Automation CMS" }, { name: "robots", content: "noindex, nofollow" }] }),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    if (staff.role !== "admin") throw redirect({ to: "/admin", search: { type: "all", status: "all", search: "", page: 1 } });
    return { staff, users: await listStaffUsers() };
  },
  component: UsersPage,
});

function UsersPage() {
  const loaded = Route.useLoaderData();
  const [users, setUsers] = useState(loaded.users);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function refresh() { setUsers(await listStaffUsers()); }
  async function create(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); const form = new FormData(event.currentTarget); const result = await createStaffUser({ data: { email: String(form.get("email")), name: String(form.get("name")), role: String(form.get("role")) as "admin" | "staff", temporaryPassword: String(form.get("password")) } }); if (!result.ok) setError(result.error); else { event.currentTarget.reset(); setMessage("User created. They must change the temporary password at first sign-in."); await refresh(); } }
  return <AdminShell staff={loaded.staff} title="CMS users" eyebrow="Administration">
    <form onSubmit={create} className="grid gap-3 border border-rule bg-surface p-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_160px_1fr_auto] xl:items-end">
      <Field name="name" label="Name" /><Field name="email" label="Email" type="email" /><label className="grid gap-1.5"><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">Role</span><select name="role" className="h-11 border border-rule bg-background px-3 text-sm"><option value="staff">Staff</option><option value="admin">Administrator</option></select></label><Field name="password" label="Temporary password" type="password" minLength={12} /><button className="inline-flex h-11 items-center justify-center gap-2 bg-accent px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white"><UserPlus className="h-4 w-4" /> Create</button>
    </form>
    {message ? <div className="mt-4 border border-green-300 bg-green-50 p-3 text-sm text-green-800">{message}</div> : null}{error ? <div role="alert" className="mt-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
    <div className="mt-6 grid gap-3">{users.map((user) => <form key={user.id} onSubmit={async (event) => { event.preventDefault(); setError(""); const form = new FormData(event.currentTarget); const result = await updateStaffUser({ data: { id: user.id, name: String(form.get("name")), role: String(form.get("role")) as "admin" | "staff", isActive: form.get("active") === "on" } }); if (!result.ok) setError(result.error); else { setMessage("User updated."); await refresh(); } }} className="grid gap-3 border border-rule bg-surface p-4 md:grid-cols-[1fr_1fr_140px_110px_auto] md:items-end">
      <Field name="name" label="Name" defaultValue={user.name} /><label className="grid gap-1.5"><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">Email</span><input value={user.email} disabled className="h-11 border border-rule bg-background px-3 text-sm opacity-60" /></label><label className="grid gap-1.5"><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">Role</span><select name="role" defaultValue={user.role} className="h-11 border border-rule bg-background px-3 text-sm"><option value="staff">Staff</option><option value="admin">Admin</option></select></label><label className="flex h-11 items-center gap-2"><input name="active" type="checkbox" defaultChecked={user.isActive} /> Active</label><div className="flex gap-2"><button className="h-11 border border-rule px-3 text-xs font-semibold">Save</button><button type="button" title="Reset password" onClick={async () => { const temporaryPassword = prompt("Enter a new temporary password (12+ chars, upper/lower-case and number)"); if (!temporaryPassword) return; const result = await resetStaffPassword({ data: { id: user.id, temporaryPassword } }); if (!result.ok) setError(result.error); else setMessage("Password reset; existing sessions were invalidated."); }} className="h-11 border border-rule px-3"><KeyRound className="h-4 w-4" /></button></div>
    </form>)}</div>
  </AdminShell>;
}

function Field({ label, ...input }: { name: string; label: string; type?: string; defaultValue?: string; minLength?: number }) { return <label className="grid gap-1.5"><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">{label}</span><input {...input} required className="h-11 border border-rule bg-background px-3 text-sm outline-none focus:border-accent" /></label>; }
