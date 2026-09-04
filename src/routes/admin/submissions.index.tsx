import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink, Inbox, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  Avatar,
  BulkBar,
  ChipSelect,
  EmptyState,
  FootBar,
  formatDate,
  KebabMenu,
  Notice,
  SearchField,
  SkeletonRows,
  StatusBadge,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_TYPE_LABELS,
} from "@/components/admin/cms-ui";
import {
  getAdminSession,
  listSubmissions,
  markSubmissionReviewed,
  setSubmissionStatus,
  type SubmissionListResult,
} from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";

type SubmissionSearch = {
  type: string;
  status: string;
  search: string;
  page: number;
};

type Status = keyof typeof SUBMISSION_STATUS_LABELS;

export const Route = createFileRoute("/admin/submissions/")({
  head: () => cmsHead("Submissions"),
  validateSearch: (search: Record<string, unknown>): SubmissionSearch => ({
    type: typeof search.type === "string" ? search.type : "all",
    status: typeof search.status === "string" ? search.status : "all",
    search: typeof search.search === "string" ? search.search : "",
    page: typeof search.page === "number" && search.page > 0 ? search.page : 1,
  }),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    return { staff };
  },
  component: SubmissionsPage,
});

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  ...Object.entries(SUBMISSION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...Object.entries(SUBMISSION_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

function SubmissionsPage() {
  const { staff } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [result, setResult] = useState<SubmissionListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState(search.search);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  // Typing filters the list without a submit button; the URL stays shareable.
  useEffect(() => {
    if (query === search.search) return;
    const timer = setTimeout(() => {
      void navigate({ search: { ...search, search: query, page: 1 } });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search, navigate]);

  useEffect(() => {
    setQuery(search.search);
  }, [search.search]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await listSubmissions({
          data: {
            type: search.type === "all" ? undefined : (search.type as never),
            status: search.status === "all" ? undefined : (search.status as never),
            search: search.search || undefined,
            page: search.page,
          },
        });
        if (active) {
          setResult(response);
          setSelected([]);
        }
      } catch {
        if (active) setLoadError("We could not load submissions.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [search.type, search.status, search.search, search.page, reload]);

  const items = result?.ok ? result.items : [];
  const filtered = search.type !== "all" || search.status !== "all" || search.search !== "";

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function applyStatus(status: Status, ids: number[]) {
    if (!ids.length) return;
    setBulkBusy(true);
    setNotice("");
    try {
      for (const id of ids) {
        await setSubmissionStatus({ data: { id, status: status as never } });
      }
      setNotice(
        `${ids.length} submission${ids.length === 1 ? "" : "s"} moved to ${SUBMISSION_STATUS_LABELS[status].toLowerCase()}.`,
      );
      setSelected([]);
      setReload((value) => value + 1);
    } catch {
      setLoadError("Some submissions could not be updated. Refresh and try again.");
    } finally {
      setBulkBusy(false);
    }
  }

  async function markReviewed(ids: number[]) {
    setBulkBusy(true);
    setNotice("");
    try {
      for (const id of ids) await markSubmissionReviewed({ data: { id } });
      setNotice(`${ids.length} submission${ids.length === 1 ? "" : "s"} marked as reviewed.`);
      setSelected([]);
      setReload((value) => value + 1);
    } catch {
      setLoadError("Some submissions could not be updated. Refresh and try again.");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <CmsShell
      staff={staff}
      eyebrow="Enquiries"
      title="Submissions"
      subtitle="Part enquiries, credit applications, return requests and support messages captured from the website."
      inboxCount={result?.ok ? result.counts.new : undefined}
      actions={
        filtered ? (
          <button
            type="button"
            className="cms-btn"
            onClick={() =>
              void navigate({ search: { type: "all", status: "all", search: "", page: 1 } })
            }
          >
            <RotateCcw aria-hidden="true" /> Clear filters
          </button>
        ) : null
      }
    >
      {result?.ok ? (
        <div className="cms-grid cms-grid-stats" style={{ marginBottom: 16 }}>
          {Object.entries(SUBMISSION_STATUS_LABELS).map(([status, label]) => (
            <Link
              key={status}
              to="/admin/submissions"
              search={{ ...search, status: search.status === status ? "all" : status, page: 1 }}
              className="cms-card cms-stat"
              style={
                search.status === status
                  ? { borderColor: "var(--cms-accent)", background: "var(--cms-accent-soft)" }
                  : undefined
              }
            >
              <span className="cms-stat-label">{label}</span>
              <span className="cms-stat-value">
                {result.counts[status as keyof typeof result.counts]}
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      <div className="cms-filters">
        <ChipSelect
          label="Type"
          value={search.type}
          options={TYPE_OPTIONS}
          onChange={(value) => void navigate({ search: { ...search, type: value, page: 1 } })}
        />
        <ChipSelect
          label="Status"
          value={search.status}
          options={STATUS_OPTIONS}
          onChange={(value) => void navigate({ search: { ...search, status: value, page: 1 } })}
        />
        <SearchField
          value={query}
          onChange={setQuery}
          label="Search submissions"
          placeholder="Reference, email, name or company"
        />
      </div>

      {notice ? (
        <div style={{ marginBottom: 12 }}>
          <Notice tone="success">{notice}</Notice>
        </div>
      ) : null}
      {loadError ? (
        <div style={{ marginBottom: 12 }}>
          <Notice tone="danger">{loadError}</Notice>
        </div>
      ) : null}

      {selected.length ? (
        <BulkBar count={selected.length} onClear={() => setSelected([])}>
          <span className="cms-row-inline" style={{ gap: 6 }}>
            <label className="cms-sr" htmlFor="bulk-status">
              Set status for selected submissions
            </label>
            <select
              id="bulk-status"
              disabled={bulkBusy}
              value=""
              onChange={(event) => {
                const value = event.target.value;
                event.target.value = "";
                if (value) void applyStatus(value as Status, selected);
              }}
            >
              <option value="">Set status…</option>
              {Object.entries(SUBMISSION_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button type="button" disabled={bulkBusy} onClick={() => void markReviewed(selected)}>
              {bulkBusy ? (
                <Loader2 aria-hidden="true" className="cms-spin" style={{ width: 14, height: 14 }} />
              ) : (
                <CheckCircle2 aria-hidden="true" style={{ width: 14, height: 14 }} />
              )}
              Mark reviewed
            </button>
          </span>
        </BulkBar>
      ) : null}

      <section>
        {loadError && !items.length ? null : loading ? (
          <SkeletonRows rows={7} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Inbox aria-hidden="true" />}
            title="No submissions match these filters"
            copy="Try a different status, type, or search term."
          />
        ) : (
          <>
            <div className="cms-list">
              {items.map((item) => {
                const isSelected = selected.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="cms-row"
                    data-selected={isSelected ? "true" : "false"}
                    style={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ["--cms-row-columns" as any]:
                        "24px minmax(0, 1fr) minmax(0, 190px) 110px 96px 40px",
                    }}
                  >
                    <input
                      type="checkbox"
                      className="cms-check"
                      checked={isSelected}
                      onChange={() => toggle(item.id)}
                      aria-label={`Select ${item.reference ?? `submission ${item.id}`}`}
                    />
                    <span className="cms-row-main">
                      <Link
                        to="/admin/submissions/$id"
                        params={{ id: String(item.id) }}
                        className="cms-row-title"
                      >
                        {item.reference ?? `Submission #${item.id}`}
                      </Link>
                      <span className="cms-row-meta">
                        {SUBMISSION_TYPE_LABELS[item.type] ?? item.type}
                        {item.company ? ` · ${item.company}` : ""}
                      </span>
                    </span>
                    <span className="cms-row-person">
                      <Avatar name={item.contactName ?? item.contactEmail} small />
                      <span>{item.contactName ?? item.contactEmail}</span>
                    </span>
                    <span className="cms-row-date">{formatDate(item.createdAt)}</span>
                    <span>
                      <StatusBadge status={item.status} />
                    </span>
                    <span className="cms-row-actions">
                      <KebabMenu label={`Actions for ${item.reference ?? item.id}`}>
                        {(close) => (
                          <>
                            <Link
                              to="/admin/submissions/$id"
                              params={{ id: String(item.id) }}
                              role="menuitem"
                              onClick={close}
                            >
                              <ExternalLink aria-hidden="true" /> Open submission
                            </Link>
                            <a href={`mailto:${item.contactEmail}`} role="menuitem" onClick={close}>
                              <ExternalLink aria-hidden="true" /> Email {item.contactEmail}
                            </a>
                            <div className="cms-menu-sep" />
                            <div className="cms-menu-label">Set status</div>
                            {Object.entries(SUBMISSION_STATUS_LABELS).map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                role="menuitem"
                                disabled={item.status === value || bulkBusy}
                                onClick={() => {
                                  close();
                                  void applyStatus(value as Status, [item.id]);
                                }}
                              >
                                {label}
                              </button>
                            ))}
                          </>
                        )}
                      </KebabMenu>
                    </span>
                  </div>
                );
              })}
            </div>
            {result?.ok ? (
              <FootBar
                shown={items.length}
                total={result.total}
                page={result.page}
                pageCount={result.pageCount}
                noun="submissions"
                onChange={(page) => void navigate({ search: { ...search, page } })}
              />
            ) : null}
          </>
        )}
      </section>
    </CmsShell>
  );
}
