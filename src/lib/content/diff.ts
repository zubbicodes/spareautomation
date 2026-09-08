/**
 * Flat difference between two content snapshots.
 *
 * The CMS needs to answer "what exactly is about to go live?" and "what would
 * restoring this revision change?". Both reduce to walking two JSON documents
 * and reporting leaf-level changes with their dotted paths, which the field
 * schema can then turn into human labels.
 */

export type ChangeKind = "added" | "removed" | "changed";

export type ContentChange = {
  /** Dotted path from the document root, e.g. `pages.about-us.title`. */
  path: string;
  kind: ChangeKind;
  before: string | null;
  after: string | null;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Renders a leaf for display. Objects and arrays are summarised, not dumped. */
function preview(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  return `${Object.keys(value as object).length} fields`;
}

/**
 * Walks both sides in parallel. Containers recurse; anything else is compared
 * by value, so a reordered array reports as changes on the indices that moved.
 */
export function diffContent(before: unknown, after: unknown, base: string[] = []): ContentChange[] {
  const changes: ContentChange[] = [];

  if (isObject(before) && isObject(after)) {
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      changes.push(...diffContent(before[key], after[key], [...base, key]));
    }
    return changes;
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length);
    for (let index = 0; index < length; index += 1) {
      changes.push(...diffContent(before[index], after[index], [...base, String(index)]));
    }
    return changes;
  }

  const path = base.join(".");
  const missingBefore = before === undefined;
  const missingAfter = after === undefined;

  if (missingBefore && missingAfter) return changes;
  if (missingBefore) {
    return [{ path, kind: "added", before: null, after: preview(after) }];
  }
  if (missingAfter) {
    return [{ path, kind: "removed", before: preview(before), after: null }];
  }
  if (JSON.stringify(before) === JSON.stringify(after)) return changes;

  return [{ path, kind: "changed", before: preview(before), after: preview(after) }];
}

/** Cheap "is there anything to publish?" check that stops at the first change. */
export function hasChanges(before: unknown, after: unknown) {
  return JSON.stringify(before) !== JSON.stringify(after);
}
