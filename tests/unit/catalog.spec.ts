import { expect, test } from "@playwright/test";

import {
  CATALOG_CATEGORIES,
  getCatalogueSearch,
  getCatalogCollections,
  getCatalogFilterHandle,
} from "../../src/lib/catalog";

test("every storefront category and product line maps to one Shopify collection", () => {
  const collections = getCatalogCollections();
  const handles = collections.map((collection) => collection.handle);

  expect(new Set(handles).size).toBe(handles.length);
  for (const category of CATALOG_CATEGORIES) {
    expect(handles).toContain(category.handle);
    for (const line of category.productLines) {
      expect(handles).toContain(line.collectionHandle);
    }
  }
});

test("same-named aggregate lines stay separate between asphalt and concrete", () => {
  const asphalt = CATALOG_CATEGORIES.find((category) => category.handle === "asphalt")!;
  const concrete = CATALOG_CATEGORIES.find((category) => category.handle === "concrete")!;

  expect(
    asphalt.productLines.find((line) => line.label === "Aggregate Feeding")?.collectionHandle,
  ).not.toBe(
    concrete.productLines.find((line) => line.label === "Aggregate Feeding")?.collectionHandle,
  );
});

test("legacy category links resolve to the unified catalogue filters", () => {
  expect(getCatalogFilterHandle("home-controls")).toBe("home-controls");
  expect(getCatalogFilterHandle("asphalt", "burner-drying")).toBe("burner-drying");
  expect(getCatalogueSearch("home-controls")).toEqual({
    category: "home-controls",
    availability: "all",
    sort: "newest",
  });
});
