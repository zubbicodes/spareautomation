import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { APPROVED_ROUTE_LIST, BLOCK_TYPES, createBlock } from "@/lib/content/registry";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type MediaOption = {
  id: string;
  filename: string;
  defaultAlt: string;
  url: string;
  isArchived: boolean;
};

type Props = {
  value: JsonValue;
  onChange: (value: JsonValue) => void;
  path?: string[];
  rootKey?: string;
  /** Uploaded images offered by the media picker for `mediaId` fields. */
  media?: MediaOption[];
  /** Server-side validation messages keyed by dotted document path. */
  issues?: Record<string, string>;
};

const LOCKED_FIELDS = new Set(["id", "handle", "type"]);
const LINK_FIELDS = new Set(["to", "ctaTo"]);

function labelFor(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function blankLike(value: JsonValue): JsonValue {
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        LOCKED_FIELDS.has(key) ? item : blankLike(item),
      ]),
    );
  }
  return null;
}

export function StructuredContentEditor({
  value,
  onChange,
  path = [],
  rootKey,
  media = [],
  issues = {},
}: Props) {
  const field = path.at(-1) ?? "content";
  const dotted = path.join(".");
  const issue = issues[dotted];
  const child = (key: string) => ({ path: [...path, key], rootKey, media, issues });

  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-3 border border-rule bg-background p-3 text-sm">
        <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
        <span>{labelFor(field)}</span>
      </label>
    );
  }

  if (typeof value === "string" && field === "mediaId") {
    const selected = media.find((item) => item.id === value);
    return (
      <label className="grid gap-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">Image</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 border border-rule bg-background px-3 text-sm outline-none focus:border-accent"
        >
          <option value="">No image</option>
          {media
            .filter((item) => !item.isArchived || item.id === value)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.filename}
                {item.isArchived ? " (archived)" : ""}
              </option>
            ))}
        </select>
        {value && !selected ? (
          <span className="text-xs text-red-700">
            This image is no longer available. Choose another before publishing.
          </span>
        ) : null}
        {selected ? (
          <img
            src={selected.url}
            alt={selected.defaultAlt}
            className="mt-1 max-h-28 w-fit border border-rule bg-background object-contain p-1"
          />
        ) : null}
        {issue ? <span className="text-xs text-red-700">{issue}</span> : null}
      </label>
    );
  }

  if (typeof value === "string" || typeof value === "number") {
    const locked = LOCKED_FIELDS.has(field) || (rootKey === "navigation" && field === "to");
    const isLink = LINK_FIELDS.has(field) && !locked;
    const multiline =
      typeof value === "string" && (value.length > 100 || /copy|description|body|intro/i.test(field));
    const listId = isLink ? `routes-${dotted.replaceAll(".", "-")}` : undefined;
    return (
      <label className="grid gap-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">
          {labelFor(field)}
          {locked ? " (locked)" : ""}
        </span>
        {multiline ? (
          <textarea
            value={value}
            disabled={locked}
            rows={Math.min(10, Math.max(3, String(value).split("\n").length + 1))}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={issue ? true : undefined}
            className={`min-h-24 border bg-background p-3 text-sm leading-6 outline-none focus:border-accent disabled:opacity-60 ${
              issue ? "border-red-400" : "border-rule"
            }`}
          />
        ) : (
          <>
            <input
              value={value}
              type={typeof value === "number" ? "number" : "text"}
              disabled={locked}
              list={listId}
              onChange={(event) =>
                onChange(typeof value === "number" ? Number(event.target.value) : event.target.value)
              }
              aria-invalid={issue ? true : undefined}
              className={`h-11 border bg-background px-3 text-sm outline-none focus:border-accent disabled:opacity-60 ${
                issue ? "border-red-400" : "border-rule"
              }`}
            />
            {listId ? (
              <datalist id={listId}>
                {APPROVED_ROUTE_LIST.map((route) => (
                  <option key={route} value={route} />
                ))}
              </datalist>
            ) : null}
          </>
        )}
        {isLink ? (
          <span className="text-[11px] text-ink-muted">
            Use an approved internal path, or an https, mailto or tel link.
          </span>
        ) : null}
        {issue ? <span className="text-xs text-red-700">{issue}</span> : null}
      </label>
    );
  }

  if (Array.isArray(value)) {
    const fixed = (rootKey === "catalogue" && field === "categories") || rootKey === "navigation";
    const isBlockList = field === "blocks";
    return (
      <fieldset className="grid gap-3 border border-rule p-4">
        <legend className="px-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
          {labelFor(field)}
        </legend>
        {issue ? <p className="text-xs text-red-700">{issue}</p> : null}
        {value.map((item, index) => (
          <div key={index} className="relative border border-rule bg-surface p-4 pt-12">
            <div className="absolute left-3 top-3 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ink-muted">
              {isBlockList && item && typeof item === "object" && !Array.isArray(item)
                ? `${labelFor(String((item as { type?: string }).type ?? "block"))} block`
                : `${labelFor(field)} ${index + 1}`}
            </div>
            <div className="absolute right-2 top-2 flex gap-1">
              <button
                type="button"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => {
                  const next = [...value];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  onChange(next);
                }}
                className="border border-rule p-1.5 disabled:opacity-30"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={index === value.length - 1}
                onClick={() => {
                  const next = [...value];
                  [next[index + 1], next[index]] = [next[index], next[index + 1]];
                  onChange(next);
                }}
                className="border border-rule p-1.5 disabled:opacity-30"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {!fixed ? (
                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                  className="border border-red-200 p-1.5 text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <StructuredContentEditor
              value={item}
              onChange={(nextItem) =>
                onChange(value.map((current, itemIndex) => (itemIndex === index ? nextItem : current)))
              }
              {...child(String(index))}
            />
          </div>
        ))}
        {isBlockList ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted">
              Add block
            </span>
            {BLOCK_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onChange([...value, createBlock(type) as JsonValue])}
                className="inline-flex items-center gap-1.5 border border-rule px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] hover:border-accent"
              >
                <Plus className="h-3 w-3" /> {type}
              </button>
            ))}
          </div>
        ) : !fixed && value.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([...value, blankLike(value.at(-1)!)])}
            className="inline-flex w-fit items-center gap-2 border border-rule px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] hover:border-accent"
          >
            <Plus className="h-3.5 w-3.5" /> Add item
          </button>
        ) : null}
      </fieldset>
    );
  }

  if (value && typeof value === "object") {
    return (
      <div className="grid gap-4">
        {Object.entries(value).map(([key, item]) => (
          <div key={key} className={item && typeof item === "object" ? "border-l-2 border-rule pl-4" : ""}>
            {item && typeof item === "object" && !Array.isArray(item) ? (
              <h3 className="mb-3 font-display text-sm font-bold uppercase">{labelFor(key)}</h3>
            ) : null}
            <StructuredContentEditor
              value={item}
              onChange={(nextItem) => onChange({ ...value, [key]: nextItem })}
              {...child(key)}
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
}
