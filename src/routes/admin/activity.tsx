import { createFileRoute, redirect } from "@tanstack/react-router";
import { Activity, Filter } from "lucide-react";
import { useEffect, useState } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  EmptyState,
  formatDateTime,
  humaniseAction,
  Notice,
  Pager,
  SkeletonRows,
} from "@/components/admin/cms-ui";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { listAuditActions, listAuditLog, type AuditEntry } from "@/lib/admin/dashboard.functions";
import { cmsHead } from "@/lib/admin/head";

type ActivitySearch = { page: number; action: string };

export const Route = createFileRoute("/admin/activity")({
  head: () => cmsHead("Activity log"),
  validateSearch: (search: Record<string, unknown>): ActivitySearch => ({
    page: typeof search.page === "number" && search.page > 0 ? search.page : 1,
    action: typeof search.action === "string" ? search.action : "",
  }),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    if (staff.role !== "admin") throw redirect({ to: "/admin" });
    return { staff, actions: await listAuditActions() };
  },
  component: ActivityPage,
});

function ActivityPage() {
  const { staff, actions } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await listAuditLog({
          data: { page: search.page, action: search.action || undefined },
        });
        if (!active) return;
        setEntries(result.entries);
        setMeta({ page: result.page, pageCount: result.pageCount, total: result.total });
      } catch {
        if (active) setError("The activity log could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [search.page, search.action]);

  return (
    <CmsShell
      staff={staff}
      eyebrow="Administration"
      title="Activity log"
      subtitle="Every draft save, publish, revision restore, media change and account update, with the person responsible."
    >
      <div className="cms-card cms-toolbar" style={{ marginBottom: 14 }}>
        <label className="cms-field">
          <span className="cms-label">Action</span>
          <select
            value={search.action}
            onChange={(event) =>
              void navigate({ search: { page: 1, action: event.target.value } })
            }
            className="cms-select"
          >
            <option value="">All actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {humaniseAction(action)}
              </option>
            ))}
          </select>
        </label>
        <span className="cms-badge">
          <Filter aria-hidden="true" style={{ width: 12, height: 12 }} /> {meta.total} entries
        </span>
      </div>

      <section className="cms-card">
        {error ? (
          <div className="cms-card-pad">
            <Notice tone="danger">{error}</Notice>
          </div>
        ) : loading ? (
          <SkeletonRows rows={8} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<Activity aria-hidden="true" />}
            title="Nothing logged yet"
            copy="Actions taken in the CMS will appear here."
          />
        ) : (
          <>
            <div className="cms-table-wrap">
              <table className="cms-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>By</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="cms-num">{formatDateTime(entry.createdAt)}</td>
                      <td>{humaniseAction(entry.action)}</td>
                      <td className="cms-mono">
                        {entry.targetType}/{entry.targetId}
                      </td>
                      <td>{entry.staff ?? "system"}</td>
                      <td className="cms-mono cms-faint" style={{ maxWidth: 320, overflowWrap: "anywhere" }}>
                        {entry.details ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta.pageCount > 1 ? (
              <Pager
                page={meta.page}
                pageCount={meta.pageCount}
                total={meta.total}
                onChange={(page) => void navigate({ search: { ...search, page } })}
              />
            ) : null}
          </>
        )}
      </section>
    </CmsShell>
  );
}
