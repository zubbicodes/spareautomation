import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Check, KeyRound, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { CmsShell } from "@/components/admin/CmsShell";
import { Notice, SectionCard, Spinner } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogout, getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import { changeOwnPassword } from "@/lib/admin/users.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/change-password")({
  head: () => cmsHead("Change password"),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    return { staff };
  },
  component: ChangePasswordPage,
});

/** Mirrors the server-side rules in `validatePassword`. */
const RULES = [
  { label: "At least 12 characters", test: (value: string) => value.length >= 12 },
  { label: "An upper case letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "A lower case letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "A number", test: (value: string) => /\d/.test(value) },
];

function ChangePasswordPage() {
  const { staff } = Route.useLoaderData();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const passed = RULES.map((rule) => rule.test(password));
  const strong = passed.every(Boolean);
  const matches = confirmation.length > 0 && password === confirmation;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await changeOwnPassword({ data: { password, confirmation } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Password changed", { description: "Sign in again with your new password." });
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
      title="Change password"
      subtitle={
        staff.mustChangePassword
          ? "A new password is required before you can use the CMS."
          : "Choose a new password for your CMS account."
      }
    >
      {staff.mustChangePassword ? (
        <div className="mb-4 max-w-lg">
          <Notice tone="warning" title="Temporary password in use">
            Your account was created with a temporary password. Set your own to continue.
          </Notice>
        </div>
      ) : null}

      <div className="max-w-lg">
        <SectionCard>
          <form onSubmit={submit} className="space-y-4 p-4">
            <p className="text-[13px] text-muted-foreground">
              Changing your password signs out every existing session, including this one.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[12.5px] font-medium">
                New password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                maxLength={200}
                required
                autoComplete="new-password"
              />
            </div>

            <ul className="space-y-1">
              {RULES.map((rule, index) => (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    passed[index] ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {passed[index] ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    <X className="size-3.5 opacity-50" aria-hidden="true" />
                  )}
                  {rule.label}
                </li>
              ))}
            </ul>

            <div className="space-y-1.5">
              <Label htmlFor="confirmation" className="text-[12.5px] font-medium">
                Confirm password
              </Label>
              <Input
                id="confirmation"
                name="confirmation"
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                maxLength={200}
                required
                autoComplete="new-password"
                aria-invalid={confirmation.length > 0 && !matches ? true : undefined}
              />
              {confirmation.length > 0 && !matches ? (
                <p className="text-xs text-destructive">Passwords do not match.</p>
              ) : null}
            </div>

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <Button type="submit" disabled={busy || !strong || !matches}>
              {busy ? <Spinner /> : <KeyRound />} Change password
            </Button>
          </form>
        </SectionCard>
      </div>
    </CmsShell>
  );
}
