import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ExternalLink,
  Eye,
  FileText,
  MoreHorizontal,
  MousePointerClick,
  Pencil,
  Search,
  Send,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  EmptyState,
  formatRelative,
  Notice,
  Pill,
  SectionCard,
  Spinner,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import { getContentIndex, publishDraft } from "@/lib/content/content.functions";
import { specFor } from "@/lib/content/fields";
import type { ContentKey } from "@/lib/content/registry";

export const Route = createFileRoute("/admin/content/")({
  head: () => cmsHead("Content"),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    return { staff, documents: await getContentIndex() };
  },
  component: ContentIndexPage,
});

function ContentIndexPage() {
  const loaded = Route.useLoaderData();
  const [documents, setDocuments] = useState(loaded.documents);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [state, setState] = useState("all");
  const [busy, setBusy] = useState("");

  const groups = useMemo(
    () => [...new Set(loaded.documents.map((document) => document.group))],
    [loaded.documents],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return documents.filter((document) => {
      if (group !== "all" && document.group !== group) return false;
      if (state === "draft" && !document.hasUnpublishedChanges) return false;
      if (state === "published" && document.hasUnpublishedChanges) return false;
      if (!needle) return true;
      return (
        document.label.toLowerCase().includes(needle) ||
        document.group.toLowerCase().includes(needle) ||
        document.key.toLowerCase().includes(needle) ||
        specFor(document.key).description.toLowerCase().includes(needle)
      );
    });
  }, [documents, query, group, state]);

  /** Grouped the way the registry groups them, mirroring the sidebar. */
  const sections = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const document of visible) {
      if (!map.has(document.group)) map.set(document.group, []);
      map.get(document.group)!.push(document);
    }
    return [...map.entries()];
  }, [visible]);

  const pending = documents.filter((document) => document.hasUnpublishedChanges);

  async function publish(key: ContentKey, label: string) {
    setBusy(key);
    try {
      const result = await publishDraft({ data: { key } });
      if (!result.ok) {
        toast.error(`${label} could not be published`, { description: result.error });
        return;
      }
      setDocuments(await getContentIndex());
      toast.success(`${label} published`, { description: "The live website is up to date." });
    } catch {
      toast.error(`${label} could not be published.`);
    } finally {
      setBusy("");
    }
  }

  async function publishAll() {
    setBusy("all");
    let published = 0;
    for (const document of pending) {
      const result = await publishDraft({ data: { key: document.key } });
      if (result.ok) published += 1;
      else toast.error(`${document.label} could not be published`, { description: result.error });
    }
    setDocuments(await getContentIndex());
    setBusy("");
    if (published) {
      toast.success(`${published} document${published === 1 ? "" : "s"} published`);
    }
  }

  return (
    <CmsShell
      staff={loaded.staff}
      title="Content"
      subtitle="Every piece of editable wording on the website. Edit a draft, preview it, then publish. Shopify products, prices and orders are never changed here."
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/visual" search={{ page: "/", width: "desktop" as const }}>
              <MousePointerClick /> Edit on the page
            </Link>
          </Button>
          {loaded.staff.role === "admin" && pending.length > 0 ? (
            <Button size="sm" onClick={publishAll} disabled={busy !== ""}>
              {busy === "all" ? <Spinner /> : <Send />} Publish all ({pending.length})
            </Button>
          ) : null}
        </>
      }
    >
      {pending.length ? (
        <div className="mb-4">
          <Notice
            tone="warning"
            title={`${pending.length} document${pending.length === 1 ? "" : "s"} have unpublished changes`}
          >
            Visitors still see the last published wording until you publish.
          </Notice>
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
            placeholder="Search documents…"
            aria-label="Search content documents"
            className="h-9 pl-8"
          />
        </div>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="h-9 w-48" aria-label="Filter by area">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All areas</SelectItem>
            {groups.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="h-9 w-40" aria-label="Filter by publish state">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            <SelectItem value="draft">Draft changes</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="No documents match these filters"
          copy="Clear the filters to see every content area again."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setGroup("all");
                setState("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {sections.map(([sectionName, items]) => (
            <SectionCard key={sectionName} title={sectionName}>
              <ul className="divide-y">
                {items.map((item) => (
                  <li
                    key={item.key}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/admin/content/$key"
                        params={{ key: item.key }}
                        className="text-[13.5px] font-medium hover:underline"
                      >
                        {item.label}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {specFor(item.key).description}
                      </p>
                    </div>

                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {item.updatedAt ? formatRelative(item.updatedAt) : "—"}
                      {item.updatedBy ? ` · ${item.updatedBy}` : ""}
                    </span>

                    {item.hasUnpublishedChanges ? (
                      <Pill tone="warning" dot>
                        Draft changes
                      </Pill>
                    ) : (
                      <Pill tone="success" dot>
                        Published
                      </Pill>
                    )}

                    <span className="hidden font-mono text-[11px] text-muted-foreground md:block">
                      v{item.draftVersion}/{item.publishedVersion}
                    </span>

                    {busy === item.key ? (
                      <Spinner className="mx-2" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Actions for ${item.label}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem asChild className="gap-2 text-[13px]">
                            <Link to="/admin/content/$key" params={{ key: item.key }}>
                              <Pencil className="size-4" aria-hidden="true" /> Edit content
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="gap-2 text-[13px]">
                            <Link
                              to="/admin/content/$key/preview"
                              params={{ key: item.key }}
                              search={{ raw: false, page: "", width: "desktop" as const }}
                              target="_blank"
                            >
                              <Eye className="size-4" aria-hidden="true" /> Preview draft
                            </Link>
                          </DropdownMenuItem>
                          {specFor(item.key).previewPath ? (
                            <DropdownMenuItem asChild className="gap-2 text-[13px]">
                              <a
                                href={specFor(item.key).previewPath}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="size-4" aria-hidden="true" /> View live page
                              </a>
                            </DropdownMenuItem>
                          ) : null}
                          {loaded.staff.role === "admin" ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={!item.hasUnpublishedChanges}
                                onSelect={() => void publish(item.key, item.label)}
                                className="gap-2 text-[13px]"
                              >
                                <Send className="size-4" aria-hidden="true" /> Publish draft
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </li>
                ))}
              </ul>
            </SectionCard>
          ))}
        </div>
      )}
    </CmsShell>
  );
}
