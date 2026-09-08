import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Archive,
  ExternalLink,
  ImageOff,
  Images,
  MoreHorizontal,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";
import { toast } from "sonner";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  BulkBar,
  CopyButton,
  EmptyState,
  formatBytes,
  formatDate,
  Pill,
  Spinner,
} from "@/components/admin/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import {
  archiveMedia,
  deleteMedia,
  listMedia,
  updateMediaAlt,
  uploadMedia,
} from "@/lib/content/media.functions";
import { cn } from "@/lib/utils";

type MediaItem = Awaited<ReturnType<typeof listMedia>>[number];
type Filter = "all" | "published" | "draft" | "archived";

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

function MediaPage() {
  const loaded = Route.useLoaderData();
  const isAdmin = loaded.staff.role === "admin";

  const [items, setItems] = useState(loaded.media);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detail, setDetail] = useState<MediaItem | null>(null);
  const [confirm, setConfirm] = useState<{ ids: string[]; action: "archive" | "delete" } | null>(
    null,
  );

  async function refresh() {
    setItems(await listMedia());
  }

  async function upload() {
    if (!uploadFile) return;
    if (!uploadAlt.trim()) {
      toast.error("Add a description so the image stays accessible.");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("file", uploadFile);
      formData.set("defaultAlt", uploadAlt.trim());
      const result = await uploadMedia({ data: formData });
      if (!result.ok) {
        toast.error("Upload failed", { description: result.error });
        return;
      }
      await refresh();
      setUploadOpen(false);
      setUploadFile(null);
      setUploadAlt("");
      toast.success("Image uploaded", {
        description: "It stays private until published content references it.",
      });
    } catch {
      toast.error("The image could not be uploaded.");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadAlt("");
    setUploadOpen(true);
  }

  async function saveAlt(id: string, defaultAlt: string) {
    if (!defaultAlt.trim()) return;
    setBusy(true);
    try {
      const result = await updateMediaAlt({ data: { id, defaultAlt: defaultAlt.trim() } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      await refresh();
      setDetail((current) =>
        current && current.id === id ? { ...current, defaultAlt: defaultAlt.trim() } : current,
      );
      toast.success("Description updated");
    } finally {
      setBusy(false);
    }
  }

  async function runConfirmed() {
    if (!confirm) return;
    setBusy(true);
    const failures: string[] = [];
    try {
      for (const id of confirm.ids) {
        const result =
          confirm.action === "archive"
            ? await archiveMedia({ data: { id } })
            : await deleteMedia({ data: { id } });
        if (!result.ok) failures.push(result.error);
      }
      await refresh();
      setSelected([]);
      setDetail(null);
      if (failures.length) {
        toast.error("Some images were left alone", {
          description: [...new Set(failures)][0],
        });
      } else {
        toast.success(confirm.action === "archive" ? "Images archived" : "Images deleted");
      }
    } finally {
      setBusy(false);
      setConfirm(null);
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
      title="Media"
      subtitle="Images available to page content. Uploads stay private until the content referencing them is published, and a referenced image can never be deleted."
      actions={
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload /> Upload image
        </Button>
      }
    >
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-xl transition-colors",
          dragging && "outline-2 outline-offset-4 outline-dashed outline-primary",
        )}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filename, description or id…"
              aria-label="Search media"
              className="h-9 pl-8"
            />
          </div>
          <Select value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <SelectTrigger className="h-9 w-44" aria-label="Filter images">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All images</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft only</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground tabular-nums">
            {visible.length} of {items.length}
          </span>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={<ImageOff />}
            title={items.length ? "No images match these filters" : "The media library is empty"}
            copy={
              items.length
                ? "Try a different search, or show all images."
                : "Drop a JPEG, PNG or WebP here — or use Upload image — then pick it from any content document."
            }
            action={
              <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
                <Upload /> Upload image
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((item) => {
              const isSelected = selected.includes(item.id);
              return (
                <li
                  key={item.id}
                  className={cn(
                    "group overflow-hidden rounded-xl border bg-card transition-colors",
                    isSelected ? "border-primary ring-2 ring-primary/25" : "hover:border-primary/40",
                    item.isArchived && "opacity-70",
                  )}
                >
                  <div className="cms-checkerboard relative aspect-4/3">
                    <button
                      type="button"
                      onClick={() => setDetail(item)}
                      className="block size-full"
                      aria-label={`Details for ${item.filename}`}
                    >
                      <img
                        src={item.url}
                        alt={item.defaultAlt}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover"
                      />
                    </button>
                    {isAdmin ? (
                      <span
                        className={cn(
                          "absolute top-2 left-2 rounded bg-background/85 p-0.5 backdrop-blur transition-opacity",
                          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          aria-label={`Select ${item.filename}`}
                          onCheckedChange={() =>
                            setSelected((current) =>
                              current.includes(item.id)
                                ? current.filter((value) => value !== item.id)
                                : [...current, item.id],
                            )
                          }
                        />
                      </span>
                    ) : null}
                    <span className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-7 bg-background/85 backdrop-blur"
                            aria-label={`Actions for ${item.filename}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onSelect={() => setDetail(item)}
                            className="gap-2 text-[13px]"
                          >
                            <Images className="size-4" aria-hidden="true" /> Details
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="gap-2 text-[13px]">
                            <a href={item.url} target="_blank" rel="noreferrer">
                              <ExternalLink className="size-4" aria-hidden="true" /> Open full size
                            </a>
                          </DropdownMenuItem>
                          {isAdmin ? (
                            <>
                              <DropdownMenuSeparator />
                              {item.isArchived ? null : (
                                <DropdownMenuItem
                                  onSelect={() =>
                                    setConfirm({ ids: [item.id], action: "archive" })
                                  }
                                  className="gap-2 text-[13px]"
                                >
                                  <Archive className="size-4" aria-hidden="true" /> Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onSelect={() => setConfirm({ ids: [item.id], action: "delete" })}
                                className="gap-2 text-[13px] text-destructive focus:text-destructive"
                              >
                                <Trash2 className="size-4" aria-hidden="true" /> Delete
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </span>
                  </div>

                  <div className="space-y-1.5 p-2.5">
                    <p className="truncate text-xs font-medium" title={item.filename}>
                      {item.filename}
                    </p>
                    <div className="flex flex-wrap items-center gap-1">
                      {item.isPublished ? (
                        <Pill tone="success">Published</Pill>
                      ) : (
                        <Pill tone="warning">Draft only</Pill>
                      )}
                      {item.isArchived ? <Pill tone="neutral">Archived</Pill> : null}
                      <span className="text-[11px] text-muted-foreground">
                        {formatBytes(item.size)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isAdmin ? (
        <BulkBar count={selected.length} onClear={() => setSelected([])}>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => setConfirm({ ids: selected, action: "archive" })}
          >
            <Archive /> Archive
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={busy}
            onClick={() => setConfirm({ ids: selected, action: "delete" })}
          >
            <Trash2 /> Delete
          </Button>
        </BulkBar>
      ) : null}

      {/* ------------------------------------------------------------ upload */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload an image</DialogTitle>
            <DialogDescription>
              JPEG, PNG or WebP, up to 10 MB. You can also drag a file onto the library.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="media-file" className="text-[12.5px] font-medium">
                Image file
              </Label>
              <Input
                id="media-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
              />
              {uploadFile ? (
                <p className="text-xs text-muted-foreground">
                  {uploadFile.name} · {formatBytes(uploadFile.size)}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="media-alt" className="text-[12.5px] font-medium">
                Description
                <span className="ml-0.5 text-destructive">*</span>
              </Label>
              <Input
                id="media-alt"
                value={uploadAlt}
                maxLength={300}
                onChange={(event) => setUploadAlt(event.target.value)}
                placeholder="Conveyor belt motor mounted on a packing line"
              />
              <p className="text-xs text-muted-foreground">
                Read aloud by screen readers and used by search engines. Describe what the image
                shows, not that it is an image.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={upload} disabled={busy || !uploadFile || !uploadAlt.trim()}>
              {busy ? <Spinner /> : <Upload />} Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------ detail */}
      <Sheet open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {detail ? (
            <>
              <SheetHeader>
                <SheetTitle className="truncate">{detail.filename}</SheetTitle>
                <SheetDescription>Added {formatDate(detail.createdAt)}</SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <div className="cms-checkerboard overflow-hidden rounded-lg border">
                  <img
                    src={detail.url}
                    alt={detail.defaultAlt}
                    className="max-h-72 w-full object-contain"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {detail.isPublished ? (
                    <Pill tone="success" dot>
                      Published
                    </Pill>
                  ) : (
                    <Pill tone="warning" dot>
                      Draft only
                    </Pill>
                  )}
                  {detail.isArchived ? <Pill tone="neutral">Archived</Pill> : null}
                  <Pill tone="neutral">{formatBytes(detail.size)}</Pill>
                  <Pill tone="neutral">{detail.mime.replace("image/", "").toUpperCase()}</Pill>
                </div>

                <AltEditor detail={detail} busy={busy} onSave={saveAlt} />

                <div className="space-y-1.5">
                  <Label className="text-[12.5px] font-medium">Image id</Label>
                  <div className="flex items-center gap-1">
                    <code className="min-w-0 flex-1 truncate rounded border bg-muted px-2 py-1.5 font-mono text-[11px]">
                      {detail.id}
                    </code>
                    <CopyButton value={detail.id} label="Copy image id" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t pt-4">
                  <Button variant="outline" size="sm" asChild>
                    <a href={detail.url} target="_blank" rel="noreferrer">
                      <ExternalLink /> Open full size
                    </a>
                  </Button>
                  {isAdmin ? (
                    <>
                      {detail.isArchived ? null : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirm({ ids: [detail.id], action: "archive" })}
                        >
                          <Archive /> Archive
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirm({ ids: [detail.id], action: "delete" })}
                      >
                        <Trash2 /> Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* ----------------------------------------------------------- confirm */}
      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.action === "delete" ? "Delete" : "Archive"}{" "}
              {confirm?.ids.length === 1 ? "this image" : `${confirm?.ids.length} images`}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "delete"
                ? "Deleting removes the file permanently and cannot be undone. Images referenced by draft or published content are skipped."
                : "Archiving hides the image from pickers. Content already using it keeps working."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={runConfirmed}
              disabled={busy}
              className={
                confirm?.action === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {busy ? <Spinner /> : null}
              {confirm?.action === "delete" ? "Delete permanently" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CmsShell>
  );
}

/** Alt-text editor with its own draft, so typing does not refetch the list. */
function AltEditor({
  detail,
  busy,
  onSave,
}: {
  detail: MediaItem;
  busy: boolean;
  onSave: (id: string, alt: string) => void;
}) {
  const [value, setValue] = useState(detail.defaultAlt);
  const changed = value.trim() !== detail.defaultAlt;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="media-detail-alt" className="text-[12.5px] font-medium">
        Default description
      </Label>
      <Input
        id="media-detail-alt"
        value={value}
        maxLength={300}
        onChange={(event) => setValue(event.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        Offered whenever this image is placed into content. Each placement can override it.
      </p>
      {changed ? (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={() => onSave(detail.id, value)} disabled={busy || !value.trim()}>
            Save description
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setValue(detail.defaultAlt)}>
            Reset
          </Button>
        </div>
      ) : null}
    </div>
  );
}
