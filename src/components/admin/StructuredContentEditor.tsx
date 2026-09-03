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

export function labelFor(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
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
      <label className="cms-checkbox">
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{labelFor(field)}</span>
      </label>
    );
  }

  if (typeof value === "string" && field === "mediaId") {
    const selected = media.find((item) => item.id === value);
    return (
      <label className="cms-field">
        <span className="cms-label">Image</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="cms-select"
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
          <span className="cms-error-text">
            This image is no longer available. Choose another before publishing.
          </span>
        ) : null}
        {selected ? (
          <img src={selected.url} alt={selected.defaultAlt} className="cms-media-thumb" />
        ) : null}
        {issue ? <span className="cms-error-text">{issue}</span> : null}
      </label>
    );
  }

  if (typeof value === "string" || typeof value === "number") {
    const locked = LOCKED_FIELDS.has(field) || (rootKey === "navigation" && field === "to");
    const isLink = LINK_FIELDS.has(field) && !locked;
    const multiline =
      typeof value === "string" &&
      (value.length > 90 || /copy|description|body|intro|message/i.test(field));
    const listId = isLink ? `routes-${dotted.replaceAll(".", "-")}` : undefined;
    return (
      <label className="cms-field">
        <span className="cms-label">
          {labelFor(field)}
          {locked ? " · locked" : ""}
        </span>
        {multiline ? (
          <textarea
            value={value}
            disabled={locked}
            rows={Math.min(12, Math.max(3, String(value).split("\n").length + 1))}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={issue ? true : undefined}
            className="cms-textarea"
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
              className="cms-input"
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
          <span className="cms-hint">
            Use an approved internal path, or an https, mailto or tel link.
          </span>
        ) : null}
        {issue ? <span className="cms-error-text">{issue}</span> : null}
      </label>
    );
  }

  if (Array.isArray(value)) {
    const fixed = (rootKey === "catalogue" && field === "categories") || rootKey === "navigation";
    const isBlockList = field === "blocks";
    return (
      <fieldset className="cms-fieldset">
        <legend>{labelFor(field)}</legend>
        {issue ? <p className="cms-error-text">{issue}</p> : null}
        {value.map((item, index) => (
          <div key={index} className="cms-block">
            <span className="cms-block-type">
              {isBlockList && item && typeof item === "object" && !Array.isArray(item)
                ? `${labelFor(String((item as { type?: string }).type ?? "block"))} block`
                : `${labelFor(field)} ${index + 1}`}
            </span>
            <span className="cms-block-tools">
              <button
                type="button"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => {
                  const next = [...value];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  onChange(next);
                }}
                className="cms-btn cms-btn-sm cms-btn-icon"
              >
                <ChevronUp aria-hidden="true" />
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
                className="cms-btn cms-btn-sm cms-btn-icon"
              >
                <ChevronDown aria-hidden="true" />
              </button>
              {!fixed ? (
                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                  className="cms-btn cms-btn-sm cms-btn-icon cms-btn-danger"
                >
                  <Trash2 aria-hidden="true" />
                </button>
              ) : null}
            </span>
            <StructuredContentEditor
              value={item}
              onChange={(nextItem) =>
                onChange(
                  value.map((current, itemIndex) => (itemIndex === index ? nextItem : current)),
                )
              }
              {...child(String(index))}
            />
          </div>
        ))}
        {isBlockList ? (
          <div className="cms-add-row">
            <span className="cms-label">Add block</span>
            {BLOCK_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onChange([...value, createBlock(type) as JsonValue])}
                className="cms-btn cms-btn-sm"
              >
                <Plus aria-hidden="true" /> {type}
              </button>
            ))}
          </div>
        ) : !fixed && value.length > 0 ? (
          <div className="cms-add-row">
            <button
              type="button"
              onClick={() => onChange([...value, blankLike(value.at(-1)!)])}
              className="cms-btn cms-btn-sm"
            >
              <Plus aria-hidden="true" /> Add item
            </button>
          </div>
        ) : null}
      </fieldset>
    );
  }

  if (value && typeof value === "object") {
    return (
      <div className="cms-group">
        {Object.entries(value).map(([key, item]) => {
          const nested = item && typeof item === "object";
          return (
            <div key={key} className={nested ? "cms-group cms-group-nested" : undefined}>
              {nested && !Array.isArray(item) ? (
                <h3 className="cms-group-title">{labelFor(key)}</h3>
              ) : null}
              <StructuredContentEditor
                value={item}
                onChange={(nextItem) => onChange({ ...value, [key]: nextItem })}
                {...child(key)}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}
