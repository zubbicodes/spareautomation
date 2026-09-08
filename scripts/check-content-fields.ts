/**
 * Integrity check for the CMS field schema.
 *
 * `src/lib/content/fields.ts` describes how every content value is edited, but
 * the values themselves are owned by the Zod registry. Nothing in the type
 * system ties the two together, so this script walks the compiled defaults and
 * fails if the editor could not render a field — which is exactly the drift
 * that would otherwise surface as a blank control in the CMS.
 *
 * Run with: npm run check:content
 */

import {
  BLOCK_SPECS,
  FIELD_SPECS,
  isMapDocument,
  resolveField,
  specFor,
  type BlockKind,
} from "../src/lib/content/fields";
import {
  BLOCK_TYPES,
  CONTENT_KEYS,
  createBlock,
  getDefaultContent,
  type ContentKey,
} from "../src/lib/content/registry";
import { EDITABLE_PAGES } from "../src/lib/content/editable-pages";

const problems: string[] = [];

function fail(message: string) {
  problems.push(message);
}

/** Every leaf in a document must resolve to a field definition. */
function walk(key: ContentKey, value: unknown, path: string[], root: unknown) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(key, item, [...path, String(index)], root));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      walk(key, childValue, [...path, childKey], root);
    }
    return;
  }
  // Leaf: string, number, boolean or null.
  if (path.at(-1) === "type") return; // Block discriminators are never edited.
  const field = resolveField(key, path, root);
  if (!field) fail(`${key}: no field declared for "${path.join(".")}"`);
}

for (const key of CONTENT_KEYS) {
  const defaults = getDefaultContent(key);
  const spec = specFor(key);

  walk(key, defaults, [], defaults);

  // Tabs must reference real fields, and cover every declared field once.
  const declared = new Set(Object.keys(spec.fields));
  const seen = new Set<string>();
  for (const tab of spec.tabs) {
    if (tab.fields.length === 0) fail(`${key}: tab "${tab.id}" lists no fields`);
    for (const name of tab.fields) {
      if (!declared.has(name)) fail(`${key}: tab "${tab.id}" references unknown field "${name}"`);
      if (seen.has(name)) fail(`${key}: field "${name}" appears on more than one tab`);
      seen.add(name);
    }
  }
  for (const name of declared) {
    if (!seen.has(name)) fail(`${key}: field "${name}" is on no tab and can never be edited`);
  }

  // Non-map documents must declare a field for every top-level default key.
  if (!isMapDocument(key)) {
    for (const name of Object.keys(defaults as Record<string, unknown>)) {
      if (!declared.has(name)) fail(`${key}: no field declared for top-level "${name}"`);
    }
  }

  if (spec.previewPath && !EDITABLE_PAGES.some((page) => page.path === spec.previewPath)) {
    fail(`${key}: previewPath "${spec.previewPath}" is not an editable page`);
  }
}

// Every block type the registry can create must have an editor spec, and the
// spec must cover every field that block actually carries.
for (const type of BLOCK_TYPES) {
  const spec = BLOCK_SPECS[type as BlockKind];
  if (!spec) {
    fail(`blocks: no editor spec for block type "${type}"`);
    continue;
  }
  const block = createBlock(type) as Record<string, unknown>;
  for (const name of Object.keys(block)) {
    if (!(name in spec.fields)) fail(`blocks: "${type}" has no field declared for "${name}"`);
  }
  if (!(spec.titleField in spec.fields)) {
    fail(`blocks: "${type}" titleField "${spec.titleField}" is not one of its fields`);
  }
}

for (const type of Object.keys(BLOCK_SPECS)) {
  if (!(BLOCK_TYPES as readonly string[]).includes(type)) {
    fail(`blocks: editor spec "${type}" is not a registry block type`);
  }
}

// Every editable page must name content documents that exist.
for (const page of EDITABLE_PAGES) {
  for (const document of page.documents) {
    if (!(document in FIELD_SPECS)) {
      fail(`pages: "${page.path}" references unknown document "${document}"`);
    }
  }
}

if (problems.length) {
  console.error(`Content field schema check failed (${problems.length} problems):\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `Content field schema OK: ${CONTENT_KEYS.length} documents, ${BLOCK_TYPES.length} block types, ${EDITABLE_PAGES.length} editable pages.`,
);
