import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export const SUBMISSION_TYPE_LABELS: Record<string, string> = {
  part_inquiry: "Part inquiry",
  credit_account: "Credit account",
  return_request: "Return request",
  support_tracking: "Order tracking",
  support_resources: "Resource request",
  support_question: "Product question",
  unsubscribe: "Unsubscribe",
};

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

const STATUS_TONE: Record<string, string> = {
  new: "cms-badge-accent",
  in_review: "cms-badge-warning",
  approved: "cms-badge-success",
  rejected: "cms-badge-danger",
  completed: "cms-badge",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`cms-badge ${STATUS_TONE[status] ?? ""}`}>
      {SUBMISSION_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const AVATAR_PALETTE = [
  ["#ffe1cf", "#8a3b1c"],
  ["#dbe9ff", "#1c4d8a"],
  ["#e2f6e3", "#1f6b34"],
  ["#f0e2ff", "#5b2a9b"],
  ["#ffe6ef", "#96214c"],
  ["#e6f4f8", "#14606f"],
];

/** Initials avatar with a stable colour derived from the person's name. */
export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const initials =
    name
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "SA";
  const hash = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  const [background, color] = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  return (
    <span
      className={`cms-avatar${small ? " cms-avatar-sm" : ""}`}
      style={{ background, color }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const icons = {
    info: <Info aria-hidden="true" />,
    success: <CheckCircle2 aria-hidden="true" />,
    warning: <AlertTriangle aria-hidden="true" />,
    danger: <AlertTriangle aria-hidden="true" />,
  };
  const classes = {
    info: "cms-notice",
    success: "cms-notice cms-notice-success",
    warning: "cms-notice cms-notice-warning",
    danger: "cms-notice cms-notice-danger",
  };
  return (
    <div className={classes[tone]} role={tone === "danger" ? "alert" : "status"}>
      {icons[tone]}
      <span>{children}</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  copy,
}: {
  icon: ReactNode;
  title: string;
  copy?: string;
}) {
  return (
    <div className="cms-empty">
      {icon}
      <strong style={{ fontWeight: 600, color: "var(--cms-text)" }}>{title}</strong>
      {copy ? <span style={{ maxWidth: "46ch" }}>{copy}</span> : null}
    </div>
  );
}

/** Rounded filter chip wrapping a native select, so keyboard use stays standard. */
export function ChipSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const current = options.find((option) => option.value === value);
  const active = options.length > 0 && value !== options[0].value;
  return (
    <span className="cms-chip-select">
      <span className="cms-chip" data-active={active ? "true" : "false"}>
        {current?.label ?? label}
        <ChevronDown aria-hidden="true" />
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </span>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <span className="cms-search">
      <Search aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        type="search"
      />
    </span>
  );
}

/** Dark bar shown while rows are selected. */
export function BulkBar({
  count,
  onClear,
  children,
  destructive,
}: {
  count: number;
  onClear: () => void;
  children?: ReactNode;
  destructive?: ReactNode;
}) {
  return (
    <div className="cms-bulkbar" role="region" aria-label="Bulk actions">
      <span className="cms-bulkbar-count">
        <Check aria-hidden="true" />
        {count} selected
      </span>
      {children}
      {destructive ? <span className="cms-bulk-danger-slot" style={{ marginLeft: "auto" }}>{destructive}</span> : null}
      <button
        type="button"
        onClick={onClear}
        style={destructive ? undefined : { marginLeft: "auto" }}
      >
        Clear
      </button>
    </div>
  );
}

/** Row overflow menu: closes on outside click, Escape, or item activation. */
export function KebabMenu({
  label = "Row actions",
  children,
}: {
  label?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="cms-menu-wrap" ref={wrap}>
      <button
        type="button"
        className="cms-btn cms-btn-ghost cms-btn-icon"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal aria-hidden="true" />
      </button>
      {open ? (
        <div className="cms-menu" id={id} role="menu">
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

/** Footer with result count and numbered pagination. */
export function FootBar({
  shown,
  total,
  page,
  pageCount,
  onChange,
  noun = "results",
}: {
  shown: number;
  total: number;
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  noun?: string;
}) {
  return (
    <div className="cms-footbar">
      <span>
        Showing <strong style={{ color: "var(--cms-text)" }}>{shown}</strong> of {total} {noun}
      </span>
      {pageCount > 1 ? (
        <nav className="cms-pagination" aria-label="Pagination">
          <button
            type="button"
            className="cms-page-btn"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" style={{ width: 15, height: 15 }} />
          </button>
          {pageNumbers(page, pageCount).map((entry, index) =>
            entry === "gap" ? (
              <span key={`gap-${index}`} className="cms-page-gap">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                className="cms-page-btn"
                data-active={entry === page ? "true" : "false"}
                aria-current={entry === page ? "page" : undefined}
                onClick={() => onChange(entry)}
              >
                {entry}
              </button>
            ),
          )}
          <button
            type="button"
            className="cms-page-btn"
            disabled={page >= pageCount}
            onClick={() => onChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" style={{ width: 15, height: 15 }} />
          </button>
        </nav>
      ) : null}
    </div>
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

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="cms-card cms-stat">
      <div className="cms-stat-label">
        {icon}
        {label}
      </div>
      <div className="cms-stat-value">{value}</div>
      {hint ? <div className="cms-stat-hint">{hint}</div> : null}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="cms-stack-sm" style={{ padding: "14px 12px" }} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="cms-skeleton" style={{ width: `${100 - index * 6}%`, height: 34 }} />
      ))}
    </div>
  );
}

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

/** "content.draft_saved" → "Content draft saved" for the activity feed. */
export function humaniseAction(action: string) {
  return action
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}
