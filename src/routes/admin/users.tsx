import { createFileRoute, redirect } from "@tanstack/react-router";
import { KeyRound, MoreHorizontal, Pencil, Search, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  EmptyState,
  formatDate,
  InitialsAvatar,
  Notice,
  Pill,
  SectionCard,
  Spinner,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import {
  createStaffUser,
  listStaffUsers,
  resetStaffPassword,
  updateStaffUser,
} from "@/lib/admin/users.functions";

type StaffUser = Awaited<ReturnType<typeof listStaffUsers>>[number];

const PASSWORD_HINT = "At least 12 characters, with upper and lower case letters and a number.";

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
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [resetting, setResetting] = useState<StaffUser | null>(null);

  async function refresh() {
    setUsers(await listStaffUsers());
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter === "admin" && user.role !== "admin") return false;
      if (roleFilter === "staff" && user.role !== "staff") return false;
      if (roleFilter === "inactive" && user.isActive) return false;
      if (!needle) return true;
      return user.name.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle);
    });
  }, [users, query, roleFilter]);

  return (
    <CmsShell
      staff={loaded.staff}
      title="Users"
      subtitle="Staff can edit and preview drafts. Administrators can also publish, restore revisions, manage media and manage accounts."
      actions={
        <Button size="sm" onClick={() => setCreating(true)}>
          <UserPlus /> New user
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or email…"
            aria-label="Search users"
            className="h-9 pl-8"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-9 w-44" aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            <SelectItem value="admin">Administrators</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No users match these filters"
          copy="Change the role filter or clear the search."
        />
      ) : (
        <SectionCard>
          <ul className="divide-y">
            {visible.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <InitialsAvatar name={user.name} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
                    {user.name}
                    {user.id === loaded.staff.id ? <Pill tone="neutral">You</Pill> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  {user.role === "admin" ? (
                    <Pill tone="accent" dot>
                      Administrator
                    </Pill>
                  ) : (
                    <Pill tone="neutral" dot>
                      Staff
                    </Pill>
                  )}
                  {user.isActive ? null : <Pill tone="danger">Inactive</Pill>}
                  {user.mustChangePassword ? <Pill tone="warning">Reset due</Pill> : null}
                </div>

                <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground sm:block">
                  {formatDate(user.createdAt)}
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Actions for ${user.name}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      onSelect={() => setEditing(user)}
                      className="gap-2 text-[13px]"
                    >
                      <Pencil className="size-4" aria-hidden="true" /> Edit account
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setResetting(user)}
                      className="gap-2 text-[13px]"
                    >
                      <KeyRound className="size-4" aria-hidden="true" /> Reset password
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <div className="mt-4">
        <Notice tone="info">
          <span className="flex items-start gap-2">
            <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            The final active administrator cannot be demoted or deactivated, and nobody can
            deactivate their own account. Resetting a password signs that user out everywhere.
          </span>
        </Notice>
      </div>

      <CreateUserDialog
        open={creating}
        onOpenChange={setCreating}
        busy={busy}
        onCreate={async (values) => {
          setBusy(true);
          try {
            const result = await createStaffUser({ data: values });
            if (!result.ok) {
              toast.error("User not created", { description: result.error });
              return false;
            }
            await refresh();
            toast.success("User created", {
              description: "They must change the temporary password at first sign-in.",
            });
            return true;
          } finally {
            setBusy(false);
          }
        }}
      />

      <EditUserDialog
        user={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        busy={busy}
        onSave={async (values) => {
          setBusy(true);
          try {
            const result = await updateStaffUser({ data: values });
            if (!result.ok) {
              toast.error("Change not applied", { description: result.error });
              return false;
            }
            await refresh();
            toast.success("Account updated");
            return true;
          } finally {
            setBusy(false);
          }
        }}
      />

      <ResetPasswordDialog
        user={resetting}
        onOpenChange={(open) => !open && setResetting(null)}
        busy={busy}
        onReset={async (id, temporaryPassword) => {
          setBusy(true);
          try {
            const result = await resetStaffPassword({ data: { id, temporaryPassword } });
            if (!result.ok) {
              toast.error("Password not reset", { description: result.error });
              return false;
            }
            await refresh();
            toast.success("Password reset", {
              description: "That user's existing sessions were signed out.",
            });
            return true;
          } finally {
            setBusy(false);
          }
        }}
      />
    </CmsShell>
  );
}

/* ---------------------------------------------------------------- dialogs */

function CreateUserDialog({
  open,
  onOpenChange,
  busy,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  onCreate: (values: {
    email: string;
    name: string;
    role: "admin" | "staff";
    temporaryPassword: string;
  }) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [password, setPassword] = useState("");

  function reset() {
    setName("");
    setEmail("");
    setRole("staff");
    setPassword("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
          <DialogDescription>
            They sign in with this email and the temporary password, then choose their own.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Full name" id="new-name">
            <Input id="new-name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Email" id="new-email">
            <Input
              id="new-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Role" id="new-role">
            <Select value={role} onValueChange={(value) => setRole(value as "admin" | "staff")}>
              <SelectTrigger id="new-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff — edit and preview drafts</SelectItem>
                <SelectItem value="admin">Administrator — publish and manage</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Temporary password" id="new-password" help={PASSWORD_HINT}>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={busy || !name.trim() || !email.trim() || password.length < 12}
            onClick={async () => {
              if (await onCreate({ name, email, role, temporaryPassword: password })) {
                reset();
                onOpenChange(false);
              }
            }}
          >
            {busy ? <Spinner /> : <UserPlus />} Create user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  onOpenChange,
  busy,
  onSave,
}: {
  user: StaffUser | null;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  onSave: (values: {
    id: number;
    name: string;
    role: "admin" | "staff";
    isActive: boolean;
  }) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [active, setActive] = useState(true);
  const [loadedId, setLoadedId] = useState<number | null>(null);

  // Seed the form the first time a given user opens the dialog.
  if (user && loadedId !== user.id) {
    setLoadedId(user.id);
    setName(user.name);
    setRole(user.role);
    setActive(user.isActive);
  }

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit account</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Full name" id="edit-name">
            <Input id="edit-name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Role" id="edit-role">
            <Select value={role} onValueChange={(value) => setRole(value as "admin" | "staff")}>
              <SelectTrigger id="edit-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff — edit and preview drafts</SelectItem>
                <SelectItem value="admin">Administrator — publish and manage</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
            <div>
              <Label htmlFor="edit-active" className="text-[12.5px] font-medium">
                Account is active
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Deactivating signs the user out everywhere immediately.
              </p>
            </div>
            <Switch id="edit-active" checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={busy || !name.trim() || !user}
            onClick={async () => {
              if (!user) return;
              if (await onSave({ id: user.id, name, role, isActive: active })) onOpenChange(false);
            }}
          >
            {busy ? <Spinner /> : null} Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  onOpenChange,
  busy,
  onReset,
}: {
  user: StaffUser | null;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  onReset: (id: number, temporaryPassword: string) => Promise<boolean>;
}) {
  const [password, setPassword] = useState("");

  return (
    <Dialog
      open={user !== null}
      onOpenChange={(next) => {
        if (!next) setPassword("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            {user?.name} must change this temporary password at their next sign-in. All their
            current sessions are ended.
          </DialogDescription>
        </DialogHeader>

        <Field label="Temporary password" id="reset-password" help={PASSWORD_HINT}>
          <Input
            id="reset-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={busy || password.length < 12 || !user}
            onClick={async () => {
              if (!user) return;
              if (await onReset(user.id, password)) {
                setPassword("");
                onOpenChange(false);
              }
            }}
          >
            {busy ? <Spinner /> : <KeyRound />} Reset password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  id,
  help,
  children,
}: {
  label: string;
  id: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12.5px] font-medium">
        {label}
      </Label>
      {children}
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}
