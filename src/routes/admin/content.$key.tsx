import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ExternalLink, History, Loader2, RotateCcw, Save, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import { formatDateTime, formatRelative, Notice } from "@/components/admin/cms-ui";
import { labelFor, StructuredContentEditor } from "@/components/admin/StructuredContentEditor";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import {
  getContentEditor,
  publishDraft,
  restoreRevision,
  saveDraft,
} from "@/lib/content/content.functions";
import { listMedia } from "@/lib/content/media.functions";
import { isContentKey } from "@/lib/content/registry";

export const Route = createFileRoute("/admin/content/$key")({
  head: () => cmsHead("Edit content"),
  loader: async ({ params }) => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    if (!isContentKey(params.key)) throw new Error("Unknown content document");
    const [editor, media] = await Promise.all([
      getContentEditor({ data: { key: params.key } }),
      listMedia(),
    ]);
    return { staff, editor, media };
  },
  component: ContentEditorPage,
});

function issueMap(issues?: Array<{ path: string; message: string }>) {
  return Object.fromEntries((issues ?? []).map((issue) => [issue.path, issue.message]));
}

function ContentEditorPage() {
  const loaded = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const { staff, media } = loaded;
  const [editor, setEditor] = useState(loaded.editor);
  const [draft, setDraft] = useState<unknown>(loaded.editor.document.draftData);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<Record<string, string>>({});

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    // A keyboard-first save keeps long editing sessions quick.
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    }
    addEventListener("keydown", onKeyDown);
    return () => removeEventListener("keydown", onKeyDown);
  });

  /** Top-level keys become the in-page section navigation. */
  const sections = useMemo(() => {
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) return [];
    return Object.keys(draft as Record<string, unknown>);
  }, [draft]);

  async function save() {
    if (busy) return;
    setBusy("save");
    setError("");
    setNotice("");
    setIssues({});
    try {
      const result = await saveDraft({
        data: { key: editor.document.key, data: draft, version: editor.document.draftVersion },
      });
      if (!result.ok) {
        setIssues(issueMap(result.issues));
        setError(
          result.issues?.length ? `${result.error} Correct the highlighted fields.` : result.error,
        );
        return;
      }
      setEditor({ ...editor, document: { ...editor.document, draftVersion: result.version } });
      setDirty(false);
      setNotice("Draft saved.");
    } finally {
      setBusy("");
    }
  }

  async function publish() {
    if (dirty) {
      setError("Save the current draft before publishing.");
      return;
    }
    setBusy("publish");
    setError("");
    setIssues({});
    try {
      const result = await publishDraft({ data: { key: editor.document.key } });
      if (!result.ok) {
        setIssues(issueMap(result.issues));
        setError(result.error);
        return;
      }
      setNotice(`Published version ${result.version}. The website is live with this content.`);
      await navigate({
        to: "/admin/content/$key",
        params: { key: editor.document.key },
        replace: true,
      });
    } finally {
      setBusy("");
    }
  }

  const hasDraftChanges = editor.document.draftVersion !== editor.document.publishedVersion;

  return (
    <CmsShell
      staff={staff}
      eyebrow={editor.document.group}
      title={editor.document.label}
      subtitle="Edit the draft, preview it in the real page layout, then publish. Structure, links and product data stay protected by the content rules."
      breadcrumbs={[{ label: "Content", to: "/admin/content" }]}
    >
      <div className="cms-actionbar">
        <button onClick={save} disabled={!!busy} className="cms-btn cms-btn-primary">
          {busy === "save" ? (
            <Loader2 aria-hidden="true" className="cms-spin" />
          ) : (
            <Save aria-hidden="true" />
          )}{" "}
          Save draft
        </button>
        <Link
          to="/admin/content/$key/preview"
          params={{ key: editor.document.key }}
          search={{ raw: false, page: "", width: "desktop" as const }}
          target="_blank"
          className="cms-btn"
        >
          <ExternalLink aria-hidden="true" /> Preview draft
        </Link>
        {staff.role === "admin" ? (
          <button onClick={publish} disabled={!!busy} className="cms-btn">
            {busy === "publish" ? (
              <Loader2 aria-hidden="true" className="cms-spin" />
            ) : (
              <Send aria-hidden="true" />
            )}{" "}
            Publish
          </button>
        ) : null}
        <span className="cms-actionbar-meta">
          {dirty ? (
            <span className="cms-badge cms-badge-warning">Unsaved changes</span>
          ) : hasDraftChanges ? (
            <span className="cms-badge cms-badge-warning">Draft ahead of live</span>
          ) : (
            <span className="cms-badge cms-badge-success">Live</span>
          )}
          <span>
            Draft v{editor.document.draftVersion} · Live v{editor.document.publishedVersion}
          </span>
        </span>
      </div>

      {notice ? (
        <div style={{ marginBottom: 14 }}>
          <Notice tone="success">{notice}</Notice>
        </div>
      ) : null}
      {error ? (
        <div style={{ marginBottom: 14 }}>
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}

      <div className="cms-editor">
        <nav className="cms-card cms-editor-nav" aria-label="Document sections">
          <span className="cms-label" style={{ padding: "4px 10px" }}>
            Sections
          </span>
          {sections.map((section) => (
            <a key={section} href={`#section-${section}`}>
              {labelFor(section)}
            </a>
          ))}
        </nav>

        <section className="cms-card cms-card-pad">
          <div className="cms-stack">
            {sections.length ? (
              sections.map((section) => (
                <div key={section} id={`section-${section}`} style={{ scrollMarginTop: 120 }}>
                  <StructuredContentEditor
                    value={
                      (draft as Record<string, never>)[section] as never
                    }
                    rootKey={editor.document.key}
                    media={media}
                    issues={issues}
                    path={[section]}
                    onChange={(value) => {
                      setDraft({ ...(draft as Record<string, unknown>), [section]: value });
                      setDirty(true);
                    }}
                  />
                </div>
              ))
            ) : (
              <StructuredContentEditor
                value={draft as never}
                rootKey={editor.document.key}
                media={media}
                issues={issues}
                onChange={(value) => {
                  setDraft(value);
                  setDirty(true);
                }}
              />
            )}
          </div>
        </section>

        <aside className="cms-card">
          <header className="cms-card-head">
            <History aria-hidden="true" style={{ width: 15, height: 15 }} />
            <h2 className="cms-card-title">Revisions</h2>
          </header>
          <div className="cms-list">
            {editor.revisions.length === 0 ? (
              <p className="cms-card-pad cms-muted">No published revisions yet.</p>
            ) : (
              editor.revisions.map((revision) => (
                <div key={revision.id} className="cms-row">
                  <span className="cms-row-main">
                    <span className="cms-row-title">Version {revision.version}</span>
                    <span className="cms-row-meta">
                      {formatDateTime(revision.createdAt)}
                      {revision.publisher ? ` · ${revision.publisher}` : ""}
                    </span>
                  </span>
                  {staff.role === "admin" ? (
                    <span className="cms-row-actions">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(`Restore version ${revision.version} into the draft?`)) return;
                          setBusy("restore");
                          try {
                            await restoreRevision({
                              data: { key: editor.document.key, revisionId: revision.id },
                            });
                            location.reload();
                          } finally {
                            setBusy("");
                          }
                        }}
                        className="cms-btn cms-btn-sm"
                      >
                        <RotateCcw aria-hidden="true" /> Restore to draft
                      </button>
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
          <div className="cms-card-foot cms-faint" style={{ fontSize: 12 }}>
            Published {formatRelative(editor.document.publishedAt)}
            {editor.document.publishedBy ? ` by ${editor.document.publishedBy}` : ""}
          </div>
        </aside>
      </div>
    </CmsShell>
  );
}
