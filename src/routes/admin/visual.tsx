import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Check,
  ExternalLink,
  Eye,
  Loader2,
  MousePointerClick,
  Monitor,
  RotateCcw,
  Save,
  Send,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import { ChipSelect, Notice } from "@/components/admin/cms-ui";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import { getDraftBundle, publishDraft, saveDraft } from "@/lib/content/content.functions";
import {
  breadcrumbOfPath,
  documentKeyOf,
  labelOfPath,
  readPath,
  writePath,
} from "@/lib/content/paths";
import { isContentKey, type ContentKey } from "@/lib/content/registry";

/** Pages the client can open in the visual editor. */
const PAGES = [
  { value: "/", label: "Home page" },
  { value: "/about-us", label: "About us" },
  { value: "/contact-us", label: "Contact us" },
  { value: "/delivery-information", label: "Delivery information" },
  { value: "/returns", label: "Returns" },
  { value: "/returns-policy", label: "Returns policy" },
  { value: "/terms-and-conditions", label: "Terms and conditions" },
  { value: "/privacy-policy", label: "Privacy policy" },
  { value: "/cookies", label: "Cookie policy" },
  { value: "/disclaimer", label: "Disclaimer" },
  { value: "/resources", label: "Resources" },
  { value: "/got-a-question", label: "Got a question" },
  { value: "/credit-account", label: "Credit account" },
];

const WIDTHS = {
  desktop: { label: "Desktop", width: "100%", icon: Monitor },
  tablet: { label: "Tablet", width: "834px", icon: Tablet },
  mobile: { label: "Mobile", width: "414px", icon: Smartphone },
} as const;

type Width = keyof typeof WIDTHS;

type DraftEntry = { data: unknown; version: number };

type Selection = { path: string; label: string };

