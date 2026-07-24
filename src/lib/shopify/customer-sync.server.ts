import { shopifyAdmin } from "./admin.server";

/**
 * Sync an approved trade/credit application to Shopify as a tagged customer.
 *
 * Golden rule: the CMS never creates orders. This only creates (or represents)
 * the customer record in Shopify so staff can raise draft orders / invoices
 * there. Account type and credit details are stored as tags + metafields.
 */

export type CustomerSyncMetafield = { key: string; value: string };

export type CustomerSyncInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags: string[];
  note: string;
  metafields: CustomerSyncMetafield[];
};

export type CustomerSyncResult = { customerId: string };

const METAFIELD_NAMESPACE = "spares_automation";

type CustomerMutationPayload = {
  customer: { id: string } | null;
  userErrors: Array<{ field: string[] | null; message: string }>;
};

function customerInput(input: CustomerSyncInput, tags: string[]) {
  return {
    email: input.email,
    firstName: input.firstName || undefined,
    lastName: input.lastName || undefined,
    phone: input.phone || undefined,
    tags,
    note: input.note,
    metafields: input.metafields.map((metafield) => ({
      namespace: METAFIELD_NAMESPACE,
      key: metafield.key,
      type: "single_line_text_field",
      value: metafield.value,
    })),
  };
}

function assertCustomerMutation(
  payload: CustomerMutationPayload,
  fallback: string,
): CustomerSyncResult {
  if (payload.userErrors.length || !payload.customer) {
    throw new Error(
      payload.userErrors.map((error) => error.message).join("; ") || fallback,
    );
  }
  return { customerId: payload.customer.id };
}

/**
 * Upsert by email. Existing customer tags are preserved while account tags and
 * app-owned metafields are added/updated.
 */
export async function syncCustomerToShopify(
  input: CustomerSyncInput,
): Promise<CustomerSyncResult> {
  const escapedEmail = input.email.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const found = await shopifyAdmin<{
    customers: { nodes: Array<{ id: string; tags: string[] }> };
  }>(
    `#graphql
      query FindApplicationCustomer($query: String!) {
        customers(first: 1, query: $query) {
          nodes {
            id
            tags
          }
        }
      }
    `,
    { query: `email:"${escapedEmail}"` },
  );

  const existing = found.customers.nodes[0];
  const tags = Array.from(new Set([...(existing?.tags ?? []), ...input.tags]));
  const baseInput = customerInput(input, tags);

  if (existing) {
    const result = await shopifyAdmin<{ customerUpdate: CustomerMutationPayload }>(
      `#graphql
        mutation SyncApplicationCustomer($input: CustomerInput!) {
          customerUpdate(input: $input) {
            customer {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      { input: { ...baseInput, id: existing.id } },
    );
    return assertCustomerMutation(
      result.customerUpdate,
      "Could not update the Shopify customer.",
    );
  }

  const result = await shopifyAdmin<{ customerCreate: CustomerMutationPayload }>(
    `#graphql
      mutation SyncApplicationCustomer($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    { input: baseInput },
  );
  return assertCustomerMutation(
    result.customerCreate,
    "Could not create the Shopify customer.",
  );
}

export type AccountCustomerSyncInput = Omit<
  CustomerSyncInput,
  "tags" | "metafields"
> & {
  extraTags?: string[];
  metafields?: CustomerSyncMetafield[];
};

export async function syncTradeCustomer(
  input: AccountCustomerSyncInput,
): Promise<CustomerSyncResult> {
  return syncCustomerToShopify({
    ...input,
    tags: ["trade-account", ...(input.extraTags ?? [])],
    metafields: [
      { key: "account_type", value: "trade" },
      { key: "pricing_tier", value: "quote-based" },
      ...(input.metafields ?? []),
    ],
  });
}

export async function syncCreditCustomer(
  input: AccountCustomerSyncInput,
): Promise<CustomerSyncResult> {
  return syncCustomerToShopify({
    ...input,
    tags: ["credit-account", ...(input.extraTags ?? [])],
    metafields: [
      { key: "account_type", value: "credit" },
      { key: "payment_terms", value: "staff-issued-invoice" },
      ...(input.metafields ?? []),
    ],
  });
}

/**
 * Best-effort: when an unsubscribe request matches a Shopify customer, flip
 * their email-marketing consent to UNSUBSCRIBED via the Admin API. Never
 * throws — a failure here must not block the unsubscribe submission.
 * Requires the Admin token to have write_customers scope.
 */
export async function unsubscribeCustomerEmail(email: string): Promise<boolean> {
  try {
    const found = await shopifyAdmin<{
      customers: { edges: Array<{ node: { id: string } }> };
    }>(
      `#graphql
        query FindCustomerByEmail($query: String!) {
          customers(first: 1, query: $query) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      { query: `email:${email}` },
    );

    const customerId = found.customers.edges[0]?.node.id;
    if (!customerId) return false;

    const result = await shopifyAdmin<{
      customerEmailMarketingConsentUpdate: {
        userErrors: Array<{ field: string[] | null; message: string }>;
      };
    }>(
      `#graphql
        mutation UnsubscribeCustomerEmail(
          $customerId: ID!
          $emailMarketingConsent: CustomerEmailMarketingConsentInput!
        ) {
          customerEmailMarketingConsentUpdate(
            customerId: $customerId
            emailMarketingConsent: $emailMarketingConsent
          ) {
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        customerId,
        emailMarketingConsent: {
          marketingState: "UNSUBSCRIBED",
          consentUpdatedAt: new Date().toISOString(),
        },
      },
    );

    return result.customerEmailMarketingConsentUpdate.userErrors.length === 0;
  } catch (error) {
    console.warn("[cms] Could not update Shopify marketing consent:", error);
    return false;
  }
}
