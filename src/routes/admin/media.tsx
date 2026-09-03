import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Archive,
  Check,
  Copy,
  Images,
  Loader2,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import { EmptyState, formatDateTime, Notice } from "@/components/admin/cms-ui";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import {
  archiveMedia,
  deleteMedia,
  listMedia,
  updateMediaAlt,
  uploadMedia,
} from "@/lib/content/media.functions";

export const Route = createFileRoute("/admin/media")({
  head: () => cmsHead("Media library"),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    return { staff, media: await listMedia() };
  },
  component: MediaPage,
});

type Filter = "all" | "published" | "draft" | "archived";

function MediaPage() {
  const loaded = Route.useLoaderData();
  const [items, setItems] = useState(loaded.media);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState("");
  const [altDraft, setAltDraft] = useState<Record<string, string>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  async function refresh() {
    setItems(await listMedia());
  }

  async function send(formData: FormData) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await uploadMedia({ data: formData });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await refresh();
      setNotice("Image uploaded. It stays private until published content references it.");
    } catch {
      setError("The image could not be uploaded.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await send(new FormData(form));
    form.reset();
  }

  async function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    const alt = prompt(`Alt text for ${file.name}`)?.trim();
    if (!alt) {
      setError("Provide alt text so the image stays accessible.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    formData.set("defaultAlt", alt);
    await send(formData);
  }

  async function saveAlt(id: string) {
    const defaultAlt = (altDraft[id] ?? "").trim();
    if (!defaultAlt) return;
    setBusy(true);
    setError("");
    try {
      const result = await updateMediaAlt({ data: { id, defaultAlt } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAltDraft((draft) => {
        const next = { ...draft };
        delete next[id];
        return next;
      });
      await refresh();
      setNotice("Alt text updated.");
    } finally {
      setBusy(false);
    }
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "published" && !item.isPublished) return false;
      if (filter === "draft" && (item.isPublished || item.isArchived)) return false;
      if (filter === "archived" && !item.isArchived) return false;
      if (!needle) return true;
      return (
        item.filename.toLowerCase().includes(needle) ||
        item.defaultAlt.toLowerCase().includes(needle) ||
        item.id.includes(needle)
      );
    });
  }, [items, query, filter]);

  return (
    <CmsShell
      staff={loaded.staff}
      eyebrow="Public images"
      title="Media library"
      subtitle="Images available to page content. Uploads stay private until the content that references them is published, and referenced images cannot be deleted."
      actions={
        <button
          type="button"
          className="cms-btn cms-btn-primary"
          onClick={() => fileInput.current?.click()}
        >
          <Upload aria-hidden="true" /> Choose image
        </button>
      }
    >
      <form
        onSubmit={upload}
        className="cms-dropzone"
        data-dragging={dragging ? "true" : "false"}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => void onDrop(event)}
        style={{ marginBottom: 16 }}
      >
        <div className="cms-row-inline" style={{ gap: 14 }}>
          <label className="cms-field" style={{ flex: "1 1 260px" }}>
            <span className="cms-label">Image file · JPEG, PNG or WebP · max 10 MB</span>
            <input
              ref={fileInput}
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="cms-input"
            />
          </label>
          <label className="cms-field" style={{ flex: "1 1 260px" }}>
            <span className="cms-label">Default alt text</span>
            <input name="defaultAlt" required maxLength={300} className="cms-input" />
          </label>
          <button disabled={busy} className="cms-btn cms-btn-primary">
            {busy ? <Loader2 aria-hidden="true" className="cms-spin" /> : <Upload aria-hidden="true" />}{" "}
            Upload
          </button>
        </div>
        <p className="cms-hint">
          Drag an image anywhere onto this panel to upload it, or pick a file above. Alt text
          describes the image for screen readers and search engines.
        </p>
      </form>

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

      <div className="cms-card cms-toolbar" style={{ marginBottom: 16 }}>
        <label className="cms-field cms-field-grow">
          <span className="cms-label">Search</span>
          <span className="cms-search">
            <Search aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filename, alt text or id"
              aria-label="Search media"
            />
          </span>
        </label>
        <label className="cms-field">
          <span className="cms-label">Show</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
            className="cms-select"
          >
            <option value="all">All images</option>
            <option value="published">Published</option>
            <option value="draft">Draft only</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <span className="cms-badge">
          {visible.length} of {items.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <section className="cms-card">
          <EmptyState
            icon={<Images aria-hidden="true" />}
            title="No images to show"
            copy="Upload a JPEG, PNG or WebP image, then select it from any content document."
          />
        </section>
      ) : (
        <div className="cms-grid cms-grid-media">
          {visible.map((item) => (
            <article
              key={item.id}
              className="cms-media-card"
              data-archived={item.isArchived ? "true" : "false"}
            >
              <div className="cms-media-frame">
                <img src={item.url} alt={item.defaultAlt} loading="lazy" />
              </div>
              <div className="cms-media-body">
                <h2 className="cms-media-name" title={item.filename}>
                  {item.filename}
                </h2>
                <div className="cms-row-inline" style={{ gap: 6 }}>
                  {item.isPublished ? (
                    <span className="cms-badge cms-badge-success">Published</span>
                  ) : (
                    <span className="cms-badge cms-badge-warning">Draft only</span>
                  )}
                  {item.isArchived ? <span className="cms-badge">Archived</span> : null}
                  <span className="cms-badge">{(item.size / 1024).toFixed(0)} KB</span>
                </div>
                <label className="cms-field">
                  <span className="cms-label">Alt text</span>
                  <input
                    className="cms-input"
                    value={altDraft[item.id] ?? item.defaultAlt}
                    maxLength={300}
                    onChange={(event) =>
                      setAltDraft((draft) => ({ ...draft, [item.id]: event.target.value }))
                    }
                  />
                </label>
                {altDraft[item.id] !== undefined && altDraft[item.id] !== item.defaultAlt ? (
                  <button
                    type="button"
                    onClick={() => void saveAlt(item.id)}
                    className="cms-btn cms-btn-sm cms-btn-primary"
                  >
                    <Check aria-hidden="true" /> Save alt text
                  </button>
                ) : null}
                <p className="cms-faint" style={{ fontSize: 11.5 }}>
                  Added {formatDateTime(item.createdAt)}
                </p>
                <div className="cms-row-inline" style={{ gap: 6 }}>
                  <button
                    type="button"
                    className="cms-btn cms-btn-sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(item.id);
                        setCopied(item.id);
                        setTimeout(() => setCopied(""), 1600);
                      } catch {
                        setError("Copying is blocked in this browser; select the id manually.");
                      }
                    }}
                    title={item.id}
                  >
                    {copied === item.id ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                    {copied === item.id ? "Copied" : "Copy id"}
                  </button>
                  {loaded.staff.role === "admin" ? (
                    <>
                      {!item.isArchived ? (
                        <button
                          type="button"
                          className="cms-btn cms-btn-sm"
                          onClick={async () => {
                            const result = await archiveMedia({ data: { id: item.id } });
                            if (!result.ok) setError(result.error);
                            else {
                              setNotice("Image archived.");
                              await refresh();
                            }
                          }}
                        >
                          <Archive aria-hidden="true" /> Archive
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="cms-btn cms-btn-sm cms-btn-danger"
                        onClick={async () => {
                          if (!confirm("Permanently delete this unreferenced image?")) return;
                          const result = await deleteMedia({ data: { id: item.id } });
                          if (!result.ok) setError(result.error);
                          else {
                            setNotice("Image deleted.");
                            await refresh();
                          }
                        }}
                      >
                        <Trash2 aria-hidden="true" /> Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </CmsShell>
  );
}
