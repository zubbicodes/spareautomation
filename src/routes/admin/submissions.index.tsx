import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Filter, Inbox, RotateCcw, Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  EmptyState,
  formatDateTime,
  Notice,
  Pager,
  SkeletonRows,
  StatusBadge,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_TYPE_LABELS,
} from "@/components/admin/cms-ui";
import {
  getAdminSession,
  listSubmissions,
  type SubmissionListResult,
} from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";

type SubmissionSearch = {
  type: string;
  status: string;
  search: string;
  page: number;
};

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

function SubmissionsPage() {
  const { staff } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [result, setResult] = useState<SubmissionListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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
        if (active) setResult(response);
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
  }, [search.type, search.status, search.search, search.page]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void navigate({
      search: {
        type: String(form.get("type") ?? "all"),
        status: String(form.get("status") ?? "all"),
        search: String(form.get("search") ?? ""),
        page: 1,
      },
    });
  }

  const items = result?.ok ? result.items : [];
  const filtered = search.type !== "all" || search.status !== "all" || search.search !== "";

  return (
    <CmsShell
      staff={staff}
      eyebrow="Enquiries"
      title="Submissions"
      subtitle="Part enquiries, credit applications, return requests and support messages captured from the website."
      inboxCount={result?.ok ? result.counts.new : undefined}
      actions={
        filtered ? (
          <Link
            to="/admin/submissions"
            search={{ type: "all", status: "all", search: "", page: 1 }}
            className="cms-btn"
          >
            <RotateCcw aria-hidden="true" /> Clear filters
          </Link>
        ) : null
      }
    >
      {result?.ok ? (
        <div className="cms-grid cms-grid-stats" style={{ marginBottom: 14 }}>
          {Object.entries(SUBMISSION_STATUS_LABELS).map(([status, label]) => (
            <Link
              key={status}
              to="/admin/submissions"
              search={{ ...search, status, page: 1 }}
              className="cms-card cms-stat"
              style={
                search.status === status
                  ? { borderColor: "var(--cms-accent)", boxShadow: "0 0 0 3px rgba(43,92,255,0.12)" }
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

      <form onSubmit={applyFilters} className="cms-card cms-toolbar" style={{ marginBottom: 14 }}>
        <label className="cms-field cms-field-grow">
          <span className="cms-label">Search</span>
          <span className="cms-search">
            <Search aria-hidden="true" />
            <input
              name="search"
              defaultValue={search.search}
              placeholder="Reference, email, name or company"
              aria-label="Search submissions"
            />
          </span>
        </label>
        <label className="cms-field">
          <span className="cms-label">Type</span>
          <select name="type" defaultValue={search.type} className="cms-select">
            <option value="all">All types</option>
            {Object.entries(SUBMISSION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="cms-field">
          <span className="cms-label">Status</span>
          <select name="status" defaultValue={search.status} className="cms-select">
            <option value="all">All statuses</option>
            {Object.entries(SUBMISSION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="cms-btn cms-btn-primary">
          <Filter aria-hidden="true" /> Apply
        </button>
      </form>

      <section className="cms-card">
        {loadError ? (
          <div className="cms-card-pad">
            <Notice tone="danger">{loadError}</Notice>
          </div>
        ) : loading ? (
          <SkeletonRows rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Inbox aria-hidden="true" />}
            title="No submissions match these filters"
            copy="Try a different status, type, or search term."
          />
        ) : (
          <>
            <div className="cms-table-wrap">
              <table className="cms-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Contact</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Received</th>
                    <th style={{ textAlign: "right" }}>Shopify</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link
                          to="/admin/submissions/$id"
                          params={{ id: String(item.id) }}
                          className="cms-link cms-mono"
                        >
                          {item.reference ?? `#${item.id}`}
                        </Link>
                      </td>
                      <td>{SUBMISSION_TYPE_LABELS[item.type] ?? item.type}</td>
                      <td>
                        <div>{item.contactName ?? "—"}</div>
                        <div className="cms-faint" style={{ fontSize: 12 }}>
                          {item.contactEmail}
                        </div>
                      </td>
                      <td>{item.company ?? "—"}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="cms-num">{formatDateTime(item.createdAt)}</td>
                      <td style={{ textAlign: "right" }}>
                        {item.shopifySyncedAt ? (
                          <span className="cms-badge cms-badge-success">Synced</span>
                        ) : (
                          <span className="cms-faint">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result?.ok && result.pageCount > 1 ? (
              <Pager
                page={result.page}
                pageCount={result.pageCount}
                total={result.total}
                onChange={(page) => void navigate({ search: { ...search, page } })}
              />
            ) : null}
          </>
        )}
      </section>
    </CmsShell>
  );
}
