import path from "node:path";

import { expect, test } from "@playwright/test";

import { validatePassword } from "../../src/lib/admin/auth.server";
import { hasContentImageSignature } from "../../src/lib/content/media.functions";
import { isPathInside } from "../../src/lib/content/media-storage.server";
import { getDefaultContent, validateContent } from "../../src/lib/content/registry";

test("CMS passwords use the strengthened server policy", () => {
  expect(validatePassword("short")).toContain("12 characters");
  expect(validatePassword("alllowercase123")).toContain("upper-case");
  expect(validatePassword("StrongTemporary123")).toBeNull();
});

test("public media accepts only matching image signatures", () => {
  expect(hasContentImageSignature("image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe(true);
  expect(hasContentImageSignature("image/png", Buffer.from("not a png"))).toBe(false);
  expect(hasContentImageSignature("image/svg+xml", Buffer.from("<svg/>"))).toBe(false);
});

test("resolved media paths cannot escape their storage root", () => {
  const root = path.resolve("data", "uploads", "content-media");
  expect(isPathInside(root, path.join(root, "asset.jpg"))).toBe(true);
  expect(isPathInside(root, path.resolve(root, "..", "private.txt"))).toBe(false);
});

test("content images require contextual alt text", () => {
  const pages = getDefaultContent("pages");
  pages["about-us"].blocks = [{ type: "hero", eyebrow: "", title: "Hero", copy: "", mediaId: "abc", mediaAlt: "" }];
  expect(() => validateContent("pages", pages)).toThrow(/Alt text/);
});
