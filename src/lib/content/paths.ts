import { CONTENT_KEYS, isContentKey, type ContentKey } from "./registry";

/** Split a dotted content path such as `pages.about-us.title` into segments. */
export function splitPath(path: string) {
  return path.split(".").filter(Boolean);
}

/** The content document a dotted path belongs to, if any. */
export function documentKeyOf(path: string): ContentKey | null {
  const [head] = splitPath(path);
  return head && isContentKey(head) ? head : null;
}

export function readPath(value: unknown, path: string): unknown {
  return splitPath(path).reduce<unknown>((current, segment) => {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) return current[Number(segment)];
    if (typeof current === "object") return (current as Record<string, unknown>)[segment];
    return undefined;
  }, value);
}

/** Immutably set a dotted path, cloning only the branches that change. */
export function writePath<T>(value: T, path: string, next: unknown): T {
  const segments = splitPath(path);
  if (!segments.length) return next as T;

  const [segment, ...rest] = segments;
  if (Array.isArray(value)) {
    const index = Number(segment);
    const copy = [...value] as unknown[];
    copy[index] = rest.length ? writePath(copy[index], rest.join("."), next) : next;
    return copy as unknown as T;
  }

  const source = (value ?? {}) as Record<string, unknown>;
  return {
    ...source,
    [segment]: rest.length ? writePath(source[segment], rest.join("."), next) : next,
  } as T;
}

/** Human label for a path, used when a marker does not supply one. */
export function labelOfPath(path: string) {
  const segments = splitPath(path);
  const last = segments.at(-1) ?? path;
  return last
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

/** Where a path lives, e.g. "Homepage → Hero panels". */
export function breadcrumbOfPath(path: string) {
  const segments = splitPath(path);
  return segments.slice(0, -1).join(" › ");
}

export const CONTENT_KEY_LIST = CONTENT_KEYS;
