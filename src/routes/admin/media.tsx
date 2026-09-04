import { createFileRoute, redirect } from "@tanstack/react-router";
import { Archive, Check, Copy, Images, Loader2, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  BulkBar,
  ChipSelect,
  EmptyState,
  FootBar,
  formatDate,
  KebabMenu,
  Notice,
  SearchField,
} from "@/components/admin/cms-ui";
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
  head: () => cmsHead("Media"),
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
  const [selected, setSelected] = useState<string[]>([]);
  const [altDraft, setAltDraft] = useState<Record<string, string>>({});
  const [showUpload, setShowUpload] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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
        return false;
      }
      await refresh();
      setNotice("Image uploaded. It stays private until published content references it.");
      return true;
    } catch {
      setError("The image could not be uploaded.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (await send(new FormData(form))) form.reset();
  }

  async function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    setShowUpload(true);
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

  async function runOnSelection(action: "archive" | "delete") {
    setBusy(true);
    setError("");
    setNotice("");
    const failures: string[] = [];
    try {
      for (const id of selected) {
        const result =
          action === "archive"
            ? await archiveMedia({ data: { id } })
            : await deleteMedia({ data: { id } });
        if (!result.ok) failures.push(result.error);
      }
      await refresh();
      setSelected([]);
      if (failures.length) setError([...new Set(failures)].join("\n"));
      else setNotice(action === "archive" ? "Images archived." : "Images deleted.");
    } finally {
      setBusy(false);
    }
  }

  async function archiveOne(id: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await archiveMedia({ data: { id } });
      if (!result.ok) setError(result.error);
      else {
        await refresh();
        setNotice("Image archived.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteOne(id: string) {
    if (!confirm("Permanently delete this unreferenced image?")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await deleteMedia({ data: { id } });
      if (!result.ok) setError(result.error);
      else {
        await refresh();
        setNotice("Image deleted.");
      }
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
      title="Media"
      subtitle="Images available to page content. Uploads stay private until the content that references them is published, and referenced images cannot be deleted."
      actions={
        <button
          type="button"
          className="cms-btn cms-btn-primary"
          onClick={() => {
            setShowUpload((open) => !open);
            setTimeout(() => formRef.current?.scrollIntoView({ block: "nearest" }), 0);
          }}
        >
          <Upload aria-hidden="true" /> Upload
        </button>
      }
    >
      {showUpload ? (
        <form
          ref={formRef}
          onSubmit={upload}
          className="cms-dropzone"
          data-dragging={dragging ? "true" : "false"}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => void onDrop(event)}
          style={{ marginBottom: 14 }}
        >
          <div className="cms-row-inline" style={{ gap: 14 }}>
            <label className="cms-field" style={{ flex: "1 1 250px" }}>
              <span className="cms-label">Image file · JPEG, PNG or WebP · max 10 MB</span>
              <input
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                className="cms-input"
              />
            </label>
            <label className="cms-field" style={{ flex: "1 1 250px" }}>
              <span className="cms-label">Default alt text</span>
              <input name="defaultAlt" required maxLength={300} className="cms-input" />
            </label>
            <button disabled={busy} className="cms-btn cms-btn-primary">
              {busy ? (
                <Loader2 aria-hidden="true" className="cms-spin" />
              ) : (
                <Upload aria-hidden="true" />
              )}{" "}
              Upload
            </button>
          </div>
          <p className="cms-hint">
            Drag an image onto this panel to upload it. Alt text describes the image for screen
            readers and search engines.
          </p>
        </form>
      ) : null}

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

      <div className="cms-filters">
        <ChipSelect
          label="Show"
          value={filter}
          options={[
            { value: "all", label: "All images" },
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft only" },
            { value: "archived", label: "Archived" },
          ]}
          onChange={(value) => setFilter(value as Filter)}
        />
        <SearchField
          value={query}
          onChange={setQuery}
          label="Search media"
          placeholder="Filename, alt text or id"
        />
      </div>

      {selected.length && loaded.staff.role === "admin" ? (
        <BulkBar
          count={selected.length}
          onClear={() => setSelected([])}
          destructive={
            <button
              type="button"
              className="cms-bulk-danger"
              disabled={busy}
              onClick={() => {
                if (confirm(`Permanently delete ${selected.length} unreferenced image(s)?`)) {
                  void runOnSelection("delete");
                }
              }}
            >
              <Trash2 aria-hidden="true" style={{ width: 14, height: 14 }} /> Delete
            </button>
          }
        >
          <button type="button" disabled={busy} onClick={() => void runOnSelection("archive")}>
            <Archive aria-hidden="true" style={{ width: 14, height: 14 }} /> Archive
          </button>
        </BulkBar>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={<Images aria-hidden="true" />}
          title="No images to show"
          copy="Upload a JPEG, PNG or WebP image, then select it from any content document."
        />
      ) : (
        <>
          <div className="cms-grid cms-grid-media">
            {visible.map((item) => {
              const isSelected = selected.includes(item.id);
              return (
                <article
                  key={item.id}
                  className="cms-media-card"
                  data-archived={item.isArchived ? "true" : "false"}
                  data-selected={isSelected ? "true" : "false"}
                >
                  <div className="cms-media-frame">
                    <img src={item.url} alt={item.defaultAlt} loading="lazy" />
                    {loaded.staff.role === "admin" ? (
                      <input
                        type="checkbox"
                        className="cms-check cms-media-check"
                        checked={isSelected}
                        aria-label={`Select ${item.filename}`}
                        onChange={() =>
                          setSelected((current) =>
                            current.includes(item.id)
                              ? current.filter((value) => value !== item.id)
                              : [...current, item.id],
                          )
                        }
                      />
                    ) : null}
                  </div>
                  <div className="cms-media-body">
                    <div className="cms-row-inline" style={{ gap: 8, flexWrap: "nowrap" }}>
                      <h2 className="cms-media-name" title={item.filename}>
                        {item.filename}
                      </h2>
                      <span style={{ marginLeft: "auto" }}>
                        <KebabMenu label={`Actions for ${item.filename}`}>
                          {(close) => (
                            <>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={async () => {
                                  close();
                                  try {
                                    await navigator.clipboard.writeText(item.id);
                                    setCopied(item.id);
                                    setTimeout(() => setCopied(""), 1600);
                                  } catch {
                                    setError("Copying is blocked in this browser.");
                                  }
                                }}
                              >
                                <Copy aria-hidden="true" /> Copy image id
                              </button>
                              <a href={item.url} target="_blank" rel="noreferrer" role="menuitem">
                                <Images aria-hidden="true" /> Open image
                              </a>
                              {loaded.staff.role === "admin" ? (
                                <>
                                  <div className="cms-menu-sep" />
                                  {!item.isArchived ? (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        close();
                                        void archiveOne(item.id);
                                      }}
                                    >
                                      <Archive aria-hidden="true" /> Archive
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="cms-menu-danger"
                                    onClick={() => {
                                      close();
                                      void deleteOne(item.id);
                                    }}
                                  >
                                    <Trash2 aria-hidden="true" /> Delete
                                  </button>
                                </>
                              ) : null}
                            </>
                          )}
                        </KebabMenu>
                      </span>
                    </div>
                    <div className="cms-row-inline" style={{ gap: 6 }}>
                      {item.isPublished ? (
                        <span className="cms-badge cms-badge-success">Published</span>
                      ) : (
                        <span className="cms-badge cms-badge-warning">Draft only</span>
                      )}
                      {item.isArchived ? <span className="cms-badge">Archived</span> : null}
                      <span className="cms-badge">{(item.size / 1024).toFixed(0)} KB</span>
                      {copied === item.id ? (
                        <span className="cms-badge cms-badge-accent">
                          <Check aria-hidden="true" style={{ width: 12, height: 12 }} /> Id copied
                        </span>
                      ) : null}
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
                    <p className="cms-faint" style={{ fontSize: 12 }}>
                      Added {formatDate(item.createdAt)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
          <FootBar
            shown={visible.length}
            total={items.length}
            page={1}
            pageCount={1}
            noun="images"
            onChange={() => undefined}
          />
        </>
      )}
    </CmsShell>
  );
}
