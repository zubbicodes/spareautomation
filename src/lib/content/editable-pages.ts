/**
 * The pages the visual editor can open.
 *
 * Derived from the content registry rather than hand-listed, so a page added to
 * `pages` or `functional` becomes editable without a second edit here — and a
 * page removed from the registry stops being offered.
 */

import { FUNCTIONAL_ENTRY_LABELS, PAGE_ENTRY_LABELS } from "./fields";
import { CONTENT_REGISTRY, type ContentKey } from "./registry";
import { humanise } from "./fields";

export type EditablePage = {
  /** Public path opened in the preview frame. */
  path: string;
  label: string;
  /** How it is grouped in pickers and the command palette. */
  group: "Homepage" | "Catalogue" | "Information" | "Functional";
  /** Content documents whose wording appears on this page. */
  documents: ContentKey[];
};

/** Documents that contribute wording to every page. */
const GLOBAL_DOCUMENTS: ContentKey[] = ["site", "navigation", "messages"];

function entriesOf(key: "pages" | "functional") {
  return Object.keys(CONTENT_REGISTRY[key].defaults as Record<string, unknown>);
}

export const EDITABLE_PAGES: EditablePage[] = [
  {
    path: "/",
    label: "Homepage",
    group: "Homepage",
    documents: ["home", "catalogue", ...GLOBAL_DOCUMENTS],
  },
  {
    path: "/products",
    label: "All products",
    group: "Catalogue",
    documents: ["product", "catalogue", ...GLOBAL_DOCUMENTS],
  },
  ...entriesOf("pages").map<EditablePage>((entry) => ({
    path: `/${entry}`,
    label: PAGE_ENTRY_LABELS[entry] ?? humanise(entry),
    group: "Information",
    documents: ["pages", ...GLOBAL_DOCUMENTS],
  })),
  ...entriesOf("functional").map<EditablePage>((entry) => ({
    path: `/${entry}`,
    label: FUNCTIONAL_ENTRY_LABELS[entry] ?? humanise(entry),
    group: "Functional",
    documents: ["functional", ...GLOBAL_DOCUMENTS],
  })),
];

export const EDITABLE_PAGE_GROUPS = ["Homepage", "Catalogue", "Information", "Functional"] as const;

export function isEditablePage(path: string) {
  return EDITABLE_PAGES.some((page) => page.path === path);
}

export function editablePageFor(path: string) {
  return EDITABLE_PAGES.find((page) => page.path === path) ?? EDITABLE_PAGES[0];
}
