import { SITE } from "@/lib/site";

export function pageHead(title: string, description: string, path: string, noIndex = false) {
  const fullTitle = title.includes("Spares Automation") ? title : `${title} | Spares Automation`;
  const url = `${SITE.url}${path}`;
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { name: "robots", content: noIndex ? "noindex, follow" : "index, follow, max-image-preview:large" },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
