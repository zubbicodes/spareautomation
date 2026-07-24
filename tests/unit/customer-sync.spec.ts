import { expect, test } from "@playwright/test";

import {
  syncCreditCustomer,
  syncTradeCustomer,
} from "../../src/lib/shopify/customer-sync.server";

const originalFetch = globalThis.fetch;
const originalDomain = process.env.SHOPIFY_STORE_DOMAIN;
const originalToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

test.beforeEach(() => {
  process.env.SHOPIFY_STORE_DOMAIN = "example.myshopify.com";
  process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = "test-token";
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.SHOPIFY_STORE_DOMAIN = originalDomain;
  process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = originalToken;
});

function response(data: unknown): Response {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("credit sync creates a customer with required tags and metafields", async () => {
  const requests: Array<{ query: string; variables: Record<string, unknown> }> = [];
  globalThis.fetch = (async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as {
      query: string;
      variables: Record<string, unknown>;
    };
    requests.push(body);
    if (body.query.includes("FindApplicationCustomer")) {
      return response({ customers: { nodes: [] } });
    }
    return response({
      customerCreate: {
        customer: { id: "gid://shopify/Customer/1" },
        userErrors: [],
      },
    });
  }) as typeof fetch;

  const result = await syncCreditCustomer({
    email: "credit@example.com",
    note: "Approved",
    metafields: [{ key: "credit_limit", value: "10000" }],
  });

  expect(result.customerId).toBe("gid://shopify/Customer/1");
  expect(requests[1].query).toContain("customerCreate");
  const input = requests[1].variables.input as {
    tags: string[];
    metafields: Array<{ key: string; value: string }>;
  };
  expect(input.tags).toContain("credit-account");
  expect(input.metafields).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ key: "account_type", value: "credit" }),
      expect.objectContaining({
        key: "payment_terms",
        value: "staff-issued-invoice",
      }),
      expect.objectContaining({ key: "credit_limit", value: "10000" }),
    ]),
  );
});

test("trade sync updates an existing customer and preserves existing tags", async () => {
  const requests: Array<{ query: string; variables: Record<string, unknown> }> = [];
  globalThis.fetch = (async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as {
      query: string;
      variables: Record<string, unknown>;
    };
    requests.push(body);
    if (body.query.includes("FindApplicationCustomer")) {
      return response({
        customers: {
          nodes: [{ id: "gid://shopify/Customer/2", tags: ["existing-tag"] }],
        },
      });
    }
    return response({
      customerUpdate: {
        customer: { id: "gid://shopify/Customer/2" },
        userErrors: [],
      },
    });
  }) as typeof fetch;

  const result = await syncTradeCustomer({
    email: "trade@example.com",
    note: "Approved",
  });

  expect(result.customerId).toBe("gid://shopify/Customer/2");
  expect(requests[1].query).toContain("customerUpdate");
  const input = requests[1].variables.input as {
    id: string;
    tags: string[];
    metafields: Array<{ key: string; value: string }>;
  };
  expect(input.id).toBe("gid://shopify/Customer/2");
  expect(input.tags).toEqual(expect.arrayContaining(["existing-tag", "trade-account"]));
  expect(input.metafields).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ key: "account_type", value: "trade" }),
      expect.objectContaining({ key: "pricing_tier", value: "quote-based" }),
    ]),
  );
});
