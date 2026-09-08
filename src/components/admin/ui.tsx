/**
 * Shared CMS presentation pieces.
 *
 * Everything here composes `src/components/ui` (shadcn) rather than restating
 * its styling, so the admin inherits one token set, one focus ring and one dark
 * mode. Screens should reach for these instead of hand-rolling layout.
 */

import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ labels */

export const SUBMISSION_TYPE_LABELS: Record<string, string> = {
  part_inquiry: "Part inquiry",
  credit_account: "Credit account",
  return_request: "Return request",
  support_tracking: "Order tracking",
  support_resources: "Resource request",
  support_question: "Product question",
  unsubscribe: "Unsubscribe",
};

/** Literal keys, so screens can derive the status union rather than restate it. */
export const SUBMISSION_STATUS_LABELS = {
  new: "New",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
} as const;

export type SubmissionStatus = keyof typeof SUBMISSION_STATUS_LABELS;

const STATUS_LABEL_LOOKUP: Record<string, string> = SUBMISSION_STATUS_LABELS;

/* ------------------------------------------------------------------- pills */

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  accent: "border-primary/25 bg-primary/10 text-primary",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/12 text-warning",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  info: "border-info/25 bg-info/10 text-info",
};

/** Small state chip. Carries a dot so tone is not the only signal. */
export function Pill({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  new: "accent",
  in_review: "warning",
  approved: "success",
  rejected: "danger",
  completed: "neutral",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <Pill tone={STATUS_TONE[status] ?? "neutral"} dot>
      {STATUS_LABEL_LOOKUP[status] ?? status}
    </Pill>
  );
}

/** Draft-versus-live state shown on content rows and in the publish rail. */
export function PublishPill({
  dirty,
  ahead,
}: {
  /** Unsaved edits in the browser. */
  dirty?: boolean;
  /** Saved draft that has not been published. */
  ahead?: boolean;
}) {
  if (dirty) return <Pill tone="warning" dot>Unsaved</Pill>;
  if (ahead) return <Pill tone="accent" dot>Draft ahead</Pill>;
  return <Pill tone="success" dot>Live</Pill>;
}

/* ----------------------------------------------------------------- avatars */

const AVATAR_TONES = [
  "bg-[oklch(0.92_0.05_30)] text-[oklch(0.4_0.13_30)]",
  "bg-[oklch(0.92_0.05_250)] text-[oklch(0.4_0.13_250)]",
  "bg-[oklch(0.92_0.05_150)] text-[oklch(0.38_0.12_150)]",
  "bg-[oklch(0.92_0.05_300)] text-[oklch(0.4_0.14_300)]",
  "bg-[oklch(0.92_0.05_355)] text-[oklch(0.42_0.14_355)]",
  "bg-[oklch(0.92_0.05_200)] text-[oklch(0.38_0.11_200)]",
];

/** Initials avatar with a colour derived from the name, so it stays stable. */
export function InitialsAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials =
    name
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "SA";
  const hash = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
        AVATAR_TONES[hash % AVATAR_TONES.length],
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/* ----------------------------------------------------------------- notices */

const NOTICE_STYLE: Record<Tone, { wrap: string; icon: ReactNode }> = {
  neutral: { wrap: "border-border bg-muted/50 text-foreground", icon: <Info /> },
  accent: { wrap: "border-primary/25 bg-primary/8 text-foreground", icon: <Info /> },
  info: { wrap: "border-info/25 bg-info/8 text-foreground", icon: <Info /> },
  success: { wrap: "border-success/25 bg-success/8 text-foreground", icon: <CheckCircle2 /> },
  warning: { wrap: "border-warning/30 bg-warning/10 text-foreground", icon: <AlertTriangle /> },
  danger: { wrap: "border-destructive/25 bg-destructive/8 text-foreground", icon: <XCircle /> },
};

const NOTICE_ICON_TONE: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  accent: "text-primary",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
};

