import type { PageSeo } from "@/lib/content/registry";
import { SITE } from "@/lib/site";

export type PageHeadOptions = {
  /** Keep the page out of search results. */
  noIndex?: boolean;
  /** Also stop crawlers following its links (account/cart style pages). */
  noFollow?: boolean;
  /** Published business URL. Falls back to the compiled default. */
  siteUrl?: string;
  /** Published business name used for the title suffix. */
  siteName?: string;
  /** Published social handle for the Twitter card. */
  socialHandle?: string;
  ogTitle?: string;
  ogDescription?: string;
};

function robots({ noIndex, noFollow }: PageHeadOptions) {
  if (noIndex) return noFollow ? "noindex, nofollow" : "noindex, follow";
  return "index, follow, max-image-preview:large";
}

export function pageHead(
  title: string,
  description: string,
  path: string,
  options: boolean | PageHeadOptions = {},
) {
  const resolved: PageHeadOptions = typeof options === "boolean" ? { noIndex: options } : options;
  const siteName = resolved.siteName?.trim() || SITE.name;
  const siteUrl = (resolved.siteUrl?.trim() || SITE.url).replace(/\/$/, "");
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const url = `${siteUrl}${path}`;
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { name: "robots", content: robots(resolved) },
      { property: "og:title", content: resolved.ogTitle?.trim() || fullTitle },
      { property: "og:description", content: resolved.ogDescription?.trim() || description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:site_name", content: siteName },
      { name: "twitter:card", content: "summary" },
      ...(resolved.socialHandle?.trim() ? [{ name: "twitter:site", content: resolved.socialHandle.trim() }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

type SiteSettings = {
  name: string;
  url: string;
  socialHandle: string;
};

/**
 * Head metadata for a route whose loader carries published content: title,
 * description and Open Graph copy all come from the CMS document, with the
 * compiled defaults still applied when a loader failed.
 */
export function contentPageHead(
  seo: PageSeo | undefined,
  site: SiteSettings | undefined,
  path: string,
  fallback: { title: string; description: string },
  options: { noIndex?: boolean; noFollow?: boolean } = {},
) {
  return pageHead(seo?.title || fallback.title, seo?.description || fallback.description, path, {
    ...options,
    siteUrl: site?.url,
    siteName: site?.name,
    socialHandle: site?.socialHandle,
    ogTitle: seo?.ogTitle,
    ogDescription: seo?.ogDescription,
  });
}
