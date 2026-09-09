import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Check,
  ExternalLink,
  Eye,
  Monitor,
  MousePointerClick,
  PanelRightClose,
  RotateCcw,
  Save,
  Send,
  Smartphone,
  SquareDashedMousePointer,
  Tablet,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { CmsShell } from "@/components/admin/CmsShell";
import { FieldRenderer, type FieldContext, type JsonValue } from "@/components/admin/FieldRenderer";
import { EmptyState, Notice, Pill, SectionCard, Spinner } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import { getDraftBundle, publishDraft, saveDraft } from "@/lib/content/content.functions";
import {
  EDITABLE_PAGE_GROUPS,
  EDITABLE_PAGES,
  editablePageFor,
  isEditablePage,
} from "@/lib/content/editable-pages";
import { describePath, humanise, resolveField, type FieldDef } from "@/lib/content/fields";
import { listMedia } from "@/lib/content/media.functions";
import { breadcrumbOfPath, documentKeyOf, readPath, writePath } from "@/lib/content/paths";
import type { ContentKey } from "@/lib/content/registry";
import { cn } from "@/lib/utils";

const WIDTHS = {
  desktop: { label: "Desktop", width: "100%", icon: Monitor },
  tablet: { label: "Tablet", width: "834px", icon: Tablet },
  mobile: { label: "Mobile", width: "414px", icon: Smartphone },
} as const;

type Width = keyof typeof WIDTHS;
type DraftEntry = { data: JsonValue; version: number; repaired?: boolean };
type Selection = { path: string; label: string };

export const Route = createFileRoute("/admin/visual")({
  head: () => cmsHead("Edit pages"),
  validateSearch: (search: Record<string, unknown>) => ({
    page: typeof search.page === "string" && isEditablePage(search.page) ? search.page : "/",
    width: (["desktop", "tablet", "mobile"] as const).includes(search.width as Width)
      ? (search.width as Width)
      : ("desktop" as const),
  }),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    const [bundle, media] = await Promise.all([getDraftBundle(), listMedia()]);
    return { staff, drafts: JSON.parse(bundle) as Record<string, DraftEntry>, media };
  },
  component: VisualEditorPage,
});

