import { expect, test } from "@playwright/test";

import {
  CONTENT_KEYS,
  getDefaultContent,
  getDefaultContentBundle,
  renderTemplate,
  validateContent,
} from "../../src/lib/content/registry";

test("all compiled CMS defaults pass their schema", () => {
  for (const key of CONTENT_KEYS) expect(() => validateContent(key, getDefaultContent(key))).not.toThrow();
  expect(Object.keys(getDefaultContentBundle()).sort()).toEqual([...CONTENT_KEYS].sort());
});

test("navigation destinations and Shopify handles remain locked", () => {
  const navigation = getDefaultContent("navigation");
  navigation.header[0].to = "javascript:alert(1)";
  expect(() => validateContent("navigation", navigation)).toThrow();

  const catalogue = getDefaultContent("catalogue");
  catalogue.categories[0].handle = "renamed-in-cms";
  expect(() => validateContent("catalogue", catalogue)).toThrow();
});

test("fixed pages cannot be added and unsafe links are rejected", () => {
  const pages = getDefaultContent("pages") as Record<string, unknown>;
  pages["client-created-page"] = pages["about-us"];
  expect(() => validateContent("pages", pages)).toThrow();

  const original = getDefaultContent("pages");
  original["about-us"].ctaTo = "data:text/html,unsafe";
  expect(() => validateContent("pages", original)).toThrow();
});

test("email templates retain required variables and substitutions are escaped", () => {
  const emails = getDefaultContent("emails");
  emails.returnStatus.subject = "Status changed";
  emails.returnStatus.body = "No template variables remain.";
  expect(() => validateContent("emails", emails)).toThrow();
  expect(renderTemplate("Hello {{name}} {{missing}}", { name: "<Admin>" })).toBe("Hello &lt;Admin&gt; {{missing}}");
});
