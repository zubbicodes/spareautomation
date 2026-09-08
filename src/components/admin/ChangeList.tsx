import { Minus, Plus, PencilLine } from "lucide-react";

import { EmptyState, Pill, type Tone } from "@/components/admin/ui";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ContentChange } from "@/lib/content/diff";
import { humanise, resolveField } from "@/lib/content/fields";
import type { ContentKey } from "@/lib/content/registry";

const KIND_META: Record<ContentChange["kind"], { label: string; tone: Tone; icon: typeof Plus }> = {
  added: { label: "Added", tone: "success", icon: Plus },
  removed: { label: "Removed", tone: "danger", icon: Minus },
  changed: { label: "Changed", tone: "accent", icon: PencilLine },
};

/**
 * Renders a content diff in editorial terms.
 *
 * The raw diff is keyed by dotted paths; the field schema turns each into the
 * label an editor actually saw when typing, so "what am I publishing?" is
 * answerable without reading JSON.
 */
export function ChangeList({
  changes,
  contentKey,
  value,
}: {
  changes: ContentChange[];
  contentKey: ContentKey;
  /** The document the paths refer to, used to resolve block types. */
  value: unknown;
}) {
  if (changes.length === 0) {
    return <EmptyState title="No differences" copy="These two versions are identical." />;
  }

  return (
    <ScrollArea className="max-h-[55vh] pr-3">
      <ul className="divide-y">
        {changes.map((change) => {
          const meta = KIND_META[change.kind];
          const Icon = meta.icon;
          return (
            <li key={`${change.kind}-${change.path}`} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <Icon
                  className={`size-3.5 shrink-0 ${
                    change.kind === "added"
                      ? "text-success"
                      : change.kind === "removed"
                        ? "text-destructive"
                        : "text-primary"
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[13px] font-medium">
                  {describe(contentKey, change.path, value)}
                </span>
                <Pill tone={meta.tone}>{meta.label}</Pill>
              </div>
              <code className="cms-break-path mt-1 block font-mono text-[10.5px] text-muted-foreground">
                {change.path}
              </code>
              <div className="mt-2 space-y-1.5">
                {change.before !== null ? (
                  <p className="rounded border border-destructive/20 bg-destructive/5 px-2 py-1.5 text-xs">
                    <span className="mr-1.5 font-mono text-destructive">−</span>
                    <span className="text-muted-foreground line-through">
                      {truncate(change.before)}
                    </span>
                  </p>
                ) : null}
                {change.after !== null ? (
                  <p className="rounded border border-success/20 bg-success/5 px-2 py-1.5 text-xs">
                    <span className="mr-1.5 font-mono text-success">+</span>
                    {truncate(change.after)}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}

/**
 * "pages.about-us.blocks.2.title" → "About us › Page sections › Heading",
 * falling back to humanised path segments where no field is declared.
 */
function describe(contentKey: ContentKey, path: string, value: unknown) {
  const segments = path.split(".").filter(Boolean);
  const parts: string[] = [];

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    // Array indices read better as positions than as labels of their own.
    if (/^\d+$/.test(segment)) {
      parts.push(`#${Number(segment) + 1}`);
      continue;
    }
    const field = resolveField(contentKey, segments.slice(0, index + 1), value);
    parts.push(field?.label ?? humanise(segment));
  }

  return parts.join(" › ") || humanise(contentKey);
}

function truncate(value: string, limit = 220) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > limit ? `${clean.slice(0, limit)}…` : clean || "(empty)";
}
