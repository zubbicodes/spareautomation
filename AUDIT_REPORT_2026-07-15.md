# Spares Automation snag audit

**Audit date:** 15 July 2026  
**Sources:** `snags (1).docx` and `spares automation snags 10 July 2026 (REDMARKS UNFINISHED).docx`  
**Website checked:** https://spareautomation.web-testlink.com and the matching local build

## Remediation update

The actionable code changes identified by this audit were implemented on 15 July 2026. The homepage/category wording, asphalt category alignment, compact mobile overlays, photo/cart instructions, resource naming, and “Control Panels & Software” replacement are now covered by automated browser tests. The report table below reflects the updated local build; deployment is still required before these changes appear on the test website.

## Executive result

The actionable responsive, layout, wording, navigation, and product-page remediation is implemented in the local build. Shopify now returns six customer-accessible products, and every current product page has been checked at phone, tablet, laptop, and desktop widths. Remaining work is limited to deployment, client-supplied assets/content, and live transactional sign-off.

## Detailed checklist

| Area | Requested change | Status | Evidence / remaining work |
|---|---|---:|---|
| Header | Remove “Part / product number” beside the search | Done | Header now has one search field and a Search button only. |
| Header | Remove “Spares catalogue” below the logo | Done | Subtitle is no longer rendered. |
| Homepage | Remove AS-01/CN-01 and Range 01 labels | Done | These codes are absent. |
| Homepage | Restore sensible asphalt/concrete image-overlay sizing | Done | Heroes were reduced to 460px desktop / 390px mobile, with a two-column link grid on mobile. Browser tests confirm no clipping or horizontal overflow. |
| Homepage | Remove “Heavy plant / bituminous” and “Heavy plant / ready-mix” | Done | Removed from the homepage. Category pages still contain internal-looking eyebrow text such as “Heavy Plant / Vertical 01/02.” |
| Homepage | Remove old “Choose from...” descriptions and “Browse range” | Done | The old copy is absent. |
| Homepage | Remove “Browse sub-categories” | Done | Both “Browse sub-categories” and the “Sub-categories - 06” labels were removed. |
| Homepage | Remove unnecessary text below subcategories | Done | Category-page marketing introductions were removed. |
| Homepage | Change “New Arrivals” to “Control Panels and Software” | Done locally | Homepage, catalogue filter, metadata, sitemap, and route now use “Control Panels & Software.” The old URL redirects to the new route. |
| Homepage | Correct ready-mix categories | Done | Aggregate Feeding; Cement / Material Silos; Additive System; Water Controls; Air Controls; Automation Controls are present. |
| Homepage | Correct asphalt/blacktop categories | Done using supplied documents | Homepage and category page now both use Feeders, Burner / Drying, Bitumen, Hot Stone / Silos, Baghouse, and Mixing Tower. |
| Homepage | Explain replacement photo sizes | Partial | Current Packing and Home images are both **1024×1024**. Code guidance asks for landscape 4:3 or 16:10 at minimum 1200px wide, but replacement assets have not been supplied and this answer is not shown to the client in the UI. |
| Homepage | Improve “Need help” type sizing | Done | Main heading remains compact and the small help label was increased to 13px with stronger contrast. |
| Homepage | Explain/enable “Send photo” | Done by clarification | The form is explicitly described as text-only; customers are told to attach photos by email or WhatsApp. No unsupported upload is advertised. |
| Homepage/cart | Explain/enable “Send cart details” | Implemented | Cart code generates a pre-filled email containing lines, quantities, subtotal, and contact fields. Final live transactional sign-off is still required. |
| Homepage | Add easy PDF/video icons | Done | “PDFs & Manuals” and “Videos” cards link to `/resources`. |
| Resources | Provide PDFs/manuals/videos | Partial | The resources page is a request form, not a browsable library. Product templates support Shopify metafield links, but no live product/resource could be verified. |
| Footer | Remove old industrial-spares sentence and large procurement/stat blocks | Done | Old marketing/statistics/subscribe content shown in the document screenshot is gone. Footer is compact. |
| Footer | Add requested Information and Help links | Done | All Products, Contact, About, cart/quote equivalent, Trade Account, Track Order, order history, question page, and all seven Help links are present and resolve. |
| Navigation | Make “Resources” match its destination | Done | The generic label was replaced by “PDFs & Videos,” matching the homepage cards and request-page content. |
| Products index | Reduce oversized hero | Done | Browser test measured the hero at no more than 281px. |
| Products index | Remove the apparent second search bar | Done | Only the global searchbox remains; catalogue controls are filters/selects. |
| Products | Make product pages visible | Done locally | Shopify returns six visible product links. All six product-detail pages passed responsive checks at five viewport sizes. |
| Product template | Multiple images with thumbnail selection | Implemented, not live-verified | Gallery renders a main image and selectable thumbnails when a product has multiple Shopify images. |
| Product template | Stock level | Implemented, not live-verified | Exact `quantityAvailable` is shown when exposed; otherwise “Available to order” or “Out of stock.” |
| Product template | Brand and MPN/range | Implemented, not live-verified | Uses custom metafields, vendor, and SKU fallbacks. |
| Product template | Product description | Implemented, not live-verified | Shopify HTML/plain description area exists. |
| Product template | Setup video | Implemented, not live-verified | Supports setup/video metafields and consent-gated YouTube embeds. |
| Product template | Datasheets/manuals | Implemented, not live-verified | Supports PDF guide, datasheet, and manual metafields. |
| Product template | Add to quotation | Implemented, not live-verified | “Request quote by email” generates product/variant/quantity email content. It is an email action, not a server-side quotation basket. |
| Product template | Got a question by email or WhatsApp | Implemented, not live-verified | Both actions exist in the detail template. |
| Category pages | Show other product lines without returning home | Done | Asphalt and concrete pages render their product-line links before the product grid. |
| Support pages | Contact/About/Trade/Tracking/Question/Help layouts | Mostly done | All requested routes return HTTP 200 and use a consistent compact layout. The exact trade-account template and legal/policy wording still require business/client approval. |
| Mobile | Make large text/navigation usable | Done technically | Browser checks at 390×844 show no horizontal overflow, no clipped homepage headings, and working mobile navigation. Visual client approval remains advisable. |
| General copy | Remove random/internal-looking text | Done for identified examples | “Browse sub-categories,” “Sub-categories - 06,” “Heavy Plant / Vertical 01/02,” and the other internal vertical labels were removed or replaced with customer-facing wording. |

