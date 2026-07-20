import { getServerConfig } from "../config.server";

type ShopifyGraphQLError = {
  message: string;
};

type ShopifyAdminResponse<T> = {
  data?: T;
  errors?: ShopifyGraphQLError[];
};

export async function shopifyAdmin<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const config = getServerConfig();
  const domain = config.shopifyStoreDomain;
  const token = config.shopifyAdminAccessToken;

  if (!domain || !token) {
    throw new Error("Shopify quote submissions are not configured.");
  }

  const response = await fetch(
    `https://${domain}/admin/api/${config.shopifyAdminApiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  const payload = (await response.json()) as ShopifyAdminResponse<T>;

  if (!response.ok || payload.errors?.length) {
    const message =
      payload.errors?.map((error) => error.message).join("; ") ||
      `Shopify quote request failed with ${response.status}`;
    throw new Error(message);
  }

  if (!payload.data) {
    throw new Error("Shopify returned no quote data.");
  }

  return payload.data;
}
