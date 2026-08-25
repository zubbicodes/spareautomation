import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getCatalogCollections } from "../src/lib/catalog.ts";

type AdminResult<T> = { data?: T; errors?: Array<{ message: string }> };
type Collection = { id: string; handle: string; title: string; publishedOnPublication: boolean };

const apply = process.argv.includes("--apply");
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const adminDomain = process.env.SHOPIFY_ADMIN_STORE_DOMAIN ?? domain;
const configuredToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const version = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-07";

if (!adminDomain) {
  throw new Error("Set SHOPIFY_STORE_DOMAIN in .env.");
}

function getShopifyCliCommand() {
  if (process.platform !== "win32") return { command: "shopify", args: [] as string[] };

  const cliEntry = join(
    process.env.APPDATA ?? "",
    "npm",
    "node_modules",
    "@shopify",
    "cli",
    "bin",
    "run.js",
  );
  if (!existsSync(cliEntry)) {
    throw new Error(
      "Shopify CLI was not found. Install it with: npm install -g @shopify/cli@latest",
    );
  }
  return { command: process.execPath, args: [cliEntry] };
}

async function admin<T>(query: string, variables: Record<string, unknown> = {}) {
  if (!configuredToken) {
    const cli = getShopifyCliCommand();
    try {
      const output = execFileSync(
        cli.command,
        [
          ...cli.args,
          "store",
          "execute",
          "--store",
          adminDomain,
          "--version",
          version,
          "--query",
          query,
          "--variables",
          JSON.stringify(variables),
          "--json",
          ...(query.trimStart().startsWith("mutation") ? ["--allow-mutations"] : []),
        ],
        { encoding: "utf8", windowsHide: true },
      );
      const result = JSON.parse(output) as T;
      if (!result || typeof result !== "object") {
        throw new Error("Shopify CLI returned no Admin API data.");
      }
      return result;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Shopify CLI could not access ${adminDomain}. First run:\nshopify store auth --store ${adminDomain} --scopes read_products,write_products,read_publications,write_publications\n\n${detail}`,
      );
    }
  }

  const response = await fetch(`https://${adminDomain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": configuredToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  const result = (await response.json()) as AdminResult<T>;
  if (!response.ok || result.errors?.length || !result.data) {
    throw new Error(
      result.errors?.map((error) => error.message).join("; ") ||
        `Shopify Admin API failed (${response.status}).`,
    );
  }
  return result.data;
}

const publicationData = await admin<{
  publications: { nodes: Array<{ id: string; catalog: { title: string } | null }> };
}>(`
  query CatalogPublications { publications(first: 50) { nodes { id catalog { title } } } }
`);
const configuredPublicationId = process.env.SHOPIFY_STOREFRONT_PUBLICATION_ID;
const headlessPublications = publicationData.publications.nodes.filter((publication) =>
  /headless/i.test(publication.catalog?.title ?? ""),
);
const publication = configuredPublicationId
  ? publicationData.publications.nodes.find((item) => item.id === configuredPublicationId)
  : headlessPublications.length === 1
    ? headlessPublications[0]
    : undefined;

if (!publication) {
  const choices = publicationData.publications.nodes
    .map((item) => `${item.catalog?.title ?? "Unnamed publication"}: ${item.id}`)
    .join("\n");
  throw new Error(
    `Could not choose the Headless storefront publication. Set SHOPIFY_STOREFRONT_PUBLICATION_ID to one of:\n${choices}`,
  );
}

const existingData = await admin<{ collections: { nodes: Collection[] } }>(
  `
  query CatalogCollections($publicationId: ID!) {
    collections(first: 250) {
      nodes { id handle title publishedOnPublication(publicationId: $publicationId) }
    }
  }
`,
  { publicationId: publication.id },
);

const existing = new Map(
  existingData.collections.nodes.map((collection) => [collection.handle, collection]),
);
const required = getCatalogCollections();
const missing = required.filter((collection) => !existing.has(collection.handle));
const unpublished = required
  .map((collection) => existing.get(collection.handle))
  .filter((collection): collection is Collection =>
    Boolean(collection && !collection.publishedOnPublication),
  );
const renames = required
  .map((collection) => ({ collection, existing: existing.get(collection.handle) }))
  .filter(({ collection, existing }) => Boolean(existing && existing.title !== collection.title));

console.log(`Storefront publication: ${publication.catalog?.title ?? "Headless"}`);
console.log(
  `Required collections: ${required.length}; missing: ${missing.length}; unpublished: ${unpublished.length}; titles to align: ${renames.length}`,
);
for (const collection of missing) console.log(`CREATE  ${collection.handle} - ${collection.title}`);
for (const collection of unpublished)
  console.log(`PUBLISH ${collection.handle} - ${collection.title}`);
for (const { collection, existing: current } of renames)
  console.log(`RENAME  ${collection.handle} - ${current!.title} -> ${collection.title}`);

if (!apply) {
  console.log(
    "Dry run only. Run npm run shopify:sync-collections -- --apply to create and publish them.",
  );
  process.exit(0);
}

const idsToPublish = unpublished.map((collection) => collection.id);
for (const { collection, existing: current } of renames) {
  const result = await admin<{
    collectionUpdate: { userErrors: Array<{ message: string }> };
  }>(
    `
      mutation UpdateCatalogCollection($collection: CollectionUpdateInput!) {
        collectionUpdate(collection: $collection) { userErrors { message } }
      }
    `,
    { collection: { id: current!.id, title: collection.title } },
  );
  if (result.collectionUpdate.userErrors.length) {
    throw new Error(
      `Could not rename ${collection.handle}: ${result.collectionUpdate.userErrors.map((error) => error.message).join("; ")}`,
    );
  }
}

for (const collection of missing) {
  const result = await admin<{
    collectionCreate: { collection: { id: string } | null; userErrors: Array<{ message: string }> };
  }>(
    `
    mutation CreateCatalogCollection($collection: CollectionCreateInput!) {
      collectionCreate(collection: $collection) { collection { id } userErrors { message } }
    }
  `,
    {
      collection: {
        title: collection.title,
        handle: collection.handle,
        descriptionHtml: collection.description,
      },
    },
  );
  if (result.collectionCreate.userErrors.length || !result.collectionCreate.collection) {
    throw new Error(
      `Could not create ${collection.handle}: ${result.collectionCreate.userErrors.map((error) => error.message).join("; ")}`,
    );
  }
  idsToPublish.push(result.collectionCreate.collection.id);
}

for (const id of idsToPublish) {
  const result = await admin<{
    publishablePublish: { userErrors: Array<{ message: string }> };
  }>(
    `
    mutation PublishCatalogCollection($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) { userErrors { message } }
    }
  `,
    { id, input: [{ publicationId: publication.id }] },
  );
  if (result.publishablePublish.userErrors.length) {
    throw new Error(result.publishablePublish.userErrors.map((error) => error.message).join("; "));
  }
}

console.log(
  `Done. Created ${missing.length}, renamed ${renames.length}, and published ${idsToPublish.length} collections.`,
);
