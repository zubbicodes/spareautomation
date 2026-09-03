import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Info } from "lucide-react";
import type { ReactNode } from "react";

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

export function EmptyState({ icon, title, copy }: { icon: ReactNode; title: string; copy?: string }) {
  return (
    <div className="cms-empty">
      {icon}
      <strong style={{ fontWeight: 600, color: "var(--cms-text)" }}>{title}</strong>
      {copy ? <span style={{ maxWidth: "44ch" }}>{copy}</span> : null}
    </div>
  );
}

export function Pager({
  page,
  pageCount,
  total,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="cms-pager">
      <span>
        Page {page} of {pageCount} · {total} total
      </span>
      <div className="cms-row-inline">
        <button
          type="button"
          className="cms-btn cms-btn-sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft aria-hidden="true" /> Previous
        </button>
        <button
          type="button"
          className="cms-btn cms-btn-sm"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          Next <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
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
    <div className="cms-card-pad cms-stack-sm" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="cms-skeleton" style={{ width: `${100 - index * 7}%` }} />
      ))}
    </div>
  );
}

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

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
  return DATE_TIME.format(new Date(value));
}

/** "content.draft_saved" → "Content draft saved" for the activity feed. */
export function humaniseAction(action: string) {
  return action
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}
