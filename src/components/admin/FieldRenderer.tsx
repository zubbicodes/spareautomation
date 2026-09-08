/**
 * Schema-driven field rendering.
 *
 * Every control comes from a `FieldDef` in `src/lib/content/fields.ts`: labels,
 * help text, character budgets, locks and grouping are declared, never guessed
 * from the runtime value. Server-side Zod issues are keyed by the same dotted
 * paths this component walks, so validation lands on the exact control.
 */

import {
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Copy,
  GripVertical,
  Link2,
  Lock,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { MediaPicker, type MediaOption } from "@/components/admin/MediaPicker";
import { CharCount, EmptyState, Legend, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  BLOCK_SPECS,
  humanise,
  messageSectionOf,
  type BlockKind,
  type FieldDef,
} from "@/lib/content/fields";
import { APPROVED_ROUTE_LIST, createBlock } from "@/lib/content/registry";
import { cn } from "@/lib/utils";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type FieldContext = {
  media: MediaOption[];
  /** Server validation messages, keyed by dotted document path. */
  issues: Record<string, string>;
  /** Called with a dotted path so the editor can scroll to a field. */
  registerAnchor?: (path: string, element: HTMLElement | null) => void;
};

type RenderProps = {
  field: FieldDef;
  value: JsonValue;
  onChange: (value: JsonValue) => void;
  /** Dotted-path segments from the document root. */
  path: string[];
  /** The key this value sits under, used when a spec omits a label. */
  name?: string;
  ctx: FieldContext;
};

export function FieldRenderer(props: RenderProps) {
  switch (props.field.kind) {
    case "group":
      return <GroupControl {...props} />;
    case "seo":
      return <SeoControl {...props} />;
    case "repeater":
      return <RepeaterControl {...props} />;
    case "blocks":
      return <BlocksControl {...props} />;
    case "map":
      return <MapControl {...props} />;
    case "toggle":
      return <ToggleControl {...props} />;
    case "image":
      return <ImageControl {...props} />;
    case "link":
      return <LinkControl {...props} />;
    case "select":
      return <SelectControl {...props} />;
    case "textarea":
      return <TextAreaControl {...props} />;
    default:
      return <TextControl {...props} />;
  }
}

/* ------------------------------------------------------------------ shell */

function labelOf(field: FieldDef, name?: string) {
  return field.label ?? (name ? humanise(name) : "");
}

function FieldShell({
  field,
  name,
  path,
  ctx,
  counter,
  children,
  aside,
}: {
  field: FieldDef;
  name?: string;
  path: string[];
  ctx: FieldContext;
  counter?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  const dotted = path.join(".");
  const issue = ctx.issues[dotted];
  const id = `field-${dotted.replaceAll(".", "-")}`;

  return (
    <div className="space-y-1.5" ref={(element) => ctx.registerAnchor?.(dotted, element)}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Label htmlFor={id} className="text-[12.5px] font-medium">
          {labelOf(field, name)}
          {field.required ? (
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          ) : null}
        </Label>
        {field.locked ? (
          <Pill tone="neutral" className="gap-1">
            <Lock className="size-2.5" aria-hidden="true" /> Locked
          </Pill>
        ) : null}
        {aside}
        {counter ? <span className="ml-auto">{counter}</span> : null}
      </div>
      {children}
      {field.lockReason && field.locked ? (
        <p className="text-xs text-muted-foreground">{field.lockReason}</p>
      ) : field.help ? (
        <p className="text-xs text-muted-foreground">{field.help}</p>
      ) : null}
      {issue ? (
        <p className="flex items-start gap-1.5 text-xs text-destructive">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {issue}
        </p>
      ) : null}
    </div>
  );
}

function fieldId(path: string[]) {
  return `field-${path.join(".").replaceAll(".", "-")}`;
}

/* ------------------------------------------------------------ leaf controls */

const INPUT_TYPE: Partial<Record<FieldDef["kind"], string>> = {
  email: "email",
  tel: "tel",
  url: "url",
  number: "number",
};

function TextControl({ field, value, onChange, path, name, ctx }: RenderProps) {
  const text = value === null || value === undefined ? "" : String(value);
  const invalid = Boolean(ctx.issues[path.join(".")]);
  return (
    <FieldShell
      field={field}
      name={name}
      path={path}
      ctx={ctx}
      counter={field.max && !field.locked ? <CharCount value={text} max={field.max} /> : null}
      aside={field.variables ? <VariableChips variables={field.variables} /> : null}
    >
      <Input
        id={fieldId(path)}
        type={INPUT_TYPE[field.kind] ?? "text"}
        value={text}
        disabled={field.locked}
        placeholder={field.placeholder}
        aria-invalid={invalid || undefined}
        maxLength={field.max}
        className={cn(
          "h-9",
          field.mono && "font-mono text-[12.5px]",
          invalid && "border-destructive focus-visible:ring-destructive",
        )}
        onChange={(event) =>
          onChange(field.kind === "number" ? Number(event.target.value) : event.target.value)
        }
      />
    </FieldShell>
  );
}

function TextAreaControl({ field, value, onChange, path, name, ctx }: RenderProps) {
  const text = typeof value === "string" ? value : "";
  const invalid = Boolean(ctx.issues[path.join(".")]);
  return (
    <FieldShell
      field={field}
      name={name}
      path={path}
      ctx={ctx}
      counter={field.max ? <CharCount value={text} max={field.max} /> : null}
      aside={field.variables ? <VariableChips variables={field.variables} /> : null}
    >
      <Textarea
        id={fieldId(path)}
        value={text}
        rows={field.rows ?? 4}
        disabled={field.locked}
        placeholder={field.placeholder}
        aria-invalid={invalid || undefined}
        maxLength={field.max}
        className={cn(
          "resize-y",
          field.mono && "font-mono text-[12.5px] leading-relaxed",
          invalid && "border-destructive focus-visible:ring-destructive",
        )}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

function ToggleControl({ field, value, onChange, path, name, ctx }: RenderProps) {
  const dotted = path.join(".");
  const issue = ctx.issues[dotted];
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5"
      ref={(element) => ctx.registerAnchor?.(dotted, element)}
    >
      <div className="min-w-0">
        <Label htmlFor={fieldId(path)} className="text-[12.5px] font-medium">
          {labelOf(field, name)}
        </Label>
        {field.help ? <p className="mt-0.5 text-xs text-muted-foreground">{field.help}</p> : null}
        {issue ? <p className="mt-0.5 text-xs text-destructive">{issue}</p> : null}
      </div>
      <Switch
        id={fieldId(path)}
        checked={value === true}
        disabled={field.locked}
        onCheckedChange={(checked) => onChange(checked)}
      />
    </div>
  );
}

function SelectControl({ field, value, onChange, path, name, ctx }: RenderProps) {
  return (
    <FieldShell field={field} name={name} path={path} ctx={ctx}>
      <Select
        value={String(value ?? "")}
        disabled={field.locked}
        onValueChange={(next) => onChange(next)}
      >
        <SelectTrigger id={fieldId(path)} className="h-9">
          <SelectValue placeholder={field.placeholder ?? "Choose…"} />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

/** Text input backed by a picker of the approved internal destinations. */
function LinkControl({ field, value, onChange, path, name, ctx }: RenderProps) {
  const text = typeof value === "string" ? value : "";
  const invalid = Boolean(ctx.issues[path.join(".")]);
  const internal = text.startsWith("/");
  return (
    <FieldShell field={field} name={name} path={path} ctx={ctx}>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Link2
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={fieldId(path)}
            value={text}
            disabled={field.locked}
            aria-invalid={invalid || undefined}
            placeholder="/contact-us"
            className={cn(
              "h-9 pl-8 font-mono text-[12.5px]",
              invalid && "border-destructive focus-visible:ring-destructive",
            )}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
        {field.locked ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-9 shrink-0">
                Pick page
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-72 w-64 overflow-y-auto">
              <DropdownMenuLabel className="text-xs">Approved destinations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {APPROVED_ROUTE_LIST.map((route) => (
                <DropdownMenuItem
                  key={route}
                  onSelect={() => onChange(route)}
                  className="font-mono text-[12px]"
                >
                  {route}
                  {route === text ? (
                    <span className="ml-auto size-1.5 rounded-full bg-primary" aria-hidden="true" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {text && !internal ? (
        <p className="text-xs text-muted-foreground">
          External link — opens away from the website.
        </p>
      ) : null}
    </FieldShell>
  );
}

function ImageControl({ field, value, onChange, path, name, ctx }: RenderProps) {
  return (
    <FieldShell field={field} name={name} path={path} ctx={ctx}>
      <MediaPicker
        value={typeof value === "string" ? value : ""}
        media={ctx.media}
        invalid={Boolean(ctx.issues[path.join(".")])}
        onChange={(id) => onChange(id)}
      />
    </FieldShell>
  );
}

/** Placeholder chips that insert at the end of an email template field. */
function VariableChips({ variables }: { variables: readonly string[] }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      {variables.map((variable) => (
        <span
          key={variable}
          className="rounded border bg-muted px-1.5 py-px font-mono text-[10.5px] text-muted-foreground"
        >
          {variable}
        </span>
      ))}
    </span>
  );
}

/* ----------------------------------------------------------------- groups */

function GroupControl({ field, value, onChange, path, ctx }: RenderProps) {
  const object = (value ?? {}) as Record<string, JsonValue>;
  const fields = field.fields ?? {};
  // The `type` discriminator carries no editorial meaning, so it stays hidden.
  const entries = Object.entries(fields).filter(([key]) => key !== "type");

  function set(key: string, next: JsonValue) {
    onChange({ ...object, [key]: next });
  }

  return (
    <div className="space-y-4">
      {field.label && path.length > 0 ? <Legend>{field.label}</Legend> : null}
      {entries.map(([key, childField]) => {
        // Pair an image with its description so choosing one can fill the other.
        if (childField.kind === "image" && "mediaAlt" in fields) {
          return (
            <div key={key} className="space-y-4 rounded-lg border bg-muted/25 p-3">
              <FieldShell field={childField} name={key} path={[...path, key]} ctx={ctx}>
                <MediaPicker
                  value={typeof object[key] === "string" ? (object[key] as string) : ""}
                  media={ctx.media}
                  invalid={Boolean(ctx.issues[[...path, key].join(".")])}
                  onChange={(id) => {
                    // Clearing the image clears its description too, so the
                    // "alt text required" rule cannot fire on an empty slot.
                    onChange(id ? { ...object, [key]: id } : { ...object, [key]: "", mediaAlt: "" });
                  }}
                  onSuggestAlt={(alt) => {
                    if (!String(object.mediaAlt ?? "").trim()) {
                      onChange({ ...object, [key]: object[key], mediaAlt: alt });
                    }
                  }}
                />
              </FieldShell>
              <FieldRenderer
                field={fields.mediaAlt}
                value={object.mediaAlt ?? ""}
                onChange={(next) => set("mediaAlt", next)}
                path={[...path, "mediaAlt"]}
                name="mediaAlt"
                ctx={ctx}
              />
            </div>
          );
        }
        if (key === "mediaAlt" && "mediaId" in fields) return null;

        return (
          <FieldRenderer
            key={key}
            field={childField}
            value={object[key] ?? defaultFor(childField)}
            onChange={(next) => set(key, next)}
            path={[...path, key]}
            name={key}
            ctx={ctx}
          />
        );
      })}
    </div>
  );
}

/** Search-engine group, shown with a live result preview. */
function SeoControl({ field, value, onChange, path, ctx }: RenderProps) {
  const object = (value ?? {}) as Record<string, JsonValue>;
  const title = String(object.title ?? "");
  const description = String(object.description ?? "");

  return (
    <div className="space-y-4 rounded-lg border bg-muted/25 p-3.5">
      <div>
        <Legend>{field.label ?? "Search engine listing"}</Legend>
        {field.help ? <p className="mt-1.5 text-xs text-muted-foreground">{field.help}</p> : null}
      </div>

      <div className="rounded-lg border bg-card p-3">
        <p className="truncate text-[11px] text-muted-foreground">
          sparesautomation.co.uk › {path.slice(0, -1).join(" › ") || "page"}
        </p>
        <p className="mt-0.5 truncate text-[15px] text-info">{title || "Page title"}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {description || "The meta description shown under the title in search results."}
        </p>
      </div>

      <div className="grid gap-4">
        {Object.entries(field.fields ?? {}).map(([key, childField]) => (
          <FieldRenderer
            key={key}
            field={childField}
            value={object[key] ?? ""}
            onChange={(next) => onChange({ ...object, [key]: next })}
            path={[...path, key]}
            name={key}
            ctx={ctx}
          />
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- repeaters */

function RepeaterControl({ field, value, onChange, path, name, ctx }: RenderProps) {
  const items = Array.isArray(value) ? value : [];
  const itemField = field.of ?? { kind: "text" };
  const dotted = path.join(".");
  const issue = ctx.issues[dotted];

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  }

  return (
    <section className="space-y-2.5" ref={(element) => ctx.registerAnchor?.(dotted, element)}>
      <div className="flex items-baseline gap-2">
        <Legend>{labelOf(field, name)}</Legend>
        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
          {items.length}
        </span>
      </div>
      {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
      {issue ? <p className="text-xs text-destructive">{issue}</p> : null}

      <div className="space-y-2">
        {items.map((item, index) => (
          <RepeaterRow
            key={index}
            index={index}
            total={items.length}
            fixed={field.fixed}
            title={rowTitle(item, field, index)}
            onMoveUp={() => move(index, index - 1)}
            onMoveDown={() => move(index, index + 1)}
            onDuplicate={() =>
              onChange([...items.slice(0, index + 1), structuredClone(item), ...items.slice(index + 1)])
            }
            onRemove={() => onChange(items.filter((_, position) => position !== index))}
          >
            <FieldRenderer
              field={itemField}
              value={item}
              onChange={(next) =>
                onChange(items.map((current, position) => (position === index ? next : current)))
              }
              path={[...path, String(index)]}
              ctx={ctx}
            />
          </RepeaterRow>
        ))}
      </div>

      {field.fixed ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, defaultFor(itemField)])}
        >
          <Plus /> {field.addLabel ?? "Add item"}
        </Button>
      )}
    </section>
  );
}

function rowTitle(item: JsonValue, field: FieldDef, index: number) {
  if (typeof item === "string") return item || `Item ${index + 1}`;
  if (item && typeof item === "object" && !Array.isArray(item) && field.itemTitleField) {
    const candidate = (item as Record<string, JsonValue>)[field.itemTitleField];
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return `Item ${index + 1}`;
}

function RepeaterRow({
  index,
  total,
  title,
  fixed,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  children,
}: {
  index: number;
  total: number;
  title: string;
  fixed?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(total <= 3);
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-1.5 border-b bg-muted/40 py-1.5 pr-1.5 pl-2.5">
        <GripVertical className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 py-0.5 text-left"
        >
          <span className="w-5 shrink-0 text-[11px] text-muted-foreground tabular-nums">
            {index + 1}
          </span>
          <span className="truncate text-[12.5px] font-medium">{title}</span>
          <ChevronDown
            className={cn(
              "ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
        <span className="flex shrink-0 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Move up"
            disabled={index === 0}
            onClick={onMoveUp}
          >
            <ChevronUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Move down"
            disabled={index === total - 1}
            onClick={onMoveDown}
          >
            <ChevronDown />
          </Button>
          {fixed ? null : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Duplicate"
                onClick={onDuplicate}
              >
                <Copy />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                aria-label="Remove"
                onClick={onRemove}
              >
                <Trash2 />
              </Button>
            </>
          )}
        </span>
      </div>
      {open ? <div className="p-3.5">{children}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ blocks */

function BlocksControl({ field, value, onChange, path, name, ctx }: RenderProps) {
  const blocks = Array.isArray(value) ? value : [];
  const dotted = path.join(".");

  function move(from: number, to: number) {
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  }

  return (
    <section className="space-y-2.5" ref={(element) => ctx.registerAnchor?.(dotted, element)}>
      <div className="flex items-baseline gap-2">
        <Legend>{labelOf(field, name)}</Legend>
        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
          {blocks.length}
        </span>
      </div>
      {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
      {ctx.issues[dotted] ? (
        <p className="text-xs text-destructive">{ctx.issues[dotted]}</p>
      ) : null}

      {blocks.length === 0 ? (
        <EmptyState
          title="No sections yet"
          copy="Sections stack down the page in the order you add them."
          className="py-8"
        />
      ) : (
        <div className="space-y-2">
          {blocks.map((block, index) => {
            const type = (block as { type?: string } | null)?.type as BlockKind | undefined;
            const spec = type && type in BLOCK_SPECS ? BLOCK_SPECS[type] : null;
            const title = spec
              ? String(
                  (block as Record<string, JsonValue>)[spec.titleField] ?? "",
                ).trim() || spec.label
              : "Unrecognised section";
            return (
              <RepeaterRow
                key={index}
                index={index}
                total={blocks.length}
                title={`${spec?.label ?? "Unknown"} · ${title}`}
                onMoveUp={() => move(index, index - 1)}
                onMoveDown={() => move(index, index + 1)}
                onDuplicate={() =>
                  onChange([
                    ...blocks.slice(0, index + 1),
                    structuredClone(block),
                    ...blocks.slice(index + 1),
                  ])
                }
                onRemove={() => onChange(blocks.filter((_, position) => position !== index))}
              >
                {spec ? (
                  <GroupControl
                    field={{ kind: "group", fields: spec.fields }}
                    value={block}
                    onChange={(next) =>
                      onChange(
                        blocks.map((current, position) => (position === index ? next : current)),
                      )
                    }
                    path={[...path, String(index)]}
                    ctx={ctx}
                  />
                ) : (
                  <p className="text-xs text-destructive">
                    This section type is no longer supported. Remove it before publishing.
                  </p>
                )}
              </RepeaterRow>
            );
          })}
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Plus /> {field.addLabel ?? "Add section"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="text-xs">Section types</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(BLOCK_SPECS) as BlockKind[]).map((type) => (
            <DropdownMenuItem
              key={type}
              className="flex-col items-start gap-0.5 py-2"
              onSelect={() => onChange([...blocks, createBlock(type) as JsonValue])}
            >
              <span className="text-[13px] font-medium">{BLOCK_SPECS[type].label}</span>
              <span className="text-xs text-muted-foreground">{BLOCK_SPECS[type].description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  );
}

/* -------------------------------------------------------------------- maps */

/**
 * Fixed-key records: the information pages, the functional pages and the
 * message catalogue. Rendered as a searchable index beside one open entry
 * rather than a single unbroken stack of every entry.
 */
function MapControl({ field, value, onChange, path, ctx }: RenderProps) {
  const record = useMemo(() => (value ?? {}) as Record<string, JsonValue>, [value]);
  const keys = useMemo(() => Object.keys(record).sort(), [record]);
  const [active, setActive] = useState(keys[0] ?? "");
  const [query, setQuery] = useState("");

  if (field.groupByPrefix) {
    return <MessageMapControl field={field} record={record} onChange={onChange} path={path} ctx={ctx} />;
  }

  const current = keys.includes(active) ? active : (keys[0] ?? "");
  const needle = query.trim().toLowerCase();
  const visible = keys.filter(
    (key) =>
      !needle ||
      key.toLowerCase().includes(needle) ||
      (field.entryLabels?.[key] ?? "").toLowerCase().includes(needle),
  );

  /** Entries whose fields carry a server validation issue. */
  const flagged = new Set(
    Object.keys(ctx.issues)
      .map((issuePath) => issuePath.split(".")[path.length] ?? "")
      .filter(Boolean),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="space-y-2 lg:sticky lg:top-18 lg:self-start">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter pages…"
            aria-label="Filter pages"
            className="h-8 pl-8 text-[13px]"
          />
        </div>
        <nav className="space-y-0.5" aria-label="Pages in this document">
          {visible.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              aria-current={key === current ? "true" : undefined}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
                key === current
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <span className="truncate">{field.entryLabels?.[key] ?? humanise(key)}</span>
              {flagged.has(key) ? (
                <CircleAlert className="ml-auto size-3.5 shrink-0 text-destructive" aria-hidden="true" />
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-w-0">
        {current ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold">
                {field.entryLabels?.[current] ?? humanise(current)}
              </h3>
              <code className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                /{current}
              </code>
              <Button variant="ghost" size="sm" className="ml-auto h-7" asChild>
                <a href={`/${current}`} target="_blank" rel="noreferrer">
                  Open page
                </a>
              </Button>
            </div>
            <FieldRenderer
              field={field.of ?? { kind: "group" }}
              value={record[current]}
              onChange={(next) => onChange({ ...record, [current]: next })}
              path={[...path, current]}
              ctx={ctx}
            />
          </div>
        ) : (
          <EmptyState title="Nothing to edit" copy="This document has no entries." />
        )}
      </div>
    </div>
  );
}

/** The message catalogue: flat strings, grouped by their dotted prefix. */
function MessageMapControl({
  field,
  record,
  onChange,
  path,
  ctx,
}: {
  field: FieldDef;
  record: Record<string, JsonValue>;
  onChange: (value: JsonValue) => void;
  path: string[];
  ctx: FieldContext;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const sections = useMemo(() => {
    const grouped = new Map<string, string[]>();
    for (const key of Object.keys(record)) {
      const section = messageSectionOf(key);
      if (!grouped.has(section)) grouped.set(section, []);
      grouped.get(section)!.push(key);
    }
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [record]);

  const matches = (key: string) =>
    !needle ||
    key.toLowerCase().includes(needle) ||
    String(record[key] ?? "").toLowerCase().includes(needle);

  const total = Object.keys(record).length;
  const shown = Object.keys(record).filter(matches).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search message keys and wording…"
            aria-label="Search messages"
            className="h-9 pl-8"
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {shown} of {total}
        </span>
      </div>

      {shown === 0 ? (
        <EmptyState title="No messages match" copy="Try a different word or message key." />
      ) : null}

      {sections.map(([section, keys]) => {
        const visible = keys.filter(matches);
        if (visible.length === 0) return null;
        return (
          <section key={section} className="space-y-3">
            <Legend>{section}</Legend>
            <div className="grid gap-4">
              {visible.sort().map((key) => {
                const text = String(record[key] ?? "");
                const long = text.length > 90;
                return (
                  <FieldRenderer
                    key={key}
                    field={{
                      ...(field.of ?? { kind: "text" }),
                      kind: long ? "textarea" : "text",
                      rows: 3,
                      label: humanise(key.split(".").slice(1).join(" ")) || humanise(key),
                      help: key,
                    }}
                    value={text}
                    onChange={(next) => onChange({ ...record, [key]: next })}
                    path={[...path, key]}
                    ctx={ctx}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- defaults */

/** A blank value matching a field's kind, used when adding repeater entries. */
function defaultFor(field: FieldDef): JsonValue {
  switch (field.kind) {
    case "toggle":
      return true;
    case "number":
      return 0;
    case "repeater":
    case "blocks":
      return [];
    case "group":
    case "seo":
      return Object.fromEntries(
        Object.entries(field.fields ?? {}).map(([key, child]) => [key, defaultFor(child)]),
      );
    case "map":
      return {};
    default:
      return "";
  }
}

export { defaultFor };
