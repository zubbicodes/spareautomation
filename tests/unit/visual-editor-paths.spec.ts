import { expect, test } from "@playwright/test";

import { describePath, resolveField } from "../../src/lib/content/fields";
import { readPath, writePath } from "../../src/lib/content/paths";
import {
  CONTENT_KEYS,
  getDefaultContent,
  validateContent,
  type ContentKey,
} from "../../src/lib/content/registry";

/** Every editable leaf in a document, as dotted paths. */
function leafPaths(value: unknown, base: string[] = []): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => leafPaths(item, [...base, String(index)]));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => leafPaths(item, [...base, key]));
  }
  return [base.join(".")];
}

/*
 * The visual editor never posts a whole document the user typed; it takes the
 * stored draft and rewrites one dotted path inside it. If that rewrite turned a
 * container into the wrong shape, the save would be rejected for a field nobody
 * touched — so every leaf of every document is exercised here.
 */
test("writing any single content path leaves the document valid", () => {
  for (const key of CONTENT_KEYS) {
    const original = getDefaultContent(key) as Record<string, unknown>;

    for (const path of leafPaths(original)) {
      const current = readPath(original, path);
      // Only text leaves are editable through click-to-edit.
      if (typeof current !== "string") continue;

      const next = writePath(original, path, `${current} edited`) as Record<string, unknown>;
      expect(readPath(next, path), `${key}.${path}`).toBe(`${current} edited`);
      // The source document must not be mutated: the editor keeps it as the
      // baseline for optimistic concurrency.
      expect(readPath(original, path), `${key}.${path} source`).toBe(current);
    }
  }
});

test("rewriting a nested array entry keeps every container an array", () => {
  const catalogue = getDefaultContent("catalogue");
  const next = writePath(
    catalogue as unknown as Record<string, unknown>,
    "ranges.0.lines.0.label",
    "Mixing Machine",
  ) as typeof catalogue;

  expect(Array.isArray(next.ranges)).toBe(true);
  expect(Array.isArray(next.ranges[0].lines)).toBe(true);
  expect(next.ranges[0].lines[0].label).toBe("Mixing Machine");
  expect(() => validateContent("catalogue", next)).not.toThrow();
});

test("every editable path resolves to a declared field with a readable name", () => {
  const samples: Array<[ContentKey, string]> = [
    ["catalogue", "ranges.0.lines.0.label"],
    ["navigation", "header.0.label"],
    ["site", "phoneDisplay"],
    ["home", "finderTitle"],
  ];

  for (const [key, path] of samples) {
    const value = getDefaultContent(key);
    expect(resolveField(key, path.split("."), value), path).not.toBeNull();
    const described = describePath(key, path, value);
    expect(described, path).not.toContain(".");
    expect(described.length, path).toBeGreaterThan(0);
  }

  expect(describePath("catalogue", "ranges.0.lines.0.label", getDefaultContent("catalogue"))).toBe(
    "Hero panels › #1 › Product lines › #1 › Line label",
  );
});
