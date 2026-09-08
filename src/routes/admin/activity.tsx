import { createFileRoute, redirect } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useEffect, useState } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  EmptyState,
  formatDateTime,
  formatRelative,
  humaniseAction,
  InitialsAvatar,
  Notice,
  Pill,
  ResultsFooter,
  SectionCard,
  TableSkeleton,
  type Tone,
} from "@/components/admin/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { listAuditActions, listAuditLog, type AuditEntry } from "@/lib/admin/dashboard.functions";
import { cmsHead } from "@/lib/admin/head";

type ActivitySearch = { page: number; action: string };

/** Colour by consequence: publishing and deleting stand out from saving. */
function toneFor(action: string): Tone {
  if (action.includes("delete") || action.includes("deactivat")) return "danger";
  if (action.includes("publish") || action.includes("restore")) return "success";
  if (action.includes("created") || action.includes("upload")) return "accent";
  return "neutral";
}

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
      title="Activity log"
      subtitle="Every draft save, publish, revision restore, media change and account update, with the person responsible."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select
          value={search.action || "all"}
          onValueChange={(action) =>
            void navigate({ search: { page: 1, action: action === "all" ? "" : action } })
          }
        >
          <SelectTrigger className="h-9 w-64" aria-label="Filter by action">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((action) => (
              <SelectItem key={action} value={action}>
                {humaniseAction(action)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground tabular-nums">{meta.total} entries</span>
      </div>

      {error ? (
        <Notice tone="danger" title="The activity log could not be loaded">
          Refresh the page, or try again in a moment.
        </Notice>
      ) : (
        <SectionCard>
          {loading ? (
            <TableSkeleton rows={8} />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={<Activity />}
              title="Nothing logged yet"
              copy="Saves, publishes, media changes and account updates appear here."
              className="m-4 border-0"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">When</TableHead>
                      <TableHead className="w-52">Action</TableHead>
                      <TableHead className="w-56">Target</TableHead>
                      <TableHead className="w-44">By</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                          <time dateTime={entry.createdAt} title={formatDateTime(entry.createdAt)}>
                            {formatRelative(entry.createdAt)}
                          </time>
                        </TableCell>
                        <TableCell>
                          <Pill tone={toneFor(entry.action)} dot>
                            {humaniseAction(entry.action)}
                          </Pill>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {entry.targetType}/{entry.targetId}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2 text-xs">
                            <InitialsAvatar
                              name={entry.staff ?? "System"}
                              className="size-5 text-[9px]"
                            />
                            {entry.staff ?? "system"}
                          </span>
                        </TableCell>
                        <TableCell className="cms-break-path max-w-80 font-mono text-[11px] text-muted-foreground">
                          {entry.details ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ResultsFooter
                shown={entries.length}
                total={meta.total}
                noun="entries"
                page={meta.page}
                pageCount={meta.pageCount}
                onChange={(page) => void navigate({ search: { ...search, page } })}
              />
            </>
          )}
        </SectionCard>
      )}
    </CmsShell>
  );
}
