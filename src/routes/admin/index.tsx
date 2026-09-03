import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  FileText,
  Images,
  Inbox,
  Send,
  Users,
} from "lucide-react";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  EmptyState,
  formatDateTime,
  formatRelative,
  humaniseAction,
  Notice,
  Stat,
  StatusBadge,
  SUBMISSION_TYPE_LABELS,
} from "@/components/admin/cms-ui";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { getDashboard } from "@/lib/admin/dashboard.functions";
import { cmsHead } from "@/lib/admin/head";

export const Route = createFileRoute("/admin/")({
  head: () => cmsHead("Overview"),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    return { staff, data: await getDashboard() };
  },
  component: OverviewPage,
});

const SUBMISSION_SEARCH = { type: "all", status: "all", search: "", page: 1 } as const;

function OverviewPage() {
  const { staff, data } = Route.useLoaderData();
  const openCount = (data.submissions.byStatus.new ?? 0) + (data.submissions.byStatus.in_review ?? 0);

  return (
    <CmsShell
      staff={staff}
      eyebrow="Dashboard"
      title="Overview"
      subtitle="Everything waiting for the team: enquiries from the website, unpublished content drafts, and the latest changes made in the CMS."
      inboxCount={data.submissions.byStatus.new}
      actions={
        <>
          <Link to="/admin/content" className="cms-btn">
            <FileText aria-hidden="true" /> Edit content
          </Link>
          <Link to="/admin/submissions" search={SUBMISSION_SEARCH} className="cms-btn cms-btn-primary">
            <Inbox aria-hidden="true" /> Open inbox
          </Link>
        </>
      }
    >
      {!data.ok ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone="warning">
            Live figures are unavailable because the CMS database could not be reached. The public
            website keeps serving its last published content.
          </Notice>
        </div>
      ) : null}

      <div className="cms-grid cms-grid-stats" style={{ marginBottom: 16 }}>
        <Stat
          label="Open enquiries"
          value={openCount}
          hint={`${data.submissions.byStatus.new ?? 0} new · ${data.submissions.byStatus.in_review ?? 0} in review`}
          icon={<Inbox aria-hidden="true" style={{ width: 14, height: 14 }} />}
        />
        <Stat
          label="Last 7 days"
          value={data.submissions.last7Days}
          hint={`${data.submissions.total} submissions all time`}
          icon={<Activity aria-hidden="true" style={{ width: 14, height: 14 }} />}
        />
        <Stat
          label="Drafts to publish"
          value={data.content.pendingPublish.length}
          hint={`${data.content.total} content documents`}
          icon={<Send aria-hidden="true" style={{ width: 14, height: 14 }} />}
        />
        <Stat
          label="Media"
          value={data.media.total}
          hint={`${data.media.published} live · ${data.media.archived} archived`}
          icon={<Images aria-hidden="true" style={{ width: 14, height: 14 }} />}
        />
        <Stat
          label="Team"
          value={data.team.active}
          hint={`${data.team.admins} admins · ${data.team.inactive} inactive`}
          icon={<Users aria-hidden="true" style={{ width: 14, height: 14 }} />}
        />
      </div>

      <div className="cms-grid cms-grid-2">
        <section className="cms-card">
          <header className="cms-card-head">
            <h2 className="cms-card-title">Latest enquiries</h2>
            <Link
              to="/admin/submissions"
              search={SUBMISSION_SEARCH}
              className="cms-link"
              style={{ marginLeft: "auto", fontSize: 12 }}
            >
              View all
            </Link>
          </header>
          {data.submissions.recent.length ? (
            <div className="cms-list">
              {data.submissions.recent.map((item) => (
                <Link
                  key={item.id}
                  to="/admin/submissions/$id"
                  params={{ id: String(item.id) }}
                  className="cms-row"
                >
                  <span className="cms-row-main">
                    <span className="cms-row-title">
                      {item.reference ?? `#${item.id}`}{" "}
                      <span className="cms-faint" style={{ fontWeight: 400 }}>
                        · {SUBMISSION_TYPE_LABELS[item.type] ?? item.type}
                      </span>
                    </span>
                    <span className="cms-row-meta">
                      {item.contactEmail} · {formatRelative(item.createdAt)}
                    </span>
                  </span>
                  <span className="cms-row-actions">
                    <StatusBadge status={item.status} />
                    <ArrowUpRight aria-hidden="true" style={{ width: 15, height: 15, opacity: 0.5 }} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Inbox aria-hidden="true" />}
              title="No enquiries yet"
              copy="Website forms will appear here the moment a customer submits one."
            />
          )}
        </section>

        <section className="cms-card">
          <header className="cms-card-head">
            <h2 className="cms-card-title">Waiting to publish</h2>
            <Link to="/admin/content" className="cms-link" style={{ marginLeft: "auto", fontSize: 12 }}>
              All documents
            </Link>
          </header>
          {data.content.pendingPublish.length ? (
            <div className="cms-list">
              {data.content.pendingPublish.map((item) => (
                <Link
                  key={item.key}
                  to="/admin/content/$key"
                  params={{ key: item.key }}
                  className="cms-row"
                >
                  <span className="cms-row-main">
                    <span className="cms-row-title">{item.label}</span>
                    <span className="cms-row-meta">
                      {item.group} · edited {formatRelative(item.updatedAt)}
                      {item.updatedBy ? ` by ${item.updatedBy}` : ""}
                    </span>
                  </span>
                  <span className="cms-row-actions">
                    <span className="cms-badge cms-badge-warning">Draft changes</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Send aria-hidden="true" />}
              title="Everything is published"
              copy={`The website matches the CMS. Last publish ${formatRelative(data.content.lastPublishedAt)}.`}
            />
          )}
        </section>
      </div>

      <section className="cms-card" style={{ marginTop: 14 }}>
        <header className="cms-card-head">
          <h2 className="cms-card-title">Recent CMS activity</h2>
          {staff.role === "admin" ? (
            <Link to="/admin/activity" search={{ page: 1, action: "" }} className="cms-link" style={{ marginLeft: "auto", fontSize: 12 }}>
              Full log
            </Link>
          ) : null}
        </header>
        {data.activity.length ? (
          <div className="cms-table-wrap">
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Target</th>
                  <th>By</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {data.activity.map((entry) => (
                  <tr key={entry.id}>
                    <td>{humaniseAction(entry.action)}</td>
                    <td className="cms-mono">
                      {entry.targetType}/{entry.targetId}
                    </td>
                    <td>{entry.staff ?? "system"}</td>
                    <td className="cms-num">{formatDateTime(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Activity aria-hidden="true" />}
            title="No activity recorded yet"
            copy="Draft saves, publishes, media changes and account updates are all logged here."
          />
        )}
      </section>
    </CmsShell>
  );
}
