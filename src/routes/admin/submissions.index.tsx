import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { CheckCircle2, Inbox, Mail, MoreHorizontal, RotateCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  BulkBar,
  EmptyState,
  formatDate,
  formatRelative,
  InitialsAvatar,
  Notice,
  ResultsFooter,
  SectionCard,
  Spinner,
  StatusPill,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_TYPE_LABELS,
  TableSkeleton,
  type SubmissionStatus,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAdminSession,
  listSubmissions,
  markSubmissionReviewed,
  setSubmissionStatus,
  type SubmissionListResult,
} from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import { cn } from "@/lib/utils";

type SubmissionSearch = { type: string; status: string; search: string; page: number };
type Status = SubmissionStatus;

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
  const [query, setQuery] = useState(search.search);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
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
  const allSelected = items.length > 0 && selected.length === items.length;

  async function applyStatus(status: Status, ids: number[]) {
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      for (const id of ids) await setSubmissionStatus({ data: { id, status: status as never } });
      toast.success(
        `${ids.length} submission${ids.length === 1 ? "" : "s"} moved to ${SUBMISSION_STATUS_LABELS[status].toLowerCase()}`,
      );
      setSelected([]);
      setReload((value) => value + 1);
    } catch {
      toast.error("Some submissions could not be updated. Refresh and try again.");
    } finally {
      setBulkBusy(false);
    }
  }

  async function markReviewed(ids: number[]) {
    setBulkBusy(true);
    try {
      for (const id of ids) await markSubmissionReviewed({ data: { id } });
      toast.success(`${ids.length} submission${ids.length === 1 ? "" : "s"} marked as reviewed`);
      setSelected([]);
      setReload((value) => value + 1);
    } catch {
      toast.error("Some submissions could not be updated. Refresh and try again.");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <CmsShell
      staff={staff}
      title="Submissions"
      subtitle="Part enquiries, credit applications, return requests and support messages captured from the website."
      inboxCount={result?.ok ? result.counts.new : undefined}
      actions={
        filtered ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              void navigate({ search: { type: "all", status: "all", search: "", page: 1 } })
            }
          >
            <RotateCcw /> Clear filters
          </Button>
        ) : null
      }
    >
      {result?.ok ? (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(SUBMISSION_STATUS_LABELS).map(([status, label]) => {
            const active = search.status === status;
            return (
              <Link
                key={status}
                to="/admin/submissions"
                search={{ ...search, status: active ? "all" : status, page: 1 }}
                aria-pressed={active}
                className={cn(
                  "rounded-xl border bg-card px-3 py-2.5 transition-colors",
                  active ? "border-primary bg-primary/8" : "hover:border-primary/40",
                )}
              >
                <span className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {label}
                </span>
                <span className="mt-1 block text-xl font-semibold tabular-nums">
                  {result.counts[status as keyof typeof result.counts]}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Reference, email, name or company…"
            aria-label="Search submissions"
            className="h-9 pl-8"
          />
        </div>
        <Select
          value={search.type}
          onValueChange={(value) => void navigate({ search: { ...search, type: value, page: 1 } })}
        >
          <SelectTrigger className="h-9 w-48" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(SUBMISSION_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadError ? (
        <div className="mb-4">
          <Notice tone="danger">{loadError}</Notice>
        </div>
      ) : null}

      <SectionCard>
        {loading ? (
          <TableSkeleton rows={7} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Inbox />}
            title={filtered ? "No submissions match these filters" : "No submissions yet"}
            copy={
              filtered
                ? "Try a different status, type or search term."
                : "Website forms appear here the moment a customer submits one."
            }
            className="m-4 border-0"
          />
        ) : (
          <>
            <div className="flex items-center gap-3 border-b px-4 py-2">
              <Checkbox
                checked={allSelected}
                aria-label="Select all on this page"
                onCheckedChange={(checked) =>
                  setSelected(checked ? items.map((item) => item.id) : [])
                }
              />
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {items.length} on this page
              </span>
            </div>
            <ul className="divide-y">
              {items.map((item) => {
                const isSelected = selected.includes(item.id);
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex flex-wrap items-center gap-3 px-4 py-2.5 transition-colors",
                      isSelected ? "bg-primary/5" : "hover:bg-accent/40",
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      aria-label={`Select ${item.reference ?? `submission ${item.id}`}`}
                      onCheckedChange={() =>
                        setSelected((current) =>
                          current.includes(item.id)
                            ? current.filter((value) => value !== item.id)
                            : [...current, item.id],
                        )
                      }
                    />

                    <div className="min-w-0 flex-1">
                      <Link
                        to="/admin/submissions/$id"
                        params={{ id: String(item.id) }}
                        className="text-[13px] font-medium hover:underline"
                      >
                        {item.reference ?? `Submission #${item.id}`}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {SUBMISSION_TYPE_LABELS[item.type] ?? item.type}
                        {item.company ? ` · ${item.company}` : ""}
                      </p>
                    </div>

                    <span className="hidden min-w-0 items-center gap-2 text-xs md:flex md:w-48">
                      <InitialsAvatar
                        name={item.contactName ?? item.contactEmail}
                        className="size-5 text-[9px]"
                      />
                      <span className="truncate">{item.contactName ?? item.contactEmail}</span>
                    </span>

                    <time
                      className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground sm:block"
                      dateTime={item.createdAt}
                      title={formatDate(item.createdAt)}
                    >
                      {formatRelative(item.createdAt)}
                    </time>

                    <StatusPill status={item.status} />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Actions for ${item.reference ?? item.id}`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild className="gap-2 text-[13px]">
                          <Link to="/admin/submissions/$id" params={{ id: String(item.id) }}>
                            <Inbox className="size-4" aria-hidden="true" /> Open submission
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="gap-2 text-[13px]">
                          <a href={`mailto:${item.contactEmail}`}>
                            <Mail className="size-4" aria-hidden="true" /> Email sender
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs">Set status</DropdownMenuLabel>
                        {Object.entries(SUBMISSION_STATUS_LABELS).map(([value, label]) => (
                          <DropdownMenuItem
                            key={value}
                            disabled={item.status === value || bulkBusy}
                            onSelect={() => void applyStatus(value as Status, [item.id])}
                            className="text-[13px]"
                          >
                            {label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              })}
            </ul>
            {result?.ok ? (
              <ResultsFooter
                shown={items.length}
                total={result.total}
                noun="submissions"
                page={result.page}
                pageCount={result.pageCount}
                onChange={(page) => void navigate({ search: { ...search, page } })}
              />
            ) : null}
          </>
        )}
      </SectionCard>

      <BulkBar count={selected.length} onClear={() => setSelected([])}>
        <Select
          value=""
          onValueChange={(value) => void applyStatus(value as Status, selected)}
          disabled={bulkBusy}
        >
          <SelectTrigger className="h-8 w-36" aria-label="Set status for selected submissions">
            <SelectValue placeholder="Set status…" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SUBMISSION_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          disabled={bulkBusy}
          onClick={() => void markReviewed(selected)}
        >
          {bulkBusy ? <Spinner /> : <CheckCircle2 />} Mark reviewed
        </Button>
      </BulkBar>
    </CmsShell>
  );
}
