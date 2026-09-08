import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  FileText,
  Images,
  Inbox,
  MousePointerClick,
  Send,
  Users,
} from "lucide-react";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  EmptyState,
  formatDateTime,
  formatRelative,
  humaniseAction,
  InitialsAvatar,
  Notice,
  Pill,
  SectionCard,
  Stat,
  StatusPill,
  SUBMISSION_TYPE_LABELS,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { getDashboard } from "@/lib/admin/dashboard.functions";
import { cmsHead } from "@/lib/admin/head";

const SUBMISSION_SEARCH = { type: "all", status: "all", search: "", page: 1 } as const;
const ACTIVITY_SEARCH = { page: 1, action: "" } as const;

export const Route = createFileRoute("/admin/")({
  head: () => cmsHead("Dashboard"),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    return { staff, data: await getDashboard() };
  },
  component: OverviewPage,
});

function OverviewPage() {
  const { staff, data } = Route.useLoaderData();
  const open = (data.submissions.byStatus.new ?? 0) + (data.submissions.byStatus.in_review ?? 0);
  const firstName = staff.name.split(/\s+/)[0];

  return (
    <CmsShell
      staff={staff}
      title="Overview"
      subtitle={`Welcome back, ${firstName}. Enquiries from the website, content waiting to publish, and the latest changes made in the CMS.`}
      inboxCount={data.submissions.byStatus.new}
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/content">
              <FileText /> All content
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/admin/visual" search={{ page: "/", width: "desktop" as const }}>
              <MousePointerClick /> Edit website text
            </Link>
          </Button>
        </>
      }
    >
      {!data.ok ? (
        <div className="mb-5">
          <Notice tone="warning" title="Live figures are unavailable">
            The CMS database could not be reached. The public website keeps serving its last
            published content.
          </Notice>
        </div>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          label="Open enquiries"
          value={open}
          hint={`${data.submissions.byStatus.new ?? 0} new · ${data.submissions.byStatus.in_review ?? 0} in review`}
          icon={<Inbox />}
          tone={open > 0 ? "accent" : "neutral"}
          to="/admin/submissions"
          search={SUBMISSION_SEARCH}
        />
        <Stat
          label="Last 7 days"
          value={data.submissions.last7Days}
          hint={`${data.submissions.total} submissions all time`}
          icon={<Activity />}
        />
        <Stat
          label="Drafts to publish"
          value={data.content.pendingPublish.length}
          hint={`${data.content.total} content documents`}
          icon={<Send />}
          tone={data.content.pendingPublish.length > 0 ? "warning" : "success"}
          to="/admin/content"
        />
        <Stat
          label="Media"
          value={data.media.total}
          hint={`${data.media.published} live · ${data.media.archived} archived`}
          icon={<Images />}
          to="/admin/media"
        />
        <Stat
          label="Team"
          value={data.team.active}
          hint={`${data.team.admins} admins · ${data.team.inactive} inactive`}
          icon={<Users />}
          to={staff.role === "admin" ? "/admin/users" : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Latest enquiries"
          action={
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link to="/admin/submissions" search={SUBMISSION_SEARCH}>
                View all
              </Link>
            </Button>
          }
        >
          {data.submissions.recent.length ? (
            <ul className="divide-y">
              {data.submissions.recent.map((item) => (
                <li key={item.id}>
                  <Link
                    to="/admin/submissions/$id"
                    params={{ id: String(item.id) }}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {item.reference ?? `#${item.id}`}
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          {SUBMISSION_TYPE_LABELS[item.type] ?? item.type}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.contactEmail} · {formatRelative(item.createdAt)}
                      </p>
                    </div>
                    <StatusPill status={item.status} />
                    <ArrowUpRight
                      className="size-4 shrink-0 text-muted-foreground/50"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Inbox />}
              title="No enquiries yet"
              copy="Website forms appear here the moment a customer submits one."
              className="m-4 border-0"
            />
          )}
        </SectionCard>

        <SectionCard
          title="Waiting to publish"
          action={
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link to="/admin/content">All documents</Link>
            </Button>
          }
        >
          {data.content.pendingPublish.length ? (
            <ul className="divide-y">
              {data.content.pendingPublish.map((item) => (
                <li key={item.key}>
                  <Link
                    to="/admin/content/$key"
                    params={{ key: item.key }}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{item.label}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.group} · edited {formatRelative(item.updatedAt)}
                        {item.updatedBy ? ` by ${item.updatedBy}` : ""}
                      </p>
                    </div>
                    <Pill tone="warning" dot>
                      Draft
                    </Pill>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Send />}
              title="Everything is published"
              copy={`The website matches the CMS. Last publish ${formatRelative(data.content.lastPublishedAt)}.`}
              className="m-4 border-0"
            />
          )}
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          title="Recent activity"
          action={
            staff.role === "admin" ? (
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link to="/admin/activity" search={ACTIVITY_SEARCH}>
                  Full log
                </Link>
              </Button>
            ) : null
          }
        >
          {data.activity.length ? (
            <ul className="divide-y">
              {data.activity.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                  <InitialsAvatar name={entry.staff ?? "System"} className="size-6 text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">
                      <span className="font-medium">{entry.staff ?? "System"}</span>{" "}
                      <span className="text-muted-foreground">
                        {humaniseAction(entry.action).toLowerCase()}
                      </span>{" "}
                      {entry.targetId ? (
                        <code className="rounded bg-muted px-1 py-px font-mono text-[11px]">
                          {entry.targetId}
                        </code>
                      ) : null}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-xs text-muted-foreground"
                    dateTime={entry.createdAt}
                    title={formatDateTime(entry.createdAt)}
                  >
                    {formatRelative(entry.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Activity />}
              title="Nothing recorded yet"
              copy="Saves, publishes and account changes are logged here."
              className="m-4 border-0"
            />
          )}
        </SectionCard>
      </div>
    </CmsShell>
  );
}
