# Shopify catalogue guide

The website categories are Shopify **manual collections**. Shopify is the source of truth: once a published product is assigned to the right collections, it appears on the storefront automatically.

## One-time developer setup

Apps created in the Dev Dashboard do not display an Admin token. Authenticate Shopify CLI directly against the store instead:

```sh
shopify store auth --store your-store.myshopify.com --scopes read_products,write_products,read_publications,write_publications
```

Approve the requested access in the browser. Shopify CLI stores the local session securely; do not add a token or the Store Sync client secret to `.env`. Then run:

If Shopify reports that the callback store has a different permanent domain, authenticate that domain and set it separately without changing the storefront domain:

```env
SHOPIFY_ADMIN_STORE_DOMAIN=permanent-store-domain.myshopify.com
```

```sh
npm run shopify:sync-collections
npm run shopify:sync-collections -- --apply
```

The first command is a safe preview. The second creates every missing category/subcategory and publishes it to the Headless storefront. If the shop has more than one possible publication, copy the requested ID into `SHOPIFY_STOREFRONT_PUBLICATION_ID` and run it again. Re-run `shopify store auth` if the local session expires or its scopes change.

## Add a product (client workflow)

1. In Shopify Admin, open **Products**, then add or open the product.
2. Set its status to **Active** and make sure it is available on the **Headless** sales channel.
3. In the **Collections** section, select the main category and the specific product line. For example, select both **Concrete Spares** and **Water Controls**.
4. Save the product.

It will then appear under **All Products**, the main category, and the selected product line. No website edit or product tag is required. Shopify/Storefront caching can take a short time to refresh.

## Existing products

From **Products**, select several products and use **Bulk edit** or **Add to collections** to assign them in batches. Each product should have one main storefront category and at least one product-line collection where appropriate.

If a product is visible in Shopify but not on the website, check these three things: **Active** status, **Headless** sales-channel availability, and assignment to both the main and product-line collections.
