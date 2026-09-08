import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ExternalLink,
  FileText,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  MousePointerClick,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useCmsTheme } from "@/components/admin/theme";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import type { AdminSession } from "@/lib/admin/admin.functions";
import { EDITABLE_PAGES } from "@/lib/content/editable-pages";
import { CONTENT_KEYS, CONTENT_REGISTRY } from "@/lib/content/registry";

const SUBMISSION_SEARCH = { type: "all", status: "all", search: "", page: 1 } as const;
const ACTIVITY_SEARCH = { page: 1, action: "" } as const;

type Props = {
  staff: AdminSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
};

/**
 * Keyboard-first navigation across every CMS surface.
 *
 * Content documents and editable pages are enumerated from the registry, so
 * the palette can never fall behind what the CMS actually manages.
 */
export function CommandPalette({ staff, open, onOpenChange, onSignOut }: Props) {
  const navigate = useNavigate();
  const { setPreference } = useCmsTheme();

  const documents = useMemo(
    () => CONTENT_KEYS.map((key) => ({ key, ...CONTENT_REGISTRY[key] })),
    [],
  );

  function run(action: () => void) {
    onOpenChange(false);
    // Let the dialog close before navigating, so focus lands on the new page.
    queueMicrotask(action);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, content and actions…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No matches.</CommandEmpty>

        <CommandGroup heading="Go to">
          <Entry
            icon={<LayoutDashboard />}
            label="Dashboard"
            onSelect={() => run(() => void navigate({ to: "/admin" }))}
          />
          <Entry
            icon={<MousePointerClick />}
            label="Edit pages"
            shortcut="Visual editor"
            onSelect={() =>
              run(() =>
                void navigate({ to: "/admin/visual", search: { page: "/", width: "desktop" } }),
              )
            }
          />
          <Entry
            icon={<Inbox />}
            label="Submissions"
            onSelect={() =>
              run(() => void navigate({ to: "/admin/submissions", search: SUBMISSION_SEARCH }))
            }
          />
          <Entry
            icon={<FileText />}
            label="All content"
            onSelect={() => run(() => void navigate({ to: "/admin/content" }))}
          />
          <Entry
            icon={<Images />}
            label="Media library"
            onSelect={() => run(() => void navigate({ to: "/admin/media" }))}
          />
          {staff.role === "admin" ? (
            <>
              <Entry
                icon={<Users />}
                label="Users"
                onSelect={() => run(() => void navigate({ to: "/admin/users" }))}
              />
              <Entry
                icon={<Activity />}
                label="Activity log"
                onSelect={() =>
                  run(() => void navigate({ to: "/admin/activity", search: ACTIVITY_SEARCH }))
                }
              />
            </>
          ) : null}
          <Entry
            icon={<Settings />}
            label="Settings"
            onSelect={() => run(() => void navigate({ to: "/admin/settings" }))}
          />
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Edit content">
          {documents.map((document) => (
            <Entry
              key={document.key}
              icon={<FileText />}
              label={document.label}
              shortcut={document.group}
              onSelect={() =>
                run(() =>
                  void navigate({ to: "/admin/content/$key", params: { key: document.key } }),
                )
              }
            />
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Open in visual editor">
          {EDITABLE_PAGES.map((page) => (
            <Entry
              key={page.path}
              icon={<MousePointerClick />}
              label={page.label}
              shortcut={page.path}
              onSelect={() =>
                run(() =>
                  void navigate({
                    to: "/admin/visual",
                    search: { page: page.path, width: "desktop" },
                  }),
                )
              }
            />
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <Entry
            icon={<Sun />}
            label="Light theme"
            onSelect={() => run(() => setPreference("light"))}
          />
          <Entry
            icon={<Moon />}
            label="Dark theme"
            onSelect={() => run(() => setPreference("dark"))}
          />
          <Entry
            icon={<Monitor />}
            label="Match system theme"
            onSelect={() => run(() => setPreference("system"))}
          />
          <Entry
            icon={<ExternalLink />}
            label="View website"
            onSelect={() => run(() => window.open("/", "_blank", "noreferrer"))}
          />
          <Entry icon={<LogOut />} label="Sign out" onSelect={() => run(onSignOut)} />
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function Entry({
  icon,
  label,
  shortcut,
  onSelect,
}: {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  onSelect: () => void;
}) {
  return (
    <CommandItem onSelect={onSelect} className="gap-2.5 text-[13px]">
      <span className="text-muted-foreground [&>svg]:size-4">{icon}</span>
      <span className="truncate">{label}</span>
      {shortcut ? (
        <CommandShortcut className="truncate text-[11px]">{shortcut}</CommandShortcut>
      ) : null}
    </CommandItem>
  );
}

/** Binds Cmd/Ctrl+K anywhere in the CMS. */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    addEventListener("keydown", onKeyDown);
    return () => removeEventListener("keydown", onKeyDown);
  }, []);
  return { open, setOpen };
}