export const Route = createFileRoute("/admin/visual")({
  head: () => cmsHead("Edit pages"),
  validateSearch: (search: Record<string, unknown>) => ({
    page: typeof search.page === "string" && search.page.startsWith("/") ? search.page : "/",
    width: (["desktop", "tablet", "mobile"] as const).includes(search.width as Width)
      ? (search.width as Width)
      : ("desktop" as const),
  }),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    return { staff, drafts: JSON.parse(await getDraftBundle()) as Record<string, DraftEntry> };
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
  const [value, setValue] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [fields, setFields] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const source = `${search.page}${search.page.includes("?") ? "&" : "?"}cmsEdit=1`;

  const currentValue = useMemo(() => {
    if (!selection) return "";
    const key = documentKeyOf(selection.path);
    if (!key) return "";
    const rest = selection.path.slice(key.length + 1);
    return String(readPath(drafts[key]?.data, rest) ?? "");
  }, [selection, drafts]);

  useEffect(() => {
    setValue(currentValue);
    setDirty(false);
  }, [currentValue, selection]);

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
    setFields(document_.querySelectorAll("[data-cms-field]").length);

    const style = document_.createElement("style");
    style.textContent = `
      [data-cms-field] { outline: 1px dashed rgba(37,99,235,.55); outline-offset: 3px; cursor: text; transition: outline-color .12s ease, background-color .12s ease; }
      [data-cms-field]:hover { outline: 2px solid #2563eb; background-color: rgba(37,99,235,.10); }
      [data-cms-field][data-cms-active="true"] { outline: 2px solid #f59e0b; background-color: rgba(245,158,11,.14); }
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
          setSelection({
            path: target.dataset.cmsField ?? "",
            label: target.dataset.cmsLabel || labelOfPath(target.dataset.cmsField ?? ""),
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
    setFields(null);
    let cancelled = false;
    const started = Date.now();
    const timer = setInterval(() => {
      if (cancelled) return;
      const document_ = frame.current?.contentDocument;
      if (document_ && document_.readyState !== "loading" && document_.body) {
        clearInterval(timer);
        connectFrame(document_);
        return;
      }
      if (Date.now() - started > 15_000) {
        clearInterval(timer);
        setReady(true);
        setFields(0);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [connectFrame, source, reloadKey]);

  async function save() {
    if (!selection) return;
    const key = documentKeyOf(selection.path);
    if (!key || !isContentKey(key)) {
      setError("This text is not editable from the visual editor.");
      return;
    }
    const entry = drafts[key];
    const rest = selection.path.slice(key.length + 1);
    setBusy("save");
    setError("");
    setNotice("");
    try {
      const nextData = writePath(entry.data, rest, value);
      const result = await saveDraft({ data: { key, data: nextData, version: entry.version } });
      if (!result.ok) {
        setError(
          result.issues?.length
            ? result.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n")
            : result.error,
        );
        return;
      }
      setDrafts({ ...drafts, [key]: { data: nextData, version: result.version } });
      setDirty(false);
      setNotice("Saved. The preview below now shows your wording; publish to make it live.");
      reloadFrame();
    } finally {
      setBusy("");
    }
  }

  async function publish() {
    if (!selection) return;
    const key = documentKeyOf(selection.path);
    if (!key) return;
    if (dirty) {
      setError("Save your change before publishing.");
      return;
    }
    setBusy("publish");
    setError("");
    setNotice("");
    try {
      const result = await publishDraft({ data: { key } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice("Published. The live website now shows this text.");
      reloadFrame();
    } finally {
      setBusy("");
    }
  }

  function reloadFrame() {
    setSelection(null);
    setReloadKey((value) => value + 1);
  }

  const documentKey = selection ? documentKeyOf(selection.path) : null;
  const multiline = value.length > 70 || /copy|description|intro|body/i.test(selection?.path ?? "");

  return (
    <CmsShell
      staff={loaded.staff}
      eyebrow="Website"
      title="Edit pages"
      subtitle="Open a page, click any text on it, and change the wording. Saving keeps it as a draft; publishing puts it live."
      actions={
        <>
          <a href={search.page} target="_blank" rel="noreferrer" className="cms-btn">
            <ExternalLink aria-hidden="true" /> Open live page
          </a>
          <button type="button" className="cms-btn" onClick={reloadFrame}>
            <RotateCcw aria-hidden="true" /> Refresh
          </button>
        </>
      }
    >
      <div className="cms-filters">
        <ChipSelect
          label="Page"
          value={search.page}
          options={PAGES}
          onChange={(page) => {
            setSelection(null);
            void navigate({ search: { ...search, page } });
          }}
        />
        <span className="cms-seg" role="group" aria-label="Preview width">
          {(Object.keys(WIDTHS) as Width[]).map((width) => {
            const Icon = WIDTHS[width].icon;
            return (
              <button
                key={width}
                type="button"
                data-active={search.width === width ? "true" : "false"}
                onClick={() => void navigate({ search: { ...search, width } })}
                style={{ border: 0, background: "transparent", cursor: "pointer", font: "inherit" }}
              >
                <Icon aria-hidden="true" style={{ width: 14, height: 14, verticalAlign: "-2px" }} />{" "}
                {WIDTHS[width].label}
              </button>
            );
          })}
        </span>
        <span className="cms-badge cms-badge-accent">
          <MousePointerClick aria-hidden="true" style={{ width: 13, height: 13 }} /> Click text on the
          page to edit it
        </span>
      </div>

      {notice ? (
        <div style={{ marginBottom: 12 }}>
          <Notice tone="success">{notice}</Notice>
        </div>
      ) : null}
      {error ? (
        <div style={{ marginBottom: 12 }}>
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}

      <div className="cms-visual">
        <div className="cms-visual-stage">
          {!ready ? (
            <div className="cms-visual-loading">
              <Loader2 aria-hidden="true" className="cms-spin" /> Loading page…
            </div>
          ) : null}
          <iframe
            ref={frame}
            key={`${source}-${reloadKey}`}
            title="Page being edited"
            src={source}
            className="cms-visual-frame"
            style={{ width: WIDTHS[search.width].width }}
          />
        </div>

        <aside className="cms-card cms-visual-panel">
          {ready && fields === 0 && !selection ? (
            <div className="cms-card-pad">
              <Notice tone="warning">
                No editable text was found on this page. Reload it, and if that does not help open
                the section from Content in the sidebar.
              </Notice>
            </div>
          ) : null}
          {selection ? (
            <>
              <header className="cms-card-head">
                <h2 className="cms-card-title">{selection.label}</h2>
              </header>
              <div className="cms-card-pad cms-stack">
                <p className="cms-hint" style={{ marginTop: -4 }}>
                  {breadcrumbOfPath(selection.path)}
                </p>
                <label className="cms-field">
                  <span className="cms-label">Text shown on the website</span>
                  {multiline ? (
                    <textarea
                      className="cms-textarea"
                      rows={6}
                      value={value}
                      onChange={(event) => {
                        setValue(event.target.value);
                        setDirty(true);
                      }}
                    />
                  ) : (
                    <input
                      className="cms-input"
                      value={value}
                      onChange={(event) => {
                        setValue(event.target.value);
                        setDirty(true);
                      }}
                    />
                  )}
                </label>
                <div className="cms-row-inline">
                  <button
                    type="button"
                    className="cms-btn cms-btn-primary"
                    disabled={!!busy || !dirty}
                    onClick={save}
                  >
                    {busy === "save" ? (
                      <Loader2 aria-hidden="true" className="cms-spin" />
                    ) : (
                      <Save aria-hidden="true" />
                    )}{" "}
                    Save change
                  </button>
                  {loaded.staff.role === "admin" ? (
                    <button
                      type="button"
                      className="cms-btn"
                      disabled={!!busy || dirty}
                      onClick={publish}
                    >
                      {busy === "publish" ? (
                        <Loader2 aria-hidden="true" className="cms-spin" />
                      ) : (
                        <Send aria-hidden="true" />
                      )}{" "}
                      Publish
                    </button>
                  ) : null}
                </div>
                {dirty ? (
                  <p className="cms-hint">Unsaved change. Save it to keep this wording.</p>
                ) : (
                  <p className="cms-hint">
                    <Check
                      aria-hidden="true"
                      style={{ width: 13, height: 13, verticalAlign: "-2px" }}
                    />{" "}
                    Draft matches what you see here.
                  </p>
                )}
                {documentKey ? (
                  <Link
                    to="/admin/content/$key"
                    params={{ key: documentKey as ContentKey }}
                    className="cms-link"
                    style={{ fontSize: 12.5 }}
                  >
                    Open the full editor for this section →
                  </Link>
                ) : null}
              </div>
            </>
          ) : (
            <div className="cms-card-pad cms-stack-sm">
              <span className="cms-badge cms-badge-accent" style={{ width: "fit-content" }}>
                <Eye aria-hidden="true" style={{ width: 13, height: 13 }} /> Nothing selected
              </span>
              <h2 className="cms-card-title">Click any highlighted text</h2>
              <p className="cms-muted">
                Editable wording is outlined on the page. Click it, type the new text, then press
                Save change. Prices, products and links are managed elsewhere and stay locked.
              </p>
              <p className="cms-hint">
                Nothing changes for visitors until you press Publish.
              </p>
            </div>
          )}
        </aside>
      </div>
    </CmsShell>
  );
}