## Priority remaining work

1. Confirm all six Shopify products have complete images, stock, brand, MPN, descriptions, videos/PDFs where applicable, and correct collection tags.
2. Test product → cart → quote → checkout with a controlled staging order after deployment.
3. Publish actual document/video assets if Resources should become a library; it currently and accurately operates as a request service.
4. Replace the square 1024×1024 Packing/Home images when approved landscape assets are supplied.
5. Obtain client-approved trade-account and legal/policy content, deploy the remediation build, and obtain visual sign-off.

## Verification performed

- Ran 130 checks across 26 public routes at 320, 390, 768, 1024, and 1440px widths: **zero responsive defects or runtime errors** after remediation.
- Ran 30 additional checks covering all six live Shopify product pages at the same five viewport widths: **zero responsive defects or runtime errors**.
- Ran the expanded Playwright suite: **23 passed, 3 intentional viewport skips**.
- Confirmed no horizontal overflow, clipped visible headings, off-screen controls, route failures, or missing main landmarks.
- Verified touch-tablet category access and the registration form at a 320px viewport.
- TypeScript, lint (zero errors; six existing Fast Refresh warnings), and the production build pass.

## Sign-off recommendation

The responsive and UX remediation is complete in the local build. Final project sign-off should follow deployment, supplied replacement assets/content, and a controlled live product → cart → quote → checkout test.
