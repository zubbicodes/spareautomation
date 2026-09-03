import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import { Notice } from "@/components/admin/cms-ui";
import { adminLogout, getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import { changeOwnPassword } from "@/lib/admin/users.functions";

export const Route = createFileRoute("/admin/change-password")({
  head: () => cmsHead("Change password"),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    return { staff };
  },
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const { staff } = Route.useLoaderData();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await changeOwnPassword({
        data: {
          password: String(form.get("password")),
          confirmation: String(form.get("confirmation")),
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await adminLogout();
      void navigate({ to: "/admin/login" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Password could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CmsShell
      staff={staff}
      eyebrow="Account security"
      title="Change password"
      subtitle={
        staff.mustChangePassword
          ? "A new password is required before you can use the CMS."
          : "Choose a new password for your CMS account."
      }
    >
      {staff.mustChangePassword ? (
        <div style={{ marginBottom: 14 }}>
          <Notice tone="warning">
            Your account uses a temporary password. Set a new one to continue.
          </Notice>
        </div>
      ) : null}

      <form
        onSubmit={submit}
        className="cms-card cms-card-pad cms-stack"
        style={{ maxWidth: 480 }}
      >
        <p className="cms-muted">
          Use at least 12 characters with upper case, lower case and numeric characters. Changing your
          password signs out every existing session.
        </p>
        <label className="cms-field">
          <span className="cms-label">New password</span>
          <input
            name="password"
            type="password"
            minLength={12}
            maxLength={200}
            required
            autoComplete="new-password"
            className="cms-input"
          />
        </label>
        <label className="cms-field">
          <span className="cms-label">Confirm password</span>
          <input
            name="confirmation"
            type="password"
            minLength={12}
            maxLength={200}
            required
            autoComplete="new-password"
            className="cms-input"
          />
        </label>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <div>
          <button disabled={busy} className="cms-btn cms-btn-primary">
            {busy ? <Loader2 aria-hidden="true" className="cms-spin" /> : <KeyRound aria-hidden="true" />}{" "}
            Change password
          </button>
        </div>
      </form>
    </CmsShell>
  );
}
