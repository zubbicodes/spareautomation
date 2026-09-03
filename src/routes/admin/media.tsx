import { createFileRoute, redirect } from "@tanstack/react-router";
import { Archive, Loader2, Trash2, Upload } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { archiveMedia, deleteMedia, listMedia, uploadMedia } from "@/lib/content/media.functions";

export const Route = createFileRoute("/admin/media")({
  head: () => ({ meta: [{ title: "Media | Spares Automation CMS" }, { name: "robots", content: "noindex, nofollow" }] }),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    return { staff, media: await listMedia() };
  },
  component: MediaPage,
});

function MediaPage() {
  const loaded = Route.useLoaderData();
  const [items, setItems] = useState(loaded.media);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  async function refresh() { setItems(await listMedia()); }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try { const result = await uploadMedia({ data: new FormData(event.currentTarget) }); if (!result.ok) { setError(result.error); return; } event.currentTarget.reset(); await refresh(); setNotice("Image uploaded. It remains private until referenced by published content."); } catch { setError("The image could not be uploaded."); } finally { setBusy(false); }
  }
  return <AdminShell staff={loaded.staff} title="Media library" eyebrow="Public content images">
    <form onSubmit={upload} className="grid gap-4 border border-rule bg-surface p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <label className="grid gap-1.5"><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">JPEG, PNG or WebP · max 10 MB</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="h-11 border border-rule bg-background p-2 text-sm" /></label>
      <label className="grid gap-1.5"><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">Default alt text</span><input name="defaultAlt" required maxLength={300} className="h-11 border border-rule bg-background px-3 text-sm outline-none focus:border-accent" /></label>
      <button disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 bg-accent px-5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload</button>
    </form>
    {notice ? <div role="status" className="mt-4 border border-green-300 bg-green-50 p-3 text-sm text-green-800">{notice}</div> : null}{error ? <div role="alert" className="mt-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((item) => <article key={item.id} className={`border border-rule bg-surface p-3 ${item.isArchived ? "opacity-55" : ""}`}>
      <div className="aspect-video bg-background"><img src={item.url} alt={item.defaultAlt} className="h-full w-full object-contain" /></div><h2 className="mt-3 truncate text-sm font-semibold">{item.filename}</h2><p className="mt-1 text-xs text-ink-muted">ID: <code>{item.id}</code></p><p className="mt-1 text-xs text-ink-muted">{(item.size / 1024).toFixed(1)} KB · {item.isPublished ? "Published" : "Draft only"}{item.isArchived ? " · Archived" : ""}</p><p className="mt-2 text-xs">{item.defaultAlt}</p>
      {loaded.staff.role === "admin" ? <div className="mt-3 flex gap-2">{!item.isArchived ? <button onClick={async () => { const result = await archiveMedia({ data: { id: item.id } }); if (!result.ok) setError(result.error); else await refresh(); }} className="inline-flex items-center gap-1 border border-rule px-2 py-1 text-xs"><Archive className="h-3 w-3" /> Archive</button> : null}<button onClick={async () => { if (!confirm("Permanently delete this unreferenced image?")) return; const result = await deleteMedia({ data: { id: item.id } }); if (!result.ok) setError(result.error); else await refresh(); }} className="inline-flex items-center gap-1 border border-red-200 px-2 py-1 text-xs text-red-700"><Trash2 className="h-3 w-3" /> Delete</button></div> : null}
    </article>)}</div>
  </AdminShell>;
}
