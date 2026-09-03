import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ExternalLink, Loader2, RotateCcw, Save, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { StructuredContentEditor } from "@/components/admin/StructuredContentEditor";
import { getAdminSession } from "@/lib/admin/admin.functions";
import {
  getContentEditor,
  publishDraft,
  restoreRevision,
  saveDraft,
} from "@/lib/content/content.functions";
import { listMedia } from "@/lib/content/media.functions";
import { isContentKey } from "@/lib/content/registry";

export const Route = createFileRoute("/admin/content/$key")({
  head: () => ({
    meta: [
      { title: "Edit content | Spares Automation CMS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
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

  async function save() {
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
          result.issues?.length
            ? `${result.error} Correct the highlighted fields.`
            : result.error,
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
      setNotice(`Published version ${result.version}.`);
      await navigate({
        to: "/admin/content/$key",
        params: { key: editor.document.key },
        replace: true,
      });
    } finally {
      setBusy("");
    }
  }

  return (
    <AdminShell staff={staff} title={editor.document.label} eyebrow={editor.document.group}>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          onClick={save}
          disabled={!!busy}
          className="inline-flex h-10 items-center gap-2 bg-accent px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50"
        >
          {busy === "save" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}{" "}
          Save draft
        </button>
        <Link
          to="/admin/content/$key/preview"
          params={{ key: editor.document.key }}
          search={{ raw: false, page: "", width: "desktop" as const }}
          target="_blank"
          className="inline-flex h-10 items-center gap-2 border border-rule px-4 font-mono text-[10px] uppercase tracking-[0.16em] hover:border-accent"
        >
          <ExternalLink className="h-4 w-4" /> Preview
        </Link>
        {staff.role === "admin" ? (
          <button
            onClick={publish}
            disabled={!!busy}
            className="inline-flex h-10 items-center gap-2 border border-accent px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Publish
          </button>
        ) : null}
        <span className="ml-auto text-xs text-ink-muted">
          Draft v{editor.document.draftVersion} · Live v{editor.document.publishedVersion}
        </span>
      </div>
      {dirty ? (
        <p className="mb-4 border border-amber/60 bg-amber/10 p-3 text-sm">
          Unsaved changes. Save the draft before previewing or publishing.
        </p>
      ) : null}
      {notice ? (
        <div role="status" className="mb-4 border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="mb-4 whitespace-pre-wrap border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="border border-rule bg-surface p-4 md:p-6">
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
        </section>
        <aside>
          <h2 className="font-display text-lg font-bold uppercase">Published revisions</h2>
          <div className="mt-3 grid gap-2">
            {editor.revisions.map((revision) => (
              <div key={revision.id} className="border border-rule bg-surface p-3">
                <div className="text-sm font-semibold">Version {revision.version}</div>
                <div className="mt-1 text-xs text-ink-muted">
                  {new Date(revision.createdAt).toLocaleString("en-GB")}
                  {revision.publisher ? ` · ${revision.publisher}` : ""}
                </div>
                {staff.role === "admin" ? (
                  <button
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
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restore to draft
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