function VisualEditorPage() {
  const loaded = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const frame = useRef<HTMLIFrameElement>(null);

  const [drafts, setDrafts] = useState(loaded.drafts);
  const [selection, setSelection] = useState<Selection | null>(null);
  /** Dotted path → value, for every field touched since the last save. */
  const [edits, setEdits] = useState<Record<string, JsonValue>>({});
  const [undoStack, setUndoStack] = useState<Array<{ path: string; value: JsonValue }>>([]);
  const [busy, setBusy] = useState<"" | "save" | "publish">("");
  const [ready, setReady] = useState(false);
  const [fieldCount, setFieldCount] = useState<number | null>(null);
  /** False when the frame never produced a document, e.g. framing was refused. */
  const [frameLoaded, setFrameLoaded] = useState(true);
  const [outline, setOutline] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const page = editablePageFor(search.page);
  const source = `${search.page}${search.page.includes("?") ? "&" : "?"}cmsEdit=1`;

  /** Drafts with the unsaved edits applied, which is what the panel edits. */
  const workingDrafts = useMemo(() => {
    const next: Record<string, DraftEntry> = { ...drafts };
    for (const [path, value] of Object.entries(edits)) {
      const key = documentKeyOf(path);
      if (!key || !next[key]) continue;
      const rest = path.slice(key.length + 1);
      next[key] = { ...next[key], data: writePath(next[key].data, rest, value) as JsonValue };
    }
    return next;
  }, [drafts, edits]);

  const dirtyKeys = useMemo(() => {
    const keys = new Set<ContentKey>();
    for (const path of Object.keys(edits)) {
      const key = documentKeyOf(path);
      if (key) keys.add(key);
    }
    return [...keys];
  }, [edits]);

  const selected = useMemo(() => {
    if (!selection) return null;
    const key = documentKeyOf(selection.path);
    if (!key) return null;
    const rest = selection.path.slice(key.length + 1);
    const segments = rest.split(".").filter(Boolean);
    const field = resolveField(key, segments, workingDrafts[key]?.data);
    return {
      key,
      rest,
      segments,
      field: (field ?? { kind: "text", label: selection.label }) as FieldDef,
      value: (readPath(workingDrafts[key]?.data, rest) ?? "") as JsonValue,
    };
  }, [selection, workingDrafts]);

  /**
   * Writes an edit and mirrors simple text straight into the preview, so the
   * page updates as the editor types instead of after a round trip.
   */
  const applyEdit = useCallback(
    (path: string, value: JsonValue) => {
      setUndoStack((stack) => [...stack.slice(-49), { path, value: edits[path] ?? null }]);
      setEdits((current) => ({ ...current, [path]: value }));

      if (typeof value !== "string") return;
      const document_ = frame.current?.contentDocument;
      const target = document_?.querySelector<HTMLElement>(`[data-cms-field="${cssEscape(path)}"]`);
      // Only mirror leaf text nodes; anything with markup inside is left alone.
      if (target && target.childElementCount === 0) target.textContent = value;
    },
    [edits],
  );

  /**
   * Wire click-to-edit inside the rendered page.
   *
   * The load event is unreliable (cached documents and dev-time remounts can
   * fire it before React attaches a handler), so readiness is polled instead
   * and the connection is idempotent.
   */
  const connectFrame = useCallback((document_: Document) => {
    if (document_.body?.dataset.cmsConnected === "true") return;
    document_.body.dataset.cmsConnected = "true";
    setReady(true);
    setFrameLoaded(true);
    setFieldCount(document_.querySelectorAll("[data-cms-field]").length);

    const style = document_.createElement("style");
    style.textContent = `
      [data-cms-field] { cursor: text; transition: outline-color .12s ease, background-color .12s ease; border-radius: 2px; }
      html[data-cms-outline="on"] [data-cms-field] { outline: 1px dashed rgba(99,102,241,.5); outline-offset: 3px; }
      [data-cms-field]:hover { outline: 2px solid #6366f1 !important; outline-offset: 3px; background-color: rgba(99,102,241,.10); }
      [data-cms-field][data-cms-active="true"] { outline: 2px solid #f59e0b !important; outline-offset: 3px; background-color: rgba(245,158,11,.14); }
      [data-cms-field][data-cms-edited="true"]::after { content: "•"; color: #f59e0b; font-weight: 700; margin-left: .25em; }
    `;
    document_.head.append(style);

    document_.addEventListener(
      "click",
      (event) => {
        const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
          "[data-cms-field]",
        );
        if (target) {
          // Editing beats navigating while the editor is open.
          event.preventDefault();
          event.stopPropagation();
          for (const marked of document_.querySelectorAll<HTMLElement>("[data-cms-active]")) {
            marked.removeAttribute("data-cms-active");
          }
          target.setAttribute("data-cms-active", "true");
          setPanelOpen(true);
          setSelection({
            path: target.dataset.cmsField ?? "",
            label: target.dataset.cmsLabel || humanise(target.dataset.cmsField?.split(".").at(-1) ?? ""),
          });
          return;
        }
        // Keep the editor on the page being edited.
        const link = (event.target as HTMLElement | null)?.closest("a");
        if (link) event.preventDefault();
      },
      true,
    );
  }, []);

  // Poll the frame until its document is usable, then connect. Also gives up
  // gracefully so the overlay can never sit on the page forever.
  useEffect(() => {
    setReady(false);
    setFieldCount(null);
    setFrameLoaded(true);
    let cancelled = false;
    const started = Date.now();
    const timer = setInterval(() => {
      if (cancelled) return;
      const document_ = frame.current?.contentDocument;
      // A fresh iframe already exposes an `about:blank` document that is
      // "complete" and has a body. Connecting to it would wire the click
      // handlers to a document the real navigation is about to throw away,
      // leaving the editor reporting zero editable fields for ever.
      if (
        document_ &&
        document_.URL !== "about:blank" &&
        document_.readyState !== "loading" &&
        document_.body
      ) {
        clearInterval(timer);
        connectFrame(document_);
        return;
      }
      if (Date.now() - started > 15_000) {
        clearInterval(timer);
        setReady(true);
        setFieldCount(0);
        setFrameLoaded(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [connectFrame, source, reloadKey]);

  // Keep the outline preference and edited markers in sync with the frame.
  useEffect(() => {
    const document_ = frame.current?.contentDocument;
    if (!document_ || !ready) return;
    document_.documentElement.dataset.cmsOutline = outline ? "on" : "off";
    for (const element of document_.querySelectorAll<HTMLElement>("[data-cms-edited]")) {
      element.removeAttribute("data-cms-edited");
    }
    for (const path of Object.keys(edits)) {
      document_
        .querySelector<HTMLElement>(`[data-cms-field="${cssEscape(path)}"]`)
        ?.setAttribute("data-cms-edited", "true");
    }
  }, [outline, edits, ready, reloadKey]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (Object.keys(edits).length) event.preventDefault();
    };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [edits]);

  async function saveAll() {
    if (dirtyKeys.length === 0) return true;
    setBusy("save");
    try {
      const nextDrafts = { ...drafts };
      for (const key of dirtyKeys) {
        const entry = workingDrafts[key];
        const result = await saveDraft({
          data: { key, data: entry.data, version: drafts[key].version },
        });
        if (!result.ok) {
          const issue = "issues" in result ? result.issues?.[0] : undefined;
          toast.error("Could not save every change", {
            description: issue
              ? `${describePath(key, issue.path, entry.data)} — ${issue.message}`
              : result.error,
          });
          return false;
        }
        nextDrafts[key] = { data: entry.data, version: result.version };
      }
      setDrafts(nextDrafts);
      setEdits({});
      setUndoStack([]);
      toast.success("Changes saved to the draft", {
        description: "Publish when you want visitors to see them.",
      });
      return true;
    } finally {
      setBusy("");
    }
  }

  async function publishAll() {
    const keys = dirtyKeys.length ? dirtyKeys : page.documents;
    if (dirtyKeys.length && !(await saveAll())) return;
    setBusy("publish");
    try {
      let published = 0;
      for (const key of keys) {
        const result = await publishDraft({ data: { key } });
        if (result.ok) published += 1;
        else if (result.error) toast.error(`${key}: ${result.error}`);
      }
      if (published) {
        toast.success("Published", { description: "The live website now shows this wording." });
        reloadFrame();
      }
    } finally {
      setBusy("");
    }
  }

  function reloadFrame() {
    setSelection(null);
    setReloadKey((value) => value + 1);
  }

  function undo() {
    const last = undoStack.at(-1);
    if (!last) return;
    setUndoStack((stack) => stack.slice(0, -1));
    setEdits((current) => {
      const next = { ...current };
      if (last.value === null) delete next[last.path];
      else next[last.path] = last.value;
      return next;
    });
    reloadFrame();
  }

  const editCount = Object.keys(edits).length;
  /** Documents whose stored draft was invalid and had to be swapped out. */
  const repaired = page.documents.filter((key) => drafts[key]?.repaired);
  const ctx: FieldContext = { media: loaded.media, issues: {} };

  return (
    <CmsShell
      staff={loaded.staff}
      title="Edit pages"
      bare
      wide
      actions={null}
    >
      <div className="flex flex-col gap-3">
        {/* -------------------------------------------------------- toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2">
          <Select
            value={search.page}
            onValueChange={(value) => {
              setSelection(null);
              void navigate({ search: { ...search, page: value } });
            }}
          >
            <SelectTrigger className="h-8 w-56" aria-label="Page to edit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDITABLE_PAGE_GROUPS.map((group) => {
                const pages = EDITABLE_PAGES.filter((entry) => entry.group === group);
                if (pages.length === 0) return null;
                return (
                  <SelectGroup key={group}>
                    <SelectLabel className="text-xs">{group}</SelectLabel>
                    {pages.map((entry) => (
                      <SelectItem key={entry.path} value={entry.path}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>

          <div
            role="group"
            aria-label="Preview width"
            className="flex items-center rounded-lg border p-0.5"
          >
            {(Object.keys(WIDTHS) as Width[]).map((width) => {
              const Icon = WIDTHS[width].icon;
              return (
                <button
                  key={width}
                  type="button"
                  aria-pressed={search.width === width}
                  aria-label={WIDTHS[width].label}
                  onClick={() => void navigate({ search: { ...search, width } })}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md transition-colors",
                    search.width === width
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <Button
            variant={outline ? "secondary" : "ghost"}
            size="sm"
            className="h-8"
            onClick={() => setOutline((value) => !value)}
            aria-pressed={outline}
          >
            <SquareDashedMousePointer /> Outlines
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Reload preview"
            onClick={reloadFrame}
          >
            <RotateCcw />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Undo last change"
            disabled={undoStack.length === 0}
            onClick={undo}
          >
            <Undo2 />
          </Button>

          <div className="ml-auto flex items-center gap-2">
            {editCount ? (
              <Pill tone="warning" dot>
                {editCount} unsaved
              </Pill>
            ) : (
              <Pill tone="success" dot>
                Saved
              </Pill>
            )}
            <Button variant="outline" size="sm" className="h-8" asChild>
              <a href={search.page} target="_blank" rel="noreferrer">
                <ExternalLink /> Live page
              </a>
            </Button>
            <Button
              size="sm"
              className="h-8"
              variant="outline"
              onClick={saveAll}
              disabled={busy !== "" || editCount === 0}
            >
              {busy === "save" ? <Spinner /> : <Save />} Save
            </Button>
            {loaded.staff.role === "admin" ? (
              <Button
                size="sm"
                className="h-8"
                onClick={publishAll}
                disabled={busy !== "" || (editCount === 0 && dirtyKeys.length === 0)}
              >
                {busy === "publish" ? <Spinner /> : <Send />} Publish
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={panelOpen ? "Hide inspector" : "Show inspector"}
              onClick={() => setPanelOpen((value) => !value)}
            >
              <PanelRightClose className={cn("transition-transform", !panelOpen && "rotate-180")} />
            </Button>
          </div>
        </div>

        {/* ---------------------------------------------------------- stage */}
        <div
          className={cn(
            "grid min-h-0 gap-3",
            panelOpen ? "xl:grid-cols-[minmax(0,1fr)_20rem]" : "grid-cols-1",
          )}
        >
          <div className="relative flex min-h-[70vh] justify-center overflow-hidden rounded-xl border bg-muted/40 p-3">
            {!ready ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/70 text-[13px] text-muted-foreground backdrop-blur-sm">
                <Spinner /> Loading page…
              </div>
            ) : null}
            <iframe
              ref={frame}
              key={`${source}-${reloadKey}`}
              title="Page being edited"
              src={source}
              className="h-full min-h-[70vh] w-full rounded-lg border bg-white shadow-sm"
              style={{ width: WIDTHS[search.width].width, maxWidth: "100%" }}
            />
          </div>

          {panelOpen ? (
            <aside className="min-w-0 space-y-3 xl:sticky xl:top-18 xl:self-start">
              {repaired.length ? (
                <Notice tone="warning" title="A saved draft could not be read">
                  {repaired.length === 1 ? "One content document" : `${repaired.length} content documents`}{" "}
                  on this page had a draft that no longer matches the content rules, so you are
                  editing the published wording instead. Saving replaces the unreadable draft.
                </Notice>
              ) : null}

              {ready && fieldCount === 0 ? (
                frameLoaded ? (
                  <Notice tone="warning" title="No editable text found here">
                    This page has not been wired for click-to-edit yet. Use the Content section in
                    the sidebar to change its wording.
                  </Notice>
                ) : (
                  <Notice tone="danger" title="The page could not be loaded">
                    The preview did not open. Reload it, and if it stays blank the server may be
                    refusing to display the site inside the editor.
                  </Notice>
                )
              ) : null}

              {selected ? (
                <SectionCard
                  title={selection?.label}
                  description={breadcrumbOfPath(selection?.path ?? "")}
                >
                  <div className="space-y-4 p-3.5">
                    <FieldRenderer
                      field={selected.field}
                      value={selected.value}
                      onChange={(next) => applyEdit(selection!.path, next)}
                      path={selected.segments}
                      ctx={ctx}
                    />

                    <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={saveAll}
                        disabled={busy !== "" || editCount === 0}
                      >
                        {busy === "save" ? <Spinner /> : <Save />} Save {editCount || ""}
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/admin/content/$key" params={{ key: selected.key }}>
                          Full editor
                        </Link>
                      </Button>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      {editCount ? (
                        <>
                          <Check className="mr-1 inline size-3" aria-hidden="true" />
                          Edits are held here until you save. Nothing changes for visitors until you
                          publish.
                        </>
                      ) : (
                        "Draft matches what you see in the preview."
                      )}
                    </p>
                  </div>
                </SectionCard>
              ) : (
                <SectionCard title="Nothing selected">
                  <div className="space-y-3 p-3.5">
                    <EmptyState
                      icon={<MousePointerClick />}
                      title="Click any highlighted text"
                      copy="Editable wording is outlined on the page. Click it, change it, then save."
                      className="border-0 py-6"
                    />
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      <li className="flex gap-2">
                        <Eye className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                        {fieldCount ?? 0} editable field{fieldCount === 1 ? "" : "s"} on this page.
                      </li>
                      <li className="flex gap-2">
                        <SquareDashedMousePointer
                          className="mt-0.5 size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        Prices, products and destinations stay locked — those come from Shopify.
                      </li>
                    </ul>
                  </div>
                </SectionCard>
              )}
            </aside>
          ) : null}
        </div>
      </div>
    </CmsShell>
  );
}

/** Escapes a dotted content path for use inside an attribute selector. */
function cssEscape(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
