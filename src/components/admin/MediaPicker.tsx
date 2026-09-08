import { Check, ImageOff, ImagePlus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, formatBytes, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type MediaOption = {
  id: string;
  filename: string;
  defaultAlt: string;
  url: string;
  isArchived: boolean;
  mime?: string;
  size?: number;
};

type Props = {
  value: string;
  onChange: (id: string) => void;
  media: MediaOption[];
  /** Called with the image's default alt text when a new image is chosen. */
  onSuggestAlt?: (alt: string) => void;
  invalid?: boolean;
};

/**
 * Image field: a real thumbnail with a browsable library behind it, rather than
 * a filename dropdown. Choosing an image offers its stored alt text so the
 * neighbouring description field is not left empty by accident.
 */
export function MediaPicker({ value, onChange, media, onSuggestAlt, invalid }: Props) {
  const [open, setOpen] = useState(false);
  const selected = media.find((item) => item.id === value);
  const missing = Boolean(value) && !selected;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border p-2.5",
          invalid || missing ? "border-destructive/50" : "",
        )}
      >
        <span className="cms-checkerboard flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border">
          {selected ? (
            <img
              src={selected.url}
              alt=""
              className="size-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <ImageOff className="size-5 text-muted-foreground" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <p className="truncate text-[13px] font-medium">{selected.filename}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {selected.size ? <span>{formatBytes(selected.size)}</span> : null}
                {selected.isArchived ? <Pill tone="warning">Archived</Pill> : null}
              </p>
            </>
          ) : missing ? (
            <p className="text-[13px] text-destructive">
              This image is no longer available. Choose another before publishing.
            </p>
          ) : (
            <p className="text-[13px] text-muted-foreground">No image selected</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            <ImagePlus /> {selected ? "Replace" : "Choose"}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              aria-label="Remove image"
              onClick={() => onChange("")}
            >
              <Trash2 />
            </Button>
          ) : null}
        </div>
      </div>

      <MediaBrowser
        open={open}
        onOpenChange={setOpen}
        media={media}
        value={value}
        onPick={(item) => {
          onChange(item.id);
          if (item.defaultAlt) onSuggestAlt?.(item.defaultAlt);
          setOpen(false);
        }}
      />
    </div>
  );
}

function MediaBrowser({
  open,
  onOpenChange,
  media,
  value,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaOption[];
  value: string;
  onPick: (item: MediaOption) => void;
}) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    // Archived images stay hidden unless one is already in use here.
    return media
      .filter((item) => !item.isArchived || item.id === value)
      .filter(
        (item) =>
          !needle ||
          item.filename.toLowerCase().includes(needle) ||
          item.defaultAlt.toLowerCase().includes(needle),
      );
  }, [media, query, value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose an image</DialogTitle>
          <DialogDescription>
            Images come from the media library. Upload new ones from Library → Media.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by filename or description…"
            aria-label="Search images"
            className="pl-8"
          />
        </div>

        <ScrollArea className="h-[52vh] -mx-1 px-1">
          {visible.length === 0 ? (
            <EmptyState
              icon={<ImageOff />}
              title={media.length ? "No images match that search" : "The media library is empty"}
              copy={
                media.length
                  ? "Try a different filename or description."
                  : "Upload images from Library → Media, then pick them here."
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-1 sm:grid-cols-3 md:grid-cols-4">
              {visible.map((item) => {
                const active = item.id === value;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onPick(item)}
                    aria-pressed={active}
                    className={cn(
                      "group overflow-hidden rounded-lg border text-left transition-colors",
                      active ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/40",
                    )}
                  >
                    <span className="cms-checkerboard relative block aspect-4/3">
                      <img
                        src={item.url}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      {active ? (
                        <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3" aria-hidden="true" />
                        </span>
                      ) : null}
                    </span>
                    <span className="block px-2 py-1.5">
                      <span className="block truncate text-xs font-medium">{item.filename}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {item.defaultAlt || "No description"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
