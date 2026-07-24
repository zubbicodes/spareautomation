import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Inbox, Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  getAdminSession,
  listSubmissions,
  type SubmissionListResult,
} from "@/lib/admin/admin.functions";

const TYPE_LABELS: Record<string, string> = {
  part_inquiry: "Part inquiry",
  trade_account: "Trade account",
  credit_account: "Credit account",
  support_tracking: "Order tracking",
  support_resources: "Resource request",
  support_question: "Product question",
  unsubscribe: "Unsubscribe",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

const STATUS_STYLES: Record<string, string> = {
  new: "border-accent/40 bg-accent/10 text-accent",
  in_review: "border-amber/40 bg-amber/10 text-amber",
  approved: "border-green-500/40 bg-green-500/10 text-green-700",
  rejected: "border-red-500/40 bg-red-500/10 text-red-700",
  completed: "border-rule bg-surface text-ink-muted",
};

type AdminSearch = {
  type: string;
  status: string;
  search: string;
  page: number;
};

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Admin Dashboard | Spares Automation" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  validateSearch: (search: Record<string, unknown>): AdminSearch => ({
    type: typeof search.type === "string" ? search.type : "all",
    status: typeof search.status === "string" ? search.status : "all",
    search: typeof search.search === "string" ? search.search : "",
    page: typeof search.page === "number" && search.page > 0 ? search.page : 1,
  }),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) {
      throw redirect({ to: "/admin/login" });
    }
    return { staff };
  },
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
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
        const res = await listSubmissions({
          data: {
            type: search.type === "all" ? undefined : (search.type as never),
            status: search.status === "all" ? undefined : (search.status as never),
            search: search.search || undefined,
            page: search.page,
          },
        });
        if (active) setResult(res);
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
      to: "/admin",
      search: {
        type: String(form.get("type") ?? "all"),
        status: String(form.get("status") ?? "all"),
        search: String(form.get("search") ?? ""),
        page: 1,
      },
    });
  }

  const items = result?.ok ? result.items : [];

  return (
    <AdminShell staff={staff} title="Submissions" eyebrow="Dashboard">
      {result?.ok ? (
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <div key={status} className="border border-rule bg-surface p-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">
                {label}
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-ink">
                {result.counts[status as keyof typeof result.counts]}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <form
        onSubmit={applyFilters}
        className="mb-5 grid gap-3 border border-rule bg-surface p-4 md:grid-cols-[1fr_180px_180px_auto]"
      >
        <label className="grid gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted">Search</span>
          <div className="flex items-center border border-rule bg-background focus-within:border-accent">
            <Search className="ml-3 h-4 w-4 text-ink-muted" />
            <input
              name="search"
              defaultValue={search.search}
              placeholder="Reference, email, name or company"
              className="h-11 w-full bg-transparent px-3 text-sm text-ink outline-none placeholder:text-ink-muted"
            />
          </div>
        </label>
        <label className="grid gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted">Type</span>
          <select name="type" defaultValue={search.type} className="h-11 border border-rule bg-background px-3 text-sm text-ink outline-none focus:border-accent">
            <option value="all">All types</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted">Status</span>
          <select name="status" defaultValue={search.status} className="h-11 border border-rule bg-background px-3 text-sm text-ink outline-none focus:border-accent">
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className="inline-flex h-11 items-center justify-center bg-accent px-6 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white hover:brightness-110">
            Apply
          </button>
        </div>
      </form>

      {loadError ? (
        <div role="alert" className="border border-red-300 bg-red-50 p-4 text-sm text-red-800">{loadError}</div>
      ) : loading ? (
        <div className="border border-rule bg-surface px-4 py-16 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
          Loading submissions
        </div>
      ) : items.length === 0 ? (
        <div className="border border-rule bg-surface px-4 py-16 text-center">
          <Inbox className="mx-auto h-8 w-8 text-ink-muted" />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">No submissions match these filters</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-rule bg-surface">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-rule bg-background font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3 text-right">Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-background">
                    <td className="px-4 py-3">
                      <Link to="/admin/submissions/$id" params={{ id: String(item.id) }} className="font-mono text-xs font-semibold text-ink hover:text-accent">
                        {item.reference ?? `#${item.id}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink">{TYPE_LABELS[item.type] ?? item.type}</td>
                    <td className="px-4 py-3">
                      <div className="text-ink">{item.contactName ?? "—"}</div>
                      <div className="text-xs text-ink-muted">{item.contactEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-ink">{item.company ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${STATUS_STYLES[item.status] ?? STATUS_STYLES.completed}`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                      {item.shopifySyncedAt ? "Synced" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result?.ok && result.pageCount > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                Page {result.page} of {result.pageCount} · {result.total} total
              </span>
              <div className="flex gap-2">
                <button
                  disabled={result.page <= 1}
                  onClick={() => void navigate({ to: "/admin", search: { ...search, page: result.page - 1 } })}
                  className="inline-flex h-10 items-center gap-1 border border-rule px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  disabled={result.page >= result.pageCount}
                  onClick={() => void navigate({ to: "/admin", search: { ...search, page: result.page + 1 } })}
                  className="inline-flex h-10 items-center gap-1 border border-rule px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </AdminShell>
  );
}
