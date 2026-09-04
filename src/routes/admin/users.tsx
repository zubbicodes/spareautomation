import { createFileRoute, redirect } from "@tanstack/react-router";
import { KeyRound, Loader2, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  Avatar,
  ChipSelect,
  EmptyState,
  FootBar,
  formatDate,
  Notice,
  SearchField,
} from "@/components/admin/cms-ui";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import {
  createStaffUser,
  listStaffUsers,
  resetStaffPassword,
  updateStaffUser,
} from "@/lib/admin/users.functions";

export const Route = createFileRoute("/admin/users")({
  head: () => cmsHead("Users"),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    if (staff.role !== "admin") throw redirect({ to: "/admin" });
    return { staff, users: await listStaffUsers() };
  },
  component: UsersPage,
});

function UsersPage() {
  const loaded = Route.useLoaderData();
  const [users, setUsers] = useState(loaded.users);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  async function refresh() {
    setUsers(await listStaffUsers());
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const result = await createStaffUser({
        data: {
          email: String(data.get("email")),
          name: String(data.get("name")),
          role: String(data.get("role")) as "admin" | "staff",
          temporaryPassword: String(data.get("password")),
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      form.reset();
      setShowCreate(false);
      setMessage("User created. They must change the temporary password at first sign-in.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function update(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const result = await updateStaffUser({
        data: {
          id,
          name: String(data.get("name")),
          role: String(data.get("role")) as "admin" | "staff",
          isActive: data.get("active") === "on",
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("User updated.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function reset(id: number) {
    const temporaryPassword = prompt(
      "Enter a new temporary password (12+ characters, upper and lower case plus a number)",
    );
    if (!temporaryPassword) return;
    setError("");
    setMessage("");
    const result = await resetStaffPassword({ data: { id, temporaryPassword } });
    if (!result.ok) setError(result.error);
    else {
      setMessage("Password reset. Existing sessions for that user were signed out.");
      await refresh();
    }
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter === "admin" && user.role !== "admin") return false;
      if (roleFilter === "staff" && user.role !== "staff") return false;
      if (roleFilter === "inactive" && user.isActive) return false;
      if (!needle) return true;
      return (
        user.name.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle)
      );
    });
  }, [users, query, roleFilter]);

  return (
    <CmsShell
      staff={loaded.staff}
      eyebrow="Administration"
      title="Users"
      subtitle="Staff can edit and preview drafts. Administrators can also publish, restore revisions, manage media and manage accounts."
      actions={
        <button
          type="button"
          className="cms-btn cms-btn-primary"
          onClick={() => setShowCreate((open) => !open)}
        >
          <UserPlus aria-hidden="true" /> {showCreate ? "Close" : "New user"}
        </button>
      }
    >
      {message ? (
        <div style={{ marginBottom: 12 }}>
          <Notice tone="success">{message}</Notice>
        </div>
      ) : null}
      {error ? (
        <div style={{ marginBottom: 12 }}>
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}

      {showCreate ? (
        <form onSubmit={create} className="cms-card cms-card-pad" style={{ marginBottom: 14 }}>
          <div
            className="cms-grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(206px, 1fr))" }}
          >
            <label className="cms-field">
              <span className="cms-label">Full name</span>
              <input name="name" required className="cms-input" />
            </label>
            <label className="cms-field">
              <span className="cms-label">Email</span>
              <input name="email" type="email" required className="cms-input" />
            </label>
            <label className="cms-field">
              <span className="cms-label">Role</span>
              <select name="role" className="cms-select">
                <option value="staff">Staff — edit drafts</option>
                <option value="admin">Administrator — publish and manage</option>
              </select>
            </label>
            <label className="cms-field">
              <span className="cms-label">Temporary password</span>
              <input name="password" type="password" minLength={12} required className="cms-input" />
              <span className="cms-hint">12+ characters, upper and lower case plus a number.</span>
            </label>
          </div>
          <div className="cms-row-inline" style={{ marginTop: 12 }}>
            <button disabled={busy} className="cms-btn cms-btn-primary">
              {busy ? (
                <Loader2 aria-hidden="true" className="cms-spin" />
              ) : (
                <UserPlus aria-hidden="true" />
              )}{" "}
              Create user
            </button>
            <button type="button" className="cms-btn" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="cms-filters">
        <ChipSelect
          label="Role"
          value={roleFilter}
          options={[
            { value: "all", label: "All users" },
            { value: "admin", label: "Administrators" },
            { value: "staff", label: "Staff" },
            { value: "inactive", label: "Inactive" },
          ]}
          onChange={setRoleFilter}
        />
        <SearchField
          value={query}
          onChange={setQuery}
          label="Search users"
          placeholder="Name or email"
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Users aria-hidden="true" />}
          title="No users match these filters"
          copy="Change the role filter or clear the search."
        />
      ) : (
        <>
          <div className="cms-list">
            {visible.map((user) => (
              <form
                key={user.id}
                onSubmit={(event) => void update(event, user.id)}
                className="cms-row"
                style={{
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ["--cms-row-columns" as any]:
                    "28px minmax(0, 1.2fr) minmax(0, 1fr) 132px 104px 108px auto",
                }}
              >
                <Avatar name={user.name} small />
                <label style={{ minWidth: 0 }}>
                  <span className="cms-sr">Name for {user.email}</span>
                  <input name="name" defaultValue={user.name} required className="cms-input" />
                </label>
                <input
                  value={user.email}
                  disabled
                  className="cms-input"
                  aria-label={`Email for ${user.name}`}
                />
                <label>
                  <span className="cms-sr">Role for {user.email}</span>
                  <select name="role" defaultValue={user.role} className="cms-select">
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="cms-checkbox">
                  <input name="active" type="checkbox" defaultChecked={user.isActive} />
                  Active
                </label>
                <span className="cms-row-date">
                  {formatDate(user.createdAt)}
                  {user.mustChangePassword ? (
                    <>
                      <br />
                      <span className="cms-badge cms-badge-warning">Reset due</span>
                    </>
                  ) : null}
                </span>
                <span className="cms-row-actions">
                  <button disabled={busy} className="cms-btn cms-btn-sm">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => void reset(user.id)}
                    className="cms-btn cms-btn-sm cms-btn-icon"
                    title={`Reset password for ${user.email}`}
                    aria-label={`Reset password for ${user.email}`}
                  >
                    <KeyRound aria-hidden="true" />
                  </button>
                </span>
              </form>
            ))}
          </div>
          <FootBar
            shown={visible.length}
            total={users.length}
            page={1}
            pageCount={1}
            noun="users"
            onChange={() => undefined}
          />
        </>
      )}

      <p className="cms-hint" style={{ marginTop: 14, display: "flex", gap: 7 }}>
        <ShieldCheck aria-hidden="true" style={{ width: 15, height: 15 }} />
        The final active administrator cannot be demoted or deactivated, and no one can deactivate
        their own account.
      </p>
    </CmsShell>
  );
}