/** Inline banner for state that must persist on the page, not a toast. */
export function Notice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const style = NOTICE_STYLE[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-lg border px-3.5 py-3 text-[13px]", style.wrap)}
    >
      <span className={cn("mt-px [&>svg]:size-4 [&>svg]:shrink-0", NOTICE_ICON_TONE[tone])}>
        {style.icon}
      </span>
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? (
          <div className={cn("text-muted-foreground", title && "mt-0.5")}>{children}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------ empty states */

export function EmptyState({
  icon,
  title,
  copy,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  copy?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-4.5">
          {icon}
        </span>
      ) : null}
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        {copy ? <p className="mx-auto max-w-[46ch] text-[13px] text-muted-foreground">{copy}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------- stat cards */

export function Stat({
  label,
  value,
  hint,
  icon,
  to,
  search,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  to?: string;
  search?: Record<string, unknown>;
  tone?: Tone;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {icon ? (
          <span className={cn("[&>svg]:size-3.5", NOTICE_ICON_TONE[tone])}>{icon}</span>
        ) : null}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </>
  );

  const className =
    "rounded-xl border bg-card p-4 transition-colors" + (to ? " hover:border-primary/40 hover:bg-accent/40" : "");

  if (to) {
    return (
      <Link to={to} search={search as never} className={cn(className, "block")}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

/* ------------------------------------------------------------------- cards */

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      {title ? (
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[13px] font-semibold">{title}</h2>
            {description ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Labelled rule used to head a run of fields. */
export function Legend({ children }: { children: ReactNode }) {
  return <div className="cms-legend">{children}</div>;
}

/* -------------------------------------------------------------- pagination */

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>
      {pageNumbers(page, pageCount).map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-xs text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={entry}
            variant={entry === page ? "default" : "ghost"}
            size="icon"
            className="size-8 text-xs tabular-nums"
            aria-current={entry === page ? "page" : undefined}
            onClick={() => onChange(entry)}
          >
            {entry}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
    </nav>
  );
}

/** 1 2 3 … 42 style window around the current page. */
function pageNumbers(page: number, pageCount: number): Array<number | "gap"> {
  if (pageCount <= 6) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) result.push("gap");
    result.push(value);
    previous = value;
  }
  return result;
}

/** Result count on the left, pagination on the right. */
export function ResultsFooter({
  shown,
  total,
  noun = "results",
  page,
  pageCount,
  onChange,
}: {
  shown: number;
  total: number;
  noun?: string;
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5 text-xs text-muted-foreground">
      <span>
        Showing <span className="font-medium text-foreground tabular-nums">{shown}</span> of{" "}
        <span className="tabular-nums">{total}</span> {noun}
      </span>
      <Pagination page={page} pageCount={pageCount} onChange={onChange} />
    </div>
  );
}

/* ---------------------------------------------------------------- bulk bar */

/** Floating action bar shown while rows are selected. */
export function BulkBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children?: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="fixed inset-x-0 bottom-5 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] flex-wrap items-center gap-2 rounded-full border bg-popover/95 py-2 pr-2 pl-4 shadow-lg backdrop-blur"
    >
      <span className="flex items-center gap-1.5 text-[13px] font-medium">
        <Check className="size-3.5 text-primary" aria-hidden="true" />
        <span className="tabular-nums">{count}</span> selected
      </span>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
      {children}
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}

/* ----------------------------------------------------------------- helpers */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-9 w-full" />
      ))}
    </div>
  );
}

/** Copies a short value — references, handles, content paths. */
export function CopyButton({
  value,
  label = "Copy",
  ...props
}: { value: string; label?: string } & Omit<ComponentProps<typeof Button>, "onClick" | "value">) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label={copied ? "Copied" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          /* Clipboard access can be blocked; the value stays selectable. */
        }
      }}
      {...props}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
    </Button>
  );
}

/** Live character budget. Turns amber near the limit and red past it. */
export function CharCount({ value, max }: { value: string; max: number }) {
  const used = value.length;
  const ratio = used / max;
  return (
    <span
      className={cn(
        "text-[11px] tabular-nums",
        ratio > 1 ? "text-destructive" : ratio > 0.9 ? "text-warning" : "text-muted-foreground",
      )}
    >
      {used}/{max}
    </span>
  );
}

/* -------------------------------------------------------------- formatting */

const DATE = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | null | undefined) {
  return value ? DATE.format(new Date(value)) : "—";
}

export function formatDateTime(value: string | null | undefined) {
  return value ? DATE_TIME.format(new Date(value)) : "—";
}

export function formatRelative(value: string | null | undefined) {
  if (!value) return "never";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return DATE.format(new Date(value));
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "content.draft_saved" → "Content draft saved" for the activity feed. */
export function humaniseAction(action: string) {
  return action
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export { Badge };
