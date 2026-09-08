import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "cms-theme";

function resolve(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

/**
 * CMS colour scheme.
 *
 * The attribute lives on <html> because Radix portals (dialogs, dropdowns,
 * toasts) mount onto <body>, and it is written by an inline script in
 * `cmsHead` before first paint so a dark editor never flashes light.
 */
export function useCmsTheme() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    setPreference(readPreference());
  }, []);

  const apply = useCallback((next: ThemePreference) => {
    setPreference(next);
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Private browsing can refuse storage; the choice still applies now. */
    }
    document.documentElement.setAttribute("data-cms-theme", resolve(next));
  }, []);

  // Follow the OS while the preference is "system".
  useEffect(() => {
    if (preference !== "system" || typeof matchMedia !== "function") return;
    const query = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () =>
      document.documentElement.setAttribute("data-cms-theme", query.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference]);

  const toggle = useCallback(() => {
    apply(resolve(readPreference()) === "dark" ? "light" : "dark");
  }, [apply]);

  return { preference, setPreference: apply, toggle };
}

export function ThemeToggle() {
  const { preference, setPreference } = useCmsTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Colour theme">
          <Sun className="dark:hidden" />
          <Moon className="hidden dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs">Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(
          [
            ["light", "Light", Sun],
            ["dark", "Dark", Moon],
            ["system", "System", Monitor],
          ] as const
        ).map(([value, label, Icon]) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => setPreference(value)}
            className="gap-2 text-[13px]"
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
            {preference === value ? (
              <span className="ml-auto size-1.5 rounded-full bg-primary" aria-hidden="true" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
